const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Completed', 'Pending', 'Failed'),
    defaultValue: 'Completed',
  },
  remarks: {
     type: DataTypes.TEXT,
     allowNull: true
  }
}, {
  timestamps: true,
});

module.exports = Payment;
