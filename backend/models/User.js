const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING, // e.g., 'ASHA_WORKER', 'DOCTOR', 'SUPERVISOR'
    allowNull: false,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ashaWorkerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  healthCentre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doctorId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  supervisorId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
});

module.exports = User;
