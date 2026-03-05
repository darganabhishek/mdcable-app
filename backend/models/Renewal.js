const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Renewal = sequelize.define('Renewal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  previous_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  new_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Expired'),
    defaultValue: 'Active'
  }
}, {
  timestamps: true,
});

module.exports = Renewal;
