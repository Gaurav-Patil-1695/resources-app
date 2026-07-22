'use strict';
const db = require('../knex');

const TABLE = 'categories';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findBySlug = (slug) =>
  db(TABLE).where({ slug }).first();

const findAll = () =>
  db(TABLE).orderBy('parent_id', 'asc').orderBy('sort_order', 'asc');

const findRoots = () =>
  db(TABLE).whereNull('parent_id').orderBy('sort_order', 'asc');

const findChildren = (parent_id) =>
  db(TABLE).where({ parent_id }).orderBy('sort_order', 'asc');

/**
 * Returns the full subtree ids (inclusive) for a given root category id.
 * Performs an in-process BFS using all categories to avoid multiple round-trips.
 */
const findSubtreeIds = async (root_id) => {
  const all = await findAll();
  const childrenMap = {};
  for (const row of all) {
    if (row.parent_id == null) continue;
    if (!childrenMap[row.parent_id]) childrenMap[row.parent_id] = [];
    childrenMap[row.parent_id].push(row.id);
  }
  const ids = [];
  const queue = [root_id];
  while (queue.length) {
    const current = queue.shift();
    ids.push(current);
    if (childrenMap[current]) queue.push(...childrenMap[current]);
  }
  return ids;
};

/**
 * Returns the ancestor chain from root down to the given category id.
 */
const findAncestors = async (id) => {
  const all = await findAll();
  const byId = {};
  for (const row of all) byId[row.id] = row;
  const chain = [];
  let current = byId[id];
  while (current) {
    chain.unshift(current);
    current = current.parent_id ? byId[current.parent_id] : null;
  }
  return chain;
};

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
  findRoots,
  findChildren,
  findSubtreeIds,
  findAncestors,
  create,
  update,
  remove,
};
