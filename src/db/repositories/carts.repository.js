'use strict';

const db = require('../knex');

const CARTS_TABLE = 'carts';
const ITEMS_TABLE = 'cart_items';

// ---- carts ----

const findById = (id) =>
  db(CARTS_TABLE).where({ id }).first();

const findByUser = (user_id) =>
  db(CARTS_TABLE).where({ user_id }).first();

const findBySession = (session_id) =>
  db(CARTS_TABLE).where({ session_id }).first();

const createCart = async (data) => {
  const [id] = await db(CARTS_TABLE).insert(data);
  return findById(id);
};

const updateCart = async (id, data) => {
  await db(CARTS_TABLE).where({ id }).update(data);
  return findById(id);
};

const deleteCart = (id) =>
  db(CARTS_TABLE).where({ id }).del();

// ---- cart_items ----

const findItemById = (id) =>
  db(ITEMS_TABLE).where({ id }).first();

const findItemsByCart = (cart_id) =>
  db(ITEMS_TABLE).where({ cart_id });

const findItemByCartAndSku = (cart_id, sku_id) =>
  db(ITEMS_TABLE).where({ cart_id, sku_id }).first();

const addItem = async (data) => {
  const [id] = await db(ITEMS_TABLE).insert(data);
  return findItemById(id);
};

const updateItem = async (id, data) => {
  await db(ITEMS_TABLE).where({ id }).update(data);
  return findItemById(id);
};

const removeItem = (id) =>
  db(ITEMS_TABLE).where({ id }).del();

const clearCart = (cart_id) =>
  db(ITEMS_TABLE).where({ cart_id }).del();

const upsertItem = async (cart_id, sku_id, quantity, unit_price) => {
  const existing = await findItemByCartAndSku(cart_id, sku_id);
  if (existing) {
    return updateItem(existing.id, { quantity, unit_price });
  }
  return addItem({ cart_id, sku_id, quantity, unit_price });
};

module.exports = {
  findById,
  findByUser,
  findBySession,
  createCart,
  updateCart,
  deleteCart,
  findItemById,
  findItemsByCart,
  findItemByCartAndSku,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  upsertItem,
};
