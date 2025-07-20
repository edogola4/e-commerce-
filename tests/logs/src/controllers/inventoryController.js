// src/controllers/inventoryController.js
const InventoryService = require('../services/inventoryService');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
// @access  Private (Admin/Seller)
const getLowStockAlerts = asyncHandler(async (req, res, next) => {
  const alerts = await InventoryService.checkLowStockProducts();
  
  // Filter by seller if not admin
  let filteredAlerts = alerts;
  if (req.user.role === 'seller') {
    filteredAlerts = alerts.filter(alert => 
      alert.seller._id.toString() === req.user.id
    );
  }
  
  res.status(200).json({
    success: true,
    count: filteredAlerts.length,
    data: {
      alerts: filteredAlerts,
      summary: {
        critical: filteredAlerts.filter(a => a.urgency === 'critical').length,
        high: filteredAlerts.filter(a => a.urgency === 'high').length,
        medium: filteredAlerts.filter(a => a.urgency === 'medium').length
      }
    }
  });
});

// @desc    Generate stock report
// @route   GET /api/inventory/report
// @access  Private (Admin)
const generateStockReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new AppError('Start date and end date are required', 400));
  }
  
  const report = await InventoryService.generateStockReport(startDate, endDate);
  
  res.status(200).json({
    success: true,
    data: { report }
  });
});

// @desc    Adjust product stock
// @route   POST /api/inventory/adjust/:productId
// @access  Private (Admin/Seller)
const adjustStock = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { adjustments, reason } = req.body;
  
  if (!reason) {
    return next(new AppError('Reason for stock adjustment is required', 400));
  }
  
  // Check if user owns the product (for sellers)
  if (req.user.role === 'seller') {
    const product = await Product.findById(productId);
    if (!product || product.seller.toString() !== req.user.id) {
      return next(new AppError('Not authorized to adjust this product stock', 403));
    }
  }
  
  const result = await InventoryService.adjustStock(
    productId, 
    adjustments, 
    reason, 
    req.user.id
  );
  
  res.status(200).json({
    success: true,
    message: 'Stock adjusted successfully',
    data: result
  });
});

// @desc    Get stock movement history
// @route   GET /api/inventory/history/:productId
// @access  Private (Admin/Seller)
const getStockHistory = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId)
    .select('name sku stockAdjustments reservations analytics')
    .populate('stockAdjustments.adjustedBy', 'firstName lastName');
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  // Check access for sellers
  if (req.user.role === 'seller' && product.seller.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this product history', 403));
  }
  
  res.status(200).json({
    success: true,
    data: {
      product: {
        name: product.name,
        sku: product.sku,
        currentStock: product.stock
      },
      stockAdjustments: product.stockAdjustments || [],
      reservations: product.reservations || [],
      analytics: product.analytics
    }
  });
});

// @desc    Cleanup expired reservations
// @route   POST /api/inventory/cleanup-reservations
// @access  Private (Admin)
const cleanupExpiredReservations = asyncHandler(async (req, res, next) => {
  const result = await InventoryService.cleanupExpiredReservations();
  
  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get inventory dashboard
// @route   GET /api/inventory/dashboard
// @access  Private (Admin/Seller)
const getInventoryDashboard = asyncHandler(async (req, res, next) => {
  let query = { status: 'active' };
  
  // Filter by seller if not admin
  if (req.user.role === 'seller') {
    query.seller = req.user.id;
  }
  
  // Get basic inventory stats
  const totalProducts = await Product.countDocuments(query);
  const outOfStock = await Product.countDocuments({ ...query, stock: 0 });
  const lowStock = await Product.countDocuments({
    ...query,
    stock: { $lte: '$lowStockThreshold', $gt: 0 }
  });
  
  // Get low stock alerts
  const alerts = await InventoryService.checkLowStockProducts();
  const userAlerts = req.user.role === 'seller' 
    ? alerts.filter(alert => alert.seller._id.toString() === req.user.id)
    : alerts;
  
  // Get top selling products (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const topProducts = await Product.find(query)
    .sort({ 'analytics.purchases': -1 })
    .limit(5)
    .select('name sku analytics stock');
  
  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalProducts,
        outOfStock,
        lowStock,
        activeProducts: totalProducts - outOfStock
      },
      alerts: {
        critical: userAlerts.filter(a => a.urgency === 'critical').length,
        high: userAlerts.filter(a => a.urgency === 'high').length,
        total: userAlerts.length
      },
      topProducts,
      recentAlerts: userAlerts.slice(0, 5)
    }
  });
});

module.exports = {
  getLowStockAlerts,
  generateStockReport,
  adjustStock,
  getStockHistory,
  cleanupExpiredReservations,
  getInventoryDashboard
};