// Juspay Hyperswitch Payment Integration
const axios = require('axios');

const HYPERSWITCH_API_URL = process.env.HYPERSWITCH_API_URL || 'https://api.hyperswitch.io';
const HYPERSWITCH_API_KEY = process.env.HYPERSWITCH_API_KEY;
const HYPERSWITCH_PUBLISHABLE_KEY = process.env.HYPERSWITCH_PUBLISHABLE_KEY;

/**
 * Hyperswitch provides unified payment orchestration
 * Supports 50+ payment methods globally including:
 * - Cards (Visa, Mastercard, Amex)
 * - Wallets (PayPal, Google Pay, Apple Pay)
 * - UPI (PhonePe, Google Pay, Paytm)
 * - Local payment methods (iDEAL, Klarna, etc.)
 */

class HyperswitchPayment {
  constructor() {
    this.apiKey = HYPERSWITCH_API_KEY;
    this.publishableKey = HYPERSWITCH_PUBLISHABLE_KEY;
    this.baseURL = HYPERSWITCH_API_URL;
  }

  // Create Payment Intent
  async createPaymentIntent(params) {
    const { amount, currency, customerId, metadata, description } = params;

    try {
      const response = await axios.post(
        `${this.baseURL}/payments`,
        {
          amount: Math.round(amount * 100), // Convert to smallest currency unit
          currency: currency.toLowerCase(),
          customer_id: customerId,
          description: description || 'Tambola Ticket Purchase',
          metadata: metadata || {},
          capture_method: 'automatic',
          authentication_type: 'three_ds',
          return_url: `${process.env.APP_URL}/payment/callback`,
          // Enable multiple payment methods
          allowed_payment_method_types: [
            'card',
            'wallet',
            'upi',
            'bank_transfer',
            'pay_later'
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.payment_id,
        clientSecret: response.data.client_secret,
        status: response.data.status,
        gateway: 'hyperswitch'
      };
    } catch (error) {
      console.error('Hyperswitch payment creation error:', error.response?.data || error.message);
      throw new Error('Failed to create payment intent');
    }
  }

  // Retrieve Payment Status
  async retrievePayment(paymentId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payments/${paymentId}`,
        {
          headers: {
            'api-key': this.apiKey
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        paymentMethod: response.data.payment_method,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error('Payment retrieval error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve payment');
    }
  }

  // Confirm Payment (if manual capture)
  async confirmPayment(paymentId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payments/${paymentId}/confirm`,
        {},
        {
          headers: {
            'api-key': this.apiKey
          }
        }
      );

      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      console.error('Payment confirmation error:', error.response?.data || error.message);
      throw new Error('Failed to confirm payment');
    }
  }

  // Cancel Payment
  async cancelPayment(paymentId, reason) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payments/${paymentId}/cancel`,
        { cancellation_reason: reason },
        {
          headers: {
            'api-key': this.apiKey
          }
        }
      );

      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      console.error('Payment cancellation error:', error.response?.data || error.message);
      throw new Error('Failed to cancel payment');
    }
  }

  // Create Customer Profile (for repeat payments)
  async createCustomer(customerData) {
    const { email, phone, name, countryCode } = customerData;

    try {
      const response = await axios.post(
        `${this.baseURL}/customers`,
        {
          email,
          phone,
          name,
          phone_country_code: countryCode
        },
        {
          headers: {
            'api-key': this.apiKey
          }
        }
      );

      return {
        success: true,
        customerId: response.data.customer_id
      };
    } catch (error) {
      console.error('Customer creation error:', error.response?.data || error.message);
      throw new Error('Failed to create customer');
    }
  }

  // Webhook signature verification
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const webhookSecret = process.env.HYPERSWITCH_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }

  // Get publishable key for frontend
  getPublishableKey() {
    return this.publishableKey;
  }
}

module.exports = new HyperswitchPayment();
