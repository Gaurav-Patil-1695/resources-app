const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation results.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * Validation schema for creating a return request.
 */
const validateReturnRequest = [
  body('reason')
    .notEmpty()
    .withMessage('Reason is required.')
    .isString()
    .withMessage('Reason must be a string.')
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters.'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array.'),

  body('items.*.product_id')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each item must have a product_id.')
    .isString()
    .withMessage('product_id must be a string.'),

  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each item must have a quantity.')
    .isInt({ min: 1 })
    .withMessage('quantity must be a positive integer.'),

  handleValidationErrors,
];

/**
 * Validation schema for reviewing a return request (admin).
 */
const validateReview = [
  body('decision')
    .notEmpty()
    .withMessage('Decision is required.')
    .isIn(['approved', 'rejected'])
    .withMessage('Decision must be either approved or rejected.'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string.')
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters.'),

  handleValidationErrors,
];

module.exports = {
  validateReturnRequest,
  validateReview,
};
