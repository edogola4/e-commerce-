// src/controllers/checkoutController.js
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const PaymentService = require('../services/paymentService');
const BusinessLogicService = require('../services/businessLogicService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// @desc    Initiate checkout process
// @route   POST /api/checkout/initiate
// @access  Private
const initiateCheckout = asyncHandler(async (req, res, next) => {
  const {
    shippingAddress,
    billingAddress,
    shippingMethod = 'standard',
    couponCode,
    paymentMethod,
    deliveryInstructions,
    notes
  } = req.body;
  
  // Get user with populated cart
  const user = await User.findById(req.user.id).populate('cart.product');
  
  if (!user.cart || user.cart.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }
  
  // Check inventory availability
  const availability = await BusinessLogicService.checkInventoryAvailability(user.cart);
  const unavailableItems = availability.filter(item => !item.available);
  
  if (unavailableItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some items are not available',
      unavailableItems
    });
  }
  
  // Calculate order totals
  const orderCalculation = await BusinessLogicService.calculateOrderTotals(
    user.cart,
    shippingMethod,
    couponCode,
    shippingAddress
  );
  
  // Prepare order items
  const orderItems = user.cart.map(cartItem => ({
    product: cartItem.product._id,
    name: cartItem.product.name,
    price: cartItem.product.price,
    quantity: cartItem.quantity,
    variant: cartItem.selectedVariant || {},
    sku: cartItem.product.sku,
    image: {
      url: cartItem.product.images[0]?.url,
      alt: cartItem.product.name
    },
    seller: cartItem.product.seller
  }));
  
  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    totalAmount: orderCalculation.totalAmount,
    subtotal: orderCalculation.subtotal,
    taxAmount: orderCalculation.taxAmount,
    shippingAmount: orderCalculation.shippingAmount,
    discountAmount: orderCalculation.discountAmount,
    couponCode,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    shippingMethod,
    deliveryInstructions,
    notes,
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // Reserve inventory
  await BusinessLogicService.reserveInventory(user.cart, order._id);
  
  res.status(201).json({
    success: true,
    message: 'Checkout initiated successfully',
    data: {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod
      },
      calculation: orderCalculation
    }
  });
});

// @desc    Process payment for order
// @route   POST /api/checkout/payment/:orderId
// @access  Private
const processPayment = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { paymentData } = req.body;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  if (order.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this order', 403));
  }
  
  if (order.paymentStatus === 'completed') {
    return next(new AppError('Order already paid', 400));
  }
  
  try {
    let paymentResult;
    
    switch (order.paymentMethod) {
      case 'mpesa':
        paymentResult = await PaymentService.initiateMpesaSTKPush(order, paymentData.phoneNumber);
        
        // Update order with M-Pesa details
        order.paymentDetails = {
          phoneNumber: paymentData.phoneNumber,
          checkoutRequestID: paymentResult.checkoutRequestID,
          merchantRequestID: paymentResult.merchantRequestID
        };
        order.paymentStatus = 'processing';
        await order.save();
        
        res.status(200).json({
          success: true,
          message: 'M-Pesa payment initiated. Please check your phone for STK push.',
          data: {
            checkoutRequestID: paymentResult.checkoutRequestID,
            customerMessage: paymentResult.customerMessage
          }
        });
        break;
        
      case 'card':
        if (paymentData.gateway === 'stripe') {
          paymentResult = await PaymentService.processStripePayment(order, paymentData.paymentMethodId);
        } else if (paymentData.gateway === 'flutterwave') {
          paymentResult = await PaymentService.processFlutterwavePayment(order, paymentData);
        } else if (paymentData.gateway === 'paystack') {
          paymentResult = await PaymentService.processPaystackPayment(order, paymentData.email);
        }
        
        if (paymentResult.success) {
          order.paymentStatus = 'completed';
          order.status = 'confirmed';
          order.paymentDetails = {
            ...paymentResult,
            paymentDate: new Date()
          };
          await order.save();
          
          // Clear user cart
          await req.user.clearCart();
          
          res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data: { order }
          });
        } else {
          res.status(200).json({
            success: true,
            message: 'Payment requires additional action',
            data: paymentResult
          });
        }
        break;
        
      case 'cash_on_delivery':
        order.paymentStatus = 'pending';
        order.status = 'confirmed';
        order.paymentDetails = {
          transactionId: `COD_${Date.now()}`,
          paymentMethod: 'cash_on_delivery'
        };
        await order.save();
        
        // Clear user cart
        await req.user.clearCart();
        
        res.status(200).json({
          success: true,
          message: 'Order confirmed. Payment will be collected on delivery.',
          data: { order }
        });
        break;
        
      default:
        return next(new AppError('Unsupported payment method', 400));
    }
    
  } catch (error) {
    // Release inventory if payment fails
    await BusinessLogicService.releaseInventory(orderId);
    
    order.paymentStatus = 'failed';
    order.paymentDetails = {
      ...order.paymentDetails,
      failureReason: error.message
    };
    await order.save();
    
    return next(new AppError(error.message, 400));
  }
});

