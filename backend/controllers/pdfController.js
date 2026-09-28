const PDFDocument = require('pdfkit');
const { Patient, HealthRecord, Consultation, FollowUp } = require('../models');

exports.generateHealthRecordPdf = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Fetch patient with related records
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const healthRecords = await HealthRecord.findAll({ where: { patientId }, order: [['date', 'DESC']] });
    const consultations = await Consultation.findAll({ where: { patientId }, order: [['submittedAt', 'DESC']] });
    const followUps = await FollowUp.findAll({ where: { patientId }, order: [['scheduledDate', 'DESC']] });

    // Set up PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers for download
    res.setHeader('Content-disposition', `attachment; filename=SynCura_Patient_${patientId}_Health_Record.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('SynCura AI', { align: 'center' });
    doc.fontSize(14).text('Patient Health Record', { align: 'center' });
    doc.moveDown(2);
    
    // Patient Information
    doc.fontSize(16).font('Helvetica-Bold').text('Patient Information');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Name: ${patient.name}`);
    doc.text(`Patient ID: ${patient.id}`);
    doc.text(`Age/Gender: ${patient.age} / ${patient.gender}`);
    doc.text(`Location: ${patient.village || 'Not available'}`);
    doc.text(`Phone: ${patient.phone || 'Not available'}`);
    doc.text(`Status: ${patient.status || 'Not available'}`);
    doc.moveDown(1.5);
    
    // Visit Summary (Health Records)
    doc.fontSize(16).font('Helvetica-Bold').text('Visit Summary');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    if (healthRecords.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No health records found.');
    } else {
      for (const hr of healthRecords) {
        doc.fontSize(12).font('Helvetica-Bold').text(`Date: ${new Date(hr.date).toLocaleDateString()} - ${hr.visitType || 'General'}`);
        doc.font('Helvetica').text(`Diagnosis: ${hr.diagnosis || 'Not available'}`);
        doc.text(`Symptoms/Notes: ${hr.symptoms || 'Not available'}`);
        if (hr.vitals) {
           const v = typeof hr.vitals === 'string' ? JSON.parse(hr.vitals) : hr.vitals;
           if (Object.keys(v).length > 0) {
             const vitalsStr = Object.entries(v).map(([key, val]) => `${key}: ${val}`).join(', ');
             doc.text(`Vitals: ${vitalsStr}`);
           }
        }
        doc.text(`Recorded By: ${hr.recordedBy || 'Not available'}`);
        doc.moveDown(0.5);
      }
    }
    doc.moveDown(1);
    
    // Consultation History
    doc.fontSize(16).font('Helvetica-Bold').text('Consultation History');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    if (consultations.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No consultation history found.');
    } else {
      for (const c of consultations) {
        doc.fontSize(12).font('Helvetica-Bold').text(`Date: ${new Date(c.submittedAt || c.createdAt).toLocaleDateString()}`);
        doc.font('Helvetica').text(`Symptoms: ${c.symptoms || 'Not available'}`);
        doc.text(`Status: ${c.status || 'Not available'}`);
        if (c.doctorNotes) doc.text(`Doctor Notes: ${c.doctorNotes}`);
        doc.moveDown(0.5);
      }
    }
    doc.moveDown(1);

    // Follow-up Schedule
    doc.fontSize(16).font('Helvetica-Bold').text('Follow-up Schedule');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    
    if (followUps.length === 0) {
      doc.fontSize(12).font('Helvetica-Oblique').text('No follow-ups scheduled.');
    } else {
      for (const f of followUps) {
        doc.fontSize(12).font('Helvetica-Bold').text(`Date: ${new Date(f.scheduledDate).toLocaleDateString()} ${f.scheduledTime || ''}`);
        doc.font('Helvetica').text(`Reason: ${f.reason || 'Not available'}`);
        doc.text(`Priority: ${f.priority || 'Normal'}`);
        doc.text(`Status: ${f.status || 'SCHEDULED'}`);
        if (f.notes) doc.text(`Notes: ${f.notes}`);
        doc.moveDown(0.5);
      }
    }
    doc.moveDown(2);
    
    // Footer
    doc.fontSize(10).font('Helvetica-Oblique').text(`Report generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    
    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    // If headers already sent, we can't send JSON. But we try:
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to generate PDF' });
    }
  }
};
