// src/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variant: {
      size: String,
      color: String,
      material: String
    },
    sku: String,
    image: {
      url: String,
      alt: String
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  billingAddress: {
    name: String,
    street: String,
    city: String,
    county: String,
    postalCode: String,
    phone: String,
    email: String
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    mpesaReceiptNumber: String,
    phoneNumber: String,
    amount: Number,
    currency: {
      type: String,
      default: 'KES'
    },
    gateway: String,
    gatewayTransactionId: String,
    paymentDate: Date,
    failureReason: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingUrl: String
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'pickup'],
    default: 'standard'
  },
  deliveryInstructions: {
    type: String,
    maxlength: [500, 'Delivery instructions cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending'
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    refundId: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    maxlength: [500, 'Gift message cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin'],
    default: 'web'
  },
  customerIP: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'items.product': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${(count + 1).toString().padStart(4, '0')}`;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  next();
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy
  });
  
  // Update timestamps for specific statuses
  if (newStatus === 'delivered' && !this.actualDelivery) {
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  // Calculate tax (16% VAT in Kenya)
  this.taxAmount = this.subtotal * 0.16;
  
  // Calculate total
  this.totalAmount = this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
  
  return this;
};

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Method to check if order can be refunded
orderSchema.methods.canBeRefunded = function() {
  return ['delivered'].includes(this.status) && this.paymentStatus === 'completed';
};

// Method to process refund
orderSchema.methods.processRefund = function(amount, reason, processedBy) {
  const refund = {
    amount,
    reason,
    status: 'pending',
    processedBy,
    processedAt: new Date()
  };
  
  this.refunds.push(refund);
  
  // Update order status if full refund
  if (amount >= this.totalAmount) {
    this.status = 'refunded';
    this.paymentStatus = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }
  
  return this.save();
};

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for total quantity
orderSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for current status info
orderSchema.virtual('currentStatusInfo').get(function() {
  return this.statusHistory[this.statusHistory.length - 1];
});

// Static method to get sales analytics
orderSchema.statics.getSalesAnalytics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        totalItems: { $sum: { $sum: '$items.quantity' } }
      }
    }
  ]);
};

// Static method to get order by number
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber })
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name images')
    .populate('items.seller', 'firstName lastName');
};

module.exports = mongoose.model('Order', orderSchema);