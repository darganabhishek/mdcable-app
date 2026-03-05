const express = require('express');
const router = express.Router();
const { getCollectionReport, getRenewalReport, getDashboardStats } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize(['Super Admin', 'Admin', 'Area Manager']), getDashboardStats);
router.get('/collections', authenticate, authorize(['Super Admin', 'Admin']), getCollectionReport);
router.get('/renewals', authenticate, authorize(['Super Admin', 'Admin']), getRenewalReport);

module.exports = router;
