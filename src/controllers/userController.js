// src/controllers/userController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Add item to cart
// @route   POST /api/users/cart
// @access  Private
const addToCart = asyncHandler(async (req, res, next) => {
  const { product: productId, quantity = 1, variant = {} } = req.body;
  
  // Validate product exists and is available
  const product = await Product.findById(productId);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (product.status !== 'active') {
    return next(new AppError('Product is not available', 400));
  }
  
  // Check stock availability
  let availableStock = product.stock;
  
  // If variant is specified, check variant stock
  if (Object.keys(variant).length > 0) {
    const productVariant = product.variants.find(v => 
      Object.keys(variant).every(key => v[key] === variant[key])
    );
    
    if (!productVariant) {
      return next(new AppError('Product variant not found', 404));
    }
    
    availableStock = productVariant.stock;
  }
  
  if (availableStock < quantity) {
    return next(new AppError(`Only ${availableStock} items available in stock`, 400));
  }
  
  // Add to cart
  await req.user.addToCart(productId, quantity, variant);
  
  // Get updated cart with populated products
  const user = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount');
  
  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: {
      cart: user.cart
    }
  });
});

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount status');
  
  // Filter out inactive products and calculate totals
  const activeCartItems = user.cart.filter(item => 
    item.product && item.product.status === 'active'
  );
  
  let subtotal = 0;
  let totalItems = 0;
  
  const cartWithCalculations = activeCartItems.map(item => {
    const product = item.product;
    let itemPrice = product.price;
    
    // Apply discount if exists
    if (product.discount > 0) {
      itemPrice = product.price * (1 - product.discount / 100);
    }
    
    // Use variant price if specified
    if (item.selectedVariant && item.selectedVariant.price) {
      itemPrice = item.selectedVariant.price;
    }
    
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;
    totalItems += item.quantity;
    
    return {
      ...item.toObject(),
      itemPrice,
      itemTotal
    };
  });
  
  res.status(200).json({
    success: true,
    data: {
      cart: cartWithCalculations,
      summary: {
        subtotal,
        totalItems,
        itemCount: cartWithCalculations.length
      }
    }
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/users/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { itemId } = req.params;
  
  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }
  
  const user = await User.findById(req.user.id);
  const cartItem = user.cart.id(itemId);
  
  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }
  
  // Check stock availability
  const product = await Product.findById(cartItem.product);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  let availableStock = product.stock;
  
  // Check variant stock if applicable
  if (cartItem.selectedVariant && Object.keys(cartItem.selectedVariant).length > 0) {
    const productVariant = product.variants.find(v => 
      Object.keys(cartItem.selectedVariant).every(key => 
        v[key] === cartItem.selectedVariant[key]
      )
    );
    
    if (productVariant) {
      availableStock = productVariant.stock;
    }
  }
  
  if (availableStock < quantity) {
    return next(new AppError(`Only ${availableStock} items available in stock`, 400));
  }
  
  cartItem.quantity = quantity;
  await user.save();
  
  // Return updated cart
  const updatedUser = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount');
  
  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: {
      cart: updatedUser.cart
    }
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/users/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;
  
  const user = await User.findById(req.user.id);
  const cartItem = user.cart.id(itemId);
  
  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }
  
  cartItem.remove();
  await user.save();
  
  // Return updated cart
  const updatedUser = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount');
  
  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: {
      cart: updatedUser.cart
    }
  });
});

// @desc    Clear cart
// @route   DELETE /api/users/cart
// @access  Private
const clearCart = asyncHandler(async (req, res, next) => {
  await req.user.clearCart();
  
  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      cart: []
    }
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('wishlist', 'name price images discount ratings stock status');
  
  // Filter out inactive products
  const activeWishlistItems = user.wishlist.filter(product => 
    product && product.status === 'active'
  );
  
  res.status(200).json({
    success: true,
    count: activeWishlistItems.length,
    data: {
      wishlist: activeWishlistItems
    }
  });
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  const orders = await Order.find({ user: req.user.id })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
  
  const total = await Order.countDocuments({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    data: {
      orders
    }
  });
});

// @desc    Get single order
// @route   GET /api/users/orders/:orderId
// @access  Private
const getUserOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.user.id
  })
    .populate('items.product', 'name images')
    .populate('items.seller', 'firstName lastName');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      order
    }
  });
});

// @desc    Cancel order
// @route   PATCH /api/users/orders/:orderId/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.user.id
  });
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  if (!order.canBeCancelled()) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }
  
  await order.updateStatus('cancelled', 'Cancelled by customer', req.user.id);
  
  // Restore product stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.updateStock(item.quantity, 'add');
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: {
      order
    }
  });
});

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res, next) => {
  const { categories, priceRange, brands } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      preferences: {
        categories: categories || req.user.preferences.categories,
        priceRange: priceRange || req.user.preferences.priceRange,
        brands: brands || req.user.preferences.brands
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences
    }
  });
});

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get recent orders
  const recentOrders = await Order.find({ user: userId })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Get order statistics
  const orderStats = await Order.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  // Get wishlist count
  const user = await User.findById(userId).populate('wishlist', '_id');
  const wishlistCount = user.wishlist.length;
  
  // Get cart count
  const cartCount = user.cart.length;
  
  // Calculate total spent
  const totalSpent = await Order.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        status: { $in: ['delivered', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      recentOrders,
      orderStats,
      wishlistCount,
      cartCount,
      totalSpent: totalSpent[0]?.total || 0
    }
  });
});

