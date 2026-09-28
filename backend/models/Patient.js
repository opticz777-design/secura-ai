const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  village: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  lastVisit: { type: DataTypes.DATE },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  emergencyContact: { type: DataTypes.STRING },
  ashaWorkerId: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: true },
  conditions: { type: DataTypes.JSON }
});

module.exports = Patient;
