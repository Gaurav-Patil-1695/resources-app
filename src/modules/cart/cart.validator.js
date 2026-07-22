const Joi = require('joi');
const { validationMiddleware } = require('../../utils/validation');

/**
 * Schema for creating a cart.
 * Accepts an optional guestId for guest cart creation.
 */
const createCartSchema = Joi.object({
  guestId: Joi.string().uuid().optional().allow(null, ''),
});

/**
 * Schema for adding an item to the cart.
 */
const addItemSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.base': 'Product ID must be a string.',
    'string.guid': 'Product ID must be a valid UUID.',
    'any.required': 'Product ID is required.',
  }),
  variantId: Joi.string().uuid().optional().allow(null, '').messages({
    'string.base': 'Variant ID must be a string.',
    'string.guid': 'Variant ID must be a valid UUID.',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
  }),
});

/**
 * Schema for updating an item in the cart.
 */
const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be 0 or greater.',
    'any.required': 'Quantity is required.',
  }),
});

/**
 * Schema for applying a promo code.
 */
const applyPromoSchema = Joi.object({
  promoCode: Joi.string().trim().min(1).max(50).required().messages({
    'string.base': 'Promo code must be a string.',
    'string.empty': 'Promo code is required.',
    'string.min': 'Promo code is required.',
    'string.max': 'Promo code must not exceed 50 characters.',
    'any.required': 'Promo code is required.',
  }),
});

const validateCreateCart = validationMiddleware(createCartSchema);
const validateAddItem = validationMiddleware(addItemSchema);
const validateUpdateItem = validationMiddleware(updateItemSchema);
const validateApplyPromo = validationMiddleware(applyPromoSchema);

module.exports = {
  validateCreateCart,
  validateAddItem,
  validateUpdateItem,
  validateApplyPromo,
};
