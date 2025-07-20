// src/routes/email.js
const express = require('express');
const {
  testEmailService,
  sendLowStockAlerts,
  sendMarketingEmail,
  sendOrderConfirmationManual,
  getEmailStats
} = require('../controllers/emailController');

const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/test', testEmailService);
router.post('/low-stock-alerts', sendLowStockAlerts);
router.post('/marketing', sendMarketingEmail);
router.post('/order-confirmation/:orderId', validateObjectId('orderId'), sendOrderConfirmationManual);
router.get('/stats', getEmailStats);

module.exports = router;

// ============================================
    