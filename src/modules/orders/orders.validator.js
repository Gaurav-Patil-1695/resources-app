const { body, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Reusable error response helper
// ---------------------------------------------------------------------------
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// Advance order validator
// ---------------------------------------------------------------------------
const validateAdvanceOrder = [
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string.')
    .isLength({ max: 500 })
    .withMessage('Note must not exceed 500 characters.'),

  body('trackingNumber')
    .optional()
    .isString()
    .withMessage('Tracking number must be a string.')
    .isLength({ max: 100 })
    .withMessage('Tracking number must not exceed 100 characters.'),

  body('carrier')
    .optional()
    .isString()
    .withMessage('Carrier must be a string.')
    .isLength({ max: 100 })
    .withMessage('Carrier must not exceed 100 characters.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Cancel order validator
// ---------------------------------------------------------------------------
const validateCancelOrder = [
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string.')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Return request validator
// ---------------------------------------------------------------------------
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
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array.'),

  body('items.*.orderItemId')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include an orderItemId.')
    .isString()
    .withMessage('orderItemId must be a string.'),

  body('items.*.quantity')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Each return item must include a quantity.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer.'),

  handleValidationErrors,
];

module.exports = {
  validateAdvanceOrder,
  validateCancelOrder,
  validateReturnRequest,
};
