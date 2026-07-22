const promotionsService = require('./promotions.service');

/**
 * POST /validate
 * Validate a promo code against a given order context.
 */
async function validatePromoCode(req, res, next) {
  try {
    const { code, orderTotal, userId, items } = req.body;
    const result = await promotionsService.validateAndCalculateDiscount({ code, orderTotal, userId, items });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/promo-codes
 * List all promo codes with optional filters.
 */
async function listPromoCodes(req, res, next) {
  try {
    const filters = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      status: req.query.status,
      search: req.query.search,
    };
    const result = await promotionsService.listPromoCodes(filters);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/promo-codes
 * Create a new promo code.
 */
async function createPromoCode(req, res, next) {
  try {
    const promoData = req.body;
    const created = await promotionsService.createPromoCode(promoData);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/promo-codes/:id
 * Get a single promo code by ID.
 */
async function getPromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const promo = await promotionsService.getPromoCodeById(id);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: promo });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/promo-codes/:id
 * Update an existing promo code.
 */
async function updatePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await promotionsService.updatePromoCode(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/promo-codes/:id
 * Delete a promo code.
 */
async function deletePromoCode(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await promotionsService.deletePromoCode(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    return res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validatePromoCode,
  listPromoCodes,
  createPromoCode,
  getPromoCode,
  updatePromoCode,
  deletePromoCode,
};
