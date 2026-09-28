const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');

router.get('/:patientId/health-record-pdf', pdfController.generateHealthRecordPdf);

module.exports = router;
