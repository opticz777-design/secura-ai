const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BloodDonationResponse = sequelize.define('BloodDonationResponse', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bloodRequestId: { type: DataTypes.STRING, allowNull: false },
  donorId: { type: DataTypes.INTEGER, allowNull: false },
  response: { type: DataTypes.STRING, allowNull: false },
  originalEmailContent: { type: DataTypes.TEXT },
  respondedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = BloodDonationResponse;
