const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Create or update a product review
// @route   POST /api/reviews
// @access  Private
const createProductReview = async (req, res) => {
  const { rating, comment, productId } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (alreadyReviewed) {
      // Update existing review
      alreadyReviewed.rating = Number(rating);
      alreadyReviewed.comment = comment;
      await alreadyReviewed.save();
    } else {
      // Create new review
      await Review.create({
        user: req.user._id,
        product: productId,
        name: req.user.name,
        rating: Number(rating),
        comment
      });
    }

    // Recalculate Product average rating and numReviews
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

    product.numReviews = numReviews;
    product.rating = Number(avgRating.toFixed(1));
    await product.save();

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:id
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProductReview,
  getProductReviews
};
