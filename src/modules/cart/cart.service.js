const db = require('../../db');
const { AppError } = require('../../utils/errors');

/**
 * Create a new cart.
 * If userId is provided, associates the cart with the authenticated user.
 * If guestId is provided, creates a guest cart.
 */
async function createCart({ userId, guestId }) {
  const [cart] = await db('carts')
    .insert({
      user_id: userId || null,
      guest_id: guestId || null,
      status: 'active',
      promo_code: null,
      discount_amount: 0,
    })
    .returning('*');
  return cart;
}

/**
 * Get a cart by ID, including its items.
 * Validates ownership for authenticated users.
 */
async function getCart(cartId, userId) {
  const cart = await db('carts').where({ id: cartId }).first();
  if (!cart) {
    throw new AppError('Cart not found.', 404);
  }
  _assertCartAccess(cart, userId);
  const items = await db('cart_items')
    .where({ cart_id: cartId })
    .select('*');
  return { ...cart, items };
}

/**
 * Add an item to the cart.
 * Validates stock availability before adding.
 * If the item (productId + variantId) already exists, increments quantity.
 */
async function addItem(cartId, { productId, variantId, quantity }, userId) {
  const cart = await _getActiveCart(cartId);
  _assertCartAccess(cart, userId);

  await _validateStock(productId, variantId, quantity);

  const existing = await db('cart_items')
    .where({ cart_id: cartId, product_id: productId, variant_id: variantId || null })
    .first();

  let item;
  if (existing) {
    const newQuantity = existing.quantity + quantity;
    await _validateStock(productId, variantId, newQuantity);
    [item] = await db('cart_items')
      .where({ id: existing.id })
      .update({ quantity: newQuantity, updated_at: db.fn.now() })
      .returning('*');
  } else {
    const unitPrice = await _getProductPrice(productId, variantId);
    [item] = await db('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        unit_price: unitPrice,
      })
      .returning('*');
  }

  await _updateCartTotals(cartId);
  return item;
}

/**
 * Update the quantity of a specific cart item.
 * Validates stock availability for the new quantity.
 * If quantity is set to 0, removes the item.
 */
async function updateItem(cartId, itemId, { quantity }, userId) {
  const cart = await _getActiveCart(cartId);
  _assertCartAccess(cart, userId);

  const item = await db('cart_items').where({ id: itemId, cart_id: cartId }).first();
  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  if (quantity === 0) {
    await db('cart_items').where({ id: itemId }).delete();
    await _updateCartTotals(cartId);
    return null;
  }

  await _validateStock(item.product_id, item.variant_id, quantity);

  const [updated] = await db('cart_items')
    .where({ id: itemId })
    .update({ quantity, updated_at: db.fn.now() })
    .returning('*');

  await _updateCartTotals(cartId);
  return updated;
}

/**
 * Remove a specific item from the cart.
 */
async function removeItem(cartId, itemId, userId) {
  const cart = await _getActiveCart(cartId);
  _assertCartAccess(cart, userId);

  const item = await db('cart_items').where({ id: itemId, cart_id: cartId }).first();
  if (!item) {
    throw new AppError('Cart item not found.', 404);
  }

  await db('cart_items').where({ id: itemId }).delete();
  await _updateCartTotals(cartId);
}

/**
 * Apply a promo code to the cart.
 * Validates that the promo code exists and is active.
 */
async function applyPromo(cartId, promoCode, userId) {
  const cart = await _getActiveCart(cartId);
  _assertCartAccess(cart, userId);

  if (!promoCode || typeof promoCode !== 'string' || promoCode.trim() === '') {
    throw new AppError('Promo code is required.', 400);
  }

  const promo = await db('promo_codes')
    .where({ code: promoCode.trim().toUpperCase(), is_active: true })
    .first();

  if (!promo) {
    throw new AppError('Invalid or expired promo code.', 422);
  }

  const now = new Date();
  if (promo.expires_at && new Date(promo.expires_at) < now) {
    throw new AppError('Invalid or expired promo code.', 422);
  }

  if (promo.starts_at && new Date(promo.starts_at) > now) {
    throw new AppError('Invalid or expired promo code.', 422);
  }

  const subtotal = await _getCartSubtotal(cartId);
  let discountAmount = 0;

  if (promo.discount_type === 'percentage') {
    discountAmount = parseFloat(((subtotal * promo.discount_value) / 100).toFixed(2));
  } else if (promo.discount_type === 'fixed') {
    discountAmount = Math.min(promo.discount_value, subtotal);
  }

  const [updatedCart] = await db('carts')
    .where({ id: cartId })
    .update({
      promo_code: promo.code,
      discount_amount: discountAmount,
      updated_at: db.fn.now(),
    })
    .returning('*');

  const items = await db('cart_items').where({ cart_id: cartId }).select('*');
  return { ...updatedCart, items };
}

/**
 * Remove the applied promo code from the cart.
 */
