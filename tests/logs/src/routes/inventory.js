// src/routes/inventory.js
const express = require('express');
const {
  getLowStockAlerts,
  generateStockReport,
  adjustStock,
  getStockHistory,
  cleanupExpiredReservations,
  getInventoryDashboard
} = require('../controllers/inventoryController');

const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard - accessible by admin and sellers
router.get('/dashboard', authorize('admin', 'seller'), getInventoryDashboard);

// Alerts - accessible by admin and sellers
router.get('/alerts', authorize('admin', 'seller'), getLowStockAlerts);

// Stock history - accessible by admin and sellers
router.get('/history/:productId', validateObjectId('productId'), authorize('admin', 'seller'), getStockHistory);

// Stock adjustment - accessible by admin and sellers
router.post('/adjust/:productId', validateObjectId('productId'), authorize('admin', 'seller'), adjustStock);

// Admin only routes
router.get('/report', authorize('admin'), generateStockReport);
router.post('/cleanup-reservations', authorize('admin'), cleanupExpiredReservations);

module.exports = router;