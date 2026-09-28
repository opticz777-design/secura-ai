const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthRecord = sequelize.define('HealthRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  visitType: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE },
  recordedBy: { type: DataTypes.STRING },
  diagnosis: { type: DataTypes.STRING },
  symptoms: { type: DataTypes.STRING },
  vitals: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING },
  ashaWorkerId: { type: DataTypes.STRING }
});

module.exports = HealthRecord;
