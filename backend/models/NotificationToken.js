const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationToken = sequelize.define('NotificationToken', {
  token: { type: DataTypes.STRING, primaryKey: true },
  donorId: { type: DataTypes.INTEGER, allowNull: false },
  bloodRequestId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
});

module.exports = NotificationToken;
