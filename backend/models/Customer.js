const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  area: {
    type: DataTypes.STRING,
  },
  area_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  service_type: {
    type: DataTypes.ENUM('Cable', 'Internet', 'Both'),
    allowNull: false,
    defaultValue: 'Cable'
  },
  cable_package_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  internet_package_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  installation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active',
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  }
}, {
  timestamps: true,
});

module.exports = Customer;
