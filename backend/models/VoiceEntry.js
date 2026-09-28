const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoiceEntry = sequelize.define('VoiceEntry', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false
  },
  extractedData: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Needs Review'
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = VoiceEntry;
