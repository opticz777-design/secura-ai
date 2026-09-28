const { IncentiveClaim, Patient, HealthRecord, Consultation } = require('../models');
const { Op } = require('sequelize');

const INCENTIVE_RATES = {
  patientRegistrations: 50,
  institutionalDeliveries: 600,
  immunizationFollowUps: 150,
  teleconsultations: 100,
  highRiskANC: 162.5
};

// Helper to get current cycle date range
const getCurrentCycleRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end, month: month + 1, year }; // 1-indexed for storage
};

const calculateCycleTasks = async (ashaWorkerId, start, end) => {
  const patientsCount = await Patient.count({
    where: { ashaWorkerId, createdAt: { [Op.between]: [start, end] } }
  });

  const deliveriesCount = 0; // No true data source currently available

  const immunizationsCount = await HealthRecord.count({
    where: { ashaWorkerId, visitType: 'Immunization', date: { [Op.between]: [start, end] } }
  });

  const teleconsultationsCount = await Consultation.count({
    where: { ashaWorkerId, submittedAt: { [Op.between]: [start, end] } }
  });

  const ancCount = await HealthRecord.count({
    where: { ashaWorkerId, visitType: 'Pregnancy', date: { [Op.between]: [start, end] } }
  });

  const taskBreakdown = [
    { taskName: 'Patient Registrations', completedCount: patientsCount, ratePerTask: INCENTIVE_RATES.patientRegistrations, subtotal: patientsCount * INCENTIVE_RATES.patientRegistrations },
    { taskName: 'Institutional Deliveries Facilitated', completedCount: deliveriesCount, ratePerTask: INCENTIVE_RATES.institutionalDeliveries, subtotal: deliveriesCount * INCENTIVE_RATES.institutionalDeliveries },
    { taskName: 'Immunization Follow-ups', completedCount: immunizationsCount, ratePerTask: INCENTIVE_RATES.immunizationFollowUps, subtotal: immunizationsCount * INCENTIVE_RATES.immunizationFollowUps },
    { taskName: 'Teleconsultations Coordinated', completedCount: teleconsultationsCount, ratePerTask: INCENTIVE_RATES.teleconsultations, subtotal: teleconsultationsCount * INCENTIVE_RATES.teleconsultations },
    { taskName: 'High-Risk ANC Home Visits', completedCount: ancCount, ratePerTask: INCENTIVE_RATES.highRiskANC, subtotal: ancCount * INCENTIVE_RATES.highRiskANC }
  ];

  const totalTasks = patientsCount + deliveriesCount + immunizationsCount + teleconsultationsCount + ancCount;
  const estimatedAmount = taskBreakdown.reduce((sum, item) => sum + item.subtotal, 0);

  return { totalTasks, estimatedAmount, taskBreakdown };
};

