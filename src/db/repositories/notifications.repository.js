'use strict';
const db = require('../knex');

const TABLE = 'notifications';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUser = (user_id, { limit = 20, offset = 0 } = {}) =>
  db(TABLE)
    .where({ user_id })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

const findUnreadByUser = (user_id) =>
  db(TABLE).where({ user_id, is_read: false }).orderBy('created_at', 'desc');

const countUnreadByUser = (user_id) =>
  db(TABLE).where({ user_id, is_read: false }).count('id as total').first();

const create = async (data) => {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
};

const bulkCreate = (records) =>
  db(TABLE).insert(records);

const markAsRead = (id) =>
  db(TABLE).where({ id }).update({ is_read: true });

const markAllAsReadForUser = (user_id) =>
  db(TABLE).where({ user_id, is_read: false }).update({ is_read: true });

const remove = (id) =>
  db(TABLE).where({ id }).del();

const removeAllForUser = (user_id) =>
  db(TABLE).where({ user_id }).del();

module.exports = {
  findById,
  findByUser,
  findUnreadByUser,
  countUnreadByUser,
  create,
  bulkCreate,
  markAsRead,
  markAllAsReadForUser,
  remove,
  removeAllForUser,
};
