const Joi = require('joi');

// ─── Middleware factories ─────────────────────────────────────────────────────

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(422).json({
        message: 'Validation failed.',
        errors: error.details.map((d) => ({ field: d.context && d.context.key, message: d.message })),
      });
    }
    req.body = value;
    return next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Invalid path parameter.',
        errors: error.details.map((d) => ({ field: d.context && d.context.key, message: d.message })),
      });
    }
    req.params = value;
    return next();
  };
}

// ─── Param schemas ────────────────────────────────────────────────────────────

const productIdParamSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'productId must be a valid UUID.',
    'any.required': 'productId is required.',
  }),
});

const skuIdParamSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'productId must be a valid UUID.',
    'any.required': 'productId is required.',
  }),
  skuId: Joi.string().uuid().required().messages({
    'string.guid': 'skuId must be a valid UUID.',
    'any.required': 'skuId is required.',
  }),
});

const categoryIdParamSchema = Joi.object({
  categoryId: Joi.string().uuid().required().messages({
    'string.guid': 'categoryId must be a valid UUID.',
    'any.required': 'categoryId is required.',
  }),
});

const brandIdParamSchema = Joi.object({
  brandId: Joi.string().uuid().required().messages({
    'string.guid': 'brandId must be a valid UUID.',
    'any.required': 'brandId is required.',
  }),
});

const imageIdParamSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'productId must be a valid UUID.',
    'any.required': 'productId is required.',
  }),
  imageId: Joi.string().uuid().required().messages({
    'string.guid': 'imageId must be a valid UUID.',
    'any.required': 'imageId is required.',
  }),
});

// ─── Product schemas ──────────────────────────────────────────────────────────

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Product name is required.',
    'string.min': 'Product name must be at least 1 character.',
    'string.max': 'Product name must not exceed 255 characters.',
    'any.required': 'Product name is required.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.empty': 'Product slug is required.',
    'string.pattern.base': 'Product slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Product slug must not exceed 255 characters.',
    'any.required': 'Product slug is required.',
  }),
  description: Joi.string().trim().max(5000).allow('', null).optional().messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Base price must be a number.',
    'number.positive': 'Base price must be greater than 0.',
    'any.required': 'Base price is required.',
  }),
  category_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').default('active').messages({
    'any.only': 'Status must be one of active, inactive, or draft.',
  }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Product name must not be empty.',
    'string.min': 'Product name must be at least 1 character.',
    'string.max': 'Product name must not exceed 255 characters.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional().messages({
    'string.empty': 'Product slug must not be empty.',
    'string.pattern.base': 'Product slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Product slug must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(5000).allow('', null).optional().messages({
    'string.max': 'Product description must not exceed 5000 characters.',
  }),
  base_price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Base price must be a number.',
    'number.positive': 'Base price must be greater than 0.',
  }),
  category_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'category_id must be a valid UUID.',
  }),
  brand_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'brand_id must be a valid UUID.',
  }),
  status: Joi.string().valid('active', 'inactive', 'draft').optional().messages({
    'any.only': 'Status must be one of active, inactive, or draft.',
  }),
});

// ─── SKU schemas ──────────────────────────────────────────────────────────────

const createSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'SKU code is required.',
    'string.min': 'SKU code must be at least 1 character.',
    'string.max': 'SKU code must not exceed 100 characters.',
    'any.required': 'SKU code is required.',
  }),
  attributes: Joi.object().default({}).optional().messages({
    'object.base': 'Attributes must be a valid object.',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number.',
    'number.positive': 'Price must be greater than 0.',
    'any.required': 'Price is required.',
  }),
  stock_quantity: Joi.number().integer().min(0).default(0).optional().messages({
    'number.base': 'Stock quantity must be a number.',
    'number.integer': 'Stock quantity must be an integer.',
    'number.min': 'Stock quantity must be at least 0.',
  }),
  status: Joi.string().valid('active', 'inactive').default('active').messages({
    'any.only': 'SKU status must be one of active or inactive.',
  }),
});

