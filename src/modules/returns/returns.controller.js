const returnsService = require('./returns.service');

/**
 * POST /orders/:orderId/return-requests
 * Initiate a return request for an order.
 */
async function createReturnRequest(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const payload = req.body;
    const returnRequest = await returnsService.createReturnRequest(orderId, userId, payload);
    return res.status(201).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId/return-requests
 * List return requests for a specific order.
 */
async function getReturnRequestsByOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const returnRequests = await returnsService.getReturnRequestsByOrder(orderId, userId);
    return res.status(200).json({ data: returnRequests });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /orders/:orderId/return-requests/:returnRequestId
 * Get a specific return request by ID (customer view).
 */
async function getReturnRequestById(req, res, next) {
  try {
    const { orderId, returnRequestId } = req.params;
    const userId = req.user.id;
    const returnRequest = await returnsService.getReturnRequestById(returnRequestId, orderId, userId);
    return res.status(200).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /return-requests
 * Admin: list all return requests.
 */
async function listReturnRequests(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
    };
    const result = await returnsService.listReturnRequests(filters);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /return-requests/:returnRequestId
 * Admin: get return request detail.
 */
async function getReturnRequestDetail(req, res, next) {
  try {
    const { returnRequestId } = req.params;
    const returnRequest = await returnsService.getReturnRequestDetail(returnRequestId);
    return res.status(200).json({ data: returnRequest });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /return-requests/:returnRequestId/review
 * Admin: approve or reject a return request.
 */
async function reviewReturnRequest(req, res, next) {
  try {
    const { returnRequestId } = req.params;
    const adminId = req.user.id;
    const payload = req.body;
    const result = await returnsService.reviewReturnRequest(returnRequestId, adminId, payload);
    return res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReturnRequest,
  getReturnRequestsByOrder,
  getReturnRequestById,
  listReturnRequests,
  getReturnRequestDetail,
  reviewReturnRequest,
};
