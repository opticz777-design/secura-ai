const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consultation = sequelize.define('Consultation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  ashaWorkerName: { type: DataTypes.STRING },
  symptoms: { type: DataTypes.STRING },
  priority: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  submittedAt: { type: DataTypes.DATE },
  ashaNotes: { type: DataTypes.TEXT },
  doctorNotes: { type: DataTypes.TEXT },
  visitType: { type: DataTypes.STRING },
  ashaWorkerId: { type: DataTypes.STRING },
  simplifiedNotes: { type: DataTypes.TEXT },
  patientNotified: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Consultation;