exports.getCurrentCycleActivity = async (req, res) => {
  try {
    if (req.user.role === 'DOCTOR') return res.status(403).json({ success: false, error: 'Forbidden' });
    if (req.user.role !== 'ASHA_WORKER') return res.status(403).json({ success: false, error: 'Forbidden' });

    const ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    if (!ashaWorkerId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { start, end, month, year } = getCurrentCycleRange();

    const existingClaim = await IncentiveClaim.findOne({
      where: { ashaWorkerId, cycleMonth: month, cycleYear: year }
    });

    const { totalTasks, estimatedAmount, taskBreakdown } = await calculateCycleTasks(ashaWorkerId, start, end);

    res.json({
      success: true,
      data: {
        cycleMonth: month,
        cycleYear: year,
        totalTasks,
        estimatedAmount,
        taskBreakdown,
        alreadySubmitted: !!existingClaim,
        claimStatus: existingClaim ? existingClaim.status : 'Not Submitted'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitClaim = async (req, res) => {
  if (req.user.role === 'DOCTOR') return res.status(403).json({ success: false, error: 'Forbidden' });
  if (req.user.role !== 'ASHA_WORKER') return res.status(403).json({ success: false, error: 'Forbidden: Only ASHA workers can submit claims' });

  try {
    const ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    const ashaWorkerName = req.user.displayName || 'ASHA Worker';
    const healthCentre = req.user.healthCentre;

    if (!ashaWorkerId || !healthCentre) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { start, end, month, year } = getCurrentCycleRange();

    const { totalTasks, estimatedAmount, taskBreakdown } = await calculateCycleTasks(ashaWorkerId, start, end);

    if (totalTasks === 0) {
      return res.status(400).json({ success: false, error: 'No tasks completed to claim' });
    }

    const t = await IncentiveClaim.sequelize.transaction({ type: 'EXCLUSIVE' });
    try {
      const existingClaim = await IncentiveClaim.findOne({
        where: { ashaWorkerId, cycleMonth: month, cycleYear: year },
        transaction: t
      });

      if (existingClaim) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Claim already exists for this cycle', duplicate: true });
      }

      const newClaim = await IncentiveClaim.create({
        ashaWorkerId,
        ashaWorkerName,
        healthCentre,
        cycleMonth: month,
        cycleYear: year,
        totalTasks,
        claimedAmount: estimatedAmount,
        status: 'Pending',
        submittedDate: new Date(),
        taskBreakdown,
        notes: req.body.notes || ''
      }, { transaction: t });

      await t.commit();
      res.status(201).json({ success: true, data: newClaim });
    } catch (txError) {
      if (!t.finished) await t.rollback();
      throw txError;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    if (req.user.role === 'DOCTOR') return res.status(403).json({ success: false, error: 'Forbidden' });

    const ashaWorkerId = req.user.ashaWorkerId || req.user.username;
    const userRole = req.user.role;
    const healthCentre = req.user.healthCentre;

    if (userRole === 'SUPERVISOR') {
        const claims = await IncentiveClaim.findAll({
            where: { healthCentre, status: { [Op.ne]: 'Pending' } },
            order: [['createdAt', 'DESC']]
        });
        return res.json({ success: true, data: claims });
    }

    if (!ashaWorkerId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const claims = await IncentiveClaim.findAll({
      where: { ashaWorkerId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPendingClaims = async (req, res) => {
  try {
    if (req.user.role === 'DOCTOR') return res.status(403).json({ success: false, error: 'Forbidden' });

    const userRole = req.user.role;
    const healthCentre = req.user.healthCentre;

    if (userRole !== 'SUPERVISOR' || !healthCentre) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const claims = await IncentiveClaim.findAll({
      where: { healthCentre, status: 'Pending' },
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, data: claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateClaimStatus = async (req, res) => {
  if (req.user.role === 'DOCTOR') return res.status(403).json({ success: false, error: 'Forbidden' });

  const t = await IncentiveClaim.sequelize.transaction({ type: 'EXCLUSIVE' });
  try {
    const userRole = req.user.role;
    const healthCentre = req.user.healthCentre;
    const reviewedBy = req.user.supervisorId || req.user.username;

    if (userRole !== 'SUPERVISOR' || !healthCentre) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { status, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status === 'Rejected' && !rejectionReason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const claim = await IncentiveClaim.findByPk(req.params.id, { transaction: t });

    if (!claim) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    if (claim.healthCentre !== healthCentre) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Claim is outside of your jurisdiction' });
    }

    if (claim.status !== 'Pending') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Claim has already been reviewed' });
    }

    claim.status = status;
    claim.reviewedAt = new Date();
    claim.reviewedBy = reviewedBy;
    if (status === 'Rejected') {
      claim.rejectionReason = rejectionReason;
    }

    await claim.save({ transaction: t });

    const { User, AppNotification } = require('../models');
    const ashaUser = await User.findOne({ where: { ashaWorkerId: claim.ashaWorkerId }, transaction: t });
    if (ashaUser) {
      await AppNotification.create({
        title: 'Claim Status Updated',
        message: `Your incentive claim for ${claim.cycleMonth}/${claim.cycleYear} has been ${status}.`,
        type: 'incentive',
        userId: ashaUser.id,
        relatedEntityId: claim.id,
        relatedEntityType: 'IncentiveClaim'
      }, { transaction: t });
    }

    await t.commit();

    res.json({ success: true, data: claim });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
