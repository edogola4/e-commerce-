const express = require('express');
const router = express.Router();
const {
  stripePayment,
  mpesaSTKPush,
  mpesaCallback,
} = require('../controllers/paymentController');

router.post('/stripe', stripePayment);
router.post('/mpesa', mpesaSTKPush);
router.post('/mpesa-callback', mpesaCallback);

module.exports = router;
