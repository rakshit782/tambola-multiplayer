// Wise API Integration for Global Payouts
const axios = require('axios');

const WISE_API_URL = process.env.WISE_API_URL || 'https://api.wise.com';
const WISE_API_KEY = process.env.WISE_API_KEY;
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID;

/**
 * Wise (formerly TransferWise) for international payouts
 * Supports 80+ currencies and 160+ countries
 * Low fees and real exchange rates
 */

class WisePayouts {
  constructor() {
    this.apiKey = WISE_API_KEY;
    this.profileId = WISE_PROFILE_ID;
    this.baseURL = WISE_API_URL;
  }

  // Create a quote for payout
  async createQuote(params) {
    const { sourceCurrency, targetCurrency, sourceAmount, targetAmount } = params;

    try {
      const response = await axios.post(
        `${this.baseURL}/v3/profiles/${this.profileId}/quotes`,
        {
          sourceCurrency,
          targetCurrency,
          sourceAmount: sourceAmount || null,
          targetAmount: targetAmount || null,
          paymentMetadata: {
            transferPurpose: 'prize_payout'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        quoteId: response.data.id,
        rate: response.data.rate,
        fee: response.data.fee,
        sourceAmount: response.data.sourceAmount,
        targetAmount: response.data.targetAmount,
        expirationTime: response.data.expirationTime
      };
    } catch (error) {
      console.error('Wise quote creation error:', error.response?.data || error.message);
      throw new Error('Failed to create payout quote');
    }
  }

  // Create recipient
  async createRecipient(recipientData) {
    const { currency, type, accountDetails, name, email } = recipientData;

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/accounts`,
        {
          currency,
          type, // 'email', 'indian_rupee', 'iban', 'sort_code', etc.
          profile: this.profileId,
          accountHolderName: name,
          ownedByCustomer: false,
          details: accountDetails // Account-specific details (bank account, IBAN, etc.)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        recipientId: response.data.id,
        currency: response.data.currency,
        accountHolderName: response.data.accountHolderName
      };
    } catch (error) {
      console.error('Wise recipient creation error:', error.response?.data || error.message);
      throw new Error('Failed to create recipient');
    }
  }

  // Create transfer (payout)
  async createTransfer(params) {
    const { quoteId, recipientId, reference } = params;

    try {
      const response = await axios.post(
        `${this.baseURL}/v1/transfers`,
        {
          targetAccount: recipientId,
          quoteUuid: quoteId,
          customerTransactionId: reference, // Your internal transaction ID
          details: {
            reference: reference || 'Tambola Prize Payout',
            transferPurpose: 'prize_payout',
            sourceOfFunds: 'business_revenue'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        transferId: response.data.id,
        status: response.data.status,
        reference: response.data.reference
      };
    } catch (error) {
      console.error('Wise transfer creation error:', error.response?.data || error.message);
      throw new Error('Failed to create transfer');
    }
  }

  // Fund the transfer (actually send money)
  async fundTransfer(transferId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v3/profiles/${this.profileId}/transfers/${transferId}/payments`,
        {
          type: 'BALANCE' // Pay from Wise balance
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        paymentId: response.data.id
      };
    } catch (error) {
      console.error('Wise funding error:', error.response?.data || error.message);
      throw new Error('Failed to fund transfer');
    }
  }

  // Get transfer status
  async getTransferStatus(transferId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/transfers/${transferId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        sourceAmount: response.data.sourceValue,
        targetAmount: response.data.targetValue,
        created: response.data.created
      };
    } catch (error) {
      console.error('Wise status check error:', error.response?.data || error.message);
      throw new Error('Failed to get transfer status');
    }
  }

  // Cancel transfer
  async cancelTransfer(transferId) {
    try {
      const response = await axios.put(
        `${this.baseURL}/v1/transfers/${transferId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      console.error('Wise cancellation error:', error.response?.data || error.message);
      throw new Error('Failed to cancel transfer');
    }
  }

  // Get account balance
  async getBalance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/v4/profiles/${this.profileId}/balances?types=STANDARD`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        balances: response.data.map(balance => ({
          currency: balance.currency,
          amount: balance.amount.value
        }))
      };
    } catch (error) {
      console.error('Wise balance check error:', error.response?.data || error.message);
      throw new Error('Failed to get balance');
    }
  }

  // Get exchange rate
  async getExchangeRate(sourceCurrency, targetCurrency) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/rates`,
        {
          params: {
            source: sourceCurrency,
            target: targetCurrency
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        rate: response.data[0].rate,
        source: sourceCurrency,
        target: targetCurrency
      };
    } catch (error) {
      console.error('Wise exchange rate error:', error.response?.data || error.message);
      throw new Error('Failed to get exchange rate');
    }
  }
}

module.exports = new WisePayouts();
