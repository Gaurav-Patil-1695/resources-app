const db = require('../../config/db');

const getAddressesByUserId = async (userId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return result.rows;
};

const getAddressById = async (userId, addressId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
    [addressId, userId]
  );
  return result.rows[0] || null;
};

const isServiceablePinCode = async (pinCode) => {
  const result = await db.query(
    'SELECT 1 FROM serviceable_pin_codes WHERE pin_code = $1 AND is_active = true',
    [pinCode]
  );
  return result.rowCount > 0;
};

const unsetDefaultAddress = async (userId, client) => {
  const conn = client || db;
  await conn.query(
    'UPDATE addresses SET is_default = false WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
};

const createAddress = async (userId, payload) => {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
    address_type,
  } = payload;

  const serviceable = await isServiceablePinCode(pin_code);
  if (!serviceable) {
    const err = new Error('The provided pin code is not serviceable.');
    err.statusCode = 422;
    throw err;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (is_default) {
      await unsetDefaultAddress(userId, client);
    }

    const existingCount = await client.query(
      'SELECT COUNT(*) FROM addresses WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    const shouldBeDefault = is_default || parseInt(existingCount.rows[0].count, 10) === 0;

    const result = await client.query(
      `INSERT INTO addresses
        (user_id, full_name, phone, address_line1, address_line2, city, state, pin_code, country, is_default, address_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        full_name,
        phone,
        address_line1,
        address_line2 || null,
        city,
        state,
        pin_code,
        country,
        shouldBeDefault,
        address_type || 'home',
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateAddress = async (userId, addressId, payload) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) return null;

  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pin_code,
    country,
    is_default,
    address_type,
  } = payload;

  const newPinCode = pin_code !== undefined ? pin_code : existing.pin_code;
  if (pin_code !== undefined && pin_code !== existing.pin_code) {
    const serviceable = await isServiceablePinCode(pin_code);
    if (!serviceable) {
      const err = new Error('The provided pin code is not serviceable.');
      err.statusCode = 422;
      throw err;
    }
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const shouldBeDefault = is_default !== undefined ? is_default : existing.is_default;
    if (shouldBeDefault && !existing.is_default) {
      await unsetDefaultAddress(userId, client);
    }

    const result = await client.query(
      `UPDATE addresses SET
        full_name       = COALESCE($1, full_name),
        phone           = COALESCE($2, phone),
        address_line1   = COALESCE($3, address_line1),
        address_line2   = COALESCE($4, address_line2),
        city            = COALESCE($5, city),
        state           = COALESCE($6, state),
        pin_code        = COALESCE($7, pin_code),
        country         = COALESCE($8, country),
        is_default      = $9,
        address_type    = COALESCE($10, address_type),
        updated_at      = NOW()
       WHERE id = $11 AND user_id = $12 AND deleted_at IS NULL
       RETURNING *`,
      [
        full_name || null,
        phone || null,
        address_line1 || null,
        address_line2 !== undefined ? address_line2 : null,
        city || null,
        state || null,
        newPinCode,
        country || null,
        shouldBeDefault,
        address_type || null,
        addressId,
        userId,
      ]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteAddress = async (userId, addressId) => {
  const existing = await getAddressById(userId, addressId);
  if (!existing) return null;

  const result = await db.query(
    'UPDATE addresses SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *',
    [addressId, userId]
  );

  if (result.rowCount === 0) return null;

  if (existing.is_default) {
    await db.query(
      `UPDATE addresses SET is_default = true, updated_at = NOW()
       WHERE id = (
         SELECT id FROM addresses
         WHERE user_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 1
       )`,
      [userId]
    );
  }

  return result.rows[0];
};

module.exports = {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  isServiceablePinCode,
};
