const Razorpay = require('razorpay');

let razorpayInstance;
let isMock = false;

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret || keyId.includes('mock') || keySecret.includes('mock')) {
  console.log('Razorpay keys missing or set to mock. Running Razorpay in Sandbox Mock Mode.');
  isMock = true;
  
  razorpayInstance = {
    orders: {
      create: async (options) => {
        const mockOrderId = `order_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        return {
          id: mockOrderId,
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          notes: options.notes,
          created_at: Math.floor(Date.now() / 1000),
          isMock: true
        };
      }
    },
    payments: {
      fetch: async (paymentId) => {
        return {
          id: paymentId,
          status: 'captured',
          amount: 50000,
          currency: 'INR'
        };
      }
    }
  };
} else {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (error) {
    console.error('Failed to initialize Razorpay SDK. Falling back to Mock mode.', error.message);
    isMock = true;
    razorpayInstance = {
      orders: {
        create: async (options) => {
          return {
            id: `order_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            amount: options.amount,
            currency: options.currency || 'INR',
            status: 'created',
            isMock: true
          };
        }
      }
    };
  }
}

module.exports = {
  razorpay: razorpayInstance,
  isMock,
  keyId: isMock ? 'rzp_test_mock' : keyId
};
