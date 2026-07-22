'use strict';
const db = require('../knex');

const TABLE = 'promo_codes';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByCode = (code) =>
  db(TABLE).where({ code }).first();

const findAll = ({ limit = 50, offset = 0 } = {}) =>
  db(TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findActive = (now = new Date()) =>
  db(TABLE)
    .where({ is_active: true })
    .where('valid_from', '<=', now)
    .where('valid_until', '>=', now);

const create = async (data) => {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
};

const update = async (id, data) => {
  await db(TABLE).where({ id }).update(data);
  return findById(id);
};

const remove = (id) =>
  db(TABLE).where({ id }).del();

/**
 * Atomically increment the usage_count for a promo code.
 */
const incrementUsage = (id, trx = db) =>
  trx(TABLE).where({ id }).increment('usage_count', 1);

/**
 * Atomically decrement the usage_count (e.g. on order cancellation).
 */
const decrementUsage = (id, trx = db) =>
  trx(TABLE)
    .where({ id })
    .where('usage_count', '>', 0)
    .decrement('usage_count', 1);

module.exports = {
  findById,
  findByCode,
  findAll,
  findActive,
  create,
  update,
  remove,
  incrementUsage,
  decrementUsage,
};
