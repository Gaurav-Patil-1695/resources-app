const paymentsService = require('./payments.service');

/**
 * POST /payments/initiate
 * Initiates a new payment transaction.
 */
async function initiatePayment(req, res, next) {
  try {
    const result = await paymentsService.initiatePayment(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/callback
 * Handles provider payment callback/confirmation.
 */
async function handleCallback(req, res, next) {
  try {
    const result = await paymentsService.processCallback(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/webhook
 * Handles provider webhook notifications (provider-agnostic).
 */
async function handleWebhook(req, res, next) {
  try {
    const providerName = req.headers['x-payment-provider'] || 'default';
    const result = await paymentsService.processWebhook(providerName, req.body, req.headers);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:paymentId
 * Retrieves payment details by ID.
 */
async function getPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const payment = await paymentsService.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/:paymentId/retry
 * Retries a failed payment transaction.
 */
async function retryPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const result = await paymentsService.retryPayment(paymentId, req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiatePayment,
  handleCallback,
  handleWebhook,
  getPayment,
  retryPayment,
};
