const checkoutService = require('./checkout.service');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * POST /checkout/start
 * Initiates a new checkout session for an authenticated or guest user.
 */
const startCheckout = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { cartId, guestToken } = req.body;

  const session = await checkoutService.startCheckout({ userId, cartId, guestToken });

  return res.status(200).json({
    success: true,
    data: session,
  });
});

/**
 * POST /checkout/address
 * Saves or updates the shipping (and optionally billing) address for the session.
 */
const submitAddress = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId, shippingAddress, billingAddress, billingSameAsShipping } = req.body;

  const result = await checkoutService.submitAddress({
    userId,
    checkoutSessionId,
    shippingAddress,
    billingAddress,
    billingSameAsShipping,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /checkout/review
 * Returns a full order summary for the current checkout session.
 */
const reviewCheckout = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId, guestToken } = req.query;

  const summary = await checkoutService.reviewCheckout({ userId, checkoutSessionId, guestToken });

  return res.status(200).json({
    success: true,
    data: summary,
  });
});

/**
 * POST /checkout/place-order
 * Finalises the checkout: confirms stock, applies promo, creates order, delegates payment.
 */
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const { checkoutSessionId, guestToken, paymentMethod, promoCode } = req.body;

  const order = await checkoutService.placeOrder({
    userId,
    checkoutSessionId,
    guestToken,
    paymentMethod,
    promoCode,
  });

  return res.status(201).json({
    success: true,
    data: order,
  });
});

module.exports = {
  startCheckout,
  submitAddress,
  reviewCheckout,
  placeOrder,
};
