const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  createCoupon,
  deleteCoupon,
  getAllCoupons
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Base admin route checks for protect and admin role
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/users', getAllUsers);

router.route('/coupons')
  .get(getAllCoupons)
  .post(createCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
