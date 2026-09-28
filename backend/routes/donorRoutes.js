const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');

router.get('/', donorController.getAll);
router.get('/:id', donorController.getById);
router.post('/', donorController.create);
router.put('/:id', donorController.update);
router.delete('/:id', donorController.delete);
router.get('/email/respond', donorController.emailRespond);
router.post('/email/webhook', donorController.handleInboundEmailWebhook);
router.get('/responses/all', donorController.getAllResponses);
router.post('/:id/notify', donorController.notifyDonor);
router.post('/:id/response', donorController.saveResponse);

module.exports = router;
