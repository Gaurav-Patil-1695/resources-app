'use strict';

const db = require('../knex');

const TABLE = 'return_requests';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrder = (order_id) =>
  db(TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findByUser = (user_id, { limit = 20, offset = 0 } = {}) =>
  db(TABLE)
    .where({ user_id })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const q = db(TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);
  if (status) q.where({ status });
  return q;
};

const create = async (data, trx = db) => {
  const [id] = await trx(TABLE).insert(data);
  return trx(TABLE).where({ id }).first();
};

const update = async (id, data, trx = db) => {
  await trx(TABLE).where({ id }).update(data);
  return trx(TABLE).where({ id }).first();
};

const remove = (id) =>
  db(TABLE).where({ id }).del();

module.exports = {
  findById,
  findByOrder,
  findByUser,
  findAll,
  create,
  update,
  remove,
};
