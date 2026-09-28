const { HealthRecord, Patient } = require('../models');
const { runDetectionAgent } = require('../services/outbreakDetectionService');

exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.patientId) {
      where.patientId = req.query.patientId;
    }
    const records = await HealthRecord.findAll({
      where,
      include: [{ model: Patient }]
    });
    // Flatten patient details so the frontend receives them as expected
    const data = records.map(r => {
      const record = r.toJSON();
      if (record.Patient) {
        record.patientName = record.Patient.name;
        record.age = record.Patient.age;
        record.gender = record.Patient.gender;
        record.village = record.Patient.village;
      }
      if (typeof record.vitals === 'string') {
        try {
          record.vitals = JSON.parse(record.vitals);
        } catch (e) {
          record.vitals = null;
        }
      }
      return record;
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await HealthRecord.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    
    const record = data.toJSON();
    if (typeof record.vitals === 'string') {
      try {
        record.vitals = JSON.parse(record.vitals);
      } catch (e) {
        record.vitals = null;
      }
    }
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  const t = await HealthRecord.sequelize.transaction({ type: 'EXCLUSIVE' });
  try {
    const { patientId, diagnosis, visitType, date } = req.body;
    if (!patientId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }

    const normDiag = (diagnosis || '').trim().toLowerCase();
    const normVisit = (visitType || '').trim().toLowerCase();
    
    // Determine the calendar day of the request
    const recordDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(recordDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Search for existing record today for the same patient
    const existingRecords = await HealthRecord.findAll({ 
      where: { 
        patientId,
        date: {
          [HealthRecord.sequelize.Sequelize.Op.between]: [startOfDay, endOfDay]
        }
      },
      transaction: t 
    });

    let duplicateRecord = null;
    for (const r of existingRecords) {
      const rDiag = (r.diagnosis || '').trim().toLowerCase();
      const rVisit = (r.visitType || '').trim().toLowerCase();
      
      if (rDiag === normDiag && rVisit === normVisit) {
        duplicateRecord = r;
        break;
      }
    }

    if (duplicateRecord) {
      await t.commit();
      return res.status(200).json({ 
        success: true, 
        duplicate: true, 
        data: duplicateRecord 
      });
    }

    // Ensure date is populated before creating record
    req.body.date = recordDate;

    // Create new health record
    const data = await HealthRecord.create(req.body, { transaction: t });
    await t.commit();
    
    // Trigger outbreak detection asynchronously
    runDetectionAgent(data.id).catch(err => {
      console.error('[OUTBREAK ERROR] Failed to run detection agent:', err);
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await HealthRecord.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await HealthRecord.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
