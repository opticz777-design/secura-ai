const { Patient, HealthRecord, Consultation } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const data = await Patient.findAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await Patient.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  const t = await Patient.sequelize.transaction({ type: 'EXCLUSIVE' });
  try {
    const { name, age, gender, village, phone, status, address, emergencyContact } = req.body;
    const ashaWorkerId = req.user && req.user.ashaWorkerId ? req.user.ashaWorkerId : (req.user ? req.user.username : 'Unknown');
    
    if (!name) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const normName = name.trim().toLowerCase();
    const normVillage = (village || '').trim().toLowerCase();
    const normGender = (gender || '').trim().toLowerCase();
    const normPhone = (phone || '').trim();

    // Find existing patient
    let existingPatient = null;
    const allPatients = await Patient.findAll({ transaction: t });
    
    for (const p of allPatients) {
      const pPhone = (p.phone || '').trim();
      if (normPhone && pPhone === normPhone) {
        existingPatient = p;
        break;
      }
      
      const pName = (p.name || '').trim().toLowerCase();
      const pVillage = (p.village || '').trim().toLowerCase();
      const pGender = (p.gender || '').trim().toLowerCase();
      
      if (pName === normName && pVillage === normVillage && pGender === normGender) {
        existingPatient = p;
        break;
      }
    }

    if (existingPatient) {
      await t.commit();
      return res.status(200).json({ 
        success: true, 
        created: false, 
        duplicate: true, 
        existingPatient: true, 
        data: existingPatient 
      });
    }

    // Create new patient
    const payload = { ...req.body, ashaWorkerId };
    const newPatient = await Patient.create(payload, { transaction: t });
    
    // Create initial health record only for genuinely new patients
    const record = await HealthRecord.create({
      patientId: newPatient.id,
      visitType: 'Routine Checkup',
      date: new Date(),
      recordedBy: 'ASHA Worker',
      symptoms: 'None',
      vitals: {},
      notes: 'Patient registered',
      status: 'Pending Review',
      ashaWorkerId
    }, { transaction: t });
    
    await t.commit();
    res.status(201).json({ success: true, created: true, duplicate: false, data: newPatient, healthRecord: record });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await Patient.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    await data.update(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const data = await Patient.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Not found' });
    
    // Delete related records manually since ON DELETE CASCADE might not be set
    await HealthRecord.destroy({ where: { patientId: data.id } });
    await Consultation.destroy({ where: { patientId: data.id } });
    
    await data.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
