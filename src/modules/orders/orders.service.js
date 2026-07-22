const db = require('../../db');

// ---------------------------------------------------------------------------
// Status machine
// ---------------------------------------------------------------------------
const STATUS_TRANSITIONS = {
  pending: ['confirmed'],
  confirmed: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  returned: [],
};

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertOrderExists(order) {
  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }
}

function assertOwnership(order, user) {
  if (!user) return;
  if (user.isAdmin) return;
  if (order.user_id !== user.id) {
    const err = new Error('You do not have permission to access this order.');
    err.status = 403;
    throw err;
  }
}

async function writeStatusHistory(trx, orderId, previousStatus, newStatus, note, actorId) {
  await trx('order_status_history').insert({
    order_id: orderId,
    previous_status: previousStatus,
    new_status: newStatus,
    note: note || null,
    created_by: actorId || null,
  });
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

/**
 * List orders with optional filtering and pagination.
 */
async function listOrders({ userId, status, page, limit }) {
  const offset = (page - 1) * limit;

  const query = db('orders').orderBy('created_at', 'desc');

  if (userId) {
    query.where('user_id', userId);
  }
  if (status) {
    query.where('status', status);
  }

  const [{ count }] = await query.clone().count('id as count');
  const orders = await query.offset(offset).limit(limit);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total: parseInt(count, 10),
      totalPages: Math.ceil(parseInt(count, 10) / limit),
    },
  };
}

/**
 * Retrieve a single order by ID, enforcing ownership.
 */
async function getOrderById(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);
  return order;
}

/**
 * Retrieve tracking record for an order.
 */
async function getOrderTracking(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);

  const tracking = await db('order_tracking').where('order_id', orderId).first();
  if (!tracking) {
    const err = new Error('Tracking information not available for this order.');
    err.status = 404;
    throw err;
  }
  return tracking;
}

/**
 * Retrieve status timeline for an order.
 */
async function getOrderTimeline(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);

  const timeline = await db('order_status_history')
    .where('order_id', orderId)
    .orderBy('created_at', 'asc');

  return { orderId, timeline };
}

/**
 * Retrieve refunds for an order.
 */
async function getOrderRefunds(orderId, user) {
  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);

  const refunds = await db('refunds')
    .where('order_id', orderId)
    .orderBy('created_at', 'desc');

  return { orderId, refunds };
}

/**
 * Advance an order to the next status.
 * Writes an entry to order_status_history and optionally updates order_tracking.
 */
async function advanceOrderStatus(orderId, body, user) {
  const { note, trackingNumber, carrier } = body;

  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);

  const allowedNext = STATUS_TRANSITIONS[order.status] || [];
  if (allowedNext.length === 0) {
    const err = new Error(`Order cannot be advanced from status "${order.status}".`);
    err.status = 422;
    throw err;
  }

  const nextStatus = allowedNext[0];

  return db.transaction(async (trx) => {
    await trx('orders').where('id', orderId).update({
      status: nextStatus,
      updated_at: db.fn.now(),
    });

    await writeStatusHistory(trx, orderId, order.status, nextStatus, note, user && user.id);

    if (nextStatus === 'shipped' && (trackingNumber || carrier)) {
      const existing = await trx('order_tracking').where('order_id', orderId).first();
      if (existing) {
        await trx('order_tracking').where('order_id', orderId).update({
          tracking_number: trackingNumber || existing.tracking_number,
          carrier: carrier || existing.carrier,
          updated_at: db.fn.now(),
        });
      } else {
        await trx('order_tracking').insert({
          order_id: orderId,
          tracking_number: trackingNumber || null,
          carrier: carrier || null,
        });
      }
    }

    return trx('orders').where('id', orderId).first();
  });
}

/**
 * Cancel an order.
 */
async function cancelOrder(orderId, body, user) {
  const { reason } = body;

  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    const err = new Error(
      `Order cannot be cancelled because it is already "${order.status}". Only orders with status pending or confirmed can be cancelled.`
    );
    err.status = 422;
    throw err;
  }

  return db.transaction(async (trx) => {
    await trx('orders').where('id', orderId).update({
      status: 'cancelled',
      updated_at: db.fn.now(),
    });

    await writeStatusHistory(
      trx,
      orderId,
      order.status,
      'cancelled',
      reason || null,
      user && user.id
    );

    return trx('orders').where('id', orderId).first();
  });
}

/**
 * Create a return request for an order.
 */
async function createReturnRequest(orderId, body, user) {
  const { reason, items } = body;

  const order = await db('orders').where('id', orderId).first();
  assertOrderExists(order);
  assertOwnership(order, user);

  if (order.status !== 'delivered') {
    const err = new Error('Return requests can only be submitted for delivered orders.');
    err.status = 422;
    throw err;
  }

  const [returnRequest] = await db('return_requests')
    .insert({
      order_id: orderId,
      user_id: user && user.id,
      reason: reason || null,
      items: items ? JSON.stringify(items) : null,
      status: 'pending',
    })
    .returning('*');

  return returnRequest;
}

/**
 * Create an order — called by the checkout service.
 */
async function createOrder({ userId, items, shippingAddress, paymentMethod, totalAmount }, trx) {
  const queryBuilder = trx || db;

  const [order] = await queryBuilder('orders')
    .insert({
      user_id: userId,
      status: 'pending',
      items: JSON.stringify(items),
      shipping_address: JSON.stringify(shippingAddress),
      payment_method: paymentMethod,
      total_amount: totalAmount,
    })
    .returning('*');

  if (trx) {
    await writeStatusHistory(trx, order.id, null, 'pending', 'Order created', userId);
  } else {
    await db.transaction(async (innerTrx) => {
      await writeStatusHistory(innerTrx, order.id, null, 'pending', 'Order created', userId);
    });
  }

  return order;
}

module.exports = {
  listOrders,
  getOrderById,
  getOrderTracking,
  getOrderTimeline,
  getOrderRefunds,
  advanceOrderStatus,
  cancelOrder,
  createReturnRequest,
  createOrder,
};
