const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const createAddressRules = [
  body('full_name')
    .notEmpty()
    .withMessage('Full name is required.')
    .isString()
    .withMessage('Full name must be a string.')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters.'),

  body('phone')
    .notEmpty()
    .withMessage('Phone number is required.')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be a valid 10-digit number.'),

  body('address_line1')
    .notEmpty()
    .withMessage('Address line 1 is required.')
    .isString()
    .withMessage('Address line 1 must be a string.')
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters.'),

  body('address_line2')
    .optional({ nullable: true })
    .isString()
    .withMessage('Address line 2 must be a string.')
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters.'),

  body('city')
    .notEmpty()
    .withMessage('City is required.')
    .isString()
    .withMessage('City must be a string.')
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters.'),

  body('state')
    .notEmpty()
    .withMessage('State is required.')
    .isString()
    .withMessage('State must be a string.')
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters.'),

  body('pin_code')
    .notEmpty()
    .withMessage('Pin code is required.')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pin code must be a valid 6-digit number.'),

  body('country')
    .notEmpty()
    .withMessage('Country is required.')
    .isString()
    .withMessage('Country must be a string.')
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters.'),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean.'),

  body('address_type')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('address_type must be one of: home, work, other.'),
];

const updateAddressRules = [
  body('full_name')
    .optional()
    .isString()
    .withMessage('Full name must be a string.')
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters.'),

  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be a valid 10-digit number.'),

  body('address_line1')
    .optional()
    .isString()
    .withMessage('Address line 1 must be a string.')
    .isLength({ max: 255 })
    .withMessage('Address line 1 must not exceed 255 characters.'),

  body('address_line2')
    .optional({ nullable: true })
    .isString()
    .withMessage('Address line 2 must be a string.')
    .isLength({ max: 255 })
    .withMessage('Address line 2 must not exceed 255 characters.'),

  body('city')
    .optional()
    .isString()
    .withMessage('City must be a string.')
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters.'),

  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string.')
    .isLength({ max: 100 })
    .withMessage('State must not exceed 100 characters.'),

  body('pin_code')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pin code must be a valid 6-digit number.'),

  body('country')
    .optional()
    .isString()
    .withMessage('Country must be a string.')
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters.'),

  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean.'),

  body('address_type')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('address_type must be one of: home, work, other.'),
];

const validateCreateAddress = [...createAddressRules, handleValidationErrors];
const validateUpdateAddress = [...updateAddressRules, handleValidationErrors];

module.exports = {
  validateCreateAddress,
  validateUpdateAddress,
};
