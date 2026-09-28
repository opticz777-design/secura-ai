const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authenticateUser, authController.me);
router.post('/logout', authController.logout);

module.exports = router;
