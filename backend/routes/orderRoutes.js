const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createOrder);

router.post('/verify', protect, verifyPayment);
router.get('/myorders', protect, getMyOrders);
router.route('/:id')
  .get(protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
