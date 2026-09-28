const express = require('express');
const router = express.Router();
const incentiveClaimController = require('../controllers/incentiveClaimController');
const { requireRole } = require('../middleware/authMiddleware');

router.get('/current', incentiveClaimController.getCurrentCycleActivity);
router.get('/history', incentiveClaimController.getHistory);
router.get('/pending', incentiveClaimController.getPendingClaims);
router.post('/claims', requireRole('ASHA_WORKER'), incentiveClaimController.submitClaim);
router.patch('/claims/:id/status', requireRole('SUPERVISOR'), incentiveClaimController.updateClaimStatus);

module.exports = router;