// @desc    Handle M-Pesa callback
// @route   POST /api/checkout/mpesa/callback
// @access  Public (M-Pesa callback)
const handleMpesaCallback = asyncHandler(async (req, res, next) => {
  const callbackData = req.body;
  
  console.log('M-Pesa Callback Data:', JSON.stringify(callbackData, null, 2));
  
  try {
    const { Body } = callbackData;
    const { stkCallback } = Body;
    
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;
    
    // Find order by checkout request ID
    const order = await Order.findOne({
      'paymentDetails.checkoutRequestID': CheckoutRequestID
    });
    
    if (!order) {
      console.error('Order not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    }
    
    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata.Item;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.paymentDetails = {
        ...order.paymentDetails,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        amount,
        paymentDate: new Date()
      };
      
      await order.save();
      
      // Clear user cart
      const user = await User.findById(order.user);
      await user.clearCart();
      
      // Send confirmation notification
      // await sendOrderConfirmationEmail(order);
      
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      order.paymentDetails = {
        ...order.paymentDetails,
        failureReason: ResultDesc
      };
      
      await order.save();
      
      // Release inventory
      await BusinessLogicService.releaseInventory(order._id);
    }
    
    // Acknowledge callback
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
    
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback'
    });
  }
});

// @desc    Check payment status
// @route   GET /api/checkout/status/:orderId
// @access  Private
const checkPaymentStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  if (order.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to access this order', 403));
  }
  
  // For M-Pesa, query transaction status if still processing
  if (order.paymentMethod === 'mpesa' && order.paymentStatus === 'processing') {
    try {
      const mpesaStatus = await PaymentService.queryMpesaTransaction(
        order.paymentDetails.checkoutRequestID
      );
      
      if (mpesaStatus.ResultCode === '0') {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        await order.save();
      } else if (mpesaStatus.ResultCode !== '1032') { // Not still processing
        order.paymentStatus = 'failed';
        order.paymentDetails.failureReason = mpesaStatus.ResultDesc;
        await order.save();
      }
    } catch (error) {
      console.error('Error querying M-Pesa status:', error);
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      totalAmount: order.totalAmount
    }
  });
});

// @desc    Get checkout summary
// @route   GET /api/checkout/summary
// @access  Private
const getCheckoutSummary = asyncHandler(async (req, res, next) => {
  const { shippingMethod = 'standard', couponCode } = req.query;
  
  const user = await User.findById(req.user.id).populate('cart.product');
  
  if (!user.cart || user.cart.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }
  
  // Calculate totals
  const calculation = await BusinessLogicService.calculateOrderTotals(
    user.cart,
    shippingMethod,
    couponCode
  );
  
  res.status(200).json({
    success: true,
    data: {
      items: user.cart,
      calculation,
      paymentMethods: [
        { id: 'mpesa', name: 'M-Pesa', description: 'Pay via M-Pesa STK Push' },
        { id: 'card', name: 'Credit/Debit Card', description: 'Pay with card via secure gateway' },
        { id: 'cash_on_delivery', name: 'Cash on Delivery', description: 'Pay when your order is delivered' }
      ],
      shippingMethods: [
        { id: 'standard', name: 'Standard Delivery', price: 300, duration: '3-5 business days' },
        { id: 'express', name: 'Express Delivery', price: 500, duration: '1-2 business days' },
        { id: 'overnight', name: 'Overnight Delivery', price: 1000, duration: 'Next business day' }
      ]
    }
  });
});

module.exports = {
  initiateCheckout,
  processPayment,
  handleMpesaCallback,
  checkPaymentStatus,
  getCheckoutSummary
};