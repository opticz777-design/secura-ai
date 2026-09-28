const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppNotification = sequelize.define('AppNotification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'system' }, // 'alert', 'appointment', 'incentive', 'system'
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  recipientRole: { type: DataTypes.STRING }, // e.g., 'ASHA_WORKER', 'DOCTOR', 'SUPERVISOR'
  userId: { type: DataTypes.INTEGER, allowNull: true }, // For direct user notifications
  recipientCenter: { type: DataTypes.STRING, allowNull: true }, // Matches User.healthCentre for scoped broadcasts
  relatedEntityId: { type: DataTypes.INTEGER, allowNull: true },
  relatedEntityType: { type: DataTypes.STRING, allowNull: true },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = AppNotification;
