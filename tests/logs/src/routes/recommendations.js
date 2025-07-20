// src/routes/recommendations.js
const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get personalized recommendations
// @route   GET /api/recommendations/personal
// @access  Private
const getPersonalRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const user = await User.findById(req.user.id);
  
  // Get user's order history
  const userOrders = await Order.find({ user: req.user.id })
    .populate('items.product', 'category brand tags');
  
  // Extract user preferences from order history
  const userCategories = new Set();
  const userBrands = new Set();
  const userTags = new Set();
  
  userOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.product) {
        if (item.product.category) userCategories.add(item.product.category.toString());
        if (item.product.brand) userBrands.add(item.product.brand);
        if (item.product.tags) item.product.tags.forEach(tag => userTags.add(tag));
      }
    });
  });
  
  // Build recommendation query
  let query = { status: 'active' };
  
  if (userCategories.size > 0 || userBrands.size > 0 || userTags.size > 0) {
    query.$or = [];
    
    if (userCategories.size > 0) {
      query.$or.push({ category: { $in: Array.from(userCategories) } });
    }
    
    if (userBrands.size > 0) {
      query.$or.push({ brand: { $in: Array.from(userBrands) } });
    }
    
    if (userTags.size > 0) {
      query.$or.push({ tags: { $in: Array.from(userTags) } });
    }
  }
  
  // Exclude products already in wishlist or cart
  const excludeIds = [
    ...user.wishlist.map(id => id.toString()),
    ...user.cart.map(item => item.product.toString())
  ];
  
  if (excludeIds.length > 0) {
    query._id = { $nin: excludeIds };
  }
  
  const recommendations = await Product.find(query)
    .populate('category', 'name')
    .sort({ 'ratings.average': -1, 'analytics.views': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
const getTrendingProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const days = parseInt(req.query.days, 10) || 7;
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  // Get products with high views and purchases in the last X days
  const trending = await Product.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$analytics.views', 0.3] },
            { $multiply: ['$analytics.purchases', 0.7] },
            { $multiply: ['$analytics.wishlistCount', 0.2] }
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: trending.length,
    data: {
      trending
    }
  });
});

// @desc    Get similar products
// @route   GET /api/recommendations/similar/:productId
// @access  Public
const getSimilarProducts = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 6;
  const product = await Product.findById(req.params.productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Find similar products based on category, brand, and tags
  const similar = await Product.find({
    _id: { $ne: product._id },
    status: 'active',
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } }
    ]
  })
    .populate('category', 'name')
    .sort({ 'ratings.average': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: similar.length,
    data: {
      similar
    }
  });
});

// @desc    Get frequently bought together
// @route   GET /api/recommendations/frequently-bought/:productId
// @access  Public
const getFrequentlyBoughtTogether = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 4;
  
  // Find products that are frequently bought together with this product
  const frequentlyBought = await Order.aggregate([
    {
      $match: {
        'items.product': mongoose.Types.ObjectId(req.params.productId),
        status: { $in: ['delivered', 'completed'] }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $match: {
        'items.product': { $ne: mongoose.Types.ObjectId(req.params.productId) }
      }
    },
    {
      $group: {
        _id: '$items.product',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $match: {
        'product.status': 'active'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'product.category'
      }
    },
    {
      $unwind: '$product.category'
    },
    {
      $project: {
        product: 1,
        count: 1
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: frequentlyBought.length,
    data: {
      frequentlyBought: frequentlyBought.map(item => item.product)
    }
  });
});

// @desc    Get recommendations based on browsing history
// @route   GET /api/recommendations/browsing-history
// @access  Private
const getBrowsingHistoryRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  
  // This would typically use a browsing history model
  // For now, we'll use a simplified approach based on user preferences
  const user = await User.findById(req.user.id);
  
  let query = { status: 'active' };
  
  if (user.preferences && user.preferences.categories && user.preferences.categories.length > 0) {
    query.category = { $in: user.preferences.categories };
  }
  
  if (user.preferences && user.preferences.brands && user.preferences.brands.length > 0) {
    query.brand = { $in: user.preferences.brands };
  }
  
  if (user.preferences && user.preferences.priceRange) {
    query.price = {
      $gte: user.preferences.priceRange.min,
      $lte: user.preferences.priceRange.max
    };
  }
  
  const recommendations = await Product.find(query)
    .populate('category', 'name')
    .sort({ 'analytics.views': -1, 'ratings.average': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get category-based recommendations
// @route   GET /api/recommendations/category/:categoryId
// @access  Public
const getCategoryRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  
  const recommendations = await Product.find({
    category: req.params.categoryId,
    status: 'active'
  })
    .populate('category', 'name')
    .sort({ 'ratings.average': -1, 'analytics.purchases': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get new arrivals
// @route   GET /api/recommendations/new-arrivals
// @access  Public
const getNewArrivals = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const days = parseInt(req.query.days, 10) || 30;
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  const newArrivals = await Product.find({
    status: 'active',
    createdAt: { $gte: dateThreshold }
  })
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: newArrivals.length,
    data: {
      newArrivals
    }
  });
});

// @desc    Get deals and discounts
// @route   GET /api/recommendations/deals
// @access  Public
const getDeals = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const minDiscount = parseInt(req.query.minDiscount, 10) || 10;
  
  const deals = await Product.find({
    status: 'active',
    discount: { $gte: minDiscount }
  })
    .populate('category', 'name')
    .sort({ discount: -1, 'ratings.average': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: deals.length,
    data: {
      deals
    }
  });
});

// @desc    Get recommendations for cart completion
// @route   GET /api/recommendations/cart-completion
// @access  Private
const getCartCompletionRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 4;
  const user = await User.findById(req.user.id).populate('cart.product', 'category brand tags');
  
  if (!user.cart || user.cart.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: { recommendations: [] }
    });
  }
  
  // Get categories and brands from cart items
  const cartCategories = new Set();
  const cartBrands = new Set();
  const cartTags = new Set();
  const cartProductIds = new Set();
  
  user.cart.forEach(item => {
    if (item.product) {
      cartProductIds.add(item.product._id.toString());
      if (item.product.category) cartCategories.add(item.product.category.toString());
      if (item.product.brand) cartBrands.add(item.product.brand);
      if (item.product.tags) item.product.tags.forEach(tag => cartTags.add(tag));
    }
  });
  
  // Find complementary products
  const recommendations = await Product.find({
    status: 'active',
    _id: { $nin: Array.from(cartProductIds) },
    $or: [
      { category: { $in: Array.from(cartCategories) } },
      { brand: { $in: Array.from(cartBrands) } },
      { tags: { $in: Array.from(cartTags) } }
    ]
  })
    .populate('category', 'name')
    .sort({ 'analytics.purchases': -1, 'ratings.average': -1 })
    .limit(limit);
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// Public routes
router.get('/trending', getTrendingProducts);
router.get('/similar/:productId', getSimilarProducts);
router.get('/frequently-bought/:productId', getFrequentlyBoughtTogether);
router.get('/category/:categoryId', getCategoryRecommendations);
router.get('/new-arrivals', getNewArrivals);
router.get('/deals', getDeals);

// Protected routes
router.use(protect);
router.get('/personal', getPersonalRecommendations);
router.get('/browsing-history', getBrowsingHistoryRecommendations);
router.get('/cart-completion', getCartCompletionRecommendations);

module.exports = router;