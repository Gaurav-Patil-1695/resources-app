'use strict';
const db = require('../knex');

const TABLE = 'addresses';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUser = (user_id) =>
  db(TABLE).where({ user_id });

const findDefaultForUser = (user_id) =>
  db(TABLE).where({ user_id, is_default: true }).first();

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

const clearDefaultForUser = (user_id) =>
  db(TABLE).where({ user_id }).update({ is_default: false });

const setDefault = async (id, user_id) => {
  await clearDefaultForUser(user_id);
  return update(id, { is_default: true });
};

module.exports = {
  findById,
  findByUser,
  findDefaultForUser,
  create,
  update,
  remove,
  clearDefaultForUser,
  setDefault,
};
