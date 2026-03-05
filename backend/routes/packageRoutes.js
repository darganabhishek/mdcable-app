const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');

router.route('/')
  .get(authenticate, getPackages)
  .post(authenticate, authorize('Super Admin', 'Admin', 'Area Manager'), createPackage);

router.route('/:id')
  .get(authenticate, getPackageById)
  .put(authenticate, authorize('Super Admin', 'Admin', 'Area Manager'), updatePackage)
  .delete(authenticate, authorize('Super Admin'), deletePackage);

module.exports = router;
