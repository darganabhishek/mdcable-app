const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.STRING,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: /^\d{10}$/
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmailIfNotEmpty(value) {
        if (value && value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Must be a valid email address');
        }
      }
    }
  },
  house_no: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  locality: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Delhi'
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    defaultValue: '110023'
  },
  area_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  service_type: {
    type: DataTypes.ENUM('Cable', 'Internet'),
    allowNull: true,
  },
  package_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  installation_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  next_billing_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Expired'),
    defaultValue: 'Active',
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  }
}, {
  timestamps: true,
});

module.exports = Customer;
