const { Op } = require('sequelize');
const { OutbreakAlert, OutbreakActivity, HealthRecord, Patient } = require('../models');

// Configurable thresholds
const OUTBREAK_TIME_WINDOW_HOURS = 72;
const OUTBREAK_MEDIUM_RISK_THRESHOLD = 3;
const OUTBREAK_HIGH_RISK_THRESHOLD = 6;

function getDisease(record) {
  if (record.diagnosis) {
    return record.diagnosis.trim();
  }
  return 'Unknown Condition';
}

async function runDetectionAgent(newRecordId) {
  try {
    console.log('[OUTBREAK] Running detection agent for record ID:', newRecordId);
    const newRecord = await HealthRecord.findByPk(newRecordId, {
      include: [{ model: Patient }]
    });

    if (!newRecord || !newRecord.Patient) {
      console.log('[OUTBREAK] Insufficient data for detection.');
      return;
    }

    const patient = newRecord.Patient;
    const village = patient.village;
    const disease = getDisease(newRecord);

    if (!village || disease === 'Unknown Condition') {
      console.log('[OUTBREAK] No village or disease identified.');
      return;
    }

    // Define time window
    const timeWindowStart = new Date(Date.now() - OUTBREAK_TIME_WINDOW_HOURS * 60 * 60 * 1000);

    // Find all recent records for this village
    const recentRecords = await HealthRecord.findAll({
      where: {
        createdAt: { [Op.gte]: timeWindowStart }
      },
      include: [{
        model: Patient,
        where: { village }
      }]
    });

    // Group by the same disease
    const relatedRecords = recentRecords.filter(r => getDisease(r) === disease);
    const uniquePatientIds = new Set(relatedRecords.map(r => r.patientId));
    const caseCount = uniquePatientIds.size;

    console.log(`[OUTBREAK] Cluster threshold evaluated: ${caseCount} cases of ${disease} in ${village}`);

    if (caseCount >= OUTBREAK_MEDIUM_RISK_THRESHOLD) {
      let riskLevel = 'Medium';
      if (caseCount >= OUTBREAK_HIGH_RISK_THRESHOLD) {
        riskLevel = 'High';
      }

      // Aggregate symptoms for JSON structure
      const symptomCounts = {};
      relatedRecords.forEach(r => {
        if (r.symptoms) {
          const syms = r.symptoms.split(',').map(s => s.trim());
          syms.forEach(s => {
            if (s) {
              symptomCounts[s] = (symptomCounts[s] || 0) + 1;
            }
          });
        }
      });
      
      const symptomsJson = Object.keys(symptomCounts).map(name => ({
        name, count: symptomCounts[name]
      })).sort((a, b) => b.count - a.count);

    // Use a transaction to prevent race conditions on concurrent health record saves
    const sequelize = require('../config/database');
    await sequelize.transaction(async (t) => {
      // Check for existing alert
      const existingAlert = await OutbreakAlert.findOne({
        where: {
          disease,
          location: village,
          status: { [Op.in]: ['Active', 'Under Review'] }
        },
        transaction: t
      });

      // Calculate trend relative to previous window
      const previousWindowStart = new Date(timeWindowStart.getTime() - OUTBREAK_TIME_WINDOW_HOURS * 60 * 60 * 1000);
      const previousRecords = await HealthRecord.findAll({
        where: {
          createdAt: {
            [Op.gte]: previousWindowStart,
            [Op.lt]: timeWindowStart
          }
        },
        include: [{
          model: Patient,
          where: { village }
        }],
        transaction: t
      });
      const previousRelatedRecords = previousRecords.filter(r => getDisease(r) === disease);
      const previousUniquePatientIds = new Set(previousRelatedRecords.map(r => r.patientId));
      const previousRelatedCount = previousUniquePatientIds.size;
      
      let trendPercentage = 0;
      if (previousRelatedCount > 0) {
        trendPercentage = Math.round(((caseCount - previousRelatedCount) / previousRelatedCount) * 100);
      } else if (caseCount > 0) {
        trendPercentage = 100; // Represents "New" or 100% increase
      }

      const detectionReason = `${caseCount} related cases reported in ${village} within the last ${OUTBREAK_TIME_WINDOW_HOURS} hours.`;

      if (existingAlert) {
        await existingAlert.update({
          caseCount,
          riskLevel,
          trendPercentage,
          symptoms: symptomsJson,
          detectionReason
        }, { transaction: t });
        console.log('[OUTBREAK] Outbreak alert updated');
        
        // Log activity for significant escalation
        if (existingAlert.riskLevel !== riskLevel) {
          await OutbreakActivity.create({
            alertId: existingAlert.id,
            activityType: 'Risk Escalated',
            title: 'Cluster Risk Escalated',
            description: `Risk level increased to ${riskLevel} due to ${caseCount} total cases.`,
            performedBy: 'System'
          }, { transaction: t });
        }
      } else {
        const newAlert = await OutbreakAlert.create({
          disease,
          location: village,
          caseCount,
          riskLevel,
          trendPercentage,
          symptoms: symptomsJson,
          detectionReason,
          status: 'Active',
          reportedBy: 'System'
        }, { transaction: t });
        console.log('[OUTBREAK] New outbreak alert created');

        await OutbreakActivity.create({
          alertId: newAlert.id,
          activityType: 'Detection',
          title: 'Cluster Detection Agent Alert',
          description: `Outbreak Detection Agent detected a cluster in ${village} based on ${caseCount} related cases reported within ${OUTBREAK_TIME_WINDOW_HOURS} hours.`,
          performedBy: 'System'
        }, { transaction: t });
      }
    }); // Close transaction
    } else {
      console.log('[OUTBREAK] No outbreak threshold reached');
    }
  } catch (error) {
    console.error('[OUTBREAK ERROR]', error);
  }
}

module.exports = {
  runDetectionAgent
};
