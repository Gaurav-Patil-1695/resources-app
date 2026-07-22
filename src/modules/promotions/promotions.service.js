const db = require('../../db');

const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  FREE_SHIPPING: 'free_shipping',
};

/**
 * Validate a promo code and calculate the applicable discount.
 * @param {object} params
 * @param {string} params.code
 * @param {number} params.orderTotal
 * @param {string} params.userId
 * @param {Array}  params.items
 * @returns {object} discount details
 */
async function validateAndCalculateDiscount({ code, orderTotal, userId, items = [] }) {
  const promo = await db('promo_codes')
    .where({ code: code.trim().toUpperCase(), is_active: true })
    .first();

  if (!promo) {
    const err = new Error('Invalid or inactive promo code.');
    err.statusCode = 422;
    throw err;
  }

  const now = new Date();

  if (promo.starts_at && new Date(promo.starts_at) > now) {
    const err = new Error('Promo code is not yet active.');
    err.statusCode = 422;
    throw err;
  }

  if (promo.expires_at && new Date(promo.expires_at) < now) {
    const err = new Error('Promo code has expired.');
    err.statusCode = 422;
    throw err;
  }

  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) {
    const err = new Error('Promo code usage limit has been reached.');
    err.statusCode = 422;
    throw err;
  }

  if (promo.minimum_order_amount !== null && orderTotal < promo.minimum_order_amount) {
    const err = new Error(
      `Order total does not meet the minimum required amount of ${promo.minimum_order_amount}.`
    );
    err.statusCode = 422;
    throw err;
  }

  if (promo.per_user_limit !== null && userId) {
    const userUsageCount = await db('promo_code_usages')
      .where({ promo_code_id: promo.id, user_id: userId })
      .count('id as count')
      .first();
    if (parseInt(userUsageCount.count, 10) >= promo.per_user_limit) {
      const err = new Error('You have already used this promo code the maximum number of times.');
      err.statusCode = 422;
      throw err;
    }
  }

  const discountAmount = calculateDiscount(promo, orderTotal);
  const finalTotal = Math.max(0, orderTotal - discountAmount);

  return {
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    originalTotal: parseFloat(orderTotal.toFixed(2)),
    finalTotal: parseFloat(finalTotal.toFixed(2)),
    freeShipping: promo.discount_type === DISCOUNT_TYPES.FREE_SHIPPING,
  };
}

/**
 * Calculate the monetary discount based on promo type.
 * @param {object} promo
 * @param {number} orderTotal
 * @returns {number}
 */
function calculateDiscount(promo, orderTotal) {
  switch (promo.discount_type) {
    case DISCOUNT_TYPES.PERCENTAGE: {
      const pct = Math.min(promo.discount_value, 100);
      let amount = (orderTotal * pct) / 100;
      if (promo.max_discount_amount !== null) {
        amount = Math.min(amount, promo.max_discount_amount);
      }
      return amount;
    }
    case DISCOUNT_TYPES.FIXED:
      return Math.min(promo.discount_value, orderTotal);
    case DISCOUNT_TYPES.FREE_SHIPPING:
      return 0;
    default:
      return 0;
  }
}

/**
 * Record promo code usage after a successful order.
 * @param {string} promoCodeId
 * @param {string} userId
 * @param {string} orderId
 */
async function recordUsage(promoCodeId, userId, orderId) {
  await db.transaction(async (trx) => {
    await trx('promo_code_usages').insert({
      promo_code_id: promoCodeId,
      user_id: userId,
      order_id: orderId,
      used_at: new Date(),
    });
    await trx('promo_codes').where({ id: promoCodeId }).increment('usage_count', 1);
  });
}

/**
 * List promo codes with pagination and optional filters.
 * @param {object} filters
 * @returns {object} paginated result
 */
async function listPromoCodes({ page = 1, limit = 20, status, search } = {}) {
  const offset = (page - 1) * limit;
  let query = db('promo_codes').orderBy('created_at', 'desc');

  if (status === 'active') {
    query = query.where('is_active', true);
  } else if (status === 'inactive') {
    query = query.where('is_active', false);
  }

  if (search) {
    query = query.where('code', 'like', `%${search.toUpperCase()}%`);
  }

  const countQuery = query.clone().count('id as count').first();
  const [{ count }, rows] = await Promise.all([
    countQuery,
    query.clone().limit(limit).offset(offset).select('*'),
  ]);

  return {
    total: parseInt(count, 10),
    page,
    limit,
    data: rows,
  };
}

/**
 * Create a new promo code.
 * @param {object} promoData
 * @returns {object} created promo code
 */
async function createPromoCode(promoData) {
  const code = promoData.code.trim().toUpperCase();
  const existing = await db('promo_codes').where({ code }).first();
  if (existing) {
    const err = new Error('A promo code with this code already exists.');
    err.statusCode = 409;
    throw err;
  }

  const [id] = await db('promo_codes').insert({
    code,
    description: promoData.description || null,
    discount_type: promoData.discountType,
    discount_value: promoData.discountValue,
    minimum_order_amount: promoData.minimumOrderAmount || null,
    max_discount_amount: promoData.maxDiscountAmount || null,
    usage_limit: promoData.usageLimit || null,
    per_user_limit: promoData.perUserLimit || null,
    usage_count: 0,
    is_active: promoData.isActive !== undefined ? promoData.isActive : true,
    starts_at: promoData.startsAt || null,
    expires_at: promoData.expiresAt || null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return db('promo_codes').where({ id }).first();
}

/**
 * Get a promo code by ID.
 * @param {string|number} id
 * @returns {object|null}
 */
async function getPromoCodeById(id) {
  return db('promo_codes').where({ id }).first() || null;
}

/**
 * Update a promo code by ID.
 * @param {string|number} id
 * @param {object} updateData
 * @returns {object|null}
 */
async function updatePromoCode(id, updateData) {
  const promo = await db('promo_codes').where({ id }).first();
  if (!promo) return null;

  const updatePayload = { updated_at: new Date() };

  if (updateData.code !== undefined) updatePayload.code = updateData.code.trim().toUpperCase();
  if (updateData.description !== undefined) updatePayload.description = updateData.description;
  if (updateData.discountType !== undefined) updatePayload.discount_type = updateData.discountType;
  if (updateData.discountValue !== undefined) updatePayload.discount_value = updateData.discountValue;
  if (updateData.minimumOrderAmount !== undefined) updatePayload.minimum_order_amount = updateData.minimumOrderAmount;
  if (updateData.maxDiscountAmount !== undefined) updatePayload.max_discount_amount = updateData.maxDiscountAmount;
  if (updateData.usageLimit !== undefined) updatePayload.usage_limit = updateData.usageLimit;
  if (updateData.perUserLimit !== undefined) updatePayload.per_user_limit = updateData.perUserLimit;
  if (updateData.isActive !== undefined) updatePayload.is_active = updateData.isActive;
  if (updateData.startsAt !== undefined) updatePayload.starts_at = updateData.startsAt;
  if (updateData.expiresAt !== undefined) updatePayload.expires_at = updateData.expiresAt;

  await db('promo_codes').where({ id }).update(updatePayload);
  return db('promo_codes').where({ id }).first();
}

/**
 * Delete a promo code by ID.
 * @param {string|number} id
 * @returns {boolean}
 */
async function deletePromoCode(id) {
  const promo = await db('promo_codes').where({ id }).first();
  if (!promo) return false;
  await db('promo_codes').where({ id }).delete();
  return true;
}

module.exports = {
  validateAndCalculateDiscount,
  recordUsage,
  listPromoCodes,
  createPromoCode,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
};
