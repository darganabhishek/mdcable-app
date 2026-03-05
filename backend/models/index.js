const sequelize = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Payment = require('./Payment');
const Renewal = require('./Renewal');
const Package = require('./Package');

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
Customer.belongsTo(Package, { foreignKey: 'cable_package_id', as: 'cable_package' });
Customer.belongsTo(Package, { foreignKey: 'internet_package_id', as: 'internet_package' });

module.exports = {
  sequelize,
  User,
  Customer,
  Payment,
  Renewal,
  Package
};
