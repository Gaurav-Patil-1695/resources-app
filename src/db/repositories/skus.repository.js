'use strict';

const db = require('../knex');

const TABLE = 'skus';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySku = (sku_code) =>
  db(TABLE).where({ sku_code }).first();

const findByProduct = (product_id) =>
  db(TABLE).where({ product_id });

const findAll = ({ limit = 50, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

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
 * Atomically decrement stock_quantity by `qty` only if sufficient stock exists.
 * Returns the number of affected rows (1 on success, 0 if insufficient stock).
 */
const decrementStock = (id, qty, trx = db) =>
  trx(TABLE)
    .where({ id })
    .where('stock_quantity', '>=', qty)
    .decrement('stock_quantity', qty);

/**
 * Atomically increment stock_quantity (e.g. on order cancellation / return).
 */
const incrementStock = (id, qty, trx = db) =>
  trx(TABLE)
    .where({ id })
    .increment('stock_quantity', qty);

/**
 * Batch decrement for multiple SKUs within a transaction.
 * items: Array<{ id, qty }>
 * Resolves to true if all decrements succeeded, throws otherwise.
 */
const batchDecrementStock = async (items, trx = db) => {
  const results = await Promise.all(
    items.map(({ id, qty }) => decrementStock(id, qty, trx))
  );
  if (results.some((affected) => affected === 0)) {
    throw new Error('Insufficient stock for one or more SKUs');
  }
  return true;
};

const setStock = async (id, stock_quantity, trx = db) => {
  await trx(TABLE).where({ id }).update({ stock_quantity });
  return findById(id);
};

module.exports = {
  findById,
  findBySku,
  findByProduct,
  findAll,
  create,
  update,
  remove,
  decrementStock,
  incrementStock,
  batchDecrementStock,
  setStock,
};
