const db = require('../../db');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../../utils/AppError');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a checkout session row for either an authenticated user or a guest.
 * Throws a 404 AppError when the session cannot be found.
 */
async function resolveSession({ checkoutSessionId, userId, guestToken }) {
  let query;
  let params;

  if (userId) {
    query = 'SELECT * FROM checkout_sessions WHERE id = $1 AND user_id = $2 LIMIT 1';
    params = [checkoutSessionId, userId];
  } else {
    query = 'SELECT * FROM checkout_sessions WHERE id = $1 AND guest_token = $2 LIMIT 1';
    params = [checkoutSessionId, guestToken];
  }

  const { rows } = await db.query(query, params);
  if (!rows.length) {
    throw new AppError('Checkout session not found.', 404);
  }
  return rows[0];
}

/**
 * Validates a shipping / billing address object.
 * Returns the address unchanged on success, throws AppError on failure.
 */
function validateAddress(address, label = 'Address') {
  const required = ['fullName', 'addressLine1', 'city', 'postalCode', 'country'];
  for (const field of required) {
    if (!address[field] || !String(address[field]).trim()) {
      throw new AppError(`${label}: ${field} is required.`, 422);
    }
  }
  return address;
}

/**
 * Confirms that every line item in the cart still has sufficient stock.
 * Locks the rows for the duration of the calling transaction.
 */
