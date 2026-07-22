const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { validateAdvanceOrder, validateCancelOrder, validateReturnRequest } = require('./orders.validator');

// Customer / shared routes
router.get('/', ordersController.listOrders);
router.get('/:orderId', ordersController.getOrder);
router.get('/:orderId/tracking', ordersController.getTracking);
router.get('/:orderId/timeline', ordersController.getTimeline);
router.get('/:orderId/refunds', ordersController.getRefunds);

// Order actions
router.post('/:orderId/advance', validateAdvanceOrder, ordersController.advanceOrder);
router.post('/:orderId/cancel', validateCancelOrder, ordersController.cancelOrder);
router.post('/:orderId/return-requests', validateReturnRequest, ordersController.createReturnRequest);

module.exports = router;
