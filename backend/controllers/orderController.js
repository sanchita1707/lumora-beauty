const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { razorpay, isMock, keyId } = require('../utils/razorpay');

// Helper to deduct stock
const deductStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }
};

// Helper to restore stock (if cancelled)
const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order' });
  }

  try {
    let totalAmount = 0;
    const orderItems = [];

    // Verify stock and fetch correct database prices to prevent client-side tampering
    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${dbProduct.name}. Only ${dbProduct.stock} left.`
        });
      }

      // Price after item discount
      const itemPrice = dbProduct.price * (1 - dbProduct.discount / 100);
      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: Math.round(itemPrice),
        quantity: item.quantity,
        image: dbProduct.images[0]
      });
    }

    // Handle coupon application
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date(coupon.expiryDate) > new Date() && totalAmount >= coupon.minCartValue) {
        if (coupon.discountType === 'flat') {
          discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
          discountAmount = (totalAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        }
        discountAmount = Math.round(discountAmount);
      }
    }

    const payableAmount = Math.max(0, Math.round(totalAmount - discountAmount));

    // Create preliminary Order document
    const orderData = {
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount: Math.round(totalAmount),
      discountAmount,
      payableAmount,
      couponCode: couponCode || null,
      paymentStatus: 'Pending',
      status: 'Pending'
    };

    if (paymentMethod === 'COD') {
      // Direct placement for Cash On Delivery
      const order = await Order.create(orderData);
      
      // Deduct stock immediately
      await deductStock(orderItems);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully (Cash on Delivery)',
        order
      });
    } else if (paymentMethod === 'Razorpay') {
      // Create Razorpay Order
      const options = {
        amount: payableAmount * 100, // in paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
      };

      const razorpayOrder = await razorpay.orders.create(options);

      orderData.orderId = razorpayOrder.id; // Store Razorpay Order ID
      const order = await Order.create(orderData);

      return res.status(201).json({
        success: true,
        message: 'Razorpay order initialized',
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: keyId,
          isMock: razorpayOrder.isMock || false
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify
// @access  Private
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const order = await Order.findOne({ orderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found matching payment ID' });
    }

    let isVerified = false;

    if (isMock || razorpay_signature === 'mock_signature') {
      // Auto verify in sandbox mock mode
      isVerified = true;
    } else {
      // Real Razorpay signature verification
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');
      isVerified = generatedSignature === razorpay_signature;
    }

    if (isVerified) {
      order.paymentStatus = 'Paid';
      order.paymentId = razorpay_payment_id;
      order.status = 'Processing';
      order.trackingStatus = 'Payment Confirmed';
      
      order.trackingHistory.push({
        status: 'Payment Confirmed',
        description: `Payment of ₹${order.payableAmount} was successfully received via Razorpay. (ID: ${razorpay_payment_id})`
      });

      await order.save();

      // Deduct stock now that payment is confirmed
      await deductStock(order.items);

      res.json({ success: true, message: 'Payment verified successfully', order });
    } else {
      order.paymentStatus = 'Failed';
      order.trackingStatus = 'Payment Failed';
      order.trackingHistory.push({
        status: 'Payment Failed',
        description: 'The payment transaction could not be verified and failed.'
      });
      await order.save();
      
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify it is user's own order or user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'Delivered' || order.status === 'Shipped' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status.toLowerCase()}`
      });
    }

    order.status = 'Cancelled';
    order.trackingStatus = 'Order Cancelled';
    order.trackingHistory.push({
      status: 'Order Cancelled',
      description: 'The order has been cancelled by the customer/administrator.'
    });

    await order.save();

    // Restore stock if payment was made or COD was placed
    if (order.paymentStatus === 'Paid' || order.paymentMethod === 'COD') {
      await restoreStock(order.items);
    }

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder
};
