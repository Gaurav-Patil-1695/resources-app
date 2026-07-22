const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { validateCreateCart, validateAddItem, validateUpdateItem, validateApplyPromo } = require('./cart.validator');
const { authenticateOptional } = require('../../middleware/auth');

// POST /carts - Create a new cart
router.post('/', authenticateOptional, validateCreateCart, cartController.createCart);

// GET /carts/:cartId - Get cart by ID
router.get('/:cartId', authenticateOptional, cartController.getCart);

// POST /carts/:cartId/items - Add item to cart
router.post('/:cartId/items', authenticateOptional, validateAddItem, cartController.addItem);

// PATCH /carts/:cartId/items/:itemId - Update cart item
router.patch('/:cartId/items/:itemId', authenticateOptional, validateUpdateItem, cartController.updateItem);

// DELETE /carts/:cartId/items/:itemId - Remove item from cart
router.delete('/:cartId/items/:itemId', authenticateOptional, cartController.removeItem);

// POST /carts/:cartId/promo - Apply promo code
router.post('/:cartId/promo', authenticateOptional, validateApplyPromo, cartController.applyPromo);

// DELETE /carts/:cartId/promo - Remove promo code
router.delete('/:cartId/promo', authenticateOptional, cartController.removePromo);

module.exports = router;
