'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * HTTP request logger middleware.
 *
 * In production uses the "combined" Apache format.
 * In all other environments uses the "dev" format for readability.
 *
 * Log output is piped through the Winston logger so that all
 * application logs share a single transport configuration.
 */
const format =
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

/**
 * Morgan write stream that delegates to Winston.
 */
const stream = {
  write(message) {
    // morgan appends a trailing newline — trim it before handing to winston
    logger.http(message.trim());
  },
};

/**
 * Skip logging for health-check endpoints to reduce noise.
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function skip(req) {
  return req.url === '/health' || req.url === '/ping';
}

const requestLogger = morgan(format, { stream, skip });

module.exports = requestLogger;
