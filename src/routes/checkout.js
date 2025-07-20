// src/routes/checkout.js
// src/routes/checkout.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Simple test checkout routes to prevent crashes
router.get('/test', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Checkout routes working',
    endpoints: {
      summary: 'GET /api/checkout/summary',
      initiate: 'POST /api/checkout/initiate',
      payment: 'POST /api/checkout/payment/:orderId'
    }
  });
}));

// Protected routes
router.use(protect);

// Basic checkout summary
router.get('/summary', asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id).populate('cart.product', 'name price images');
  
  if (!user.cart || user.cart.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }
  
  // Simple calculation
  const subtotal = user.cart.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
  
  const tax = subtotal * 0.16; // 16% VAT
  const shipping = subtotal >= 5000 ? 0 : 300; // Free shipping over 5000
  const total = subtotal + tax + shipping;
  
  res.status(200).json({
    success: true,
    data: {
      items: user.cart,
      summary: {
        subtotal,
        tax,
        shipping,
        total,
        itemCount: user.cart.length
      },
      paymentMethods: [
        { id: 'mpesa', name: 'M-Pesa', available: true },
        { id: 'card', name: 'Credit/Debit Card', available: true },
        { id: 'cash_on_delivery', name: 'Cash on Delivery', available: true }
      ]
    }
  });
}));

// Basic order creation
router.post('/initiate', asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const User = require('../models/User');
  
  const { shippingAddress, paymentMethod = 'cash_on_delivery' } = req.body;
  
  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Shipping address is required'
    });
  }
  
  const user = await User.findById(req.user.id).populate('cart.product');
  
  if (!user.cart || user.cart.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }
  
  // Prepare order items
  const orderItems = user.cart.map(cartItem => ({
    product: cartItem.product._id,
    name: cartItem.product.name,
    price: cartItem.product.price,
    quantity: cartItem.quantity,
    sku: cartItem.product.sku,
    seller: cartItem.product.seller
  }));
  
  // Calculate totals
  const subtotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const taxAmount = subtotal * 0.16;
  const shippingAmount = subtotal >= 5000 ? 0 : 300;
  const totalAmount = subtotal + taxAmount + shippingAmount;
  
  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    totalAmount,
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount: 0,
    shippingAddress,
    billingAddress: shippingAddress,
    paymentMethod,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod
      }
    }
  });
}));

// Basic payment processing
router.post('/payment/:orderId', asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const User = require('../models/User');
  
  const { orderId } = req.params;
  const { paymentData } = req.body;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  if (order.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  
  // Simple payment processing
  if (order.paymentMethod === 'cash_on_delivery') {
    order.status = 'confirmed';
    order.paymentStatus = 'pending';
    await order.save();
    
    // Clear cart
    const user = await User.findById(req.user.id);
    await user.clearCart();
    
    res.status(200).json({
      success: true,
      message: 'Order confirmed. Payment will be collected on delivery.',
      data: { order }
    });
  } else {
    // For now, just simulate successful payment
    order.status = 'confirmed';
    order.paymentStatus = 'completed';
    order.paymentDetails = {
      transactionId: `DEMO_${Date.now()}`,
      paymentDate: new Date()
    };
    await order.save();
    
    // Clear cart
    const user = await User.findById(req.user.id);
    await user.clearCart();
    
    res.status(200).json({
      success: true,
      message: 'Payment completed successfully (Demo Mode)',
      data: { order }
    });
  }
}));

module.exports = router;