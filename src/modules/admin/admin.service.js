const db = require('../../config/database');

/**
 * Aggregates cross-domain report data for the admin reports endpoint.
 * Delegates to individual domain tables for counts and summaries.
 * @param {object} query - Optional filters (e.g. date range)
 * @returns {object} Aggregated report data
 */
async function getReports(query) {
  const { from_date, to_date } = query || {};

  const dateFilter = from_date && to_date
    ? { createdAt: { $gte: new Date(from_date), $lte: new Date(to_date) } }
    : {};

  const fromClause = from_date ? `AND created_at >= $1` : '';
  const toClause = to_date ? `AND created_at <= $2` : '';
  const dateParams = [];
  if (from_date) dateParams.push(new Date(from_date));
  if (to_date) dateParams.push(new Date(to_date));

  const buildDateWhere = (alias) => {
    const conditions = [];
    if (from_date) conditions.push(`${alias}created_at >= $${conditions.length + 1}`);
    if (to_date) conditions.push(`${alias}created_at <= $${conditions.length + 1}`);
    return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  };

  const [usersResult, ordersResult, rolesResult, pinCodesResult] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total_users FROM users ${buildDateWhere('')}`, dateParams),
    db.query(`SELECT COUNT(*) AS total_orders FROM orders ${buildDateWhere('')}`, dateParams),
    db.query('SELECT COUNT(*) AS total_roles FROM roles'),
    db.query('SELECT COUNT(*) AS total_pin_codes FROM serviceable_pin_codes'),
  ]);

  return {
    total_users: parseInt(usersResult.rows[0].total_users, 10),
    total_orders: parseInt(ordersResult.rows[0].total_orders, 10),
    total_roles: parseInt(rolesResult.rows[0].total_roles, 10),
    total_pin_codes: parseInt(pinCodesResult.rows[0].total_pin_codes, 10),
  };
}

/**
 * Retrieves all permissions from the database.
 * @returns {Array} List of permission records
 */
async function getAllPermissions() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM permissions ORDER BY name ASC'
  );
  return result.rows;
}

/**
 * Retrieves all roles from the database.
 * @returns {Array} List of role records
 */
async function getAllRoles() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC'
  );
  return result.rows;
}

/**
 * Creates a new role.
 * @param {object} data - Role creation payload { name, description }
 * @returns {object} Created role record
 */
async function createRole(data) {
  const { name, description } = data;
  const result = await db.query(
    `INSERT INTO roles (name, description, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING id, name, description, created_at, updated_at`,
    [name, description || null]
  );
  return result.rows[0];
}

/**
 * Retrieves a role by its ID.
 * @param {string|number} roleId
 * @returns {object} Role record
 */
async function getRoleById(roleId) {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1',
    [roleId]
  );
  if (!result.rows.length) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Updates an existing role.
 * @param {string|number} roleId
 * @param {object} data - Fields to update { name, description }
 * @returns {object} Updated role record
 */
async function updateRole(roleId, data) {
  const { name, description } = data;
  const result = await db.query(
    `UPDATE roles
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, description, created_at, updated_at`,
    [name || null, description || null, roleId]
  );
  if (!result.rows.length) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Deletes a role by ID.
 * @param {string|number} roleId
 */
async function deleteRole(roleId) {
  const result = await db.query(
    'DELETE FROM roles WHERE id = $1 RETURNING id',
    [roleId]
  );
  if (!result.rows.length) {
    const error = new Error('Role not found');
    error.statusCode = 404;
    throw error;
  }
}

/**
 * Retrieves all permissions assigned to a given role.
 * @param {string|number} roleId
 * @returns {Array} List of permission records
 */
async function getRolePermissions(roleId) {
  await getRoleById(roleId);
  const result = await db.query(
    `SELECT p.id, p.name, p.description, rp.created_at AS assigned_at
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.name ASC`,
    [roleId]
  );
  return result.rows;
}

/**
 * Assigns a permission to a role.
 * @param {string|number} roleId
 * @param {object} data - { permission_id }
 * @returns {object} Assignment record
 */
async function addPermissionToRole(roleId, data) {
  await getRoleById(roleId);
  const { permission_id } = data;

  const permCheck = await db.query(
    'SELECT id FROM permissions WHERE id = $1',
    [permission_id]
  );
  if (!permCheck.rows.length) {
    const error = new Error('Permission not found');
    error.statusCode = 404;
    throw error;
  }

  const existing = await db.query(
    'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
    [roleId, permission_id]
  );
  if (existing.rows.length) {
    const error = new Error('Permission already assigned to this role');
    error.statusCode = 409;
    throw error;
  }

  const result = await db.query(
    `INSERT INTO role_permissions (role_id, permission_id, created_at)
     VALUES ($1, $2, NOW())
     RETURNING id, role_id, permission_id, created_at`,
    [roleId, permission_id]
  );
  return result.rows[0];
}

/**
 * Removes a permission from a role.
 * @param {string|number} roleId
 * @param {string|number} permissionId
 */
async function removePermissionFromRole(roleId, permissionId) {
  await getRoleById(roleId);
  const result = await db.query(
    'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING id',
    [roleId, permissionId]
  );
  if (!result.rows.length) {
    const error = new Error('Permission assignment not found');
    error.statusCode = 404;
    throw error;
  }
}

/**
 * Retrieves all serviceable pin codes.
 * @param {object} query - Optional filters
 * @returns {Array} List of serviceable pin code records
 */
async function getAllServiceablePinCodes(query) {
  const { active } = query || {};
  let sql = 'SELECT id, pin_code, city, state, is_active, created_at, updated_at FROM serviceable_pin_codes';
  const params = [];

  if (typeof active !== 'undefined') {
    params.push(active === 'true' || active === true);
    sql += ` WHERE is_active = $${params.length}`;
  }

  sql += ' ORDER BY pin_code ASC';
  const result = await db.query(sql, params);
  return result.rows;
}

/**
 * Creates a new serviceable pin code.
 * @param {object} data - { pin_code, city, state, is_active }
 * @returns {object} Created pin code record
 */
async function createServiceablePinCode(data) {
  const { pin_code, city, state, is_active } = data;

  const existing = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE pin_code = $1',
    [pin_code]
  );
  if (existing.rows.length) {
    const error = new Error('Pin code already exists');
    error.statusCode = 409;
    throw error;
  }

  const result = await db.query(
    `INSERT INTO serviceable_pin_codes (pin_code, city, state, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [pin_code, city || null, state || null, typeof is_active !== 'undefined' ? is_active : true]
  );
  return result.rows[0];
}

/**
 * Updates an existing serviceable pin code.
 * @param {string|number} pinCodeId
 * @param {object} data - Fields to update
 * @returns {object} Updated pin code record
 */
async function updateServiceablePinCode(pinCodeId, data) {
  const { pin_code, city, state, is_active } = data;
  const result = await db.query(
    `UPDATE serviceable_pin_codes
     SET pin_code = COALESCE($1, pin_code),
         city = COALESCE($2, city),
         state = COALESCE($3, state),
         is_active = COALESCE($4, is_active),
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [
      pin_code || null,
      city || null,
      state || null,
      typeof is_active !== 'undefined' ? is_active : null,
      pinCodeId,
    ]
  );
  if (!result.rows.length) {
    const error = new Error('Serviceable pin code not found');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Deletes a serviceable pin code by ID.
 * @param {string|number} pinCodeId
 */
async function deleteServiceablePinCode(pinCodeId) {
  const result = await db.query(
    'DELETE FROM serviceable_pin_codes WHERE id = $1 RETURNING id',
    [pinCodeId]
  );
  if (!result.rows.length) {
    const error = new Error('Serviceable pin code not found');
    error.statusCode = 404;
    throw error;
  }
}

module.exports = {
  getReports,
  getAllPermissions,
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAllServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
