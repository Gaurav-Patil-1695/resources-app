const db = require('../../db');

async function getAllRoles() {
  const result = await db.query('SELECT * FROM roles ORDER BY name ASC');
  return result.rows;
}

async function getRoleById(id) {
  const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createRole({ name, description }) {
  const existing = await db.query('SELECT id FROM roles WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    const error = new Error('A role with this name already exists');
    error.status = 409;
    throw error;
  }
  const result = await db.query(
    'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  );
  return result.rows[0];
}

async function updateRole(id, { name, description }) {
  const role = await getRoleById(id);
  if (!role) return null;

  if (name && name !== role.name) {
    const existing = await db.query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name, id]);
    if (existing.rows.length > 0) {
      const error = new Error('A role with this name already exists');
      error.status = 409;
      throw error;
    }
  }

  const updatedName = name !== undefined ? name : role.name;
  const updatedDescription = description !== undefined ? description : role.description;

  const result = await db.query(
    'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [updatedName, updatedDescription, id]
  );
  return result.rows[0] || null;
}

async function deleteRole(id) {
  const role = await getRoleById(id);
  if (!role) return false;

  await db.query('DELETE FROM user_roles WHERE role_id = $1', [id]);
  const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

async function getUsersByRole(roleId) {
  const result = await db.query(
    `SELECT u.* FROM users u
     INNER JOIN user_roles ur ON ur.user_id = u.id
     WHERE ur.role_id = $1
     ORDER BY u.id ASC`,
    [roleId]
  );
  return result.rows;
}

async function assignRoleToUser({ userId, roleId }) {
  const existing = await db.query(
    'SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2',
    [userId, roleId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  const result = await db.query(
    'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING *',
    [userId, roleId]
  );
  return result.rows[0];
}

async function removeRoleFromUser({ userId, roleId }) {
  const result = await db.query(
    'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *',
    [userId, roleId]
  );
  return result.rows.length > 0;
}

async function getRolesByUser(userId) {
  const result = await db.query(
    `SELECT r.* FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1
     ORDER BY r.name ASC`,
    [userId]
  );
  return result.rows;
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesByUser,
};
