const { FollowUp, Patient } = require('../models');

exports.create = async (req, res) => {
  const t = await FollowUp.sequelize.transaction({ type: 'EXCLUSIVE' });
  try {
    const { patientId, scheduledDate, scheduledTime, reason, priority, notes } = req.body;
    const createdBy = req.user ? req.user.username || req.user.role : 'Unknown';

    if (!patientId || !scheduledDate || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'patientId, scheduledDate, and reason are required' });
    }

    // Verify patient exists
    const patient = await Patient.findByPk(patientId, { transaction: t });
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Duplicate prevention: check for same patient, date, and reason
    const normReason = reason.trim().toLowerCase();
    const existingFollowUps = await FollowUp.findAll({
      where: { patientId, scheduledDate },
      transaction: t
    });

    let duplicate = null;
    for (const f of existingFollowUps) {
      if ((f.reason || '').trim().toLowerCase() === normReason) {
        duplicate = f;
        break;
      }
    }

    if (duplicate) {
      await t.commit();
      return res.status(200).json({
        success: true,
        duplicate: true,
        data: duplicate
      });
    }

    const followUp = await FollowUp.create({
      patientId,
      scheduledDate,
      scheduledTime,
      reason,
      priority: priority || 'Normal',
      notes,
      status: 'SCHEDULED',
      createdBy
    }, { transaction: t });

    const { AppNotification } = require('../models');
    await AppNotification.create({
      title: 'New Follow-Up Scheduled',
      message: `A ${priority || 'Normal'} priority follow-up has been scheduled for patient #${patientId} on ${scheduledDate}.`,
      type: 'appointment',
      recipientRole: 'DOCTOR',
      relatedEntityId: followUp.id,
      relatedEntityType: 'FollowUp'
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, data: followUp });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const followUps = await FollowUp.findAll({
      where: { patientId: req.params.patientId },
      order: [['scheduledDate', 'ASC']]
    });
    res.json({ success: true, data: followUps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
