const { body, validationResult } = require('express-validator');
const { AppError } = require('../../utils/AppError');

// ---------------------------------------------------------------------------
// Shared helper: runs express-validator result and short-circuits on errors
// ---------------------------------------------------------------------------
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages[0], 422));
  }
  return next();
}

// ---------------------------------------------------------------------------
// POST /checkout/start
// ---------------------------------------------------------------------------
const validateCheckoutStart = [
  body('cartId')
    .notEmpty()
    .withMessage('Cart ID is required.')
    .isUUID()
    .withMessage('Cart ID must be a valid UUID.'),

  body('guestToken')
    .optional()
    .isString()
    .withMessage('Guest token must be a string.')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Guest token must be at least 8 characters.'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /checkout/address
// ---------------------------------------------------------------------------
const shippingAddressRules = [
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.')
    .isUUID()
    .withMessage('Checkout session ID must be a valid UUID.'),

  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required.')
    .isObject()
    .withMessage('Shipping address must be an object.'),

  body('shippingAddress.fullName')
    .notEmpty()
    .withMessage('Shipping address full name is required.')
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Shipping address full name must be between 1 and 120 characters.'),

  body('shippingAddress.addressLine1')
    .notEmpty()
    .withMessage('Shipping address line 1 is required.')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Shipping address line 1 must be between 1 and 200 characters.'),

  body('shippingAddress.addressLine2')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Shipping address line 2 must be at most 200 characters.'),

  body('shippingAddress.city')
    .notEmpty()
    .withMessage('Shipping address city is required.')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Shipping address city must be between 1 and 100 characters.'),

  body('shippingAddress.stateOrProvince')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Shipping address state/province must be at most 100 characters.'),

  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Shipping address postal code is required.')
    .isString()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Shipping address postal code must be between 2 and 20 characters.'),

  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Shipping address country is required.')
    .isString()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Shipping address country must be a 2-letter ISO country code.'),

  body('shippingAddress.phone')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Shipping address phone must be at most 30 characters.'),

  body('billingSameAsShipping')
    .optional()
    .isBoolean()
    .withMessage('billingSameAsShipping must be a boolean.'),
];

const billingAddressRules = [
  body('billingAddress.fullName')
    .if(body('billingSameAsShipping').not().equals('true'))
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Billing address full name must be between 1 and 120 characters.'),

  body('billingAddress.addressLine1')
    .if(body('billingSameAsShipping').not().equals('true'))
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Billing address line 1 must be between 1 and 200 characters.'),

  body('billingAddress.city')
    .if(body('billingSameAsShipping').not().equals('true'))
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Billing address city must be between 1 and 100 characters.'),

  body('billingAddress.postalCode')
    .if(body('billingSameAsShipping').not().equals('true'))
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Billing address postal code must be between 2 and 20 characters.'),

  body('billingAddress.country')
    .if(body('billingSameAsShipping').not().equals('true'))
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Billing address country must be a 2-letter ISO country code.'),
];

const validateCheckoutAddress = [
  ...shippingAddressRules,
  ...billingAddressRules,
  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// POST /checkout/place-order
// ---------------------------------------------------------------------------
const validateCheckoutPlaceOrder = [
  body('checkoutSessionId')
    .notEmpty()
    .withMessage('Checkout session ID is required.')
    .isUUID()
    .withMessage('Checkout session ID must be a valid UUID.'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required.')
    .isString()
    .withMessage('Payment method must be a string.')
    .isIn(['card', 'paypal', 'stripe', 'apple_pay', 'google_pay'])
    .withMessage('Payment method must be one of: card, paypal, stripe, apple_pay, google_pay.'),

  body('promoCode')
    .optional()
    .isString()
    .withMessage('Promo code must be a string.')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Promo code must be between 1 and 50 characters.'),

  body('guestToken')
    .optional()
    .isString()
    .withMessage('Guest token must be a string.')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Guest token must be at least 8 characters.'),

  handleValidationErrors,
];

module.exports = {
  validateCheckoutStart,
  validateCheckoutAddress,
  validateCheckoutPlaceOrder,
};
