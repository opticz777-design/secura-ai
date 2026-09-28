const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FollowUp = sequelize.define('FollowUp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Normal'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'SCHEDULED'
  },
  createdBy: {
    type: DataTypes.STRING, // Store user ID or role/name
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.STRING, // e.g. Doctor or Clinic name
    allowNull: true
  }
});

module.exports = FollowUp;
