// src/services/businessLogicService.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

class BusinessLogicService {
  
  // ============================================
  // INVENTORY MANAGEMENT BUSINESS LOGIC
  // ============================================
  
  async checkInventoryAvailability(cartItems) {
    const availability = [];
    
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        availability.push({
          productId: item.product,
          available: false,
          reason: 'Product not found',
          requestedQuantity: item.quantity,
          availableQuantity: 0
        });
        continue;
      }
      
      if (product.status !== 'active') {
        availability.push({
          productId: item.product,
          available: false,
          reason: 'Product not active',
          requestedQuantity: item.quantity,
          availableQuantity: 0
        });
        continue;
      }
      
      let availableStock = product.stock;
      
      // Check variant stock if variant is selected
      if (item.variant && Object.keys(item.variant).length > 0) {
        const variant = product.variants.find(v => 
          Object.keys(item.variant).every(key => v[key] === item.variant[key])
        );
        
        if (!variant) {
          availability.push({
            productId: item.product,
            available: false,
            reason: 'Variant not found',
            requestedQuantity: item.quantity,
            availableQuantity: 0
          });
          continue;
        }
        
        availableStock = variant.stock;
      }
      
      availability.push({
        productId: item.product,
        productName: product.name,
        available: availableStock >= item.quantity,
        reason: availableStock >= item.quantity ? 'Available' : 'Insufficient stock',
        requestedQuantity: item.quantity,
        availableQuantity: availableStock,
        isLowStock: availableStock <= product.lowStockThreshold
      });
    }
    
    return availability;
  }
  
  async reserveInventory(cartItems, orderId) {
    const reservations = [];
    
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      
      if (item.variant && Object.keys(item.variant).length > 0) {
        // Reserve variant stock
        const variantIndex = product.variants.findIndex(v => 
          Object.keys(item.variant).every(key => v[key] === item.variant[key])
        );
        
        if (variantIndex !== -1) {
          product.variants[variantIndex].stock -= item.quantity;
          reservations.push({
            productId: item.product,
            type: 'variant',
            variantIndex,
            quantity: item.quantity,
            orderId
          });
        }
      } else {
        // Reserve main product stock
        product.stock -= item.quantity;
        reservations.push({
          productId: item.product,
          type: 'main',
          quantity: item.quantity,
          orderId
        });
      }
      
      // Update product status if out of stock
      if (product.stock === 0 && product.variants.every(v => v.stock === 0)) {
        product.status = 'out_of_stock';
      }
      
      await product.save();
    }
    
    return reservations;
  }
  
  async releaseInventory(orderId) {
    // This would typically be stored in a reservations table
    // For now, we'll implement a simple version
    const order = await Order.findById(orderId).populate('items.product');
    
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      
      if (item.variant && Object.keys(item.variant).length > 0) {
        const variantIndex = product.variants.findIndex(v => 
          Object.keys(item.variant).every(key => v[key] === item.variant[key])
        );
        
        if (variantIndex !== -1) {
          product.variants[variantIndex].stock += item.quantity;
        }
      } else {
        product.stock += item.quantity;
      }
      
      // Update status if back in stock
      if (product.status === 'out_of_stock' && (product.stock > 0 || product.variants.some(v => v.stock > 0))) {
        product.status = 'active';
      }
      
      await product.save();
    }
  }
  
  // ============================================
  // ORDER PROCESSING BUSINESS LOGIC
  // ============================================
  
  async calculateOrderTotals(cartItems, shippingMethod = 'standard', couponCode = null, shippingAddress = null) {
    let subtotal = 0;
    const itemCalculations = [];
    
    // Calculate item totals
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      
      let itemPrice = product.price;
      
      // Apply product discount
      if (product.discount > 0) {
        itemPrice = product.price * (1 - product.discount / 100);
      }
      
      // Use variant price if specified
      if (item.variant && item.variant.size) {
        const variant = product.variants.find(v => 
          v.size === item.variant.size && v.color === item.variant.color
        );
        if (variant && variant.price) {
          itemPrice = variant.price;
        }
      }
      
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;
      
      itemCalculations.push({
        productId: item.product,
        productName: product.name,
        unitPrice: product.price,
        discountedPrice: itemPrice,
        quantity: item.quantity,
        itemTotal
      });
    }
    
    // Calculate tax (16% VAT in Kenya)
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    
    // Calculate shipping
    const shippingAmount = this.calculateShippingCost(subtotal, shippingMethod, shippingAddress);
    
    // Apply coupon discount
    const discountAmount = await this.applyCouponDiscount(couponCode, subtotal);
    
    // Calculate total
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      itemCalculations,
      breakdown: {
        itemsTotal: subtotal,
        tax: `16% VAT: KES ${taxAmount.toFixed(2)}`,
        shipping: `${shippingMethod}: KES ${shippingAmount.toFixed(2)}`,
        discount: couponCode ? `Coupon ${couponCode}: -KES ${discountAmount.toFixed(2)}` : null,
        total: `Total: KES ${totalAmount.toFixed(2)}`
      }
    };
  }
  
  calculateShippingCost(subtotal, shippingMethod, shippingAddress) {
    // Free shipping threshold
    if (subtotal >= 5000) {
      return 0;
    }
    
    // Base shipping rates
    const shippingRates = {
      standard: 300,    // 3-5 business days
      express: 500,     // 1-2 business days
      overnight: 1000,  // Next day delivery
      pickup: 0         // Customer pickup
    };
    
    let baseRate = shippingRates[shippingMethod] || shippingRates.standard;
    
    // Distance-based pricing (simplified)
    if (shippingAddress) {
      const remoteCounties = ['Turkana', 'Marsabit', 'Mandera', 'Wajir'];
      if (remoteCounties.includes(shippingAddress.county)) {
        baseRate *= 1.5; // 50% surcharge for remote areas
      }
    }
    
    return baseRate;
  }
  
  async applyCouponDiscount(couponCode, subtotal) {
    if (!couponCode) return 0;
    
    // Simple coupon system (in production, you'd have a Coupon model)
    const coupons = {
      'WELCOME10': { type: 'percentage', value: 10, minOrder: 1000 },
      'SAVE500': { type: 'fixed', value: 500, minOrder: 2000 },
      'NEWUSER': { type: 'percentage', value: 15, minOrder: 0 },
      'BULK20': { type: 'percentage', value: 20, minOrder: 10000 }
    };
    
    const coupon = coupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      throw new Error('Invalid coupon code');
    }
    
    if (subtotal < coupon.minOrder) {
      throw new Error(`Minimum order of KES ${coupon.minOrder} required for this coupon`);
    }
    
    if (coupon.type === 'percentage') {
      return subtotal * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      return Math.min(coupon.value, subtotal); // Don't exceed subtotal
    }
    
    return 0;
  }
  
  // ============================================
  // PAYMENT PROCESSING BUSINESS LOGIC
  // ============================================
  
  async processPayment(order, paymentMethod, paymentDetails) {
    try {
      let paymentResult;
      
      switch (paymentMethod) {
        case 'mpesa':
          paymentResult = await this.processMpesaPayment(order, paymentDetails);
          break;
        case 'card':
          paymentResult = await this.processCardPayment(order, paymentDetails);
          break;
        case 'bank_transfer':
          paymentResult = await this.processBankTransfer(order, paymentDetails);
          break;
        case 'cash_on_delivery':
          paymentResult = { success: true, transactionId: `COD_${Date.now()}` };
          break;
        default:
          throw new Error('Unsupported payment method');
      }
      
      // Update order with payment details
      order.paymentDetails = {
        ...order.paymentDetails,
        ...paymentResult,
        paymentDate: new Date(),
        amount: order.totalAmount,
        currency: 'KES'
      };
      
      if (paymentResult.success) {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        
        // Update product analytics
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 'analytics.purchases': item.quantity }
          });
        }
      } else {
        order.paymentStatus = 'failed';
        order.paymentDetails.failureReason = paymentResult.error;
        
        // Release inventory if payment failed
        await this.releaseInventory(order._id);
      }
      
      await order.save();
      return paymentResult;
      
    } catch (error) {
      order.paymentStatus = 'failed';
      order.paymentDetails.failureReason = error.message;
      await order.save();
      
      // Release inventory on error
      await this.releaseInventory(order._id);
      throw error;
    }
  }
  
  async processMpesaPayment(order, paymentDetails) {
    // M-Pesa STK Push implementation
    // This is a simplified version - full implementation would use M-Pesa API
    
    const { phoneNumber } = paymentDetails;
    
    // Validate phone number format
    if (!phoneNumber.match(/^(\+254|0)[17]\d{8}$/)) {
      throw new Error('Invalid phone number format');
    }
    
    // Simulate M-Pesa API call
    const mpesaResponse = {
      success: true,
      transactionId: `MP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      mpesaReceiptNumber: `OEI2AK4Q16`,
      phoneNumber: phoneNumber,
      amount: order.totalAmount
    };
    
    // In production, you would:
    // 1. Call M-Pesa STK Push API
    // 2. Wait for callback confirmation
    // 3. Verify transaction status
    
    return mpesaResponse;
  }
  
  async processCardPayment(order, paymentDetails) {
    // Credit/Debit card processing
    // Would integrate with payment processors like Stripe, Flutterwave, etc.
    
    const { cardNumber, expiryDate, cvv, cardHolderName } = paymentDetails;
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv) {
      throw new Error('Card details incomplete');
    }
    
    // Simulate payment processing
    const paymentResponse = {
      success: true,
      transactionId: `CARD_${Date.now()}`,
      gateway: 'stripe', // or flutterwave, paystack, etc.
      amount: order.totalAmount
    };
    
    return paymentResponse;
  }
  
  async processBankTransfer(order, paymentDetails) {
    // Bank transfer processing
    return {
      success: true,
      transactionId: `BANK_${Date.now()}`,
      transferReference: paymentDetails.reference,
      amount: order.totalAmount,
      requiresVerification: true
    };
  }
  
  // ============================================
  // ORDER FULFILLMENT BUSINESS LOGIC
  // ============================================
  
  async processOrderFulfillment(orderId) {
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Check if order can be fulfilled
    if (order.status !== 'confirmed') {
      throw new Error('Order must be confirmed before fulfillment');
    }
    
    if (order.paymentStatus !== 'completed') {
      throw new Error('Payment must be completed before fulfillment');
    }
    
    // Generate tracking number
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Update order status
    order.status = 'processing';
    order.trackingInfo = {
      trackingNumber,
      carrier: 'Standard Delivery',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    };
    
    await order.updateStatus('processing', 'Order is being prepared for shipment');
    
    // Send notifications (email, SMS)
    await this.sendOrderNotification(order, 'processing');
    
    return order;
  }
  
  async shipOrder(orderId, shippingDetails) {
    const order = await Order.findById(orderId);
    
    order.status = 'shipped';
    order.trackingInfo = {
      ...order.trackingInfo,
      ...shippingDetails,
      shippedDate: new Date()
    };
    
    await order.updateStatus('shipped', `Order shipped via ${shippingDetails.carrier}`);
    await this.sendOrderNotification(order, 'shipped');
    
    return order;
  }
  
  async deliverOrder(orderId) {
    const order = await Order.findById(orderId);
    
    order.status = 'delivered';
    order.actualDelivery = new Date();
    
    await order.updateStatus('delivered', 'Order successfully delivered');
    await this.sendOrderNotification(order, 'delivered');
    
    return order;
  }
  
  // ============================================
  // BUSINESS ANALYTICS & REPORTING
  // ============================================
  
  async generateBusinessMetrics(startDate, endDate) {
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Revenue metrics
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    // Product performance
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    // Customer metrics
    const customerMetrics = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          averageOrdersPerCustomer: { $avg: '$orderCount' },
          averageCustomerValue: { $avg: '$totalSpent' }
        }
      }
    ]);
    
    return {
      revenue: revenueData[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
      topProducts,
      customers: customerMetrics[0] || { totalCustomers: 0, averageOrdersPerCustomer: 0, averageCustomerValue: 0 }
    };
  }
  
  async sendOrderNotification(order, status) {
    // Email/SMS notification logic
    console.log(`Sending ${status} notification for order ${order.orderNumber}`);
    
    // In production, integrate with:
    // - Email service (SendGrid, Mailgun, SES)
    // - SMS service (Twilio, Africa's Talking)
    // - Push notifications (Firebase)
  }
}

module.exports = new BusinessLogicService();