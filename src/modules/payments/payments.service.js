const { v4: uuidv4 } = require('uuid');

/**
 * In-memory store for payment attempts.
 * In production this should be replaced with a proper database repository.
 */
const paymentAttempts = new Map();

/**
 * Registry of payment provider adapters.
 * Adapters should implement: { name, initiate, processCallback, processWebhook }
 */
const adapterRegistry = new Map();

/**
 * Register a payment provider adapter.
 * @param {string} name - Unique provider name.
 * @param {object} adapter - Adapter implementation.
 */
function registerAdapter(name, adapter) {
  adapterRegistry.set(name, adapter);
}

/**
 * Retrieve the active adapter by name or the first registered adapter.
 * @param {string} [providerName]
 * @returns {object} adapter
 */
function getAdapter(providerName) {
  if (providerName && adapterRegistry.has(providerName)) {
    return adapterRegistry.get(providerName);
  }
  const defaultAdapter = adapterRegistry.values().next().value;
  if (!defaultAdapter) {
    throw new Error('No payment provider adapter registered.');
  }
  return defaultAdapter;
}

/**
 * Persist a payment attempt record.
 * @param {object} attempt
 * @returns {object} saved attempt
 */
function persistPaymentAttempt(attempt) {
  paymentAttempts.set(attempt.id, attempt);
  return attempt;
}

/**
 * Update an existing payment attempt.
 * @param {string} id
 * @param {object} updates
 * @returns {object|null}
 */
function updatePaymentAttempt(id, updates) {
  const existing = paymentAttempts.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  paymentAttempts.set(id, updated);
  return updated;
}

/**
 * REQ-32: Initiate a new payment transaction.
 * Creates a payment attempt record and delegates to the active provider adapter.
 * @param {object} payload
 * @returns {object} payment attempt with provider response
 */
async function initiatePayment(payload) {
  const { amount, currency, orderId, customerId, provider, metadata } = payload;

  const adapter = getAdapter(provider);

  const attempt = persistPaymentAttempt({
    id: uuidv4(),
    orderId,
    customerId,
    amount,
    currency,
    provider: adapter.name,
    status: 'pending',
    metadata: metadata || {},
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  let providerResponse;
  try {
    providerResponse = await adapter.initiate({
      amount,
      currency,
      orderId,
      customerId,
      referenceId: attempt.id,
      metadata,
    });
  } catch (err) {
    updatePaymentAttempt(attempt.id, { status: 'failed', failureReason: err.message });
    throw err;
  }

  const updated = updatePaymentAttempt(attempt.id, {
    status: providerResponse.status || 'initiated',
    providerReference: providerResponse.providerReference || null,
    providerData: providerResponse,
  });

  return updated;
}

/**
 * REQ-33: Process a payment callback from the provider.
 * @param {object} callbackPayload
 * @returns {object} updated payment attempt
 */
async function processCallback(callbackPayload) {
  const { referenceId, providerReference, status, provider, metadata } = callbackPayload;

  const adapter = getAdapter(provider);

  let verifiedStatus;
  try {
    const verification = await adapter.processCallback(callbackPayload);
    verifiedStatus = verification.status;
  } catch (err) {
    throw err;
  }

  const normalized = normalizeStatus(verifiedStatus);

  let attempt = paymentAttempts.get(referenceId);
  if (!attempt) {
    // Create a minimal attempt record if not found (edge case)
    attempt = persistPaymentAttempt({
      id: referenceId,
      provider: adapter.name,
      providerReference,
      status: normalized,
      metadata: metadata || {},
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
    attempt = updatePaymentAttempt(referenceId, {
      status: normalized,
      providerReference,
      providerCallbackData: callbackPayload,
    });
  }

  return attempt;
}

/**
 * Process a provider webhook notification.
 * @param {string} providerName
 * @param {object} body
 * @param {object} headers
 * @returns {object}
 */
async function processWebhook(providerName, body, headers) {
  const adapter = getAdapter(providerName);

  let result;
  try {
    result = await adapter.processWebhook(body, headers);
  } catch (err) {
    throw err;
  }

  const { referenceId, status, providerReference } = result;

  if (referenceId) {
    const normalized = normalizeStatus(status);
    updatePaymentAttempt(referenceId, {
      status: normalized,
      providerReference: providerReference || null,
      providerWebhookData: body,
    });
  }

  return result;
}

/**
 * REQ-34: Retrieve a payment attempt by ID.
 * @param {string} paymentId
 * @returns {object|null}
 */
async function getPaymentById(paymentId) {
  return paymentAttempts.get(paymentId) || null;
}

/**
 * REQ-34: Retry a failed payment transaction.
 * @param {string} paymentId
 * @param {object} overrides - Optional payload overrides for the retry.
 * @returns {object} updated payment attempt
 */
async function retryPayment(paymentId, overrides) {
  const attempt = paymentAttempts.get(paymentId);
  if (!attempt) {
    const err = new Error('Payment attempt not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!['failed', 'error', 'cancelled'].includes(attempt.status)) {
    const err = new Error('Only failed, error, or cancelled payments can be retried.');
    err.statusCode = 400;
    throw err;
  }

  const adapter = getAdapter(attempt.provider);

  updatePaymentAttempt(paymentId, {
    status: 'pending',
    retryCount: (attempt.retryCount || 0) + 1,
    lastRetryAt: new Date().toISOString(),
  });

  let providerResponse;
  try {
    providerResponse = await adapter.initiate({
      amount: overrides.amount || attempt.amount,
      currency: overrides.currency || attempt.currency,
      orderId: attempt.orderId,
      customerId: attempt.customerId,
      referenceId: attempt.id,
      metadata: { ...attempt.metadata, ...(overrides.metadata || {}), isRetry: true },
    });
  } catch (err) {
    updatePaymentAttempt(paymentId, { status: 'failed', failureReason: err.message });
    throw err;
  }

  const updated = updatePaymentAttempt(paymentId, {
    status: providerResponse.status || 'initiated',
    providerReference: providerResponse.providerReference || null,
    providerData: providerResponse,
  });

  return updated;
}

/**
 * Normalize provider-specific status strings to internal status values.
 * @param {string} providerStatus
 * @returns {string}
 */
function normalizeStatus(providerStatus) {
  const statusMap = {
    success: 'success',
    successful: 'success',
    completed: 'success',
    approved: 'success',
    paid: 'success',
    failed: 'failed',
    failure: 'failed',
    declined: 'failed',
    rejected: 'failed',
    error: 'error',
    pending: 'pending',
    initiated: 'initiated',
    processing: 'processing',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    refunded: 'refunded',
  };
  const lower = (providerStatus || '').toLowerCase();
  return statusMap[lower] || providerStatus;
}

module.exports = {
  registerAdapter,
  initiatePayment,
  processCallback,
  processWebhook,
  getPaymentById,
  retryPayment,
};
