const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.get('/stats', authenticateUser, dashboardController.getDashboardStats);

module.exports = router;
