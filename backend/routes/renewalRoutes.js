const express = require('express');
const router = express.Router();
const { getRenewals, createRenewal } = require('../controllers/renewalController');
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(authorize('renewals:view'), getRenewals)
  .post(authorize('renewals:create'), createRenewal);

module.exports = router;
