// src/services/orderTrackingService.js
const Order = require('../models/Order');
const EmailService = require('../services/emailService');

class OrderTrackingService {
  
  // ============================================
  // TRACKING NUMBER GENERATION
  // ============================================
  
  generateTrackingNumber(carrier = 'STANDARD') {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${carrier.substring(0, 3)}${timestamp.slice(-6)}${random}`;
  }
  
  // ============================================
  // ORDER STATUS MANAGEMENT
  // ============================================
  
  async updateOrderStatus(orderId, newStatus, updateData = {}, updatedBy = null) {
    try {
      const order = await Order.findById(orderId).populate('user', 'firstName lastName email');
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      const oldStatus = order.status;
      
      // Update order status
      order.status = newStatus;
      
      // Add status to history
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: updateData.note || `Status updated to ${newStatus}`,
        updatedBy: updatedBy
      });
      
      // Update specific fields based on status
      switch (newStatus) {
        case 'confirmed':
          order.paymentStatus = order.paymentStatus || 'completed';
          break;
          
        case 'processing':
          if (!order.trackingInfo.trackingNumber) {
            order.trackingInfo.trackingNumber = this.generateTrackingNumber(updateData.carrier);
          }
          break;
          
        case 'shipped':
          order.trackingInfo = {
            ...order.trackingInfo,
            trackingNumber: order.trackingInfo.trackingNumber || this.generateTrackingNumber(updateData.carrier),
            carrier: updateData.carrier || 'Standard Delivery',
            shippedDate: new Date(),
            estimatedDelivery: updateData.estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            trackingUrl: updateData.trackingUrl || `https://tracking.example.com/${order.trackingInfo.trackingNumber}`
          };
          break;
          
        case 'delivered':
          order.actualDelivery = updateData.deliveryDate || new Date();
          order.trackingInfo.actualDelivery = order.actualDelivery;
          break;
          
