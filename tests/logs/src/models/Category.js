// src/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  image: {
    public_id: String,
    url: String,
    alt: String
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
  },
  attributes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'multiselect', 'boolean'],
      default: 'text'
    },
    options: [String],
    required: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  // This would be populated through population or separate query
  return this.name;
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Method to get all subcategories
categorySchema.methods.getAllSubcategories = function() {
  return this.model('Category').find({ parent: this._id, isActive: true });
};

// Method to get category hierarchy
categorySchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug
    });
    
    if (current.parent) {
      current = await this.model('Category').findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Static method to build category tree
categorySchema.statics.buildTree = async function(parentId = null) {
  const categories = await this.find({ 
    parent: parentId, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
  
  const tree = [];
  
  for (const category of categories) {
    const categoryObj = category.toObject();
    categoryObj.children = await this.buildTree(category._id);
    tree.push(categoryObj);
  }
  
  return tree;
};

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = this.model('Product');
  this.productCount = await Product.countDocuments({ 
    category: this._id, 
    status: 'active' 
  });
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);