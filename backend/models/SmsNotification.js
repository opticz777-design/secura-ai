const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SmsNotification = sequelize.define('SmsNotification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  donorId: { type: DataTypes.INTEGER, allowNull: false },
  requestId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false }, // 'Sent' or 'Failed'
  errorMessage: { type: DataTypes.TEXT, allowNull: true },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = SmsNotification;
