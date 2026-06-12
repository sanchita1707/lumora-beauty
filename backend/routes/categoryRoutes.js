const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getCategories)
  .post(protect, admin, createCategory);

router.route('/:slug')
  .get(getCategoryBySlug);

router.route('/:id')
  .delete(protect, admin, deleteCategory);

module.exports = router;