async function removePromo(cartId, userId) {
  const cart = await _getActiveCart(cartId);
  _assertCartAccess(cart, userId);

  if (!cart.promo_code) {
    throw new AppError('No promo code applied to this cart.', 400);
  }

  const [updatedCart] = await db('carts')
    .where({ id: cartId })
    .update({
      promo_code: null,
      discount_amount: 0,
      updated_at: db.fn.now(),
    })
    .returning('*');

  const items = await db('cart_items').where({ cart_id: cartId }).select('*');
  return { ...updatedCart, items };
}

/**
 * Merge a guest cart into an authenticated user's cart.
 * Called after login/registration.
 */
async function mergeGuestCart(guestCartId, userId) {
  const guestCart = await db('carts').where({ id: guestCartId, status: 'active' }).first();
  if (!guestCart) {
    throw new AppError('Guest cart not found.', 404);
  }

  let userCart = await db('carts')
    .where({ user_id: userId, status: 'active' })
    .orderBy('created_at', 'desc')
    .first();

  if (!userCart) {
    const [newCart] = await db('carts')
      .insert({
        user_id: userId,
        guest_id: null,
        status: 'active',
        promo_code: guestCart.promo_code || null,
        discount_amount: guestCart.discount_amount || 0,
      })
      .returning('*');
    userCart = newCart;
  }

  const guestItems = await db('cart_items').where({ cart_id: guestCartId });

  for (const guestItem of guestItems) {
    const existing = await db('cart_items')
      .where({
        cart_id: userCart.id,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id || null,
      })
      .first();

    if (existing) {
      const newQuantity = existing.quantity + guestItem.quantity;
      const stockOk = await _isStockAvailable(guestItem.product_id, guestItem.variant_id, newQuantity);
      const finalQuantity = stockOk ? newQuantity : existing.quantity;
      await db('cart_items')
        .where({ id: existing.id })
        .update({ quantity: finalQuantity, updated_at: db.fn.now() });
    } else {
      await db('cart_items').insert({
        cart_id: userCart.id,
        product_id: guestItem.product_id,
        variant_id: guestItem.variant_id || null,
        quantity: guestItem.quantity,
        unit_price: guestItem.unit_price,
      });
    }
  }

  await db('carts').where({ id: guestCartId }).update({ status: 'merged', updated_at: db.fn.now() });
  await _updateCartTotals(userCart.id);

  return getCart(userCart.id, userId);
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

async function _getActiveCart(cartId) {
  const cart = await db('carts').where({ id: cartId }).first();
  if (!cart) {
    throw new AppError('Cart not found.', 404);
  }
  if (cart.status !== 'active') {
    throw new AppError('Cart is no longer active.', 400);
  }
  return cart;
}

function _assertCartAccess(cart, userId) {
  if (userId && cart.user_id && cart.user_id !== userId) {
    throw new AppError('You do not have access to this cart.', 403);
  }
}

async function _validateStock(productId, variantId, quantity) {
  const available = await _isStockAvailable(productId, variantId, quantity);
  if (!available) {
    throw new AppError('Insufficient stock for the requested quantity.', 422);
  }
}

async function _isStockAvailable(productId, variantId, quantity) {
  let stockRecord;
  if (variantId) {
    stockRecord = await db('product_variants')
      .where({ id: variantId, product_id: productId })
      .first();
  } else {
    stockRecord = await db('products').where({ id: productId }).first();
  }
  if (!stockRecord) {
    throw new AppError('Product not found.', 404);
  }
  return stockRecord.stock_quantity >= quantity;
}

async function _getProductPrice(productId, variantId) {
  if (variantId) {
    const variant = await db('product_variants')
      .where({ id: variantId, product_id: productId })
      .first();
    if (!variant) {
      throw new AppError('Product variant not found.', 404);
    }
    return variant.price;
  }
  const product = await db('products').where({ id: productId }).first();
  if (!product) {
    throw new AppError('Product not found.', 404);
  }
  return product.price;
}

async function _getCartSubtotal(cartId) {
  const items = await db('cart_items').where({ cart_id: cartId });
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

async function _updateCartTotals(cartId) {
  const subtotal = await _getCartSubtotal(cartId);
  const cart = await db('carts').where({ id: cartId }).first();
  let discountAmount = cart.discount_amount || 0;

  if (cart.promo_code) {
    const promo = await db('promo_codes')
      .where({ code: cart.promo_code, is_active: true })
      .first();
    if (promo) {
      if (promo.discount_type === 'percentage') {
        discountAmount = parseFloat(((subtotal * promo.discount_value) / 100).toFixed(2));
      } else if (promo.discount_type === 'fixed') {
        discountAmount = Math.min(promo.discount_value, subtotal);
      }
    } else {
      discountAmount = 0;
    }
  }

  await db('carts')
    .where({ id: cartId })
    .update({
      subtotal,
      discount_amount: discountAmount,
      total: Math.max(0, subtotal - discountAmount),
      updated_at: db.fn.now(),
    });
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
  mergeGuestCart,
};
