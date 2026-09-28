const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutbreakAlert = sequelize.define('OutbreakAlert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  disease: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  caseCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  riskLevel: { type: DataTypes.ENUM('Low', 'Medium', 'High'), defaultValue: 'Low' },
  trendPercentage: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('Active', 'Under Review', 'Contained', 'Resolved'), defaultValue: 'Active' },
  symptoms: { type: DataTypes.JSON, defaultValue: [] },
  detectionReason: { type: DataTypes.TEXT },
  reportedBy: { type: DataTypes.STRING },
  healthOfficerNotified: { type: DataTypes.BOOLEAN, defaultValue: false },
  containedAt: { type: DataTypes.DATE },
  escalatedToStateHealthDepartment: { type: DataTypes.BOOLEAN, defaultValue: false },
  escalatedAt: { type: DataTypes.DATE },
  escalatedBy: { type: DataTypes.STRING },
});

module.exports = OutbreakAlert;
