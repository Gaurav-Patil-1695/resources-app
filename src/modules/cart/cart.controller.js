const cartService = require('./cart.service');

/**
 * POST /carts
 * Create a new cart (guest or authenticated)
 */
async function createCart(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const { guestId } = req.body;
    const cart = await cartService.createCart({ userId, guestId });
    return res.status(201).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /carts/:cartId
 * Retrieve a cart and its items
 */
async function getCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.getCart(cartId, userId);
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/items
 * Add an item to the cart
 */
async function addItem(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { productId, variantId, quantity } = req.body;
    const item = await cartService.addItem(cartId, { productId, variantId, quantity }, userId);
    return res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /carts/:cartId/items/:itemId
 * Update quantity of a cart item
 */
async function updateItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { quantity } = req.body;
    const item = await cartService.updateItem(cartId, itemId, { quantity }, userId);
    return res.status(200).json({ data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/items/:itemId
 * Remove an item from the cart
 */
async function removeItem(req, res, next) {
  try {
    const { cartId, itemId } = req.params;
    const userId = req.user ? req.user.id : null;
    await cartService.removeItem(cartId, itemId, userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /carts/:cartId/promo
 * Apply a promo code to the cart
 */
async function applyPromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const { promoCode } = req.body;
    const cart = await cartService.applyPromo(cartId, promoCode, userId);
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /carts/:cartId/promo
 * Remove the applied promo code from the cart
 */
async function removePromo(req, res, next) {
  try {
    const { cartId } = req.params;
    const userId = req.user ? req.user.id : null;
    const cart = await cartService.removePromo(cartId, userId);
    return res.status(200).json({ data: cart });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
