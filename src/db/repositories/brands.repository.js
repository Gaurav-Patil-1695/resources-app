'use strict';

const db = require('../knex');

const TABLE = 'brands';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findAll = ({ limit = 50, offset = 0 } = {}) =>
  db(TABLE).orderBy('name', 'asc').limit(limit).offset(offset);

const search = (term, { limit = 20, offset = 0 } = {}) =>
  db(TABLE)
    .whereILike('name', `%${term}%`)
    .orderBy('name', 'asc')
    .limit(limit)
    .offset(offset);

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

module.exports = {
  findById,
  findBySlug,
  findAll,
  search,
  create,
  update,
  remove,
};
