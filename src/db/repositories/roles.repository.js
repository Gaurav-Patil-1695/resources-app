'use strict';

const db = require('../knex');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';

// ---- roles ----

const findRoleById = (id) =>
  db(ROLES_TABLE).where({ id }).first();

const findRoleByName = (name) =>
  db(ROLES_TABLE).where({ name }).first();

const findAllRoles = () =>
  db(ROLES_TABLE).select('*');

const createRole = async (data) => {
  const [id] = await db(ROLES_TABLE).insert(data);
  return findRoleById(id);
};

const updateRole = async (id, data) => {
  await db(ROLES_TABLE).where({ id }).update(data);
  return findRoleById(id);
};

const removeRole = (id) =>
  db(ROLES_TABLE).where({ id }).del();

// ---- user_roles ----

const findRolesForUser = (user_id) =>
  db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, `${USER_ROLES_TABLE}.role_id`)
    .where({ user_id })
    .select(`${ROLES_TABLE}.*`);

const findUsersForRole = (role_id) =>
  db(USER_ROLES_TABLE).where({ role_id }).select('user_id');

const assignRoleToUser = async (user_id, role_id) => {
  const existing = await db(USER_ROLES_TABLE).where({ user_id, role_id }).first();
  if (existing) return existing;
  const [id] = await db(USER_ROLES_TABLE).insert({ user_id, role_id });
  return db(USER_ROLES_TABLE).where({ id }).first();
};

const removeRoleFromUser = (user_id, role_id) =>
  db(USER_ROLES_TABLE).where({ user_id, role_id }).del();

const removeAllRolesFromUser = (user_id) =>
  db(USER_ROLES_TABLE).where({ user_id }).del();

module.exports = {
  findRoleById,
  findRoleByName,
  findAllRoles,
  createRole,
  updateRole,
  removeRole,
  findRolesForUser,
  findUsersForRole,
  assignRoleToUser,
  removeRoleFromUser,
  removeAllRolesFromUser,
};
