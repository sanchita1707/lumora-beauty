const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products (with search, filter, sorting, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, rating, sort, limit, page } = req.query;
    const query = {};

    // 1. Category Filter
    if (category && category !== 'all') {
      const foundCategory = await Category.findOne({ slug: category });
      if (foundCategory) {
        query.category = foundCategory._id;
      } else if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      }
    }

    // 2. Search Filter (matches name, description, brand, or tags)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 3. Price Filter (INR)
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Sorting Option
    let sortOptions = { createdAt: -1 }; // Default: Newest first
    if (sort) {
      if (sort === 'priceAsc') sortOptions = { price: 1 };
      else if (sort === 'priceDesc') sortOptions = { price: -1 };
      else if (sort === 'rating') sortOptions = { rating: -1 };
      else if (sort === 'discount') sortOptions = { discount: -1 };
      else if (sort === 'newest') sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .limit(limitNum)
      .skip(skip);

    res.json({
      success: true,
      data: products,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug')
      .populate({
        path: 'relatedProducts',
        select: 'name slug price discount images rating brand stock'
      })
      .populate({
        path: 'frequentlyBoughtTogether',
        select: 'name slug price discount images rating brand stock'
      });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate({
        path: 'relatedProducts',
        select: 'name slug price discount images rating brand stock'
      })
      .populate({
        path: 'frequentlyBoughtTogether',
        select: 'name slug price discount images rating brand stock'
      });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured products (Bestsellers, New Arrivals, Trending)
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;

    const bestsellers = await Product.find({ isBestseller: true })
      .populate('category', 'name slug')
      .limit(limit);

    const newArrivals = await Product.find({ isNewArrival: true })
      .populate('category', 'name slug')
      .limit(limit);

    const trending = await Product.find({ isTrending: true })
      .populate('category', 'name slug')
      .limit(limit);

    res.json({
      success: true,
      bestsellers,
      newArrivals,
      trending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts
};
