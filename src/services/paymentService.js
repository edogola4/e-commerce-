// src/services/paymentService.js
const axios = require('axios');
const crypto = require('crypto');

class PaymentService {
  
  // ============================================
  // M-PESA INTEGRATION (SAFARICOM DARAJA API)
  // ============================================
  
  async getMpesaAccessToken() {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');
    
    try {
      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get M-Pesa access token');
    }
  }
  
  async initiateMpesaSTKPush(order, phoneNumber) {
    try {
      const accessToken = await this.getMpesaAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
      const passkey = process.env.MPESA_PASSKEY;
      
      // Generate password
      const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');
      
      const stkPushPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(order.totalAmount), // M-Pesa doesn't accept decimals
        PartyA: phoneNumber.replace(/^\+/, ''), // Remove + if present
        PartyB: shortCode,
        PhoneNumber: phoneNumber.replace(/^\+/, ''),
        CallBackURL: `${process.env.BACKEND_URL}/api/payments/mpesa/callback`,
        AccountReference: order.orderNumber,
        TransactionDesc: `Payment for order ${order.orderNumber}`
      };
      
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        stkPushPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      };
      
    } catch (error) {
      console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
      throw new Error(`M-Pesa payment failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }
  
  async queryMpesaTransaction(checkoutRequestID) {
    try {
      const accessToken = await this.getMpesaAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
      const passkey = process.env.MPESA_PASSKEY;
      
      const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');
      
      const queryPayload = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };
      
      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        queryPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to query M-Pesa transaction');
    }
  }
  
  // ============================================
  // STRIPE INTEGRATION
  // ============================================
  
  async processStripePayment(order, paymentMethodId) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Stripe uses cents
        currency: 'kes', // Kenyan Shilling
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/order-confirmation/${order._id}`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber
        }
      });
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      };
      
    } catch (error) {
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }
  
  // ============================================
  // FLUTTERWAVE INTEGRATION (POPULAR IN AFRICA)
  // ============================================
  
  async processFlutterwavePayment(order, paymentData) {
    try {
      const payload = {
        tx_ref: `${order.orderNumber}_${Date.now()}`,
        amount: order.totalAmount,
        currency: 'KES',
        redirect_url: `${process.env.FRONTEND_URL}/payment-callback`,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: order.shippingAddress.email,
          phonenumber: order.shippingAddress.phone,
          name: order.shippingAddress.name
        },
        customizations: {
          title: 'E-Commerce Payment',
          description: `Payment for order ${order.orderNumber}`,
          logo: `${process.env.FRONTEND_URL}/logo.png`
        },
        meta: {
          orderId: order._id.toString()
        }
      };
      
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        paymentLink: response.data.data.link,
        transactionId: response.data.data.tx_ref
      };
      
    } catch (error) {
      throw new Error(`Flutterwave payment failed: ${error.message}`);
    }
  }
  
  // ============================================
  // PAYSTACK INTEGRATION (POPULAR IN AFRICA)
  // ============================================
  
  async processPaystackPayment(order, email) {
    try {
      const payload = {
        email: email,
        amount: Math.round(order.totalAmount * 100), // Paystack uses kobo for NGN, cents for other currencies
        currency: 'KES',
        reference: `${order.orderNumber}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment-callback`,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          custom_fields: [
            {
              display_name: 'Order Number',
              variable_name: 'order_number',
              value: order.orderNumber
            }
          ]
        }
      };
      
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference
      };
      
    } catch (error) {
      throw new Error(`Paystack payment failed: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();