        case 'cancelled':
          // Release inventory if order is cancelled
          if (oldStatus !== 'cancelled') {
            await this.handleOrderCancellation(order);
          }
          break;
      }
      
      await order.save();
      
      // Send email notification if status changed
      if (oldStatus !== newStatus) {
        await EmailService.sendOrderStatusUpdate(order, order.user, newStatus);
      }
      
      return {
        success: true,
        message: `Order status updated to ${newStatus}`,
        order: order
      };
      
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }
  
  async bulkUpdateOrderStatus(orderIds, newStatus, updateData = {}, updatedBy = null) {
    const results = [];
    
    for (const orderId of orderIds) {
      try {
        const result = await this.updateOrderStatus(orderId, newStatus, updateData, updatedBy);
        results.push({ orderId, success: true, result });
      } catch (error) {
        results.push({ orderId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  // ============================================
  // DELIVERY ESTIMATION
  // ============================================
  
  calculateEstimatedDelivery(shippingMethod, shippingAddress) {
    const baseDeliveryDays = {
      'standard': 5,
      'express': 2,
      'overnight': 1,
      'pickup': 0
    };
    
    let deliveryDays = baseDeliveryDays[shippingMethod] || 5;
    
    // Add extra days for remote locations
    const remoteCounties = ['Turkana', 'Marsabit', 'Mandera', 'Wajir', 'Garissa'];
    if (remoteCounties.includes(shippingAddress.county)) {
      deliveryDays += 2;
    }
    
    // Don't deliver on weekends (simple logic)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    // If delivery falls on weekend, move to Monday
    if (deliveryDate.getDay() === 0) { // Sunday
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else if (deliveryDate.getDay() === 6) { // Saturday
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    }
    
    return deliveryDate;
  }
  
  // ============================================
  // ORDER TRACKING QUERIES
  // ============================================
  
  async getOrderTracking(orderId) {
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images')
      .select('orderNumber status statusHistory trackingInfo estimatedDelivery actualDelivery shippingAddress items totalAmount createdAt');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Calculate tracking progress
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const progress = currentStatusIndex >= 0 ? ((currentStatusIndex + 1) / statusOrder.length) * 100 : 0;
    
    // Get tracking events
    const trackingEvents = order.statusHistory.map(history => ({
      status: history.status,
      timestamp: history.timestamp,
      description: this.getStatusDescription(history.status, order),
      location: this.getStatusLocation(history.status),
      isCompleted: statusOrder.indexOf(history.status) <= currentStatusIndex
    }));
    
    return {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery
      },
      tracking: {
        trackingNumber: order.trackingInfo?.trackingNumber,
        carrier: order.trackingInfo?.carrier,
        progress: Math.round(progress),
        currentStatus: order.status,
        events: trackingEvents.reverse() // Show latest first
      },
      shipping: {
        address: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery
      },
      items: order.items
    };
  }
  
  async getOrdersByTrackingNumber(trackingNumber) {
    const orders = await Order.find({
      'trackingInfo.trackingNumber': trackingNumber
    }).populate('user', 'firstName lastName email');
    
    return orders;
  }
  
  // ============================================
  // ORDER ANALYTICS
  // ============================================
  
  async getDeliveryPerformanceMetrics(startDate, endDate) {
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Overall delivery performance
    const deliveryStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageDeliveryTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$actualDelivery', null] }, { $ne: ['$createdAt', null] }] },
                { $divide: [{ $subtract: ['$actualDelivery', '$createdAt'] }, 86400000] }, // Convert to days
                null
              ]
            }
          }
        }
      }
    ]);
    
    // On-time delivery rate
    const onTimeDeliveries = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'delivered',
          actualDelivery: { $ne: null },
          estimatedDelivery: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onTime: {
            $sum: {
              $cond: [{ $lte: ['$actualDelivery', '$estimatedDelivery'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          onTime: 1,
          onTimeRate: { $multiply: [{ $divide: ['$onTime', '$total'] }, 100] }
        }
      }
    ]);
    
    // Delivery performance by carrier
    const carrierPerformance = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'delivered',
          'trackingInfo.carrier': { $ne: null }
        }
      },
      {
        $group: {
          _id: '$trackingInfo.carrier',
          deliveries: { $sum: 1 },
          averageDeliveryTime: {
            $avg: {
              $divide: [{ $subtract: ['$actualDelivery', '$createdAt'] }, 86400000]
            }
          },
          onTimeDeliveries: {
            $sum: {
              $cond: [{ $lte: ['$actualDelivery', '$estimatedDelivery'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          carrier: '$_id',
          deliveries: 1,
          averageDeliveryTime: { $round: ['$averageDeliveryTime', 1] },
          onTimeRate: {
            $round: [{ $multiply: [{ $divide: ['$onTimeDeliveries', '$deliveries'] }, 100] }, 1]
          }
        }
      }
    ]);
    
    return {
      period: { startDate, endDate },
      deliveryStats,
      onTimeDelivery: onTimeDeliveries[0] || { total: 0, onTime: 0, onTimeRate: 0 },
      carrierPerformance
    };
  }
  
  // ============================================
  // AUTOMATED STATUS UPDATES
  // ============================================
  
  async processAutomatedStatusUpdates() {
    const updates = [];
    
    // Auto-confirm orders after 1 hour if payment is completed
    const pendingOrders = await Order.find({
      status: 'pending',
      paymentStatus: 'completed',
      createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour ago
    });
    
    for (const order of pendingOrders) {
      try {
        await this.updateOrderStatus(order._id, 'confirmed', {
          note: 'Order automatically confirmed after payment verification'
        });
        updates.push({ orderId: order._id, action: 'auto-confirmed' });
      } catch (error) {
        console.error(`Failed to auto-confirm order ${order._id}:`, error.message);
      }
    }
    
    // Auto-process orders after 24 hours of confirmation
    const confirmedOrders = await Order.find({
      status: 'confirmed',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
    });
    
    for (const order of confirmedOrders) {
      try {
        await this.updateOrderStatus(order._id, 'processing', {
          note: 'Order moved to processing automatically'
        });
        updates.push({ orderId: order._id, action: 'auto-processing' });
      } catch (error) {
        console.error(`Failed to auto-process order ${order._id}:`, error.message);
      }
    }
    
    return updates;
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  getStatusDescription(status, order) {
    const descriptions = {
      pending: 'Order placed and waiting for payment confirmation',
      confirmed: 'Payment confirmed, order is being prepared',
      processing: 'Order is being packed and prepared for shipment',
      shipped: `Order shipped via ${order.trackingInfo?.carrier || 'carrier'}`,
      delivered: 'Order successfully delivered to customer',
      cancelled: 'Order has been cancelled'
    };
    
    return descriptions[status] || `Order status: ${status}`;
  }
  
  getStatusLocation(status) {
    const locations = {
      pending: 'Online Store',
      confirmed: 'Order Processing Center',
      processing: 'Fulfillment Center',
      shipped: 'In Transit',
      delivered: 'Customer Location',
      cancelled: 'Order Cancelled'
    };
    
    return locations[status] || 'Unknown';
  }
  
  async handleOrderCancellation(order) {
    // Release inventory back to products
    for (const item of order.items) {
      try {
        const Product = require('../models/Product');
        const product = await Product.findById(item.product);
        
        if (product) {
          // Check if it's a variant or main product
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
          
          // Update product status if it was out of stock
          if (product.status === 'out_of_stock') {
            const totalStock = product.stock + product.variants.reduce((sum, v) => sum + v.stock, 0);
            if (totalStock > 0) {
              product.status = 'active';
            }
          }
          
          await product.save();
        }
      } catch (error) {
        console.error(`Failed to restore inventory for product ${item.product}:`, error.message);
      }
    }
  }
  
  // ============================================
  // REAL-TIME TRACKING SIMULATION
  // ============================================
  
  async simulateShipmentProgress(orderId) {
    const order = await Order.findById(orderId);
    
    if (!order || order.status !== 'shipped') {
      throw new Error('Order not found or not in shipped status');
    }
    
    // Simulate tracking events (in real app, this would come from carrier API)
    const trackingEvents = [
      {
        timestamp: new Date(order.trackingInfo.shippedDate),
        location: 'Warehouse - Nairobi',
        description: 'Package picked up by carrier',
        status: 'picked_up'
      },
      {
        timestamp: new Date(order.trackingInfo.shippedDate.getTime() + 2 * 60 * 60 * 1000),
        location: 'Sorting Facility - Nairobi',
        description: 'Package arrived at sorting facility',
        status: 'in_transit'
      },
      {
        timestamp: new Date(order.trackingInfo.shippedDate.getTime() + 24 * 60 * 60 * 1000),
        location: 'Distribution Center - ' + order.shippingAddress.city,
        description: 'Package arrived at local distribution center',
        status: 'out_for_delivery'
      }
    ];
    
    // Add estimated delivery event
    if (order.trackingInfo.estimatedDelivery) {
      trackingEvents.push({
        timestamp: order.trackingInfo.estimatedDelivery,
        location: order.shippingAddress.city,
        description: 'Estimated delivery',
        status: 'estimated_delivery'
      });
    }
    
    return trackingEvents;
  }
}

module.exports = new OrderTrackingService();