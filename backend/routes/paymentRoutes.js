const express = require('express');
const router = express.Router();
const { getPayments, createPayment } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(authorize('payments:view'), getPayments)
  .post(authorize('payments:create'), createPayment);

module.exports = router;
