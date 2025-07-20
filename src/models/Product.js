// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
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
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    size: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      min: [0, 'Variant price cannot be negative']
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true
    },
    image: {
      public_id: String,
      url: String
    }
  }],
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  },
  specifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches', 'm'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['g', 'kg', 'lbs'],
      default: 'kg'
    }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  downloadLink: {
    type: String,
    trim: true
  },
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'overnight', 'free'],
      default: 'standard'
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    estimatedDelivery: {
      min: Number, // days
      max: Number  // days
    }
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    wishlistCount: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ 'ratings.average': -1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });

// Virtual for calculating final price after discount
productSchema.virtual('finalPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0 || this.variants.some(variant => variant.stock > 0);
});

// Virtual for checking if product is low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Method to update ratings
productSchema.methods.updateRatings = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  
  // This would typically be calculated from actual review data
  // For now, we'll use a placeholder calculation
  const totalRatings = Object.values(this.ratings.distribution).reduce((sum, count) => sum + count, 0);
  
  if (totalRatings > 0) {
    const weightedSum = Object.entries(this.ratings.distribution).reduce((sum, [rating, count]) => {
      return sum + (parseInt(rating) * count);
    }, 0);
    
    this.ratings.average = Math.round((weightedSum / totalRatings) * 10) / 10;
    this.ratings.count = totalRatings;
  }
};

// Method to increment view count
productSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  return this.save();
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
  } else {
    this.stock += quantity;
  }
  
  // Update status based on stock
  if (this.stock === 0) {
    this.status = 'out_of_stock';
  } else if (this.status === 'out_of_stock') {
    this.status = 'active';
  }
  
  return this.save();
};

// Static method to find related products
productSchema.statics.findRelated = function(productId, category, brand, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    $or: [
      { category: category },
      { brand: brand }
    ],
    status: 'active'
  })
  .limit(limit)
  .populate('category', 'name');
};

// Static method for search
productSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    $and: [
      { status: 'active' },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  };
  
  // Add filters
  if (filters.category) {
    searchQuery.$and.push({ category: filters.category });
  }
  
  if (filters.brand) {
    searchQuery.$and.push({ brand: { $in: filters.brand } });
  }
  
  if (filters.minPrice || filters.maxPrice) {
    const priceFilter = {};
    if (filters.minPrice) priceFilter.$gte = filters.minPrice;
    if (filters.maxPrice) priceFilter.$lte = filters.maxPrice;
    searchQuery.$and.push({ price: priceFilter });
  }
  
  if (filters.rating) {
    searchQuery.$and.push({ 'ratings.average': { $gte: filters.rating } });
  }
  
  return this.find(searchQuery)
    .populate('category', 'name')
    .populate('seller', 'firstName lastName');
};

module.exports = mongoose.model('Product', productSchema);