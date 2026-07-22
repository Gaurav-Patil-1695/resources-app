const db = require('../../db');

const RETURNABLE_STATUSES = ['delivered'];
const RETURN_WINDOW_DAYS = 30;
const ALLOWED_REVIEW_DECISIONS = ['approved', 'rejected'];

/**
 * Check whether an order is eligible for a return.
 * @param {string} orderId
 * @param {string} userId
 * @returns {object} order record
 */
async function checkReturnEligibility(orderId, userId) {
  const order = await db('orders').where({ id: orderId, user_id: userId }).first();
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!RETURNABLE_STATUSES.includes(order.status)) {
    const err = new Error('Order is not eligible for a return.');
    err.statusCode = 422;
    throw err;
  }

  const deliveredAt = new Date(order.delivered_at);
  const windowExpiry = new Date(deliveredAt);
  windowExpiry.setDate(windowExpiry.getDate() + RETURN_WINDOW_DAYS);

  if (new Date() > windowExpiry) {
    const err = new Error('Return window has expired.');
    err.statusCode = 422;
    throw err;
  }

  const existingReturn = await db('return_requests')
    .where({ order_id: orderId })
    .whereIn('status', ['pending', 'approved'])
    .first();

  if (existingReturn) {
    const err = new Error('A return request already exists for this order.');
    err.statusCode = 409;
    throw err;
  }

  return order;
}

/**
 * Create a new return request.
 * @param {string} orderId
 * @param {string} userId
 * @param {object} payload - { reason, items }
 * @returns {object} created return request
 */
async function createReturnRequest(orderId, userId, payload) {
  await checkReturnEligibility(orderId, userId);

  const { reason, items } = payload;

  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: userId,
      reason,
      items: JSON.stringify(items || []),
      status: 'pending',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return returnRequest;
}

/**
 * Get all return requests for a specific order (customer scoped).
 * @param {string} orderId
 * @param {string} userId
 * @returns {Array} return requests
 */
async function getReturnRequestsByOrder(orderId, userId) {
  const order = await db('orders').where({ id: orderId, user_id: userId }).first();
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const returnRequests = await db('return_requests')
    .where({ order_id: orderId, user_id: userId })
    .orderBy('created_at', 'desc');

  return returnRequests;
}

/**
 * Get a specific return request by ID, scoped to order and user.
 * @param {string} returnRequestId
 * @param {string} orderId
 * @param {string} userId
 * @returns {object} return request
 */
async function getReturnRequestById(returnRequestId, orderId, userId) {
  const returnRequest = await db('return_requests')
    .where({ id: returnRequestId, order_id: orderId, user_id: userId })
    .first();

  if (!returnRequest) {
    const err = new Error('Return request not found.');
    err.statusCode = 404;
    throw err;
  }

  return returnRequest;
}

/**
 * List all return requests (admin).
 * @param {object} filters - { status, page, limit }
 * @returns {object} paginated result
 */
async function listReturnRequests(filters) {
  const { status, page, limit } = filters;
  const offset = (page - 1) * limit;

  let query = db('return_requests').orderBy('created_at', 'desc');

  if (status) {
    query = query.where({ status });
  }

  const [{ count }] = await query.clone().count('id as count');
  const returnRequests = await query.offset(offset).limit(limit);

  return {
    data: returnRequests,
    pagination: {
      total: parseInt(count, 10),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count, 10) / limit),
    },
  };
}

/**
 * Get return request detail (admin).
 * @param {string} returnRequestId
 * @returns {object} return request with order and user info
 */
async function getReturnRequestDetail(returnRequestId) {
  const returnRequest = await db('return_requests')
    .where({ 'return_requests.id': returnRequestId })
    .join('orders', 'return_requests.order_id', 'orders.id')
    .join('users', 'return_requests.user_id', 'users.id')
    .select(
      'return_requests.*',
      'orders.status as order_status',
      'orders.total as order_total',
      'users.email as user_email',
      'users.name as user_name'
    )
    .first();

  if (!returnRequest) {
    const err = new Error('Return request not found.');
    err.statusCode = 404;
    throw err;
  }

  return returnRequest;
}

/**
 * Review a return request (approve or reject).
 * On approval: trigger refund and update stock.
 * @param {string} returnRequestId
 * @param {string} adminId
 * @param {object} payload - { decision, notes }
 * @returns {object} updated return request
 */
async function reviewReturnRequest(returnRequestId, adminId, payload) {
  const { decision, notes } = payload;

  if (!ALLOWED_REVIEW_DECISIONS.includes(decision)) {
    const err = new Error('Invalid decision value.');
    err.statusCode = 422;
    throw err;
  }

  const returnRequest = await db('return_requests').where({ id: returnRequestId }).first();

  if (!returnRequest) {
    const err = new Error('Return request not found.');
    err.statusCode = 404;
    throw err;
  }

  if (returnRequest.status !== 'pending') {
    const err = new Error('Only pending return requests can be reviewed.');
    err.statusCode = 422;
    throw err;
  }

  const trx = await db.transaction();

  try {
    const [updated] = await trx('return_requests')
      .where({ id: returnRequestId })
      .update({
        status: decision,
        admin_id: adminId,
        admin_notes: notes || null,
        reviewed_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning('*');

    if (decision === 'approved') {
      await triggerRefund(trx, updated);
      await restoreStock(trx, updated);
    }

    await trx.commit();
    return updated;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Trigger a refund for the return request.
 * @param {object} trx - knex transaction
 * @param {object} returnRequest
 */
async function triggerRefund(trx, returnRequest) {
  const order = await trx('orders').where({ id: returnRequest.order_id }).first();
  if (!order) return;

  await trx('refunds').insert({
    order_id: returnRequest.order_id,
    return_request_id: returnRequest.id,
    user_id: returnRequest.user_id,
    amount: order.total,
    status: 'pending',
    created_at: trx.fn.now(),
    updated_at: trx.fn.now(),
  });

  await trx('orders')
    .where({ id: returnRequest.order_id })
    .update({ status: 'refund_pending', updated_at: trx.fn.now() });
}

/**
 * Restore stock for items in the return request.
 * @param {object} trx - knex transaction
 * @param {object} returnRequest
 */
async function restoreStock(trx, returnRequest) {
  let items = returnRequest.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  if (!Array.isArray(items) || items.length === 0) return;

  for (const item of items) {
    const { product_id, quantity } = item;
    if (!product_id || !quantity) continue;

    await trx('products')
      .where({ id: product_id })
      .increment('stock_quantity', quantity);
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
