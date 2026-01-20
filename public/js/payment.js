// Frontend Payment Integration with Hyperswitch

class PaymentHandler {
  constructor() {
    this.hyperswitchClient = null;
    this.publishableKey = null;
  }

  // Initialize Hyperswitch
  async initialize() {
    try {
      // Load Hyperswitch SDK
      await this.loadHyperswitchSDK();
      
      // Get publishable key from backend
      const response = await fetch('/api/payment/config');
      const config = await response.json();
      this.publishableKey = config.publishableKey;
      
      // Initialize Hyperswitch client
      this.hyperswitchClient = window.Hyperswitch(this.publishableKey);
    } catch (error) {
      console.error('Failed to initialize payment:', error);
    }
  }

  // Load Hyperswitch SDK dynamically
  loadHyperswitchSDK() {
    return new Promise((resolve, reject) => {
      if (window.Hyperswitch) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://beta.hyperswitch.io/v1/HyperLoader.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Create payment for ticket purchase
  async purchaseTicket(gameCode, ticketPrice, currency) {
    try {
      const token = localStorage.getItem('token');
      
      // Create payment intent on backend
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: gameCode,
          ticketPrice: ticketPrice,
          currency: currency
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to create payment intent');
      }

      // Show Hyperswitch payment widget
      await this.showPaymentWidget(data.clientSecret, data.paymentId);
      
      return data.paymentId;
    } catch (error) {
      console.error('Ticket purchase error:', error);
      throw error;
    }
  }

  // Show Hyperswitch payment widget
  async showPaymentWidget(clientSecret, paymentId) {
    return new Promise((resolve, reject) => {
      const widgets = this.hyperswitchClient.widgets({
        clientSecret: clientSecret,
        appearance: {
          theme: 'default',
          variables: {
            colorPrimary: '#4F46E5',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '8px'
          }
        }
      });

      // Mount payment widget
      const paymentElement = widgets.create('payment');
      paymentElement.mount('#payment-element');

      // Handle payment submission
      document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const { error, paymentIntent } = await this.hyperswitchClient.confirmPayment({
            elements: paymentElement,
            confirmParams: {
              return_url: `${window.location.origin}/payment/success`
            },
            redirect: 'if_required'
          });

          if (error) {
            this.showError(error.message);
            reject(error);
          } else {
            // Payment successful
            await this.verifyPayment(paymentId);
            this.showSuccess('Payment successful!');
            resolve(paymentIntent);
          }
        } catch (err) {
          this.showError('Payment failed');
          reject(err);
        }
      });
    });
  }

  // Verify payment on backend
  async verifyPayment(paymentId) {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentId })
    });

    const data = await response.json();
    return data.success;
  }

  // Request payout
  async requestPayout(amount, currency, recipientDetails) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/payment/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          recipientDetails: recipientDetails
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess(`Payout request submitted! Transfer ID: ${data.transferId}`);
        return data;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Payout request error:', error);
      this.showError(error.message);
      throw error;
    }
  }

  // Check payout status
  async checkPayoutStatus(transferId) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/payment/payout/status/${transferId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  // Show error message
  showError(message) {
    const errorDiv = document.getElementById('payment-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
  }

  // Show success message
  showSuccess(message) {
    const successDiv = document.getElementById('payment-success');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
      setTimeout(() => successDiv.style.display = 'none', 5000);
    }
  }
}

// Initialize payment handler
const paymentHandler = new PaymentHandler();
paymentHandler.initialize();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = paymentHandler;
}
