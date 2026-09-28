const express = require('express');
const router = express.Router();
const outbreakAlertController = require('../controllers/outbreakAlertController');

const { requireRole } = require('../middleware/authMiddleware');

router.get('/', outbreakAlertController.getAll);
router.get('/statistics', outbreakAlertController.getStatistics);
router.get('/activities/recent', outbreakAlertController.getRecentActivities);
router.get('/:id', outbreakAlertController.getById);
router.get('/:id/activities', outbreakAlertController.getActivities);
router.post('/', outbreakAlertController.create);
router.post('/report', outbreakAlertController.report);
router.post('/:id/escalate', requireRole('SUPERVISOR'), outbreakAlertController.escalateOutbreak);
router.put('/:id', outbreakAlertController.update);
router.patch('/:id/notify', outbreakAlertController.notifyHealthOfficer);
router.patch('/:id/contain', outbreakAlertController.markContained);
router.delete('/:id', outbreakAlertController.delete);

module.exports = router;
