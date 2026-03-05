const express = require('express');
const router = express.Router();
const { getRenewals, createRenewal } = require('../controllers/renewalController');
const { authenticate } = require('../middleware/auth');

router.route('/')
  .get(authenticate, getRenewals)
  .post(authenticate, createRenewal);

module.exports = router;
