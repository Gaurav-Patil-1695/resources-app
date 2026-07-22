'use strict';

const db = require('../knex');

const TABLE = 'serviceable_pin_codes';

const findByPinCode = (pin_code) =>
  db(TABLE).where({ pin_code }).first();

const isServiceable = async (pin_code) => {
  const row = await findByPinCode(pin_code);
  return Boolean(row && row.is_active);
};

const findAll = ({ limit = 100, offset = 0 } = {}) =>
  db(TABLE).limit(limit).offset(offset);

const create = async (data) => {
  const [id] = await db(TABLE).insert(data);
  return db(TABLE).where({ id }).first();
};

const update = async (pin_code, data) => {
  await db(TABLE).where({ pin_code }).update(data);
  return findByPinCode(pin_code);
};

const remove = (pin_code) =>
  db(TABLE).where({ pin_code }).del();

const bulkUpsert = (records) =>
  db.raw(
    `INSERT INTO ${TABLE} (pin_code, city, state, is_active)
     VALUES ${records.map(() => '(?, ?, ?, ?)').join(', ')}
     ON DUPLICATE KEY UPDATE city = VALUES(city), state = VALUES(state), is_active = VALUES(is_active)`,
    records.flatMap((r) => [r.pin_code, r.city, r.state, r.is_active])
  );

module.exports = {
  findByPinCode,
  isServiceable,
  findAll,
  create,
  update,
  remove,
  bulkUpsert,
};
