// src/controllers/emailController.js
const EmailService = require('../services/emailService');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Test email service
// @route   GET /api/email/test
// @access  Private (Admin)
const testEmailService = asyncHandler(async (req, res, next) => {
  const result = await EmailService.testConnection();
  
  if (result.success) {
    // Send a test email
    const testResult = await EmailService.sendEmail(
      req.user.email,
      'Test Email - E-Commerce Backend',
      '<h1>Email Service is Working!</h1><p>This is a test email from your e-commerce backend.</p>'
    );
    
    res.status(200).json({
      success: true,
      message: 'Email service is working',
      data: { connectionTest: result, testEmail: testResult }
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Email service connection failed',
      error: result.error
    });
  }
});

// @desc    Send low stock alerts
// @route   POST /api/email/low-stock-alerts
// @access  Private (Admin)
const sendLowStockAlerts = asyncHandler(async (req, res, next) => {
  // Get products with low stock
  const lowStockProducts = await Product.find({
    status: 'active',
    stock: { $lte: '$lowStockThreshold' }
  }).populate('seller', 'firstName lastName email');
  
  if (lowStockProducts.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No low stock products found',
      data: { alertsSent: 0 }
    });
  }
  
  const results = [];
  
  for (const product of lowStockProducts) {
    if (product.seller && product.seller.email) {
      const result = await EmailService.sendLowStockAlert(
        product,
        [product.seller],
        product.stock
      );
      results.push({ product: product.name, result });
    }
  }
  
  res.status(200).json({
    success: true,
    message: `Low stock alerts sent for ${results.length} products`,
    data: { alertsSent: results.length, results }
  });
});

// @desc    Send marketing email to all users
// @route   POST /api/email/marketing
// @access  Private (Admin)
const sendMarketingEmail = asyncHandler(async (req, res, next) => {
  const { subject, content, targetAudience = 'all' } = req.body;
  
  if (!subject || !content) {
    return next(new AppError('Subject and content are required', 400));
  }
  
  let query = { isActive: true, isEmailVerified: true };
  
  // Filter by target audience
  if (targetAudience === 'customers') {
    query.role = 'user';
  } else if (targetAudience === 'sellers') {
    query.role = 'seller';
  }
  
  const users = await User.find(query).select('email firstName lastName');
  
  if (users.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No users found for the target audience'
    });
  }
  
  // Create HTML email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${subject}</h1>
      </div>
      
      <div style="padding: 20px;">
        ${content}
      </div>
      
      <div style="padding: 20px; background: #f3f4f6; text-align: center; color: #666;">
        <p style="margin: 0;">
          <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #666;">Unsubscribe</a> |
          <a href="${process.env.FRONTEND_URL}" style="color: #666;">Visit Store</a>
        </p>
      </div>
    </div>
  `;
  
  // Send bulk email
  const results = await EmailService.sendBulkEmail(users, subject, html);
  
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;
  
  res.status(200).json({
    success: true,
    message: `Marketing email sent to ${successCount} users`,
    data: {
      targetAudience,
      totalUsers: users.length,
      sent: successCount,
      failed: failureCount
    }
  });
});

// @desc    Send order confirmation manually
// @route   POST /api/email/order-confirmation/:orderId
// @access  Private (Admin)
const sendOrderConfirmationManual = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name');
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  const result = await EmailService.sendOrderConfirmation(order, order.user);
  
  res.status(200).json({
    success: true,
    message: 'Order confirmation email sent',
    data: result
  });
});

// @desc    Get email statistics
// @route   GET /api/email/stats
// @access  Private (Admin)
const getEmailStats = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  // This would typically come from a proper email tracking system
  // For now, we'll return mock statistics
  const stats = {
    period: { startDate, endDate },
    emailsSent: {
      orderConfirmations: 45,
      statusUpdates: 67,
      lowStockAlerts: 12,
      marketing: 150,
      welcomeEmails: 23
    },
    deliveryStats: {
      delivered: 245,
      opened: 189,
      clicked: 67,
      bounced: 8,
      complained: 2
    },
    topPerformingEmails: [
      { type: 'Order Confirmation', openRate: '98%', clickRate: '45%' },
      { type: 'Status Update', openRate: '85%', clickRate: '32%' },
      { type: 'Marketing', openRate: '65%', clickRate: '12%' }
    ]
  };
  
  res.status(200).json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  testEmailService,
  sendLowStockAlerts,
  sendMarketingEmail,
  sendOrderConfirmationManual,
  getEmailStats
};