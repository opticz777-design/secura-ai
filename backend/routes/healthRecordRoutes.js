const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');

router.get('/', healthRecordController.getAll);
router.get('/:id', healthRecordController.getById);
router.post('/', healthRecordController.create);
router.put('/:id', healthRecordController.update);
router.delete('/:id', healthRecordController.delete);

module.exports = router;
