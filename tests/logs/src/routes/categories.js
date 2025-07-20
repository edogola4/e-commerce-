// src/routes/categories.js
const express = require('express');
const Category = require('../models/Category');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { protect, authorize } = require('../middleware/auth');
const { validateCategory, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .populate('children', 'name slug');
  
  res.status(200).json({
    success: true,
    count: categories.length,
    data: {
      categories
    }
  });
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = asyncHandler(async (req, res, next) => {
  const tree = await Category.buildTree();
  
  res.status(200).json({
    success: true,
    data: {
      tree
    }
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('parent', 'name slug')
    .populate('children', 'name slug');
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      category
    }
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
const createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);
  
  // If this category has a parent, add it to parent's children
  if (category.parent) {
    await Category.findByIdAndUpdate(
      category.parent,
      { $push: { children: category._id } }
    );
  }
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: {
      category
    }
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: {
      category
    }
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new AppError('Category not found', 404));
  }
  
  // Check if category has children
  if (category.children.length > 0) {
    return next(new AppError('Cannot delete category with subcategories', 400));
  }
  
  // Check if category has products
  const Product = require('../models/Product');
  const productCount = await Product.countDocuments({ category: req.params.id });
  
  if (productCount > 0) {
    return next(new AppError('Cannot delete category with products', 400));
  }
  
  await category.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Public routes
router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.get('/:id', validateObjectId(), getCategory);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', validateCategory, createCategory);
router.put('/:id', validateObjectId(), validateCategory, updateCategory);
router.delete('/:id', validateObjectId(), deleteCategory);

module.exports = router;