const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BloodRequest = sequelize.define('BloodRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patientName: { type: DataTypes.STRING },
  bloodGroup: { type: DataTypes.STRING },
  unitsNeeded: { type: DataTypes.INTEGER },
  urgency: { type: DataTypes.STRING },
  hospital: { type: DataTypes.STRING },
  village: { type: DataTypes.STRING },
  postedAt: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING },
  matchedDonorsCount: { type: DataTypes.INTEGER }
});

module.exports = BloodRequest;
