const express = require('express');
const router = express.Router();
const { syncBillingDates, syncPermissions, getActivityLogs } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/sync-billing', authorize('Super Admin'), syncBillingDates);
router.post('/sync-permissions', authorize('Super Admin'), syncPermissions);
router.get('/activity-logs', authorize('Super Admin'), getActivityLogs);

module.exports = router;
