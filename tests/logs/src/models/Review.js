// src/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con cannot exceed 200 characters']
  }],
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  unhelpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Reply cannot exceed 500 characters']
    },
    isSellerReply: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: {
    type: String,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters']
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'],
      required: true
    },
    description: {
      type: String,
      maxlength: [300, 'Report description cannot exceed 300 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  variant: {
    size: String,
    color: String,
    material: String
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    field: String,
    oldValue: String,
    newValue: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for helpful ratio
reviewSchema.virtual('helpfulRatio').get(function() {
  const total = this.helpful.count + this.unhelpful.count;
  return total > 0 ? (this.helpful.count / total) * 100 : 0;
});

// Method to mark as helpful
reviewSchema.methods.markHelpful = function(userId) {
  // Remove from unhelpful if exists
  const unhelpfulIndex = this.unhelpful.users.indexOf(userId);
  if (unhelpfulIndex > -1) {
    this.unhelpful.users.splice(unhelpfulIndex, 1);
    this.unhelpful.count = Math.max(0, this.unhelpful.count - 1);
  }
  
  // Add to helpful if not already there
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  }
  
  return this.save();
};

// Method to mark as unhelpful
reviewSchema.methods.markUnhelpful = function(userId) {
  // Remove from helpful if exists
  const helpfulIndex = this.helpful.users.indexOf(userId);
  if (helpfulIndex > -1) {
    this.helpful.users.splice(helpfulIndex, 1);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
  }
  
  // Add to unhelpful if not already there
  if (!this.unhelpful.users.includes(userId)) {
    this.unhelpful.users.push(userId);
    this.unhelpful.count += 1;
  }
  
  return this.save();
};

// Method to add reply
reviewSchema.methods.addReply = function(userId, message, isSellerReply = false) {
  this.replies.push({
    user: userId,
    message,
    isSellerReply,
    createdAt: new Date()
  });
  
  return this.save();
};

// Method to report review
reviewSchema.methods.reportReview = function(userId, reason, description = '') {
  // Check if user already reported
  const existingReport = this.reports.find(report => 
    report.user.toString() === userId.toString()
  );
  
  if (existingReport) {
    throw new Error('You have already reported this review');
  }
  
  this.reports.push({
    user: userId,
    reason,
    description,
    createdAt: new Date()
  });
  
  this.reportCount += 1;
  
  // Auto-flag if too many reports
  if (this.reportCount >= 5) {
    this.status = 'flagged';
  }
  
  return this.save();
};

// Method to update review
reviewSchema.methods.updateReview = function(updates) {
  const allowedUpdates = ['rating', 'title', 'comment', 'pros', 'cons'];
  const editHistory = [];
  
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined && updates[field] !== this[field]) {
      editHistory.push({
        field,
        oldValue: this[field],
        newValue: updates[field],
        editedAt: new Date()
      });
      this[field] = updates[field];
    }
  });
  
  if (editHistory.length > 0) {
    this.isEdited = true;
    this.editHistory.push(...editHistory);
  }
  
  return this.save();
};

// Pre-save middleware to verify purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Order = this.model('Order');
    const order = await Order.findOne({
      _id: this.order,
      user: this.user,
      'items.product': this.product,
      status: 'delivered'
    });
    
    if (order) {
      this.verified = true;
      this.purchaseDate = order.actualDelivery || order.createdAt;
    }
  }
  next();
});

// Post-save middleware to update product ratings
reviewSchema.post('save', async function() {
  const Product = this.model('Product');
  const product = await Product.findById(this.product);
  
  if (product) {
    // Recalculate ratings
    const reviews = await this.model('Review').find({
      product: this.product,
      status: 'approved'
    });
    
    const totalReviews = reviews.length;
    if (totalReviews > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Update rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        distribution[review.rating]++;
      });
      
      product.ratings = {
        average: Math.round(averageRating * 10) / 10,
        count: totalReviews,
        distribution
      };
      
      await product.save();
    }
  }
});

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function(productId) {
  return this.aggregate([
    {
      $match: {
        product: productId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Static method to get top reviews
reviewSchema.statics.getTopReviews = function(productId, limit = 5) {
  return this.find({
    product: productId,
    status: 'approved'
  })
  .sort({ 'helpful.count': -1, createdAt: -1 })
  .limit(limit)
  .populate('user', 'firstName lastName avatar')
  .populate('replies.user', 'firstName lastName avatar');
};

module.exports = mongoose.model('Review', reviewSchema);