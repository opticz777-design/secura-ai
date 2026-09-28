const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AwarenessContent = sequelize.define('AwarenessContent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ashaWorkerId: { type: DataTypes.STRING },
  ashaWorkerName: { type: DataTypes.STRING },
  healthCentre: { type: DataTypes.STRING },
  topic: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  contentType: { type: DataTypes.STRING },
  language: { type: DataTypes.STRING },
  tone: { type: DataTypes.STRING },
  headline: { type: DataTypes.STRING },
  bulletPoints: { 
    type: DataTypes.TEXT, 
    get() {
      const rawValue = this.getDataValue('bulletPoints');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('bulletPoints', JSON.stringify(value));
    }
  },
  callToAction: { type: DataTypes.STRING },
  audioDuration: { type: DataTypes.STRING },
  generatedText: { type: DataTypes.TEXT },
  shareCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  downloadCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  timestamps: true
});

module.exports = AwarenessContent;
