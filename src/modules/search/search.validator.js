const { query, validationResult } = require('express-validator');

/**
 * Middleware to collect validation errors and respond with 400 on failure.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({
        field: e.param,
        message: e.msg,
      })),
    });
  }
  next();
}

/**
 * Validation rules for GET /search
 */
const searchQueryRules = [
  query('q')
    .optional()
    .isString()
    .withMessage('q must be a string')
    .isLength({ max: 500 })
    .withMessage('q must not exceed 500 characters')
    .trim(),

  query('filters')
    .optional()
    .custom((value) => {
      if (typeof value !== 'string') return true;
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error();
        }
        return true;
      } catch {
        throw new Error('filters must be a valid JSON object');
      }
    })
    .withMessage('filters must be a valid JSON object'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('size')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('size must be an integer between 1 and 100')
    .toInt(),
];

/**
 * Validation rules for GET /search/autocomplete
 */
const suggestQueryRules = [
  query('q')
    .notEmpty()
    .withMessage('q is required')
    .isString()
    .withMessage('q must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('q must be between 1 and 200 characters')
    .trim(),

  query('size')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('size must be an integer between 1 and 20')
    .toInt(),
];

const validateSearchQuery = [...searchQueryRules, handleValidationErrors];
const validateSuggestQuery = [...suggestQueryRules, handleValidationErrors];

module.exports = {
  validateSearchQuery,
  validateSuggestQuery,
};
