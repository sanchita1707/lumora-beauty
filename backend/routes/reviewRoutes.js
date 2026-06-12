const express = require('express');
const router = express.Router();
const {
  createProductReview,
  getProductReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createProductReview);

router.get('/product/:id', getProductReviews);

module.exports = router;
