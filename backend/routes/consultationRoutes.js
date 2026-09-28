const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');

router.get('/', consultationController.getAll);
router.get('/:id', consultationController.getById);
router.post('/simplify', consultationController.simplify);
router.post('/', consultationController.create);
router.put('/:id', consultationController.update);
router.post('/:id/notify-patient', consultationController.notifyPatient);
router.delete('/:id', consultationController.delete);

module.exports = router;
