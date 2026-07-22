'use strict';

const logger = require('../utils/logger');

/**
 * Centralised Express error handler.
 * Must be registered as the last middleware in the application:
 *   app.use(errorHandler);
 *
 * Produces structured JSON error responses.
 * In production the stack trace is omitted from the response body.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error (stack trace always logged server-side)
  if (status >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
    });
  } else {
    logger.warn({
      message: err.message,
      method: req.method,
      url: req.originalUrl,
      status,
    });
  }

  const body = {
    status,
    error: err.error || httpStatusText(status),
    message: err.message || 'An unexpected error occurred.',
  };

  if (!isProduction && err.stack) {
    body.stack = err.stack;
  }

  if (err.details) {
    body.details = err.details;
  }

  return res.status(status).json(body);
}

/**
 * Maps a numeric HTTP status code to its standard reason phrase.
 * @param {number} code
 * @returns {string}
 */
function httpStatusText(code) {
  const map = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return map[code] || 'Internal Server Error';
}

module.exports = errorHandler;
