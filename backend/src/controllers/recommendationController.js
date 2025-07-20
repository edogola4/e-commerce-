// Add these new endpoints to src/controllers/recommendationController.js

const AdvancedRecommendationService = require('../services/advancedRecommendationService');

// @desc    Get AI-powered personalized recommendations
// @route   GET /api/recommendations/ai-personal
// @access  Private
const getAIPersonalRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const algorithm = req.query.algorithm || 'hybrid'; // collaborative, content, hybrid
  
  let recommendations;
  
  switch (algorithm) {
    case 'collaborative':
      recommendations = await AdvancedRecommendationService.getCollaborativeFiltering(req.user.id, limit);
      break;
    case 'content':
      recommendations = await AdvancedRecommendationService.getContentBasedRecommendations(req.user.id, limit);
      break;
    case 'hybrid':
    default:
      recommendations = await AdvancedRecommendationService.getHybridRecommendations(req.user.id, limit);
      break;
  }
  
  res.status(200).json({
    success: true,
    algorithm,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get behavioral recommendations based on recent activity
// @route   POST /api/recommendations/behavioral
// @access  Private
const getBehavioralRecommendations = asyncHandler(async (req, res, next) => {
  const { recentActions = [] } = req.body;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const recommendations = await AdvancedRecommendationService.getBehavioralRecommendations(
    req.user.id,
    recentActions,
    limit
  );
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get seasonal recommendations
// @route   GET /api/recommendations/seasonal
// @access  Public
const getSeasonalRecommendations = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const recommendations = await AdvancedRecommendationService.getSeasonalRecommendations(limit);
  
  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: {
      recommendations
    }
  });
});

// @desc    Get complete recommendation dashboard
// @route   GET /api/recommendations/dashboard
// @access  Private
const getRecommendationDashboard = asyncHandler(async (req, res, next) => {
  const limit = 6; // Limit per section
  
  // Get multiple types of recommendations in parallel
  const [
    personalRecommendations,
    trendingProducts,
    newArrivals,
    deals,
    seasonalRecs
  ] = await Promise.all([
    AdvancedRecommendationService.getHybridRecommendations(req.user.id, limit),
    Product.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$analytics.views', 0.3] },
              { $multiply: ['$analytics.purchases', 0.7] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' }
    ]),
    Product.find({ status: 'active' })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit),
    Product.find({ 
      status: 'active', 
      discount: { $gte: 10 } 
    })
      .populate('category', 'name')
      .sort({ discount: -1 })
      .limit(limit),
    AdvancedRecommendationService.getSeasonalRecommendations(limit)
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      sections: {
        forYou: {
          title: 'Recommended for You',
          products: personalRecommendations
        },
        trending: {
          title: 'Trending Now',
          products: trendingProducts
        },
        newArrivals: {
          title: 'New Arrivals',
          products: newArrivals
        },
        deals: {
          title: 'Best Deals',
          products: deals
        },
        seasonal: {
          title: 'Seasonal Picks',
          products: seasonalRecs
        }
      }
    }
  });
});

// @desc    Track user interaction for better recommendations
// @route   POST /api/recommendations/track
// @access  Private
const trackUserInteraction = asyncHandler(async (req, res, next) => {
  const { action, productId, duration, data = {} } = req.body;
  
  // You can store this in a separate UserBehavior model or Redis for real-time tracking
  // For now, we'll update product analytics
  
  if (action === 'view' && productId) {
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.views': 1 }
    });
  }
  
  if (action === 'purchase' && productId) {
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.purchases': 1 }
    });
  }
  
  if (action === 'wishlist' && productId) {
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.wishlistCount': 1 }
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'User interaction tracked successfully'
  });
});

// @desc    Get recommendation metrics and performance
// @route   GET /api/recommendations/metrics
// @access  Private (Admin)
const getRecommendationMetrics = asyncHandler(async (req, res, next) => {
  const totalProducts = await Product.countDocuments({ status: 'active' });
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalOrders = await Order.countDocuments();
  
  // Calculate recommendation coverage
  const productsWithAnalytics = await Product.countDocuments({
    status: 'active',
    'analytics.views': { $gt: 0 }
  });
  
  const coverage = totalProducts > 0 ? (productsWithAnalytics / totalProducts) * 100 : 0;
  
  // Get top performing products
  const topProducts = await Product.find({ status: 'active' })
    .sort({ 'analytics.purchases': -1 })
    .limit(10)
    .select('name analytics.purchases analytics.views');
  
  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalProducts,
        totalUsers,
        totalOrders,
        recommendationCoverage: Math.round(coverage),
        topPerformingProducts: topProducts
      },
      algorithms: {
        collaborative: 'Users who bought similar items',
        content: 'Based on product features',
        hybrid: 'Combined collaborative + content',
        behavioral: 'Real-time user behavior',
        seasonal: 'Time and season based'
      }
    }
  });
});

module.exports = {
  // ... existing exports
  getAIPersonalRecommendations,
  getBehavioralRecommendations,
  getSeasonalRecommendations,
  getRecommendationDashboard,
  trackUserInteraction,
  getRecommendationMetrics
};