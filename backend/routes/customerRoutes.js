const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  createBulkCustomers,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(authenticate, getCustomers)
  .post(authorize('customers:create'), createCustomer);

router.post('/bulk', authorize('customers:bulk_import'), createBulkCustomers);

router.route('/:id')
  .get(authenticate, getCustomerById)
  .put(authorize('customers:edit'), updateCustomer)
  .delete(authorize('customers:delete'), deleteCustomer);

module.exports = router;
