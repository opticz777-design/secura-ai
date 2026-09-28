const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// All routes here should be protected by authenticateUser middleware in server.js

router.get('/', notificationController.getNotifications);
router.get('/unread', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
