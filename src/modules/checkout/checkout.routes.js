const express = require('express');
const router = express.Router();
const checkoutController = require('./checkout.controller');
const { validateCheckoutStart, validateCheckoutAddress, validateCheckoutPlaceOrder } = require('./checkout.validator');
const { optionalAuth } = require('../../middleware/optionalAuth');

// All checkout routes support both authenticated and guest users
router.use(optionalAuth);

// Step 1: Start a checkout session (authenticated or guest)
router.post('/start', validateCheckoutStart, checkoutController.startCheckout);

// Step 2: Submit / update shipping address
router.post('/address', validateCheckoutAddress, checkoutController.submitAddress);

// Step 3: Review order summary
router.get('/review', checkoutController.reviewCheckout);

// Step 4: Place the order
router.post('/place-order', validateCheckoutPlaceOrder, checkoutController.placeOrder);

// Legacy aliases kept for backward-compatibility with design-package naming
router.post('/initiate', validateCheckoutStart, checkoutController.startCheckout);
router.post('/confirm', validateCheckoutPlaceOrder, checkoutController.placeOrder);

module.exports = router;
