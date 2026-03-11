const express = require('express');
const router = express.Router();
const { syncBillingDates } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sync-billing', authorize('Super Admin'), syncBillingDates);

module.exports = router;