// @desc    Search user's orders
// @route   GET /api/users/orders/search
// @access  Private
const searchOrders = asyncHandler(async (req, res, next) => {
  const { q, status, startDate, endDate } = req.query;
  
  let query = { user: req.user.id };
  
  // Status filter
  if (status) {
    query.status = status;
  }
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  // Text search
  if (q) {
    query.$or = [
      { orderNumber: { $regex: q, $options: 'i' } },
      { 'items.name': { $regex: q, $options: 'i' } }
    ];
  }
  
  const orders = await Order.find(query)
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: orders.length,
    data: {
      orders
    }
  });
});

// @desc    Get user's favorite products (most ordered)
// @route   GET /api/users/favorites
// @access  Private
const getFavoriteProducts = asyncHandler(async (req, res, next) => {
  const favorites = await Order.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        orderCount: { $sum: 1 },
        totalQuantity: { $sum: '$items.quantity' },
        lastOrdered: { $max: '$createdAt' }
      }
    },
    { $sort: { orderCount: -1, totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        product: {
          _id: '$product._id',
          name: '$product.name',
          price: '$product.price',
          images: '$product.images',
          ratings: '$product.ratings'
        },
        orderCount: 1,
        totalQuantity: 1,
        lastOrdered: 1
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: favorites.length,
    data: {
      favorites
    }
  });
});

// @desc    Update cart item variant
// @route   PATCH /api/users/cart/:itemId/variant
// @access  Private
const updateCartItemVariant = asyncHandler(async (req, res, next) => {
  const { variant } = req.body;
  const { itemId } = req.params;
  
  const user = await User.findById(req.user.id);
  const cartItem = user.cart.id(itemId);
  
  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }
  
  // Validate variant exists for the product
  const product = await Product.findById(cartItem.product);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  if (Object.keys(variant).length > 0) {
    const productVariant = product.variants.find(v => 
      Object.keys(variant).every(key => v[key] === variant[key])
    );
    
    if (!productVariant) {
      return next(new AppError('Product variant not found', 404));
    }
    
    // Check stock for new variant
    if (productVariant.stock < cartItem.quantity) {
      return next(new AppError(`Only ${productVariant.stock} items available for this variant`, 400));
    }
  }
  
  cartItem.selectedVariant = variant;
  await user.save();
  
  // Return updated cart
  const updatedUser = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount variants');
  
  res.status(200).json({
    success: true,
    message: 'Cart item variant updated',
    data: {
      cart: updatedUser.cart
    }
  });
});

// @desc    Get cart summary for checkout
// @route   GET /api/users/cart/summary
// @access  Private
const getCartSummary = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('cart.product', 'name price images stock discount status shippingInfo');
  
  if (!user.cart || user.cart.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }
  
  // Filter active products and calculate totals
  const activeCartItems = user.cart.filter(item => 
    item.product && item.product.status === 'active'
  );
  
  if (activeCartItems.length === 0) {
    return next(new AppError('No active products in cart', 400));
  }
  
  let subtotal = 0;
  let totalWeight = 0;
  let hasDigitalItems = false;
  let hasPhysicalItems = false;
  
  const summary = {
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    totalWeight: 0,
    itemCount: 0,
    requiresShipping: false
  };
  
  for (const cartItem of activeCartItems) {
    const product = cartItem.product;
    let itemPrice = product.price;
    
    // Apply discount
    if (product.discount > 0) {
      itemPrice = product.price * (1 - product.discount / 100);
    }
    
    // Use variant price if specified
    if (cartItem.selectedVariant && cartItem.selectedVariant.price) {
      itemPrice = cartItem.selectedVariant.price;
    }
    
    const itemTotal = itemPrice * cartItem.quantity;
    subtotal += itemTotal;
    
    // Check if digital or physical
    if (product.isDigital) {
      hasDigitalItems = true;
    } else {
      hasPhysicalItems = true;
      // Add weight for shipping calculation
      if (product.weight && product.weight.value) {
        totalWeight += product.weight.value * cartItem.quantity;
      }
    }
    
    summary.items.push({
      product: {
        _id: product._id,
        name: product.name,
        images: product.images
      },
      quantity: cartItem.quantity,
      price: itemPrice,
      total: itemTotal,
      variant: cartItem.selectedVariant
    });
  }
  
  summary.subtotal = subtotal;
  summary.totalWeight = totalWeight;
  summary.itemCount = activeCartItems.length;
  summary.requiresShipping = hasPhysicalItems;
  
  // Calculate tax (16% VAT in Kenya)
  summary.tax = subtotal * 0.16;
  
  // Calculate shipping (simplified - normally would be based on weight, distance, etc.)
  if (hasPhysicalItems) {
    if (subtotal >= 5000) { // Free shipping over 5000 KES
      summary.shipping = 0;
    } else {
      summary.shipping = 300; // Flat rate shipping
    }
  }
  
  summary.total = summary.subtotal + summary.tax + summary.shipping;
  
  res.status(200).json({
    success: true,
    data: {
      summary
    }
  });
});

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getWishlist,
  getUserOrders,
  getUserOrder,
  cancelOrder,
  updatePreferences,
  getUserDashboard,
  searchOrders,
  getFavoriteProducts,
  updateCartItemVariant,
  getCartSummary
};