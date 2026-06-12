const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getActiveCoupons
} = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.post('/validate', protect, validateCoupon);
router.get('/', getActiveCoupons);

module.exports = router;
