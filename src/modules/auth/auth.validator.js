const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('name')
    .notEmpty().withMessage('Name is required.')
    .isString().withMessage('Name must be a string.'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

const validateForgotPassword = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.'),
  handleValidationErrors,
];

const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  handleValidationErrors,
];

const validateGuestRegister = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string.'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGuestRegister,
};
