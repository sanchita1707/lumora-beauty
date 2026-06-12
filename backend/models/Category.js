const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  image: { type: String, required: true } // Unsplash cover image URL
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);
