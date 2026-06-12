const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true }
});

const ShippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' }
});

const TrackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentId: { type: String }, // Razorpay Payment ID or custom ref
  orderId: { type: String },   // Razorpay Order ID or custom ref
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  payableAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  trackingNumber: { type: String },
  trackingStatus: { type: String, default: 'Order Placed' },
  trackingHistory: [TrackingHistorySchema],
  couponCode: { type: String },
}, {
  timestamps: true
});

// Auto-add initial tracking history entry
OrderSchema.pre('save', function (next) {
  if (this.isNew && this.trackingHistory.length === 0) {
    this.trackingHistory.push({
      status: 'Order Placed',
      description: 'Your order has been placed successfully and is awaiting processing.'
    });
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
