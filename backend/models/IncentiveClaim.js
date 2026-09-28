const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IncentiveClaim = sequelize.define('IncentiveClaim', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ashaWorkerId: { type: DataTypes.STRING, allowNull: false },
  ashaWorkerName: { type: DataTypes.STRING },
  healthCentre: { type: DataTypes.STRING },
  cycleMonth: { type: DataTypes.INTEGER, allowNull: false },
  cycleYear: { type: DataTypes.INTEGER, allowNull: false },
  totalTasks: { type: DataTypes.INTEGER },
  claimedAmount: { type: DataTypes.DECIMAL },
  status: { type: DataTypes.STRING },
  submittedDate: { type: DataTypes.DATE },
  taskBreakdown: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  reviewedAt: { type: DataTypes.DATE },
  reviewedBy: { type: DataTypes.STRING },
  rejectionReason: { type: DataTypes.TEXT }
}, {
  indexes: [
    {
      unique: true,
      fields: ['ashaWorkerId', 'cycleMonth', 'cycleYear']
    }
  ]
});

module.exports = IncentiveClaim;
