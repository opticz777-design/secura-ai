const express = require('express');
const router = express.Router();
const bloodRequestController = require('../controllers/bloodRequestController');

router.get('/', bloodRequestController.getAll);
router.get('/:id', bloodRequestController.getById);
router.post('/', bloodRequestController.create);
router.put('/:id', bloodRequestController.update);
router.delete('/:id', bloodRequestController.delete);

module.exports = router;
