// src/services/inventoryService.js
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

class InventoryService {
  
  // ============================================
  // STOCK RESERVATION SYSTEM
  // ============================================
  
  async reserveStock(cartItems, orderId, reservationDuration = 30) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const reservations = [];
        
        for (const item of cartItems) {
          const product = await Product.findById(item.product).session(session);
          
          if (!product) {
            throw new Error(`Product ${item.product} not found`);
          }
          
          // Check main stock availability
          let availableStock = product.stock;
          let reservationType = 'main';
          let variantIndex = null;
          
          // Check variant stock if specified
          if (item.variant && Object.keys(item.variant).length > 0) {
            const variant = product.variants.find(v => 
              Object.keys(item.variant).every(key => v[key] === item.variant[key])
            );
            
            if (!variant) {
              throw new Error(`Variant not found for product ${product.name}`);
            }
            
            availableStock = variant.stock;
            reservationType = 'variant';
            variantIndex = product.variants.indexOf(variant);
          }
          
          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
          }
          
          // Reserve stock
          if (reservationType === 'variant') {
            product.variants[variantIndex].stock -= item.quantity;
            product.variants[variantIndex].reserved = (product.variants[variantIndex].reserved || 0) + item.quantity;
          } else {
            product.stock -= item.quantity;
            product.reserved = (product.reserved || 0) + item.quantity;
          }
          
          // Create reservation record
          const reservation = {
            orderId: orderId,
            productId: item.product,
            quantity: item.quantity,
            type: reservationType,
            variantIndex: variantIndex,
            expiresAt: new Date(Date.now() + reservationDuration * 60 * 1000), // 30 minutes default
            status: 'active'
          };
          
          // Store reservation in product document (or use separate collection)
          if (!product.reservations) product.reservations = [];
          product.reservations.push(reservation);
          
