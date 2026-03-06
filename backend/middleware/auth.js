const jwt = require('jsonwebtoken');
const { RolePermission } = require('../models');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const authorize = (required = []) => {
  return [
    authenticate,
    async (req, res, next) => {
      const userRole = req.user.role;

      // Super Admin bypass
      if (userRole === 'Super Admin') {
        return next();
      }

      // Handle array of roles (legacy support)
      if (Array.isArray(required) && required.includes(userRole)) {
        return next();
      }

      // Handle single role string (legacy support)
      if (typeof required === 'string' && ['Admin', 'Technician', 'Area Manager'].includes(required)) {
        if (required === userRole) return next();
      }

      // Handle permission string
      if (typeof required === 'string' && !['Admin', 'Technician', 'Area Manager'].includes(required)) {
        try {
          const perm = await RolePermission.findOne({
            where: {
              role: userRole,
              permission: required,
              enabled: true
            }
          });

          if (perm) {
            return next();
          }
        } catch (error) {
          console.error('Permission check error:', error);
          return res.status(500).json({ message: 'Internal server error during permission check.' });
        }
      }

      return res.status(403).json({ message: 'Forbidden. You do not have the required permissions.' });
    }
  ];
};

module.exports = { authenticate, authorize };
