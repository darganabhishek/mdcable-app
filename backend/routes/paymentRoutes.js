const express = require('express');
const router = express.Router();
const { 
  getPayments, 
  getPaymentById, 
  createPayment, 
  updatePayment, 
  deletePayment 
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(authorize('payments:view'), getPayments)
  .post(authorize('payments:create'), createPayment);

router.route('/:id')
  .get(authorize('payments:view'), getPaymentById)
  .put(authorize('payments:edit'), updatePayment)
  .delete(authorize('payments:delete'), deletePayment);

module.exports = router;
