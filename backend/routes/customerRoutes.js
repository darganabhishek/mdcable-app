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
  .post(authorize(['Super Admin', 'Admin', 'Area Manager']), createCustomer);

router.post('/bulk', authenticate, authorize(['Super Admin', 'Admin', 'Area Manager']), createBulkCustomers);

router.route('/:id')
  .get(authenticate, getCustomerById)
  .put(authorize(['Super Admin', 'Admin', 'Area Manager']), updateCustomer)
  .delete(authorize('Super Admin'), deleteCustomer);

module.exports = router;
