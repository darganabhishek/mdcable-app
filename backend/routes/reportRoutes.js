const express = require('express');
const router = express.Router();
const { getCollectionReport, getRenewalReport, getDashboardStats, getUpcomingRenewals } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authorize('reports:view'), getDashboardStats);
router.get('/collections', authorize('reports:view'), getCollectionReport);
router.get('/renewals', authorize('reports:view'), getRenewalReport);
router.get('/upcoming-renewals', authorize('reports:view'), getUpcomingRenewals);

module.exports = router;
