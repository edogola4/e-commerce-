// src/controllers/orderTrackingController.js
const OrderTrackingService = require('../services/orderTrackingService');
const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Track order by ID
// @route   GET /api/tracking/order/:orderId
// @access  Private
const trackOrderById = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  
  // Check if user owns the order (unless admin)
  if (req.user.role !== 'admin') {
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user.id) {
      return next(new AppError('Order not found or access denied', 404));
    }
  }
  
  const trackingData = await OrderTrackingService.getOrderTracking(orderId);
  
  res.status(200).json({
    success: true,
    data: trackingData
  });
});

// @desc    Track order by tracking number
// @route   GET /api/tracking/:trackingNumber
// @access  Public
const trackOrderByNumber = asyncHandler(async (req, res, next) => {
  const { trackingNumber } = req.params;
  
  const orders = await OrderTrackingService.getOrdersByTrackingNumber(trackingNumber);
  
  if (orders.length === 0) {
    return next(new AppError('No orders found with this tracking number', 404));
  }
  
  // Get tracking data for the first order (should only be one)
  const trackingData = await OrderTrackingService.getOrderTracking(orders[0]._id);
  
  res.status(200).json({
    success: true,
    data: trackingData
  });
});

// @desc    Update order status
// @route   PATCH /api/tracking/order/:orderId/status
// @access  Private (Admin/Seller)
const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { status, note, carrier, estimatedDelivery, trackingUrl } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  // Check if user can update this order
  if (req.user.role === 'seller') {
    const order = await Order.findById(orderId).populate('items.seller');
    const canUpdate = order.items.some(item => 
      item.seller.toString() === req.user.id
    );
    
    if (!canUpdate) {
      return next(new AppError('Not authorized to update this order', 403));
    }
  }
  
  const updateData = {
    note,
    carrier,
    estimatedDelivery,
    trackingUrl
  };
  
  const result = await OrderTrackingService.updateOrderStatus(
    orderId,
    status,
    updateData,
    req.user.id
  );
  
  res.status(200).json({
    success: true,
    message: result.message,
    data: { order: result.order }
  });
});

// @desc    Bulk update order status
// @route   PATCH /api/tracking/orders/bulk-status
// @access  Private (Admin)
const bulkUpdateOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderIds, status, note, carrier } = req.body;
  
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return next(new AppError('Order IDs array is required', 400));
  }
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }
  
  const updateData = { note, carrier };
  
  const results = await OrderTrackingService.bulkUpdateOrderStatus(
    orderIds,
    status,
    updateData,
    req.user.id
  );
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  res.status(200).json({
    success: true,
    message: `Updated ${successCount} orders, ${failureCount} failed`,
    data: {
      results,
      summary: {
        total: orderIds.length,
        success: successCount,
        failed: failureCount
      }
    }
  });
});

// @desc    Get delivery performance metrics
// @route   GET /api/tracking/metrics
// @access  Private (Admin)
const getDeliveryMetrics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new AppError('Start date and end date are required', 400));
  }
  
  const metrics = await OrderTrackingService.getDeliveryPerformanceMetrics(startDate, endDate);
  
  res.status(200).json({
    success: true,
    data: { metrics }
  });
});

// @desc    Get tracking dashboard
// @route   GET /api/tracking/dashboard
// @access  Private (Admin/Seller)
const getTrackingDashboard = asyncHandler(async (req, res, next) => {
  let query = {};
  
  // Filter by seller if not admin
  if (req.user.role === 'seller') {
    query['items.seller'] = req.user.id;
  }
  
  // Get orders by status
  const statusCounts = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get recent orders needing attention
  const pendingOrders = await Order.find({
    ...query,
    status: { $in: ['pending', 'confirmed'] }
  })
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Get overdue deliveries
  const overdueDeliveries = await Order.find({
    ...query,
    status: 'shipped',
    estimatedDelivery: { $lt: new Date() }
  })
    .populate('user', 'firstName lastName')
    .sort({ estimatedDelivery: 1 })
    .limit(5);
  
  // Calculate today's statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStats = await Order.aggregate([
    {
      $match: {
        ...query,
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        shipped: {
          $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
        }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      pendingOrders,
      overdueDeliveries,
      todayStats: todayStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        delivered: 0,
        shipped: 0
      }
    }
  });
});

// @desc    Process automated status updates
// @route   POST /api/tracking/automated-updates
// @access  Private (Admin)
const processAutomatedUpdates = asyncHandler(async (req, res, next) => {
  const updates = await OrderTrackingService.processAutomatedStatusUpdates();
  
  res.status(200).json({
    success: true,
    message: `Processed ${updates.length} automated updates`,
    data: { updates }
  });
});

// @desc    Simulate shipment tracking
// @route   GET /api/tracking/order/:orderId/simulate
// @access  Private (Admin)
const simulateShipmentTracking = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  
  const trackingEvents = await OrderTrackingService.simulateShipmentProgress(orderId);
  
  res.status(200).json({
    success: true,
    data: {
      orderId,
      trackingEvents,
      message: 'Simulated tracking events (demo purposes)'
    }
  });
});

// @desc    Get orders requiring status update
// @route   GET /api/tracking/pending-updates
// @access  Private (Admin/Seller)
const getPendingStatusUpdates = asyncHandler(async (req, res, next) => {
  let query = {};
  
  if (req.user.role === 'seller') {
    query['items.seller'] = req.user.id;
  }
  
  // Orders that might need status updates
  const pendingUpdates = await Order.find({
    ...query,
    status: { $in: ['confirmed', 'processing'] },
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
  })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: 1 });
  
  // Orders shipped but not delivered within estimated time
  const overdueShipments = await Order.find({
    ...query,
    status: 'shipped',
    estimatedDelivery: { $lt: new Date() }
  })
    .populate('user', 'firstName lastName email')
    .sort({ estimatedDelivery: 1 });
  
  res.status(200).json({
    success: true,
    data: {
      pendingUpdates: pendingUpdates.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        customer: order.user,
        ageInDays: Math.floor((Date.now() - order.createdAt) / (1000 * 60 * 60 * 24)),
        suggestedAction: order.status === 'confirmed' ? 'Move to Processing' : 'Generate Tracking'
      })),
      overdueShipments: overdueShipments.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        estimatedDelivery: order.estimatedDelivery,
        customer: order.user,
        daysOverdue: Math.floor((Date.now() - order.estimatedDelivery) / (1000 * 60 * 60 * 24)),
        trackingNumber: order.trackingInfo?.trackingNumber
      }))
    }
  });
});

module.exports = {
  trackOrderById,
  trackOrderByNumber,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getDeliveryMetrics,
  getTrackingDashboard,
  processAutomatedUpdates,
  simulateShipmentTracking,
  getPendingStatusUpdates
};