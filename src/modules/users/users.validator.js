const Joi = require('joi');

const updateMe = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.base': 'First name must be a string.',
    'string.empty': 'First name must not be empty.',
    'string.min': 'First name must be at least 1 character.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.base': 'Last name must be a string.',
    'string.empty': 'Last name must not be empty.',
    'string.min': 'Last name must be at least 1 character.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-().]{7,20}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Phone must be a string.',
      'string.pattern.base': 'Phone number is not valid.',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.base': 'Current password must be a string.',
    'any.required': 'Current password is required.',
    'string.empty': 'Current password must not be empty.',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.base': 'New password must be a string.',
    'string.empty': 'New password must not be empty.',
    'string.min': 'New password must be at least 8 characters.',
    'string.max': 'New password must not exceed 128 characters.',
    'any.required': 'New password is required.',
  }),
  confirmPassword: Joi.any()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match.',
      'any.required': 'Confirm password is required.',
    }),
});

const adminUpdateUser = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.base': 'First name must be a string.',
    'string.empty': 'First name must not be empty.',
    'string.min': 'First name must be at least 1 character.',
    'string.max': 'First name must not exceed 100 characters.',
  }),
  last_name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.base': 'Last name must be a string.',
    'string.empty': 'Last name must not be empty.',
    'string.min': 'Last name must be at least 1 character.',
    'string.max': 'Last name must not exceed 100 characters.',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[0-9\s\-().]{7,20}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.base': 'Phone must be a string.',
      'string.pattern.base': 'Phone number is not valid.',
    }),
  role: Joi.string().valid('admin', 'customer', 'moderator').optional().messages({
    'string.base': 'Role must be a string.',
    'any.only': 'Role must be one of: admin, customer, moderator.',
  }),
  status: Joi.string().valid('active', 'inactive', 'banned').optional().messages({
    'string.base': 'Status must be a string.',
    'any.only': 'Status must be one of: active, inactive, banned.',
  }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  updateMe,
  changePassword,
  adminUpdateUser,
};
