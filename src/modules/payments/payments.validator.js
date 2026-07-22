const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to collect validation results and return 422 if any errors exist.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
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
 * Validation rules for POST /payments/initiate
 */
const validateInitiatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .notEmpty()
    .withMessage('Currency is required.')
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO 4217 code.')
    .toUpperCase(),

  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required.')
    .isString()
    .withMessage('Order ID must be a string.'),

  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required.')
    .isString()
    .withMessage('Customer ID must be a string.'),

  body('provider')
    .optional()
    .isString()
    .withMessage('Provider must be a string.'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/callback
 */
const validateCallback = [
  body('referenceId')
    .notEmpty()
    .withMessage('Reference ID is required.')
    .isString()
    .withMessage('Reference ID must be a string.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isString()
    .withMessage('Status must be a string.'),

  body('provider')
    .optional()
    .isString()
    .withMessage('Provider must be a string.'),

  body('providerReference')
    .optional()
    .isString()
    .withMessage('Provider reference must be a string.'),

  handleValidationErrors,
];

/**
 * Validation rules for POST /payments/:paymentId/retry
 */
const validateRetry = [
  param('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required.')
    .isString()
    .withMessage('Payment ID must be a string.'),

  body('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number.'),

  body('currency')
    .optional()
    .isString()
    .withMessage('Currency must be a string.')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a valid 3-letter ISO 4217 code.')
    .toUpperCase(),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object.'),

  handleValidationErrors,
];

module.exports = {
  validateInitiatePayment,
  validateCallback,
  validateRetry,
};
