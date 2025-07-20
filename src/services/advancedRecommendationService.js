// src/services/advancedRecommendationService.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

class AdvancedRecommendationService {
  
  // Collaborative Filtering - Users who are similar to you also liked
  async getCollaborativeFiltering(userId, limit = 10) {
    try {
      // Get user's order history
      const userOrders = await Order.find({ user: userId })
        .populate('items.product', 'category brand');
      
      const userProductIds = new Set();
      const userCategories = new Map();
      const userBrands = new Map();
      
      // Analyze user preferences
      userOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product) {
            userProductIds.add(item.product._id.toString());
            
            // Count category preferences
            const category = item.product.category?.toString();
            if (category) {
              userCategories.set(category, (userCategories.get(category) || 0) + item.quantity);
            }
            
            // Count brand preferences
            const brand = item.product.brand;
            if (brand) {
              userBrands.set(brand, (userBrands.get(brand) || 0) + item.quantity);
            }
          }
        });
      });
      
      if (userProductIds.size === 0) {
        return this.getFallbackRecommendations(limit);
      }
      
      // Find similar users (users who bought similar products)
      const similarUsers = await Order.aggregate([
        {
          $match: {
            user: { $ne: userId },
            'items.product': { $in: Array.from(userProductIds).map(id => mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $group: {
            _id: '$user',
            commonProducts: { $sum: 1 },
            totalProducts: { $sum: { $size: '$items' } }
          }
        },
        {
          $addFields: {
            similarity: { $divide: ['$commonProducts', '$totalProducts'] }
          }
        },
        {
          $sort: { similarity: -1 }
        },
        {
          $limit: 20
        }
      ]);
      
      // Get products bought by similar users
      const similarUserIds = similarUsers.map(u => u._id);
      const recommendations = await Order.aggregate([
        {
          $match: {
            user: { $in: similarUserIds },
            'items.product': { $nin: Array.from(userProductIds).map(id => mongoose.Types.ObjectId(id)) }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.product',
            frequency: { $sum: '$items.quantity' },
            userCount: { $addToSet: '$user' }
          }
        },
        {
          $addFields: {
            score: { $multiply: ['$frequency', { $size: '$userCount' }] }
          }
        },
        {
          $sort: { score: -1 }
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
        }
      ]);
      
      return recommendations.map(r => ({
        ...r.product,
        recommendationScore: r.score,
        recommendationType: 'collaborative_filtering'
      }));
      
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }
  
  // Content-Based Filtering - Based on product features
  async getContentBasedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      const userOrders = await Order.find({ user: userId })
        .populate('items.product', 'category brand price tags');
      
      // Analyze user's product preferences
      const preferences = {
        categories: new Map(),
        brands: new Map(),
        priceRanges: [],
        tags: new Map()
      };
      
      userOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product) {
            const product = item.product;
            
            // Category preferences
            if (product.category) {
              const cat = product.category.toString();
              preferences.categories.set(cat, (preferences.categories.get(cat) || 0) + 1);
            }
            
            // Brand preferences
            if (product.brand) {
              preferences.brands.set(product.brand, (preferences.brands.get(product.brand) || 0) + 1);
            }
            
            // Price preferences
            preferences.priceRanges.push(product.price);
            
            // Tag preferences
            if (product.tags) {
              product.tags.forEach(tag => {
                preferences.tags.set(tag, (preferences.tags.get(tag) || 0) + 1);
              });
            }
          }
        });
      });
      
      if (preferences.priceRanges.length === 0) {
        return this.getFallbackRecommendations(limit);
      }
      
      // Calculate preferred price range
      const avgPrice = preferences.priceRanges.reduce((a, b) => a + b, 0) / preferences.priceRanges.length;
      const priceMargin = avgPrice * 0.3; // 30% margin
      
      // Get top categories and brands
      const topCategories = Array.from(preferences.categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);
      
      const topBrands = Array.from(preferences.brands.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([brand]) => brand);
      
      const topTags = Array.from(preferences.tags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);
      
      // Build query
      const query = {
        status: 'active',
        _id: { $nin: user.cart.map(item => item.product) },
        $or: [
          { category: { $in: topCategories } },
          { brand: { $in: topBrands } },
          { tags: { $in: topTags } }
        ],
        price: {
          $gte: Math.max(0, avgPrice - priceMargin),
          $lte: avgPrice + priceMargin
        }
      };
      
      const recommendations = await Product.find(query)
        .populate('category', 'name')
        .sort({ 'ratings.average': -1, 'analytics.purchases': -1 })
        .limit(limit);
      
      return recommendations.map(product => ({
        ...product.toObject(),
        recommendationType: 'content_based',
        recommendationScore: this.calculateContentScore(product, preferences)
      }));
      
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }
  
  // Hybrid Recommendation System
  async getHybridRecommendations(userId, limit = 10) {
    try {
      // Get recommendations from both methods
      const collaborativeRecs = await this.getCollaborativeFiltering(userId, Math.ceil(limit * 0.6));
      const contentRecs = await this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.4));
      
      // Combine and deduplicate
      const combined = new Map();
      
      collaborativeRecs.forEach(product => {
        combined.set(product._id.toString(), {
          ...product,
          hybridScore: (product.recommendationScore || 0) * 0.6
        });
      });
      
      contentRecs.forEach(product => {
        const id = product._id.toString();
        if (combined.has(id)) {
          const existing = combined.get(id);
          existing.hybridScore += (product.recommendationScore || 0) * 0.4;
          existing.recommendationType = 'hybrid';
        } else {
          combined.set(id, {
            ...product,
            hybridScore: (product.recommendationScore || 0) * 0.4,
            recommendationType: 'hybrid'
          });
        }
      });
      
      // Sort by hybrid score and return top results
      return Array.from(combined.values())
        .sort((a, b) => b.hybridScore - a.hybridScore)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Hybrid recommendations error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }
  
  // Real-time Behavioral Recommendations
  async getBehavioralRecommendations(userId, recentActions = [], limit = 10) {
    try {
      // recentActions: [{ type: 'view', productId: 'xxx', timestamp: Date }]
      const recentProductIds = recentActions
        .filter(action => action.type === 'view')
        .slice(0, 10)
        .map(action => action.productId);
      
      if (recentProductIds.length === 0) {
        return this.getHybridRecommendations(userId, limit);
      }
      
      // Get recently viewed products
      const recentProducts = await Product.find({
        _id: { $in: recentProductIds }
      }).populate('category');
      
      // Extract categories and brands from recent views
      const recentCategories = [...new Set(recentProducts.map(p => p.category?._id.toString()))];
      const recentBrands = [...new Set(recentProducts.map(p => p.brand))];
      const recentTags = [...new Set(recentProducts.flatMap(p => p.tags || []))];
      
      // Find similar products
      const recommendations = await Product.find({
        status: 'active',
        _id: { $nin: recentProductIds },
        $or: [
          { category: { $in: recentCategories } },
          { brand: { $in: recentBrands } },
          { tags: { $in: recentTags } }
        ]
      })
        .populate('category', 'name')
        .sort({ 'analytics.views': -1, 'ratings.average': -1 })
        .limit(limit);
      
      return recommendations.map(product => ({
        ...product.toObject(),
        recommendationType: 'behavioral',
        recommendationScore: this.calculateBehavioralScore(product, recentProducts)
      }));
      
    } catch (error) {
      console.error('Behavioral recommendations error:', error);
      return this.getHybridRecommendations(userId, limit);
    }
  }
  
  // Seasonal/Time-based Recommendations
  async getSeasonalRecommendations(limit = 10) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      
      // Define seasonal tags
      const seasonalTags = {
        'winter': [12, 1, 2], // Dec, Jan, Feb
        'spring': [3, 4, 5],  // Mar, Apr, May
        'summer': [6, 7, 8],  // Jun, Jul, Aug
        'autumn': [9, 10, 11] // Sep, Oct, Nov
      };
      
      let currentSeason = 'summer'; // default
      for (const [season, months] of Object.entries(seasonalTags)) {
        if (months.includes(month)) {
          currentSeason = season;
          break;
        }
      }
      
      // Get products with seasonal relevance
      const recommendations = await Product.find({
        status: 'active',
        $or: [
          { tags: { $in: [currentSeason] } },
          { name: { $regex: currentSeason, $options: 'i' } },
          { description: { $regex: currentSeason, $options: 'i' } }
        ]
      })
        .populate('category', 'name')
        .sort({ 'ratings.average': -1, 'analytics.purchases': -1 })
        .limit(limit);
      
      return recommendations.map(product => ({
        ...product.toObject(),
        recommendationType: 'seasonal',
        season: currentSeason
      }));
      
    } catch (error) {
      console.error('Seasonal recommendations error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }
  
  // Helper method to calculate content-based score
  calculateContentScore(product, preferences) {
    let score = 0;
    
    // Category score
    if (product.category && preferences.categories.has(product.category.toString())) {
      score += preferences.categories.get(product.category.toString()) * 3;
    }
    
    // Brand score
    if (product.brand && preferences.brands.has(product.brand)) {
      score += preferences.brands.get(product.brand) * 2;
    }
    
    // Tags score
    if (product.tags) {
      product.tags.forEach(tag => {
        if (preferences.tags.has(tag)) {
          score += preferences.tags.get(tag);
        }
      });
    }
    
    // Rating boost
    score += (product.ratings?.average || 0) * 10;
    
    return score;
  }
  
  // Helper method to calculate behavioral score
  calculateBehavioralScore(product, recentProducts) {
    let score = 0;
    
    recentProducts.forEach(recentProduct => {
      // Same category
      if (product.category?.toString() === recentProduct.category?._id.toString()) {
        score += 5;
      }
      
      // Same brand
      if (product.brand === recentProduct.brand) {
        score += 3;
      }
      
      // Similar tags
      const commonTags = (product.tags || []).filter(tag => 
        (recentProduct.tags || []).includes(tag)
      );
      score += commonTags.length * 2;
    });
    
    return score;
  }
  
  // Fallback recommendations for new users
  async getFallbackRecommendations(limit = 10) {
    return await Product.find({ status: 'active', isFeatured: true })
      .populate('category', 'name')
      .sort({ 'ratings.average': -1, 'analytics.purchases': -1 })
      .limit(limit);
  }
}

module.exports = new AdvancedRecommendationService();