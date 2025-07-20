// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
  },
  avatar: {
    public_id: String,
    url: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user'
  },
  addresses: [{
    name: String,
    street: String,
    city: String,
    county: String,
    postalCode: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    categories: [String],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000000 }
    },
    brands: [String]
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    selectedVariant: {
      size: String,
      color: String,
      price: Number
    }
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'cart.product': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to add to cart
userSchema.methods.addToCart = function(productId, quantity = 1, variant = {}) {
  const existingItem = this.cart.find(item => 
    item.product.toString() === productId.toString() &&
    JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.cart.push({
      product: productId,
      quantity,
      selectedVariant: variant
    });
  }
  
  return this.save();
};

// Method to remove from cart
userSchema.methods.removeFromCart = function(productId, variant = {}) {
  this.cart = this.cart.filter(item => 
    !(item.product.toString() === productId.toString() &&
      JSON.stringify(item.selectedVariant) === JSON.stringify(variant))
  );
  
  return this.save();
};

// Method to clear cart
userSchema.methods.clearCart = function() {
  this.cart = [];
  return this.save();
};

module.exports = mongoose.model('User', userSchema);