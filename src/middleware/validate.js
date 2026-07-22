'use strict';

/**
 * Generic Joi validation middleware factory.
 *
 * Validates a specific part of the request against the provided Joi schema.
 * On failure responds with HTTP 400 and a structured error body that includes
 * the individual field-level validation messages.
 *
 * Usage:
 *   router.post('/users', validate(createUserSchema), handler);
 *   router.get('/users', validate(querySchema, 'query'), handler);
 *
 * @param {import('joi').Schema} schema - A compiled Joi schema.
 * @param {'body'|'query'|'params'} [source='body'] - Which part of req to validate.
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));

      return res.status(400).json({
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed.',
        details,
      });
    }

    // Replace the request property with the sanitised / coerced value
    req[source] = value;

    return next();
  };
}

module.exports = validate;