          await product.save({ session });
          reservations.push(reservation);
        }
        
        return reservations;
      });
      
      return { success: true, message: 'Stock reserved successfully' };
      
    } catch (error) {
      throw new Error(`Stock reservation failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
  
  async releaseReservation(orderId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find all products with reservations for this order
        const products = await Product.find({
          'reservations.orderId': orderId,
          'reservations.status': 'active'
        }).session(session);
        
        for (const product of products) {
          const reservations = product.reservations.filter(r => 
            r.orderId.toString() === orderId.toString() && r.status === 'active'
          );
          
          for (const reservation of reservations) {
            if (reservation.type === 'variant') {
              const variant = product.variants[reservation.variantIndex];
              variant.stock += reservation.quantity;
              variant.reserved = Math.max(0, (variant.reserved || 0) - reservation.quantity);
            } else {
              product.stock += reservation.quantity;
              product.reserved = Math.max(0, (product.reserved || 0) - reservation.quantity);
            }
            
            // Mark reservation as released
            reservation.status = 'released';
            reservation.releasedAt = new Date();
          }
          
          await product.save({ session });
        }
      });
      
      return { success: true, message: 'Reservations released successfully' };
      
    } catch (error) {
      throw new Error(`Failed to release reservations: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
  
  async confirmReservation(orderId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const products = await Product.find({
          'reservations.orderId': orderId,
          'reservations.status': 'active'
        }).session(session);
        
        for (const product of products) {
          const reservations = product.reservations.filter(r => 
            r.orderId.toString() === orderId.toString() && r.status === 'active'
          );
          
          for (const reservation of reservations) {
            // Don't restore stock, just mark as confirmed
            if (reservation.type === 'variant') {
              const variant = product.variants[reservation.variantIndex];
              variant.reserved = Math.max(0, (variant.reserved || 0) - reservation.quantity);
            } else {
              product.reserved = Math.max(0, (product.reserved || 0) - reservation.quantity);
            }
            
            reservation.status = 'confirmed';
            reservation.confirmedAt = new Date();
          }
          
          // Update product analytics
          product.analytics.purchases += reservations.reduce((sum, r) => sum + r.quantity, 0);
          
          await product.save({ session });
        }
      });
      
      return { success: true, message: 'Reservations confirmed successfully' };
      
    } catch (error) {
      throw new Error(`Failed to confirm reservations: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
  
  // ============================================
  // LOW STOCK MONITORING
  // ============================================
  
  async checkLowStockProducts() {
    const lowStockProducts = await Product.find({
      status: 'active',
      $or: [
        { stock: { $lte: '$lowStockThreshold' } },
        { 'variants.stock': { $lte: 10 } } // Check variants too
      ]
    }).populate('seller', 'firstName lastName email');
    
    const alerts = [];
    
    for (const product of lowStockProducts) {
      // Check main stock
      if (product.stock <= product.lowStockThreshold) {
        alerts.push({
          type: 'low_stock',
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          currentStock: product.stock,
          threshold: product.lowStockThreshold,
          seller: product.seller,
          urgency: product.stock === 0 ? 'critical' : product.stock <= 5 ? 'high' : 'medium'
        });
      }
      
      // Check variant stock
      product.variants.forEach((variant, index) => {
        if (variant.stock <= 10) { // Default threshold for variants
          alerts.push({
            type: 'low_variant_stock',
            productId: product._id,
            productName: product.name,
            sku: variant.sku || product.sku,
            variant: {
              size: variant.size,
              color: variant.color,
              index: index
            },
            currentStock: variant.stock,
            threshold: 10,
            seller: product.seller,
            urgency: variant.stock === 0 ? 'critical' : variant.stock <= 3 ? 'high' : 'medium'
          });
        }
      });
    }
    
    return alerts;
  }
  
  async generateStockReport(startDate, endDate) {
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Stock movement analysis
    const stockMovement = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['confirmed', 'shipped', 'delivered'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
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
      {
        $project: {
          productName: '$product.name',
          sku: '$product.sku',
          currentStock: '$product.stock',
          totalSold: 1,
          totalRevenue: 1,
          turnoverRate: {
            $divide: ['$totalSold', { $add: ['$product.stock', '$totalSold'] }]
          }
        }
      },
      { $sort: { totalSold: -1 } }
    ]);
    
    // Current low stock items
    const lowStockAlerts = await this.checkLowStockProducts();
    
    // Dead stock (no sales in period)
    const deadStock = await Product.find({
      status: 'active',
      stock: { $gt: 0 },
      'analytics.purchases': { $eq: 0 }
    }).select('name sku stock analytics');
    
    return {
      period: { startDate, endDate },
      stockMovement,
      lowStockAlerts: lowStockAlerts.filter(alert => alert.urgency === 'critical'),
      deadStock,
      summary: {
        totalProductsTracked: stockMovement.length,
        criticalLowStock: lowStockAlerts.filter(a => a.urgency === 'critical').length,
        deadStockItems: deadStock.length
      }
    };
  }
  
  // ============================================
  // STOCK ADJUSTMENT TOOLS
  // ============================================
  
  async adjustStock(productId, adjustments, reason, adjustedBy) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const product = await Product.findById(productId).session(session);
        
        if (!product) {
          throw new Error('Product not found');
        }
        
        const stockAdjustment = {
          date: new Date(),
          reason: reason,
          adjustedBy: adjustedBy,
          changes: []
        };
        
        // Adjust main stock
        if (adjustments.mainStock !== undefined) {
          const oldStock = product.stock;
          product.stock = Math.max(0, product.stock + adjustments.mainStock);
          
          stockAdjustment.changes.push({
            type: 'main',
            oldValue: oldStock,
            newValue: product.stock,
            adjustment: adjustments.mainStock
          });
        }
        
        // Adjust variant stock
        if (adjustments.variants) {
          adjustments.variants.forEach(variantAdj => {
            const variant = product.variants[variantAdj.index];
            if (variant) {
              const oldStock = variant.stock;
              variant.stock = Math.max(0, variant.stock + variantAdj.adjustment);
              
              stockAdjustment.changes.push({
                type: 'variant',
                variantIndex: variantAdj.index,
                variantInfo: { size: variant.size, color: variant.color },
                oldValue: oldStock,
                newValue: variant.stock,
                adjustment: variantAdj.adjustment
              });
            }
          });
        }
        
        // Store adjustment history
        if (!product.stockAdjustments) product.stockAdjustments = [];
        product.stockAdjustments.push(stockAdjustment);
        
        // Update product status based on new stock levels
        const totalStock = product.stock + product.variants.reduce((sum, v) => sum + v.stock, 0);
        if (totalStock === 0) {
          product.status = 'out_of_stock';
        } else if (product.status === 'out_of_stock') {
          product.status = 'active';
        }
        
        await product.save({ session });
        
        return stockAdjustment;
      });
      
      return { success: true, message: 'Stock adjusted successfully' };
      
    } catch (error) {
      throw new Error(`Stock adjustment failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }
  
  // ============================================
  // EXPIRED RESERVATIONS CLEANUP
  // ============================================
  
  async cleanupExpiredReservations() {
    const expiredReservations = await Product.find({
      'reservations.expiresAt': { $lt: new Date() },
      'reservations.status': 'active'
    });
    
    let cleanedCount = 0;
    
    for (const product of expiredReservations) {
      const expiredItems = product.reservations.filter(r => 
        r.expiresAt < new Date() && r.status === 'active'
      );
      
      for (const reservation of expiredItems) {
        // Release reserved stock
        if (reservation.type === 'variant') {
          const variant = product.variants[reservation.variantIndex];
          variant.stock += reservation.quantity;
          variant.reserved = Math.max(0, (variant.reserved || 0) - reservation.quantity);
        } else {
          product.stock += reservation.quantity;
          product.reserved = Math.max(0, (product.reserved || 0) - reservation.quantity);
        }
        
        reservation.status = 'expired';
        reservation.expiredAt = new Date();
        cleanedCount++;
      }
      
      await product.save();
    }
    
    return { cleanedCount, message: `Cleaned up ${cleanedCount} expired reservations` };
  }
}

module.exports = new InventoryService();