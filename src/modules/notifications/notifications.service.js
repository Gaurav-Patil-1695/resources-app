const db = require('../../db');

/**
 * Retrieve paginated notifications for a user.
 * @param {string|number} userId
 * @param {{ page: number, limit: number, unreadOnly: boolean }} options
 * @returns {Promise<{ data: object[], total: number, unreadCount: number, page: number, limit: number }>}
 */
async function getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const offset = (page - 1) * limit;

  let query = db('notifications').where({ user_id: userId });

  if (unreadOnly) {
    query = query.where({ is_read: false });
  }

  const [totalRow] = await query.clone().count('id as count');
  const total = parseInt(totalRow.count, 10);

  const data = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('*');

  const [unreadRow] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');
  const unreadCount = parseInt(unreadRow.count, 10);

  return { data, total, unreadCount, page, limit };
}

/**
 * Retrieve a single notification by ID for a given user.
 * @param {string|number} userId
 * @param {string|number} notificationId
 * @returns {Promise<object|null>}
 */
async function getNotificationById(userId, notificationId) {
  const notification = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();

  return notification || null;
}

/**
 * Mark a single notification as read.
 * @param {string|number} userId
 * @param {string|number} notificationId
 * @returns {Promise<object|null>}
 */
async function markRead(userId, notificationId) {
  const existing = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();

  if (!existing) {
    return null;
  }

  await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .update({ is_read: true, read_at: db.fn.now() });

  const updated = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();

  return updated;
}

/**
 * Mark all notifications for a user as read.
 * @param {string|number} userId
 * @returns {Promise<{ updatedCount: number }>}
 */
async function markAllRead(userId) {
  const updatedCount = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true, read_at: db.fn.now() });

  return { updatedCount };
}

/**
 * Create a new notification for a user.
 * Called by other services to generate notifications.
 * @param {{ userId: string|number, type: string, title: string, message: string, metadata?: object }} payload
 * @returns {Promise<object>}
 */
async function createNotification({ userId, type, title, message, metadata = null }) {
  const [id] = await db('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    metadata: metadata ? JSON.stringify(metadata) : null,
    is_read: false,
    read_at: null,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  const notification = await db('notifications').where({ id }).first();

  return notification;
}

/**
 * Get the unread notification count for a user.
 * @param {string|number} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const [row] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');

  return parseInt(row.count, 10);
}

module.exports = {
  getNotifications,
  getNotificationById,
  markRead,
  markAllRead,
  createNotification,
  getUnreadCount,
};
