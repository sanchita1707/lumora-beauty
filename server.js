const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./backend/config/db');

// Route imports
const authRoutes = require('./backend/routes/authRoutes');
const categoryRoutes = require('./backend/routes/categoryRoutes');
const productRoutes = require('./backend/routes/productRoutes');
const reviewRoutes = require('./backend/routes/reviewRoutes');
const couponRoutes = require('./backend/routes/couponRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lumora Beauty API is running smoothly' });
});

// Serve frontend pages for any non-API routes (enables single page routing or clean files)
// For simple static site, it will fallback to index.html if file doesn't exist
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Custom 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error occurred'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
