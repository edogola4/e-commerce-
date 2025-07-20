// src/routes/orders.js
const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { protect, authorize, checkUserPermissions } = require('../middleware/auth');
const { validateOrder, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res, next) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    shippingMethod = 'standard',
    deliveryInstructions,
    notes,
    couponCode
  } = req.body;

  // Validate items and calculate totals
  let orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(new AppError(`Product ${item.product} not found`, 404));
    }
    
    if (product.status !== 'active') {
      return next(new AppError(`Product ${product.name} is not available`, 400));
    }
    
    // Check stock
    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, 400));
    }
    
    let itemPrice = product.price;
    
    // Apply product discount
    if (product.discount > 0) {
      itemPrice = product.price * (1 - product.discount / 100);
    }
    
    // Use variant price if specified
    if (item.variant && item.variant.size) {
      const variant = product.variants.find(v => 
        v.size === item.variant.size && 
        v.color === item.variant.color
      );
      
      if (variant) {
        if (variant.stock < item.quantity) {
          return next(new AppError(`Insufficient stock for ${product.name} variant`, 400));
        }
        itemPrice = variant.price || itemPrice;
      }
    }
    
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;
    
    orderItems.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity: item.quantity,
      variant: item.variant || {},
      sku: product.sku,
      image: {
        url: product.images[0]?.url,
        alt: product.name
      },
      seller: product.seller
    });
  }

  // Calculate tax (16% VAT in Kenya)
  const taxAmount = subtotal * 0.16;
  
  // Calculate shipping
  let shippingAmount = 0;
  if (shippingMethod === 'express') {
    shippingAmount = 500;
  } else if (shippingMethod === 'overnight') {
    shippingAmount = 1000;
  } else if (subtotal < 5000) {
    shippingAmount = 300; // Standard shipping fee
  }
  
  // Apply coupon discount (simplified)
  let discountAmount = 0;
  if (couponCode) {
    // Add coupon logic here
    // For now, just a simple 10% discount example
    if (couponCode === 'WELCOME10') {
      discountAmount = subtotal * 0.1;
    }
  }
  
  const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    totalAmount,
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount,
    couponCode,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    shippingMethod,
    deliveryInstructions,
    notes,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  });

  // Update product stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    await product.updateStock(item.quantity, 'subtract');
  }

  // Clear user's cart
  await req.user.clearCart();

  // Populate the order for response
  await order.populate('items.product', 'name images');
  await order.populate('user', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order
    }
  });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
  }
  
  const orders = await Order.find(query)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
  
  const total = await Order.countDocuments(query);
  
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
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res, next) => {
  let query = { _id: req.params.id };
  
  // If not admin, only allow user to see their own orders
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }
  
  const order = await Order.findOne(query)
    .populate('user', 'firstName lastName email phone')
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

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Admin/Seller)
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  await order.updateStatus(status, note, req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order
    }
  });
});

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Public (with order number)
const getOrderByNumber = asyncHandler(async (req, res, next) => {
  const order = await Order.findByOrderNumber(req.params.orderNumber);
  
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

// @desc    Process refund
// @route   POST /api/orders/:id/refund
// @access  Private (Admin)
const processRefund = asyncHandler(async (req, res, next) => {
  const { amount, reason } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  if (!order.canBeRefunded()) {
    return next(new AppError('Order cannot be refunded', 400));
  }
  
  await order.processRefund(amount, reason, req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: {
      order
    }
  });
});

// Protected routes
router.use(protect);

// User routes
router.post('/', checkUserPermissions('place_order'), validateOrder, createOrder);
router.get('/:id', validateObjectId(), getOrder);

// Admin routes
router.get('/', authorize('admin'), getOrders);
router.patch('/:id/status', validateObjectId(), authorize('admin', 'seller'), updateOrderStatus);
router.post('/:id/refund', validateObjectId(), authorize('admin'), processRefund);

// Public route for order tracking
router.get('/number/:orderNumber', getOrderByNumber);

module.exports = router;