const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OutbreakActivity = sequelize.define('OutbreakActivity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  alertId: { type: DataTypes.INTEGER, allowNull: false },
  activityType: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  performedBy: { type: DataTypes.STRING }
});

module.exports = OutbreakActivity;
