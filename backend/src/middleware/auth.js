// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        return res.status(401).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth - doesn't require login but sets user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive && !user.isLocked) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but that's okay for optional auth
        console.log('Optional auth token invalid:', error.message);
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      // Check if user owns the resource or is admin
      if (resource.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in ownership check'
      });
    }
  };
};

// Check if user has verified email
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// Rate limiting by user
const rateLimitByUser = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user.id;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userRequest = userRequests.get(userId);
    
    if (now > userRequest.resetTime) {
      userRequest.count = 1;
      userRequest.resetTime = now + windowMs;
      return next();
    }
    
    if (userRequest.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
    
    userRequest.count++;
    next();
  };
};

// Check if user can perform action (e.g., post review, place order)
const checkUserPermissions = (action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      switch (action) {
        case 'review':
          // Check if user has purchased the product
          const Order = require('../models/Order');
          const productId = req.body.product || req.params.productId;
          
          const order = await Order.findOne({
            user: user.id,
            'items.product': productId,
            status: 'delivered'
          });
          
          if (!order) {
            return res.status(403).json({
              success: false,
              message: 'You can only review products you have purchased'
            });
          }
          
          // Check if already reviewed
          const Review = require('../models/Review');
          const existingReview = await Review.findOne({
            user: user.id,
            product: productId
          });
          
          if (existingReview) {
            return res.status(400).json({
              success: false,
              message: 'You have already reviewed this product'
            });
          }
          
          req.order = order;
          break;
          
        case 'place_order':
          // Check if cart is not empty
          if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Your cart is empty'
            });
          }
          break;
          
        case 'seller_action':
          // Check if user is seller or admin
          if (!['seller', 'admin'].includes(user.role)) {
            return res.status(403).json({
              success: false,
              message: 'Only sellers and admins can perform this action'
            });
          }
          break;
          
        default:
          break;
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in permission check'
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  requireEmailVerification,
  rateLimitByUser,
  checkUserPermissions
};