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
  .post(authorize('packages:create'), createPackage);

router.route('/:id')
  .get(authenticate, getPackageById)
  .put(authorize('packages:edit'), updatePackage)
  .delete(authorize('packages:delete'), deletePackage);

module.exports = router;
