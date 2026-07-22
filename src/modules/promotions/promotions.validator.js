const Joi = require('joi');

const DISCOUNT_TYPES = ['percentage', 'fixed', 'free_shipping'];

/**
 * Schema for public promo code validation endpoint.
 */
const validatePromoCode = Joi.object({
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code is required.',
    'string.min': 'Promo code must be at least 1 character.',
    'string.max': 'Promo code must not exceed 50 characters.',
    'any.required': 'Promo code is required.',
  }),
  orderTotal: Joi.number().positive().required().messages({
    'number.base': 'Order total must be a number.',
    'number.positive': 'Order total must be a positive number.',
    'any.required': 'Order total is required.',
  }),
  userId: Joi.string().optional().allow(null, ''),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
      })
    )
    .optional()
    .default([]),
});

/**
 * Schema for creating a new promo code (admin).
 */
const validateCreatePromo = Joi.object({
  code: Joi.string().trim().min(1).max(50).required().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code is required.',
    'string.min': 'Promo code must be at least 1 character.',
    'string.max': 'Promo code must not exceed 50 characters.',
    'any.required': 'Promo code is required.',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters.',
  }),
  discountType: Joi.string()
    .valid(...DISCOUNT_TYPES)
    .required()
    .messages({
      'any.only': `Discount type must be one of: ${DISCOUNT_TYPES.join(', ')}.`,
      'any.required': 'Discount type is required.',
    }),
  discountValue: Joi.when('discountType', {
    is: 'free_shipping',
    then: Joi.number().min(0).optional().default(0),
    otherwise: Joi.number().positive().required().messages({
      'number.base': 'Discount value must be a number.',
      'number.positive': 'Discount value must be a positive number.',
      'any.required': 'Discount value is required.',
    }),
  }),
  minimumOrderAmount: Joi.number().min(0).optional().allow(null).messages({
    'number.min': 'Minimum order amount must be 0 or greater.',
  }),
  maxDiscountAmount: Joi.number().positive().optional().allow(null).messages({
    'number.positive': 'Maximum discount amount must be a positive number.',
  }),
  usageLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.integer': 'Usage limit must be an integer.',
    'number.min': 'Usage limit must be at least 1.',
  }),
  perUserLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.integer': 'Per-user limit must be an integer.',
    'number.min': 'Per-user limit must be at least 1.',
  }),
  isActive: Joi.boolean().optional().default(true),
  startsAt: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Start date must be a valid ISO 8601 date.',
  }),
  expiresAt: Joi.date().iso().greater(Joi.ref('startsAt')).optional().allow(null).messages({
    'date.format': 'Expiry date must be a valid ISO 8601 date.',
    'date.greater': 'Expiry date must be after the start date.',
  }),
});

/**
 * Schema for updating an existing promo code (admin).
 * All fields are optional for partial updates.
 */
const validateUpdatePromo = Joi.object({
  code: Joi.string().trim().min(1).max(50).optional().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code must not be empty.',
    'string.min': 'Promo code must be at least 1 character.',
    'string.max': 'Promo code must not exceed 50 characters.',
  }),
  description: Joi.string().max(500).optional().allow(null, '').messages({
    'string.max': 'Description must not exceed 500 characters.',
  }),
  discountType: Joi.string()
    .valid(...DISCOUNT_TYPES)
    .optional()
    .messages({
      'any.only': `Discount type must be one of: ${DISCOUNT_TYPES.join(', ')}.`,
    }),
  discountValue: Joi.number().positive().optional().messages({
    'number.base': 'Discount value must be a number.',
    'number.positive': 'Discount value must be a positive number.',
  }),
  minimumOrderAmount: Joi.number().min(0).optional().allow(null).messages({
    'number.min': 'Minimum order amount must be 0 or greater.',
  }),
  maxDiscountAmount: Joi.number().positive().optional().allow(null).messages({
    'number.positive': 'Maximum discount amount must be a positive number.',
  }),
  usageLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.integer': 'Usage limit must be an integer.',
    'number.min': 'Usage limit must be at least 1.',
  }),
  perUserLimit: Joi.number().integer().min(1).optional().allow(null).messages({
    'number.integer': 'Per-user limit must be an integer.',
    'number.min': 'Per-user limit must be at least 1.',
  }),
  isActive: Joi.boolean().optional(),
  startsAt: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Start date must be a valid ISO 8601 date.',
  }),
  expiresAt: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Expiry date must be a valid ISO 8601 date.',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update.',
  });

module.exports = {
  validatePromoCode,
  validateCreatePromo,
  validateUpdatePromo,
};
