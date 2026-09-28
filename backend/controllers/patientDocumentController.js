const { Patient, PatientDocument, sequelize } = require('../models');
const path = require('path');
const fs = require('fs');

// Upload a document
exports.uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No valid file provided. Must be PDF, JPG, or PNG under 5MB.' });
  }

  const { patientId } = req.params;
  const { documentType, description } = req.body;

  try {
    // 1. Validate Patient & Authorization (authorization happens in middleware usually, but here we can do basic scoping)
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      // Clean up file if patient not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Role-based scoping (similar to patientController)
    const userRole = req.user.role;
    const userCenter = req.user.center;
    
    if (userRole === 'SUPERVISOR') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ success: false, error: 'Supervisors do not have permission to upload patient documents.' });
    }

    if (userRole === 'ASHA_WORKER' && patient.village !== userCenter && userCenter !== 'All Villages') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ success: false, error: 'You do not have permission to access this patient.' });
    }

    // 2. Transaction for storing metadata safely
    const newDoc = await sequelize.transaction(async (t) => {
      const doc = await PatientDocument.create({
        patientId,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        documentType: documentType || 'Other',
        description: description || '',
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user.username || 'System',
        uploadedByRole: req.user.role || 'UNKNOWN'
      }, { transaction: t });
      return doc;
    });

    res.status(201).json({ success: true, data: newDoc });

  } catch (error) {
    console.error('Error uploading document:', error);
    // Cleanup file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: 'Failed to save document metadata' });
  }
};

// List all documents for a patient
exports.getPatientDocuments = async (req, res) => {
  const { patientId } = req.params;

  try {
    const patient = await Patient.findByPk(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    // Authorization
    const userRole = req.user.role;
    const userCenter = req.user.center;
    if (userRole === 'ASHA_WORKER' && patient.village !== userCenter && userCenter !== 'All Villages') {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this patient.' });
    }

    const documents = await PatientDocument.findAll({
      where: { patientId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
};

// View / Download a specific document
exports.viewDocument = async (req, res) => {
  const { patientId, documentId } = req.params;

  try {
    const patient = await Patient.findByPk(patientId);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    // Authorization
    const userRole = req.user.role;
    const userCenter = req.user.center;
    if (userRole === 'ASHA_WORKER' && patient.village !== userCenter && userCenter !== 'All Villages') {
      return res.status(403).json({ success: false, error: 'You do not have permission to access this patient.' });
    }

    const doc = await PatientDocument.findOne({
      where: { id: documentId, patientId }
    });

    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    const filePath = path.join(__dirname, '..', 'uploads', 'patient-documents', doc.storedFileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Physical file not found on server' });
    }

    // Set inline headers to preview in browser
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFileName}"`);
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({ success: false, error: 'Failed to stream document' });
  }
};
