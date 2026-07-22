'use strict';

const config = require('./index');

const JWT_SECRET = config.jwt.secret;
const JWT_ACCESS_TTL = config.jwt.accessTtl;
const JWT_RESET_TTL = config.jwt.resetTtl;

module.exports = {
  JWT_SECRET,
  JWT_ACCESS_TTL,
  JWT_RESET_TTL,
};
