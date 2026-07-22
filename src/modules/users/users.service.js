const db = require('../../db');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../../utils/errors');

const SALT_ROUNDS = 12;

/**
 * Fetch a single user by id.
 * @param {string|number} userId
 * @returns {Promise<object>}
 */
async function getUserById(userId) {
  const user = await db('users')
    .where({ id: userId, deleted_at: null })
    .select(
      'id',
      'email',
      'first_name',
      'last_name',
      'phone',
      'role',
      'status',
      'created_at',
      'updated_at'
    )
    .first();

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  return user;
}

/**
 * List users with optional pagination and filtering (admin).
 * @param {object} options
 * @returns {Promise<{data: object[], total: number, page: number, limit: number}>}
 */
async function listUsers({ page = 1, limit = 20, search, role, status } = {}) {
  const offset = (Number(page) - 1) * Number(limit);

  let query = db('users').whereNull('deleted_at');

  if (search) {
    query = query.where(function () {
      this.whereILike('email', `%${search}%`)
        .orWhereILike('first_name', `%${search}%`)
        .orWhereILike('last_name', `%${search}%`);
    });
  }

  if (role) {
    query = query.where({ role });
  }

  if (status) {
    query = query.where({ status });
  }

  const [{ count }] = await query.clone().count('id as count');
  const data = await query
    .select(
      'id',
      'email',
      'first_name',
      'last_name',
      'phone',
      'role',
      'status',
      'created_at',
      'updated_at'
    )
    .orderBy('created_at', 'desc')
    .limit(Number(limit))
    .offset(offset);

  return {
    data,
    total: Number(count),
    page: Number(page),
    limit: Number(limit),
  };
}

/**
 * Update own profile fields.
 * @param {string|number} userId
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function updateUser(userId, payload) {
  const allowedFields = ['first_name', 'last_name', 'phone'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  updates.updated_at = db.fn.now();

  await db('users').where({ id: userId, deleted_at: null }).update(updates);

  return getUserById(userId);
}

/**
 * Admin update: can also modify role and status.
 * @param {string|number} userId
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function adminUpdateUser(userId, payload) {
  const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'status'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  updates.updated_at = db.fn.now();

  const rowsAffected = await db('users')
    .where({ id: userId, deleted_at: null })
    .update(updates);

  if (!rowsAffected) {
    throw new NotFoundError('User not found.');
  }

  return getUserById(userId);
}

/**
 * Soft-delete a user.
 * @param {string|number} userId
 * @returns {Promise<void>}
 */
async function deleteUser(userId) {
  const rowsAffected = await db('users')
    .where({ id: userId, deleted_at: null })
    .update({ deleted_at: db.fn.now() });

  if (!rowsAffected) {
    throw new NotFoundError('User not found.');
  }
}

/**
 * Change a user's own password.
 * @param {string|number} userId
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<void>}
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await db('users')
    .where({ id: userId, deleted_at: null })
    .select('id', 'password_hash')
    .first();

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Current password is incorrect.');
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db('users')
    .where({ id: userId })
    .update({ password_hash: newHash, updated_at: db.fn.now() });
}

module.exports = {
  getUserById,
  listUsers,
  updateUser,
  adminUpdateUser,
  deleteUser,
  changePassword,
};
