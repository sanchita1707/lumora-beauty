const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');
const { uploadImage } = require('../utils/cloudinary');
const fs = require('fs');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();

    // Calculate total sales
    const completedOrders = await Order.find({
      $or: [
        { paymentStatus: 'Paid' },
        { paymentMethod: 'COD', status: { $ne: 'Cancelled' } }
      ]
    });

    const totalSales = completedOrders.reduce((acc, order) => acc + order.payableAmount, 0);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Sales by Category
    const categories = await Category.find();
    const salesByCategory = [];

    for (const cat of categories) {
      // Find products in this category
      const prodIds = await Product.find({ category: cat._id }).select('_id');
      const ids = prodIds.map(p => p._id);

      // Find orders with these products
      const ordersWithProds = await Order.find({
        'items.product': { $in: ids },
        status: { $ne: 'Cancelled' }
      });

      let categoryRevenue = 0;
      ordersWithProds.forEach(order => {
        order.items.forEach(item => {
          if (ids.some(id => id.toString() === item.product.toString())) {
            categoryRevenue += item.price * item.quantity;
          }
        });
      });

      salesByCategory.push({
        categoryName: cat.name,
        revenue: categoryRevenue
      });
    }

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalSales
      },
      recentOrders,
      salesByCategory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status and tracking history
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status, trackingDescription, trackingNumber } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status || order.status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Set tracking title based on status
    let trackTitle = status;
    if (status === 'Processing') trackTitle = 'Processing Order';
    else if (status === 'Shipped') trackTitle = 'Shipped';
    else if (status === 'Delivered') trackTitle = 'Out for Delivery / Delivered';
    else if (status === 'Cancelled') trackTitle = 'Cancelled';

    order.trackingStatus = trackTitle;

    // Add tracking history log
    order.trackingHistory.push({
      status: trackTitle,
      description: trackingDescription || `Order status updated to ${status.toLowerCase()}.`
    });

    // Mark payment status as paid if delivered
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    const updatedOrder = await order.save();
    res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, category, stock, brand, tags, isBestseller, isNewArrival, isTrending } = req.body;

    let imagePaths = [];

    // Check if images are uploaded via multer
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.path);
        imagePaths.push(uploadResult.secure_url);
        // Clean local file from disk
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    } else if (req.body.images) {
      // Fallback if they pass image URLs directly
      imagePaths = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      // Default placeholder if no images
      imagePaths.push('https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop');
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discount: Number(discount) || 0,
      category,
      stock: Number(stock),
      brand: brand || 'Lumora Beauty',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      isBestseller: isBestseller === 'true' || isBestseller === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      isTrending: isTrending === 'true' || isTrending === true,
      images: imagePaths
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    // Cleanup files if error occurred
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, discount, category, stock, brand, tags, isBestseller, isNewArrival, isTrending } = req.body;

    product.name = name || product.name;
    if (name) {
      product.slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    }
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discount = discount !== undefined ? Number(discount) : product.discount;
    product.category = category || product.category;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.brand = brand || product.brand;
    
    if (tags) {
      product.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    product.isBestseller = isBestseller !== undefined ? (isBestseller === 'true' || isBestseller === true) : product.isBestseller;
    product.isNewArrival = isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : product.isNewArrival;
    product.isTrending = isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : product.isTrending;

    // Handle new images upload
    if (req.files && req.files.length > 0) {
      const imagePaths = [];
      for (const file of req.files) {
        const uploadResult = await uploadImage(file.path);
        imagePaths.push(uploadResult.secure_url);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      product.images = imagePaths;
    } else if (req.body.images) {
      product.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const updatedProduct = await product.save();
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  const { code, discountType, discountValue, minCartValue, maxDiscount, expiryDate } = req.body;

  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minCartValue: Number(minCartValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate: new Date(expiryDate),
      isActive: true
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    await coupon.deleteOne();
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all coupons (admin detail view)
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
