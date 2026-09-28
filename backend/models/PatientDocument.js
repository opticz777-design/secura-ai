const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');

const PatientDocument = sequelize.define('PatientDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    }
  },
  originalFileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  storedFileName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  documentType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedByRole: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
});

module.exports = PatientDocument;
