const stripe = require('../config/stripe');
const { getMpesaToken } = require('../config/mpesa');
const axios = require('axios');

// STRIPE PAYMENT
exports.stripePayment = async (req, res) => {
  const { amount, currency, paymentMethodId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirm: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: paymentIntent,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: err.message,
    });
  }
};

// MPESA STK PUSH
exports.mpesaSTKPush = async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: 'ECommerce001',
      TransactionDesc: 'Order Payment',
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'STK push sent',
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'STK Push failed',
      error: error.message,
    });
  }
};

// MPESA CALLBACK
exports.mpesaCallback = (req, res) => {
  console.log('M-PESA CALLBACK:', JSON.stringify(req.body, null, 2));

  // You can store or validate payment result here

  res.status(200).json({ success: true });
};
