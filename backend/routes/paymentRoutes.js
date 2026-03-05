const express = require('express');
const router = express.Router();
const { getPayments, createPayment } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.route('/')
  .get(authenticate, getPayments)
  .post(authenticate, createPayment);

module.exports = router;
