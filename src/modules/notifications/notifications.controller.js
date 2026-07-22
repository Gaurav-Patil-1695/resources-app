const notificationsService = require('./notifications.service');

/**
 * GET /notifications
 * Returns a list of notifications for the authenticated user.
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const result = await notificationsService.getNotifications(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true',
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /notifications/:id
 * Returns a single notification by ID.
 */
async function getNotificationById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.getNotificationById(userId, id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
async function markRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.markRead(userId, id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/read-all
 * Marks all notifications as read for the authenticated user.
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await notificationsService.markAllRead(userId);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getNotificationById,
  markRead,
  markAllRead,
};