const updateSkuSchema = Joi.object({
  sku_code: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'SKU code must not be empty.',
    'string.min': 'SKU code must be at least 1 character.',
    'string.max': 'SKU code must not exceed 100 characters.',
  }),
  attributes: Joi.object().optional().messages({
    'object.base': 'Attributes must be a valid object.',
  }),
  price: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Price must be a number.',
    'number.positive': 'Price must be greater than 0.',
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock quantity must be a number.',
    'number.integer': 'Stock quantity must be an integer.',
    'number.min': 'Stock quantity must be at least 0.',
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'SKU status must be one of active or inactive.',
  }),
});

// ─── Category schemas ─────────────────────────────────────────────────────────

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Category name is required.',
    'string.min': 'Category name must be at least 1 character.',
    'string.max': 'Category name must not exceed 255 characters.',
    'any.required': 'Category name is required.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.empty': 'Category slug is required.',
    'string.pattern.base': 'Category slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Category slug must not exceed 255 characters.',
    'any.required': 'Category slug is required.',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  image_url: Joi.string().uri().max(2048).allow('', null).optional().messages({
    'string.uri': 'Category image URL must be a valid URL.',
    'string.max': 'Category image URL must not exceed 2048 characters.',
  }),
  status: Joi.string().valid('active', 'inactive').default('active').messages({
    'any.only': 'Category status must be one of active or inactive.',
  }),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Category name must not be empty.',
    'string.min': 'Category name must be at least 1 character.',
    'string.max': 'Category name must not exceed 255 characters.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional().messages({
    'string.empty': 'Category slug must not be empty.',
    'string.pattern.base': 'Category slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Category slug must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Category description must not exceed 2000 characters.',
  }),
  parent_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'parent_id must be a valid UUID.',
  }),
  image_url: Joi.string().uri().max(2048).allow('', null).optional().messages({
    'string.uri': 'Category image URL must be a valid URL.',
    'string.max': 'Category image URL must not exceed 2048 characters.',
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Category status must be one of active or inactive.',
  }),
});

// ─── Brand schemas ────────────────────────────────────────────────────────────

const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Brand name is required.',
    'string.min': 'Brand name must be at least 1 character.',
    'string.max': 'Brand name must not exceed 255 characters.',
    'any.required': 'Brand name is required.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.empty': 'Brand slug is required.',
    'string.pattern.base': 'Brand slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Brand slug must not exceed 255 characters.',
    'any.required': 'Brand slug is required.',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).allow('', null).optional().messages({
    'string.uri': 'Brand image URL must be a valid URL.',
    'string.max': 'Brand image URL must not exceed 2048 characters.',
  }),
  status: Joi.string().valid('active', 'inactive').default('active').messages({
    'any.only': 'Brand status must be one of active or inactive.',
  }),
});

const updateBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional().messages({
    'string.empty': 'Brand name must not be empty.',
    'string.min': 'Brand name must be at least 1 character.',
    'string.max': 'Brand name must not exceed 255 characters.',
  }),
  slug: Joi.string().trim().lowercase().min(1).max(255).pattern(/^[a-z0-9-]+$/).optional().messages({
    'string.empty': 'Brand slug must not be empty.',
    'string.pattern.base': 'Brand slug may only contain lowercase letters, numbers, and hyphens.',
    'string.max': 'Brand slug must not exceed 255 characters.',
  }),
  description: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Brand description must not exceed 2000 characters.',
  }),
  image_url: Joi.string().uri().max(2048).allow('', null).optional().messages({
    'string.uri': 'Brand image URL must be a valid URL.',
    'string.max': 'Brand image URL must not exceed 2048 characters.',
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Brand status must be one of active or inactive.',
  }),
});

module.exports = {
  validateBody,
  validateParams,
  productIdParamSchema,
  skuIdParamSchema,
  categoryIdParamSchema,
  brandIdParamSchema,
  imageIdParamSchema,
  createProductSchema,
  updateProductSchema,
  createSkuSchema,
  updateSkuSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
};
