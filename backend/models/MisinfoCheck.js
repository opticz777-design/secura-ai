const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MisinfoCheck = sequelize.define('MisinfoCheck', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ashaWorkerId: { type: DataTypes.STRING },
  ashaWorkerName: { type: DataTypes.STRING },
  healthCentre: { type: DataTypes.STRING },
  claimText: { type: DataTypes.TEXT },
  sourceType: { type: DataTypes.STRING },
  screenshotPath: { type: DataTypes.STRING },
  language: { type: DataTypes.STRING },
  verdict: { type: DataTypes.STRING },
  confidence: { type: DataTypes.FLOAT },
  explanation: { type: DataTypes.TEXT },
  correctedClaim: { type: DataTypes.TEXT },
  keyFacts: { type: DataTypes.JSON },
  riskLevel: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  recommendation: { type: DataTypes.TEXT },
  aiModel: { type: DataTypes.STRING }
}, {
  indexes: [
    { fields: ['ashaWorkerId'] },
    { fields: ['healthCentre'] },
    { fields: ['verdict'] }
  ]
});

module.exports = MisinfoCheck;
