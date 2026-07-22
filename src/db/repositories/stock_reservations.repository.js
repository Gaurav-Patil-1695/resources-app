'use strict';

const db = require('../knex');

const TABLE = 'stock_reservations';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByOrder = (order_id) =>
  db(TABLE).where({ order_id });

const findBySku = (sku_id) =>
  db(TABLE).where({ sku_id });

const findActive = () =>
  db(TABLE).where({ status: 'active' });

const findExpired = (now = new Date()) =>
  db(TABLE).where({ status: 'active' }).where('expires_at', '<=', now);

const create = async (data, trx = db) => {
  const [id] = await trx(TABLE).insert(data);
  return trx(TABLE).where({ id }).first();
};

const update = async (id, data, trx = db) => {
  await trx(TABLE).where({ id }).update(data);
  return trx(TABLE).where({ id }).first();
};

const release = (id, trx = db) =>
  trx(TABLE).where({ id }).update({ status: 'released' });

const releaseByOrder = (order_id, trx = db) =>
  trx(TABLE).where({ order_id, status: 'active' }).update({ status: 'released' });

const confirm = (id, trx = db) =>
  trx(TABLE).where({ id }).update({ status: 'confirmed' });

const confirmByOrder = (order_id, trx = db) =>
  trx(TABLE).where({ order_id, status: 'active' }).update({ status: 'confirmed' });

const remove = (id) =>
  db(TABLE).where({ id }).del();

module.exports = {
  findById,
  findByOrder,
  findBySku,
  findActive,
  findExpired,
  create,
  update,
  release,
  releaseByOrder,
  confirm,
  confirmByOrder,
  remove,
};
