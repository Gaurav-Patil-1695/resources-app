const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');

// GET /notifications - Poll notifications for the authenticated user
router.get('/', notificationsController.getNotifications);

// GET /notifications/:id - Get a single notification by ID
router.get('/:id', notificationsController.getNotificationById);

// PATCH /notifications/read-all - Mark all notifications as read
router.patch('/read-all', notificationsController.markAllRead);

// PATCH /notifications/:id/read - Mark a single notification as read
router.patch('/:id/read', notificationsController.markRead);

module.exports = router;
