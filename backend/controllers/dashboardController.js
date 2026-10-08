const { Patient, Consultation, IncentiveClaim, OutbreakAlert, HealthRecord, User, BloodRequest } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const { role, id, center, username } = req.user;
    
    if (role === 'ASHA_WORKER') {
      const totalPatients = await Patient.count({ where: { ashaWorkerId: id } });
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const consultationsToday = await Consultation.count({
        where: {
          ashaWorkerId: id,
          submittedAt: { [Op.gte]: todayStart }
        }
      });
      
      const outbreakAlerts = await OutbreakAlert.count({ where: { status: 'Active' } });
      const pendingIncentives = await IncentiveClaim.count({
        where: {
          ashaWorkerId: id,
          status: { [Op.in]: ['Pending', 'Needs Review'] }
        }
      });
      
      const activeBloodRequests = await BloodRequest.count({ where: { status: 'Active' } });
      
      return res.json({
        success: true,
        data: {
          totalPatients,
          consultationsToday,
          outbreakAlertsCount: outbreakAlerts,
          pendingIncentives,
          activeBloodRequests
        }
      });
    }
    
    if (role === 'DOCTOR') {
      const waitingConsultations = await Consultation.count({ where: { status: 'Waiting' } });
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const completedList = await Consultation.findAll({
        where: {
          status: 'Completed',
          updatedAt: { [Op.gte]: todayStart }
        }
      });
      const completedToday = completedList.length;
      
      let avgConsultTime = 'N/A';
      if (completedToday > 0) {
        let totalMs = 0;
        let count = 0;
        for (const c of completedList) {
          if (c.submittedAt && c.updatedAt) {
            const diff = new Date(c.updatedAt).getTime() - new Date(c.submittedAt).getTime();
            if (diff > 0) {
              totalMs += diff;
              count++;
            }
          }
        }
        if (count > 0) {
          const avgMins = totalMs / count / (1000 * 60);
          if (avgMins < 60) {
            avgConsultTime = `${Math.round(avgMins)} mins`;
          } else {
            const hrs = Math.floor(avgMins / 60);
            const mins = Math.round(avgMins % 60);
            avgConsultTime = `${hrs}h ${mins}m`;
          }
        }
      }
      
      const followUpsDue = await HealthRecord.count({ where: { status: 'Needs Follow-up' } });
      
      const outbreakAlerts = await OutbreakAlert.count({ where: { status: 'Active' } });
      
      return res.json({
        success: true,
        data: {
          waitingConsultations,
          completedToday,
          avgConsultTime,
          followUpsDue,
          outbreakAlertsCount: outbreakAlerts
        }
      });
    }
    
    if (role === 'SUPERVISOR') {
      const activeAshaWorkers = await User.count({ where: { role: 'ASHA_WORKER' } });
      
      const pendingClaims = await IncentiveClaim.count({ where: { status: 'Pending' } });
      const activeOutbreakAlerts = await OutbreakAlert.count({ where: { status: 'Active' } });
      
      const activeCases = await Patient.count({ where: { status: { [Op.in]: ['Critical', 'Follow Up'] } } });
      const highRiskCases = await Patient.count({ where: { status: 'Critical' } });
      
      const ashaWorkersList = await User.findAll({
        where: { role: 'ASHA_WORKER' },
        attributes: ['id', 'username', 'displayName', 'healthCentre', 'ashaWorkerId']
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const patientsVisitedToday = await Consultation.count({
        where: {
          submittedAt: { [Op.gte]: todayStart }
        }
      });
      
      const recordsCollectedToday = await HealthRecord.count({
        where: {
          createdAt: { [Op.gte]: todayStart } // Or use another field if createdAt isn't available, but standard Sequelize has it
        }
      }).catch(() => 0); // fallback if it fails

      const followUpsPending = await Patient.count({
        where: { status: 'Follow Up' }
      });

      return res.json({
        success: true,
        data: {
          activeAshaWorkers,
          villagesCovered: 6,
          pendingClaims,
          activeOutbreakAlerts,
          activeCases,
          highRiskCases,
          ashaWorkersList,
          patientsVisitedToday,
          recordsCollectedToday,
          followUpsPending
        }
      });
    }
    
    return res.status(403).json({ success: false, error: 'Invalid role for dashboard' });
    
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};
