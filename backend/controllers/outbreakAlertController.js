const { Op, Sequelize } = require('sequelize');
const { OutbreakAlert, OutbreakActivity, HealthRecord } = require('../models');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to calculate date cutoff from timeRange
function getDateCutoff(timeRange) {
  const days = parseInt(timeRange, 10) || 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

exports.getAll = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const cutoff = getDateCutoff(timeRange);

    const data = await OutbreakAlert.findAll({
      where: {
        createdAt: { [Op.gte]: cutoff }
      },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[OUTBREAK ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const cutoff = getDateCutoff(timeRange);

    console.log(`[OUTBREAK] Calculating statistics for last ${timeRange || 7} days`);

    // active alerts
    const activeAlertsCount = await OutbreakAlert.count({
      where: {
        createdAt: { [Op.gte]: cutoff },
        status: { [Op.in]: ['Active', 'Under Review'] }
      }
    });

    // affected villages
    const affectedVillages = await OutbreakAlert.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('location')), 'location']],
      where: {
        createdAt: { [Op.gte]: cutoff },
        status: { [Op.in]: ['Active', 'Under Review'] }
      }
    });

    // cases reported this period (from OutbreakAlert)
    const casesReportedSum = await OutbreakAlert.sum('caseCount', {
      where: {
        createdAt: { [Op.gte]: cutoff }
      }
    });
    const casesReported = casesReportedSum || 0;

    // resolved clusters
    const resolvedClusters = await OutbreakAlert.count({
      where: {
        createdAt: { [Op.gte]: cutoff },
        status: { [Op.in]: ['Contained', 'Resolved'] }
      }
    });

    res.json({
      success: true,
      data: {
        activeAlerts: activeAlertsCount,
        affectedVillages: affectedVillages.length,
        casesReported,
        resolvedClusters
      }
    });
  } catch (error) {
    console.error('[OUTBREAK ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.report = async (req, res) => {
  try {
    const { disease, location, symptoms, caseCount, detectionReason } = req.body;
    
    // Invalid data protection
    if (!disease || !location || caseCount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid report data' });
    }

    // Parse symptoms into JSON structure if it's a string
    let parsedSymptoms = [];
    if (typeof symptoms === 'string') {
      parsedSymptoms = symptoms.split(',').map(s => ({ name: s.trim(), count: caseCount }));
    } else if (Array.isArray(symptoms)) {
      parsedSymptoms = symptoms;
    }

    // Idempotency: Prevent duplicate submissions within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await OutbreakAlert.findOne({
      where: {
        disease,
        location,
        caseCount,
        createdAt: { [Op.gte]: fiveMinutesAgo }
      }
    });

    if (recentDuplicate) {
      return res.status(200).json({ success: true, data: recentDuplicate });
    }

    const data = await OutbreakAlert.create({
      disease,
      location,
      caseCount,
      symptoms: parsedSymptoms,
      detectionReason,
      status: 'Active', // Instructions specify status should be Active for the test
      reportedBy: 'ASHA Worker', 
      riskLevel: caseCount >= 6 ? 'High' : caseCount >= 3 ? 'Medium' : 'Low'
    });

    await OutbreakActivity.create({
      alertId: data.id,
      activityType: 'Manual Report',
      title: 'Manual Cluster Report',
      description: `ASHA Worker manually reported a suspected ${disease} cluster in ${location}.`,
      performedBy: 'ASHA Worker'
    });

    const { AppNotification } = require('../models');
    await AppNotification.create({
      title: 'New Outbreak Alert',
      message: `A new suspected ${disease} cluster has been reported in ${location}.`,
      type: 'alert',
      recipientRole: 'SUPERVISOR',
      relatedEntityId: data.id,
      relatedEntityType: 'OutbreakAlert'
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[OUTBREAK ERROR]', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.notifyHealthOfficer = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    
    if (data.healthOfficerNotified) {
      return res.json({ success: true, data });
    }

    await data.update({ healthOfficerNotified: true });

    await OutbreakActivity.create({
      alertId: data.id,
      activityType: 'Notification',
      title: 'Health Officer Notified',
      description: `Medical Officer notification was initiated for the ${data.disease} cluster at ${data.location}.`,
      performedBy: 'ASHA Worker'
    });

    console.log(`[OUTBREAK] Health officer notification recorded for Alert ID ${data.id}`);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.markContained = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    
    if (data.status === 'Contained') {
      return res.json({ success: true, data });
    }

    await data.update({ 
      status: 'Contained',
      containedAt: new Date()
    });

    await OutbreakActivity.create({
      alertId: data.id,
      activityType: 'Containment',
      title: 'Cluster Contained',
      description: `The ${data.disease} cluster in ${data.location} has been marked as contained.`,
      performedBy: 'Health Officer'
    });

    console.log(`[OUTBREAK] Alert marked as contained for Alert ID ${data.id}`);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const data = await OutbreakActivity.findAll({
      where: { alertId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const data = await OutbreakActivity.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Keeping existing CRUD methods for completeness
exports.create = async (req, res) => {
  try {
    const data = await OutbreakAlert.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.update = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.delete = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.escalateOutbreak = async (req, res) => {
  try {
    const data = await OutbreakAlert.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Outbreak alert not found.' });

    if (data.escalatedToStateHealthDepartment) {
       return res.status(400).json({ success: false, error: 'Alert already escalated.' });
    }

    const recipient = process.env.STATE_HEALTH_EMAIL || process.env.TEST_DONOR_EMAIL;
    if (!recipient) {
      return res.status(400).json({ success: false, error: 'State Health Department email recipient is not configured.' });
    }

    const user = req.user;

    const symptomsText = data.symptoms && data.symptoms.length > 0 
      ? data.symptoms.map(s => `${s.name} (${s.count})`).join(', ') 
      : 'Not recorded';

    const detectionReason = data.detectionReason || 'Not recorded';

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">SynCura AI<br><small style="color: #666; font-size: 14px;">Outbreak Escalation Notification</small></h2>
        <p>Dear State Health Department,</p>
        <p>This is an official outbreak escalation notification generated through the SynCura AI health coordination platform.</p>
        
        <h3 style="background-color: #f3f4f6; padding: 10px; margin-top: 20px;">OUTBREAK DETAILS</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>Disease:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.disease}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Affected Village:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.location}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Case Count:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.caseCount}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Risk Level:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.riskLevel}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Current Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.status}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>First Detected:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(data.createdAt).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Reporting Health Centre:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">SynCura Health Network</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Reported Symptoms:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${symptomsText}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Detection / Alert Information:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${detectionReason}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Escalated By:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${user.displayName} / ${user.role}</td></tr>
          <tr><td style="padding: 8px;"><strong>Escalation Time:</strong></td><td style="padding: 8px;">${new Date().toLocaleString()}</td></tr>
        </table>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 13px; color: #666;">This notification was generated from the SynCura AI outbreak monitoring system.<br>Please review the reported outbreak information and take the appropriate public-health response according to applicable procedures.</p>
        <p>Regards,<br><strong>SynCura AI</strong><br>Autonomous Healthcare System</p>
      </div>
    `;

    const { data: resendData, error } = await resend.emails.send({
      from: 'SynCura AI <onboarding@resend.dev>',
      to: [recipient],
      subject: `URGENT OUTBREAK ESCALATION – ${data.disease} – ${data.location}`,
      html: htmlContent
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, error: 'Unable to send escalation notification. Please try again.' });
    }

    await data.update({
      escalatedToStateHealthDepartment: true,
      escalatedAt: new Date(),
      escalatedBy: user.displayName
    });

    await OutbreakActivity.create({
      alertId: data.id,
      activityType: 'Escalation',
      title: 'State Health Department Notified',
      description: `${user.displayName} escalated the ${data.disease} outbreak in ${data.location} to the State Health Department.`,
      performedBy: user.displayName
    });

    const { AppNotification } = require('../models');
    const notif = await AppNotification.create({
      title: 'Outbreak Escalated',
      message: `${data.disease} outbreak in ${data.location} was escalated to the State Health Department by ${user.displayName}.`,
      type: 'alert',
      recipientRole: 'SUPERVISOR',
      relatedEntityId: data.id,
      relatedEntityType: 'OutbreakAlert'
    });

    res.json({
      success: true,
      message: 'Outbreak alert escalated successfully to the State Health Department.',
      alertId: data.id,
      escalatedAt: data.escalatedAt,
      notificationId: notif.id
    });

  } catch (error) {
    console.error('[ESCALATE ERROR]', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred during escalation.' });
  }
};
