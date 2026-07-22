const express = require('express');
const router = express.Router({ mergeParams: true });
const returnsController = require('./returns.controller');
const { validateReturnRequest, validateReview } = require('./returns.validator');
const { authenticate, authorize } = require('../../middleware/auth');

// Customer routes (nested under /orders/:orderId)
router.post(
  '/orders/:orderId/return-requests',
  authenticate,
  validateReturnRequest,
  returnsController.createReturnRequest
);

router.get(
  '/orders/:orderId/return-requests',
  authenticate,
  returnsController.getReturnRequestsByOrder
);

router.get(
  '/orders/:orderId/return-requests/:returnRequestId',
  authenticate,
  returnsController.getReturnRequestById
);

// Admin routes
router.get(
  '/return-requests',
  authenticate,
  authorize('admin'),
  returnsController.listReturnRequests
);

router.get(
  '/return-requests/:returnRequestId',
  authenticate,
  authorize('admin'),
  returnsController.getReturnRequestDetail
);

router.post(
  '/return-requests/:returnRequestId/review',
  authenticate,
  authorize('admin'),
  validateReview,
  returnsController.reviewReturnRequest
);

module.exports = router;
