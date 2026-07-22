'use strict';
const db = require('../knex');

const ORDERS_TABLE = 'orders';
const ITEMS_TABLE = 'order_items';
const HISTORY_TABLE = 'order_status_history';
const TRACKING_TABLE = 'order_tracking';

// ---- orders ----

const findById = (id) =>
  db(ORDERS_TABLE).where({ id }).first();

const findByOrderNumber = (order_number) =>
  db(ORDERS_TABLE).where({ order_number }).first();

const findByUser = (user_id, { limit = 20, offset = 0 } = {}) =>
  db(ORDERS_TABLE)
    .where({ user_id })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

const findAll = ({ limit = 20, offset = 0, status } = {}) => {
  const q = db(ORDERS_TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);
  if (status) q.where({ status });
  return q;
};

const createOrder = async (data, trx = db) => {
  const [id] = await trx(ORDERS_TABLE).insert(data);
  return trx(ORDERS_TABLE).where({ id }).first();
};

const updateOrder = async (id, data, trx = db) => {
  await trx(ORDERS_TABLE).where({ id }).update(data);
  return trx(ORDERS_TABLE).where({ id }).first();
};

// ---- order_items ----

const findItemsByOrder = (order_id) =>
  db(ITEMS_TABLE).where({ order_id });

const findItemById = (id) =>
  db(ITEMS_TABLE).where({ id }).first();

const createOrderItem = async (data, trx = db) => {
  const [id] = await trx(ITEMS_TABLE).insert(data);
  return trx(ITEMS_TABLE).where({ id }).first();
};

const bulkCreateOrderItems = (items, trx = db) =>
  trx(ITEMS_TABLE).insert(items);

// ---- order_status_history ----

const findHistoryByOrder = (order_id) =>
  db(HISTORY_TABLE).where({ order_id }).orderBy('created_at', 'asc');

const addStatusHistory = async (data, trx = db) => {
  const [id] = await trx(HISTORY_TABLE).insert(data);
  return trx(HISTORY_TABLE).where({ id }).first();
};

// ---- order_tracking ----

const findTrackingByOrder = (order_id) =>
  db(TRACKING_TABLE).where({ order_id }).orderBy('created_at', 'desc');

const findLatestTracking = (order_id) =>
  db(TRACKING_TABLE).where({ order_id }).orderBy('created_at', 'desc').first();

const addTracking = async (data, trx = db) => {
  const [id] = await trx(TRACKING_TABLE).insert(data);
  return trx(TRACKING_TABLE).where({ id }).first();
};

module.exports = {
  findById,
  findByOrderNumber,
  findByUser,
  findAll,
  createOrder,
  updateOrder,
  findItemsByOrder,
  findItemById,
  createOrderItem,
  bulkCreateOrderItems,
  findHistoryByOrder,
  addStatusHistory,
  findTrackingByOrder,
  findLatestTracking,
  addTracking,
};
