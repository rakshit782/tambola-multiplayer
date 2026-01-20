// Unified Payment Routes with Hyperswitch and Wise
const express = require('express');
const router = express.Router();
const { pgPool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const hyperswitchPayment = require('../config/hyperswitch');
const wisePayouts = require('../config/wise');

// Create Payment Intent (Pay-in using Hyperswitch)
router.post('/create-intent', authenticate, async (req, res) => {
  const { gameId, ticketPrice, currency } = req.body;
  const userId = req.user.id;

  try {
    // Get or create Hyperswitch customer
    let customerId = req.user.hyperswitch_customer_id;
    
    if (!customerId) {
      const customer = await hyperswitchPayment.createCustomer({
        email: req.user.email,
        phone: req.user.phone,
        name: req.user.username,
        countryCode: req.user.country_code
      });
      customerId = customer.customerId;
      
      // Save customer ID
      await pgPool.query(
        'UPDATE users SET hyperswitch_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // Create payment intent
    const paymentIntent = await hyperswitchPayment.createPaymentIntent({
      amount: ticketPrice,
      currency: currency,
      customerId: customerId,
      description: `Tambola Game #${gameId} Ticket`,
      metadata: {
        userId: userId,
        gameId: gameId,
        type: 'ticket_purchase'
      }
    });

    // Save transaction record
    await pgPool.query(
      `INSERT INTO transactions (user_id, transaction_type, amount, currency, payment_gateway, payment_id, game_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'ticket_purchase', ticketPrice, currency, 'hyperswitch', paymentIntent.paymentId, gameId, 'pending']
    );

    res.json({
      success: true,
      paymentId: paymentIntent.paymentId,
      clientSecret: paymentIntent.clientSecret,
      publishableKey: hyperswitchPayment.getPublishableKey()
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Verify Payment
router.post('/verify', authenticate, async (req, res) => {
  const { paymentId } = req.body;
  const userId = req.user.id;

  try {
    // Retrieve payment status from Hyperswitch
    const payment = await hyperswitchPayment.retrievePayment(paymentId);

    if (payment.status === 'succeeded' || payment.status === 'processing_complete') {
      // Update transaction status
      await pgPool.query(
        'UPDATE transactions SET status = $1 WHERE payment_id = $2 AND user_id = $3',
        ['completed', paymentId, userId]
      );

      // Update ticket payment status
      await pgPool.query(
        'UPDATE tickets SET payment_status = $1 WHERE payment_id = $2 AND user_id = $3',
        ['completed', paymentId, userId]
      );

      // Increment tickets_sold count
      const ticketResult = await pgPool.query(
        'SELECT game_id FROM tickets WHERE payment_id = $1',
        [paymentId]
      );
      
      if (ticketResult.rows.length > 0) {
        await pgPool.query(
          'UPDATE games SET tickets_sold = tickets_sold + 1 WHERE id = $1',
          [ticketResult.rows[0].game_id]
        );
      }

      res.json({ success: true, status: 'completed' });
    } else {
      res.json({ success: false, status: payment.status });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Hyperswitch Webhook Handler
router.post('/webhook/hyperswitch', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-hyperswitch-signature'];
  const payload = req.body;

  try {
    // Verify webhook signature
    const isValid = hyperswitchPayment.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(payload);

    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'refund.succeeded':
        await handleRefundSuccess(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Request Payout (Wise Integration)
router.post('/payout/request', authenticate, async (req, res) => {
  const { amount, currency, recipientDetails } = req.body;
  const userId = req.user.id;

  try {
    // Check user balance
    const userResult = await pgPool.query(
      'SELECT wallet_balance, email, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].wallet_balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Minimum payout amount check
    const minPayout = 10; // $10 or equivalent
    if (amount < minPayout) {
      return res.status(400).json({ error: `Minimum payout is ${minPayout} ${currency}` });
    }

    // Create Wise quote
    const quote = await wisePayouts.createQuote({
      sourceCurrency: 'USD', // Your business currency
      targetCurrency: currency,
      sourceAmount: amount
    });

    // Create or get recipient
    let recipientId = req.user.wise_recipient_id;
    
    if (!recipientId) {
      const recipient = await wisePayouts.createRecipient({
        currency: currency,
        type: recipientDetails.type, // e.g., 'email', 'iban', 'sort_code'
        accountDetails: recipientDetails.accountDetails,
        name: userResult.rows[0].username,
        email: userResult.rows[0].email
      });
      recipientId = recipient.recipientId;
      
      // Save recipient ID
      await pgPool.query(
        'UPDATE users SET wise_recipient_id = $1 WHERE id = $2',
        [recipientId, userId]
      );
    }

    // Create transfer
    const transfer = await wisePayouts.createTransfer({
      quoteId: quote.quoteId,
      recipientId: recipientId,
      reference: `Tambola_Payout_${userId}_${Date.now()}`
    });

    // Deduct from user wallet
    await pgPool.query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [amount, userId]
    );

    // Record transaction
    await pgPool.query(
      `INSERT INTO transactions (user_id, transaction_type, amount, currency, payment_gateway, payment_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, 'withdrawal', amount, currency, 'wise', transfer.transferId, 'processing']
    );

    res.json({
      success: true,
      transferId: transfer.transferId,
      estimatedDelivery: '1-2 business days',
      fee: quote.fee,
      exchangeRate: quote.rate
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({ error: 'Failed to process payout request' });
  }
});

// Fund payout (admin/automated process)
router.post('/payout/fund', authenticate, async (req, res) => {
  const { transferId } = req.body;

  try {
    // Check if user is admin or system
    // Add your admin check here

    // Fund the transfer
    const result = await wisePayouts.fundTransfer(transferId);

    // Update transaction status
    await pgPool.query(
      'UPDATE transactions SET status = $1 WHERE payment_id = $2',
      ['funded', transferId]
    );

    res.json({ success: true, status: result.status });
  } catch (error) {
    console.error('Payout funding error:', error);
    res.status(500).json({ error: 'Failed to fund payout' });
  }
});

// Check payout status
router.get('/payout/status/:transferId', authenticate, async (req, res) => {
  const { transferId } = req.params;
  const userId = req.user.id;

  try {
    // Verify this transfer belongs to user
    const transactionResult = await pgPool.query(
      'SELECT * FROM transactions WHERE payment_id = $1 AND user_id = $2',
      [transferId, userId]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get status from Wise
    const status = await wisePayouts.getTransferStatus(transferId);

    res.json({
      success: true,
      status: status.status,
      amount: status.targetAmount,
      created: status.created
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check payout status' });
  }
});

// Get available payout methods for country
router.get('/payout/methods/:countryCode', authenticate, async (req, res) => {
  const { countryCode } = req.params;
  const currency = req.query.currency || 'USD';

  // Return available payout methods based on country
  const methods = {
    IN: [{ type: 'indian_rupee', name: 'Bank Account (IMPS/NEFT)', currency: 'INR' }],
    US: [{ type: 'aba', name: 'Bank Account (ACH)', currency: 'USD' }],
    GB: [{ type: 'sort_code', name: 'Bank Account (UK)', currency: 'GBP' }],
    EU: [{ type: 'iban', name: 'SEPA Transfer', currency: 'EUR' }],
    default: [{ type: 'email', name: 'Email (Wise Account)', currency: currency }]
  };

  res.json({
    success: true,
    methods: methods[countryCode] || methods.default
  });
});

// Helper functions
async function handlePaymentSuccess(paymentData) {
  await pgPool.query(
    'UPDATE transactions SET status = $1 WHERE payment_id = $2',
    ['completed', paymentData.payment_id]
  );
}

async function handlePaymentFailure(paymentData) {
  await pgPool.query(
    'UPDATE transactions SET status = $1 WHERE payment_id = $2',
    ['failed', paymentData.payment_id]
  );
}

async function handleRefundSuccess(refundData) {
  await pgPool.query(
    `INSERT INTO transactions (user_id, transaction_type, amount, currency, payment_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [refundData.user_id, 'refund', refundData.amount / 100, refundData.currency, refundData.refund_id, 'completed']
  );
}

module.exports = router;
