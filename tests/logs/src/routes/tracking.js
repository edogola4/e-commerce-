
// src/routes/tracking.js
const express = require('express');
const {
  trackOrderById,
  trackOrderByNumber,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getDeliveryMetrics,
  getTrackingDashboard,
  processAutomatedUpdates,
  simulateShipmentTracking,
  getPendingStatusUpdates
} = require('../controllers/orderTrackingController');

const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Public tracking route (no auth required)
router.get('/:trackingNumber', trackOrderByNumber);

// Protected routes
router.use(protect);

// User and admin routes
router.get('/order/:orderId', validateObjectId('orderId'), trackOrderById);

// Admin and seller routes
router.patch('/order/:orderId/status', validateObjectId('orderId'), authorize('admin', 'seller'), updateOrderStatus);
router.get('/dashboard', authorize('admin', 'seller'), getTrackingDashboard);
router.get('/pending-updates', authorize('admin', 'seller'), getPendingStatusUpdates);

// Admin only routes
router.patch('/orders/bulk-status', authorize('admin'), bulkUpdateOrderStatus);
router.get('/metrics', authorize('admin'), getDeliveryMetrics);
router.post('/automated-updates', authorize('admin'), processAutomatedUpdates);
router.get('/order/:orderId/simulate', validateObjectId('orderId'), authorize('admin'), simulateShipmentTracking);

module.exports = router;