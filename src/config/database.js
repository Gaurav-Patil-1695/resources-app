'use strict';
const config = require('./index');

const knexConfig = {
  client: config.db.client,
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  },
  pool: {
    min: config.db.pool.min,
    max: config.db.pool.max,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

module.exports = knexConfig;
