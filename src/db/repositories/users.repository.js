'use strict';

const db = require('../knex');

const TABLE = 'users';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByEmail = (email) =>
  db(TABLE).where({ email }).first();

const findByPhone = (phone) =>
  db(TABLE).where({ phone }).first();

const findAll = ({ limit = 20, offset = 0 } = {}) =>
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

const count = () =>
  db(TABLE).count('id as total').first();

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  findAll,
  create,
  update,
  remove,
  count,
};
