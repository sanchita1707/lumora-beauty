const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // Percentage discount
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  images: [{ type: String, required: true }], // Unsplash URLs
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  stock: { type: Number, required: true, default: 0, min: 0 },
  brand: { type: String, default: 'Lumora Beauty' },
  isBestseller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  tags: [{ type: String }],
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  frequentlyBoughtTogether: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Indexing for search
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