async function confirmStockReservation(cartItems, client) {
  for (const item of cartItems) {
    const { rows } = await client.query(
      'SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE',
      [item.product_id]
    );
    if (!rows.length || rows[0].stock_quantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for product ${item.product_id}.`,
        409
      );
    }
  }
}

/**
 * Applies a promo code and returns the discount amount (0 when no code given).
 */
async function finalisePromo(promoCode, subtotal) {
  if (!promoCode) return { discountAmount: 0, promoId: null };

  const { rows } = await db.query(
    `SELECT * FROM promo_codes
     WHERE code = $1
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (usage_limit IS NULL OR times_used < usage_limit)
     LIMIT 1`,
    [promoCode.trim().toUpperCase()]
  );

  if (!rows.length) {
    throw new AppError('Invalid or expired promo code.', 422);
  }

  const promo = rows[0];
  let discountAmount = 0;

  if (promo.discount_type === 'percentage') {
    discountAmount = (subtotal * promo.discount_value) / 100;
  } else if (promo.discount_type === 'fixed') {
    discountAmount = Math.min(promo.discount_value, subtotal);
  }

  return { discountAmount, promoId: promo.id };
}

/**
 * Delegates to the payment provider to create a payment intent.
 * In production this calls Stripe / PayPal / etc.
 */
async function createPaymentIntent({ orderId, amount, currency, paymentMethod }) {
  // Placeholder: replace with real payment-provider SDK call.
  return {
    paymentIntentId: `pi_${uuidv4().replace(/-/g, '')}`,
    clientSecret: `cs_${uuidv4().replace(/-/g, '')}`,
    status: 'requires_payment_method',
    amount,
    currency,
  };
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

/**
 * Step 1 — Start a checkout session.
 * Loads the cart, validates it is non-empty, creates a checkout_sessions row.
 */
async function startCheckout({ userId, cartId, guestToken }) {
  // Resolve the cart
  let cartQuery;
  let cartParams;

  if (userId) {
    cartQuery = 'SELECT * FROM carts WHERE id = $1 AND user_id = $2 LIMIT 1';
    cartParams = [cartId, userId];
  } else {
    cartQuery = 'SELECT * FROM carts WHERE id = $1 AND guest_token = $2 LIMIT 1';
    cartParams = [cartId, guestToken];
  }

  const { rows: cartRows } = await db.query(cartQuery, cartParams);
  if (!cartRows.length) {
    throw new AppError('Cart not found.', 404);
  }
  const cart = cartRows[0];

  // Load cart items
  const { rows: items } = await db.query(
    `SELECT ci.*, p.name, p.price, p.stock_quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [cart.id]
  );

  if (!items.length) {
    throw new AppError('Cannot checkout an empty cart.', 422);
  }

  // Upsert a checkout session
  const sessionId = uuidv4();
  const { rows: sessionRows } = await db.query(
    `INSERT INTO checkout_sessions (id, cart_id, user_id, guest_token, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
     ON CONFLICT (cart_id) DO UPDATE
       SET status = 'pending', updated_at = NOW()
     RETURNING *`,
    [sessionId, cart.id, userId || null, guestToken || null]
  );

  return {
    checkoutSessionId: sessionRows[0].id,
    cartId: cart.id,
    itemCount: items.length,
    status: sessionRows[0].status,
  };
}

/**
 * Step 2 — Save shipping (and optional billing) address.
 */
async function submitAddress({ userId, checkoutSessionId, shippingAddress, billingAddress, billingSameAsShipping }) {
  const session = await resolveSession({ checkoutSessionId, userId, guestToken: null });

  validateAddress(shippingAddress, 'Shipping address');

  const resolvedBilling = billingSameAsShipping
    ? shippingAddress
    : validateAddress(billingAddress || {}, 'Billing address');

  await db.query(
    `UPDATE checkout_sessions
     SET shipping_address = $1,
         billing_address  = $2,
         status           = 'address_saved',
         updated_at       = NOW()
     WHERE id = $3`,
    [JSON.stringify(shippingAddress), JSON.stringify(resolvedBilling), session.id]
  );

  return {
    checkoutSessionId: session.id,
    shippingAddress,
    billingAddress: resolvedBilling,
    status: 'address_saved',
  };
}

/**
 * Step 3 — Review: return a full order summary without committing anything.
 */
async function reviewCheckout({ userId, checkoutSessionId, guestToken }) {
  const session = await resolveSession({ checkoutSessionId, userId, guestToken });

  const { rows: items } = await db.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1`,
    [session.cart_id]
  );

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxRate = 0.1; // 10 % — adjust per business rules
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const shippingAmount = subtotal >= 50 ? 0 : 5.99;
  const total = parseFloat((subtotal + taxAmount + shippingAmount).toFixed(2));

  return {
    checkoutSessionId: session.id,
    shippingAddress: session.shipping_address ? JSON.parse(session.shipping_address) : null,
    billingAddress: session.billing_address ? JSON.parse(session.billing_address) : null,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      imageUrl: i.image_url,
      quantity: i.quantity,
      unitPrice: parseFloat(i.price),
      lineTotal: parseFloat((i.price * i.quantity).toFixed(2)),
    })),
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount,
    shippingAmount,
    total,
    status: session.status,
  };
}

/**
 * Step 4 — Place order.
 * Confirms stock, finalises promo, creates the orders row, deducts stock,
 * marks cart as checked-out, delegates payment intent creation.
 */
async function placeOrder({ userId, checkoutSessionId, guestToken, paymentMethod, promoCode }) {
  const session = await resolveSession({ checkoutSessionId, userId, guestToken });

  if (!session.shipping_address) {
    throw new AppError('Shipping address is required before placing an order.', 422);
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Load cart items with row-level locks
    const { rows: items } = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [session.cart_id]
    );

    if (!items.length) {
      throw new AppError('Cannot place an order for an empty cart.', 422);
    }

    // Confirm stock
    await confirmStockReservation(items, client);

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const { discountAmount, promoId } = await finalisePromo(promoCode, subtotal);
    const taxRate = 0.1;
    const taxAmount = parseFloat(((subtotal - discountAmount) * taxRate).toFixed(2));
    const shippingAmount = subtotal >= 50 ? 0 : 5.99;
    const total = parseFloat(
      (subtotal - discountAmount + taxAmount + shippingAmount).toFixed(2)
    );

    // Create the order
    const orderId = uuidv4();
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
         id, user_id, guest_token, cart_id, checkout_session_id,
         shipping_address, billing_address,
         subtotal, discount_amount, tax_amount, shipping_amount, total,
         promo_code_id, payment_method, payment_status, status,
         created_at, updated_at
       ) VALUES (
         $1,  $2,  $3,  $4,  $5,
         $6,  $7,
         $8,  $9,  $10, $11, $12,
         $13, $14, 'pending', 'processing',
         NOW(), NOW()
       ) RETURNING *`,
      [
        orderId,
        userId || null,
        guestToken || null,
        session.cart_id,
        session.id,
        session.shipping_address,
        session.billing_address,
        parseFloat(subtotal.toFixed(2)),
        parseFloat(discountAmount.toFixed(2)),
        taxAmount,
        shippingAmount,
        total,
        promoId || null,
        paymentMethod,
      ]
    );

    const order = orderRows[0];

    // Insert order line items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(),
          order.id,
          item.product_id,
          item.quantity,
          parseFloat(item.price),
          parseFloat((item.price * item.quantity).toFixed(2)),
        ]
      );
    }

    // Deduct stock
    for (const item of items) {
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Increment promo usage
    if (promoId) {
      await client.query(
        'UPDATE promo_codes SET times_used = times_used + 1 WHERE id = $1',
        [promoId]
      );
    }

    // Mark checkout session and cart as complete
    await client.query(
      `UPDATE checkout_sessions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [session.id]
    );
    await client.query(
      `UPDATE carts SET status = 'checked_out', updated_at = NOW() WHERE id = $1`,
      [session.cart_id]
    );

    await client.query('COMMIT');

    // Delegate payment intent creation (outside transaction — side-effect only)
    const paymentIntent = await createPaymentIntent({
      orderId: order.id,
      amount: total,
      currency: 'usd',
      paymentMethod,
    });

    // Persist payment intent reference
    await db.query(
      `UPDATE orders SET payment_intent_id = $1, updated_at = NOW() WHERE id = $2`,
      [paymentIntent.paymentIntentId, order.id]
    );

    return {
      orderId: order.id,
      status: order.status,
      total,
      paymentIntent,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  startCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
