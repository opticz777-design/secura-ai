const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Donor = sequelize.define('Donor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  bloodGroup: { type: DataTypes.STRING },
  village: { type: DataTypes.STRING },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  lastDonated: { type: DataTypes.DATE },
  eligibilityStatus: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING }
});

module.exports = Donor;
