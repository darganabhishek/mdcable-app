const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Payment = require('./Payment');
const Renewal = require('./Renewal');
const Package = require('./Package');
const Area = require('./Area');
const RolePermission = require('./RolePermission');
const ActivityLog = require('./ActivityLog');

// Define Relationships

// A Customer can have multiple payments
Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments' });
Payment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// A User (Staff) can collect multiple payments
User.hasMany(Payment, { foreignKey: 'collected_by', as: 'collections' });
Payment.belongsTo(User, { foreignKey: 'collected_by', as: 'collector' });

// A Customer can have multiple renewals
Customer.hasMany(Renewal, { foreignKey: 'customer_id', as: 'renewals' });
Renewal.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Customer belongs to Package
Customer.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Package belongs to Area
Area.hasMany(Package, { foreignKey: 'area_id', as: 'packages' });
Package.belongsTo(Area, { foreignKey: 'area_id', as: 'area' });

// Customer belongs to Area
Area.hasMany(Customer, { foreignKey: 'area_id', as: 'customers' });
Customer.belongsTo(Area, { foreignKey: 'area_id', as: 'assigned_area' });

// User has many activity logs
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Customer,
  Payment,
  Renewal,
  Package,
  Area,
  RolePermission,
  ActivityLog
};
