// Multi-Currency Payment Gateway Configuration
const Razorpay = require('razorpay');
const Stripe = require('stripe');

// Razorpay for India and South Asia
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Stripe for Global Markets
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Currency Configuration
const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', minAmount: 10, gateway: 'razorpay' },
  USD: { symbol: '$', minAmount: 1, gateway: 'stripe' },
  EUR: { symbol: '€', minAmount: 1, gateway: 'stripe' },
  GBP: { symbol: '£', minAmount: 1, gateway: 'stripe' },
  AUD: { symbol: 'A$', minAmount: 1, gateway: 'stripe' },
  CAD: { symbol: 'C$', minAmount: 1, gateway: 'stripe' },
  SGD: { symbol: 'S$', minAmount: 1, gateway: 'stripe' },
  AED: { symbol: 'AED', minAmount: 5, gateway: 'stripe' }
};

// Payment Gateway Selection Logic
function selectPaymentGateway(currency, country) {
  if (['IN', 'BD', 'PK', 'LK', 'NP'].includes(country)) {
    return 'razorpay';
  }
  return 'stripe';
}

// Create Payment Order
async function createPaymentOrder(amount, currency, userId, gameId) {
  const gateway = SUPPORTED_CURRENCIES[currency]?.gateway || 'stripe';
  
  if (gateway === 'razorpay') {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency: currency,
      receipt: `game_${gameId}_user_${userId}`,
      notes: {
        gameId: gameId,
        userId: userId
      }
    });
    return { orderId: order.id, gateway: 'razorpay' };
  } else {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe uses cents
      currency: currency.toLowerCase(),
      metadata: {
        gameId: gameId,
        userId: userId
      }
    });
    return { orderId: paymentIntent.id, clientSecret: paymentIntent.client_secret, gateway: 'stripe' };
  }
}

// Verify Payment
async function verifyPayment(paymentId, gateway) {
  if (gateway === 'razorpay') {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment.status === 'captured';
  } else {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    return paymentIntent.status === 'succeeded';
  }
}

module.exports = {
  razorpay,
  stripe,
  SUPPORTED_CURRENCIES,
  selectPaymentGateway,
  createPaymentOrder,
  verifyPayment
};
