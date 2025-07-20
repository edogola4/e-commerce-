// src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }
  
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Email service initialization failed:', error.message);
    }
  }
  
  // ============================================
  // EMAIL TEMPLATES
  // ============================================
  
  generateOrderConfirmationEmail(order, user) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.image?.url || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
          <strong>${item.name}</strong>
          ${item.variant?.size ? `<br><small>Size: ${item.variant.size}</small>` : ''}
          ${item.variant?.color ? `<br><small>Color: ${item.variant.color}</small>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.price.toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">KES ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');
    
    return {
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Order Confirmed!</h1>
            <p style="margin: 5px 0 0 0;">Thank you for your order, ${user.firstName}!</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 4px;">${order.status}</span></p>
          </div>
          
          <div style="padding: 20px;">
            <h3>Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Order Summary</h3>
            <table style="width: 100%;">
              <tr><td>Subtotal:</td><td style="text-align: right;">KES ${order.subtotal.toLocaleString()}</td></tr>
              <tr><td>Tax (16% VAT):</td><td style="text-align: right;">KES ${order.taxAmount.toLocaleString()}</td></tr>
              <tr><td>Shipping:</td><td style="text-align: right;">KES ${order.shippingAmount.toLocaleString()}</td></tr>
              ${order.discountAmount > 0 ? `<tr><td>Discount:</td><td style="text-align: right; color: #10B981;">-KES ${order.discountAmount.toLocaleString()}</td></tr>` : ''}
              <tr style="border-top: 2px solid #ddd; font-weight: bold; font-size: 18px;">
                <td>Total:</td><td style="text-align: right;">KES ${order.totalAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="padding: 20px;">
            <h3>Shipping Address</h3>
            <p>
              ${order.shippingAddress.name}<br>
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.county}<br>
              ${order.shippingAddress.postalCode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          
          <div style="padding: 20px; background: #4F46E5; color: white; text-align: center;">
            <p style="margin: 0;">Questions? Contact us at support@yourstore.com</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Track your order: <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="color: #93C5FD;">View Order Status</a></p>
          </div>
        </div>
      `
    };
  }
  
  generateOrderStatusUpdateEmail(order, user, newStatus) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is now being processed and will be shipped soon.',
      shipped: `Your order has been shipped! ${order.trackingInfo?.trackingNumber ? `Tracking: ${order.trackingInfo.trackingNumber}` : ''}`,
      delivered: 'Your order has been delivered! We hope you enjoyed your purchase.',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact our support team.'
    };
    
    const statusMessage = statusMessages[newStatus] || 'Your order status has been updated.';
    
    return {
      subject: `Order Status Update - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Order Status Update</h1>
            <p style="margin: 5px 0 0 0;">Hello ${user.firstName},</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2>Order Details</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 4px;">${newStatus}</span></p>
          </div>
          
          <div style="padding: 20px;">
            <p>${statusMessage}</p>
            ${order.trackingInfo?.trackingNumber ? `<p>Tracking Number: ${order.trackingInfo.trackingNumber}</p>` : ''}
            ${order.trackingInfo?.carrier ? `<p>Carrier: ${order.trackingInfo.carrier}</p>` : ''}
            ${order.trackingInfo?.estimatedDelivery ? `<p>Estimated Delivery: ${order.trackingInfo.estimatedDelivery.toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="padding: 20px; background: #4F46E5; color: white; text-align: center;">
            <p style="margin: 0;">Questions? Contact us at support@yourstore.com</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Track your order: <a href="${process.env.FRONTEND_URL}/orders/${order._id}" style="color: #93C5FD;">View Order Status</a></p>
          </div>
        </div>
      `
    };
  } 
}