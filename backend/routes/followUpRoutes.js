const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');

router.post('/', followUpController.create);
// To get follow ups for a patient: GET /api/patients/:patientId/follow-ups would be cleaner, but we can put it here as GET /api/follow-ups/patient/:patientId
router.get('/patient/:patientId', followUpController.getByPatient);

module.exports = router;
