'use strict';

const db = require('../knex');

const TABLE = 'refunds';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrder = (order_id) =>
  db(TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findByPaymentAttempt = (payment_attempt_id) =>
  db(TABLE).where({ payment_attempt_id }).orderBy('created_at', 'desc');

const findByGatewayRef = (gateway_refund_id) =>
  db(TABLE).where({ gateway_refund_id }).first();

const findAll = ({ limit = 50, offset = 0, status } = {}) => {
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

module.exports = {
  findById,
  findByOrder,
  findByPaymentAttempt,
  findByGatewayRef,
  findAll,
  create,
  update,
};
