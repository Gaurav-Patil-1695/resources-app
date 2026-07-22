'use strict';

const PaymentAdapterInterface = require('./payment.adapter.interface');

/**
 * MockAdapter
 *
 * A test-mode payment adapter that returns configurable success or failure
 * responses without touching any real payment provider.
 *
 * Usage:
 *   const adapter = new MockAdapter();                    // all calls succeed by default
 *   const adapter = new MockAdapter({ shouldFail: true }); // all calls return an error
 *
 *   // Override per-method:
 *   adapter.setMethodOutcome('createPayment', { success: false, error: 'Declined' });
 */
class MockAdapter extends PaymentAdapterInterface {
  /**
   * @param {object}  [options]
   * @param {boolean} [options.shouldFail=false]   - Global flag: make every call fail.
   * @param {string}  [options.errorMessage='Mock payment failure'] - Default error message.
   * @param {number}  [options.latencyMs=0]        - Simulated async latency in milliseconds.
   */
  constructor(options = {}) {
    super();
    this._shouldFail = options.shouldFail === true;
    this._errorMessage = options.errorMessage || 'Mock payment failure';
    this._latencyMs = typeof options.latencyMs === 'number' ? options.latencyMs : 0;

    /** @type {Map<string, { success: boolean, data?: object, error?: string }>} */
    this._methodOutcomes = new Map();

    this._callLog = [];
  }

  // ---------------------------------------------------------------------------
  // Configuration helpers
  // ---------------------------------------------------------------------------

  /**
   * Override the outcome for a specific method.
   *
   * @param {string} methodName  - One of the interface method names.
   * @param {{ success: boolean, data?: object, error?: string }} outcome
   */
  setMethodOutcome(methodName, outcome) {
    this._methodOutcomes.set(methodName, outcome);
  }

  /**
   * Clear a previously set per-method override.
   *
   * @param {string} methodName
   */
  clearMethodOutcome(methodName) {
    this._methodOutcomes.delete(methodName);
  }

  /**
   * Returns a copy of all recorded calls (for assertions in tests).
   *
   * @returns {Array<{ method: string, args: any[], timestamp: number }>}
   */
  getCallLog() {
    return this._callLog.slice();
  }

  /** Clears the call log. */
  resetCallLog() {
    this._callLog = [];
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Simulate latency and resolve the configured outcome for a method.
   *
   * @param {string} methodName
   * @param {any[]}  args
   * @param {object} defaultSuccessData
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   * @private
   */
  async _resolve(methodName, args, defaultSuccessData) {
    this._callLog.push({ method: methodName, args, timestamp: Date.now() });

    if (this._latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._latencyMs));
    }

    // Per-method override takes precedence.
    if (this._methodOutcomes.has(methodName)) {
      const outcome = this._methodOutcomes.get(methodName);
      return {
        success: outcome.success,
        data: outcome.data !== undefined ? outcome.data : null,
        error: outcome.error !== undefined ? outcome.error : null,
      };
    }

    // Global failure flag.
    if (this._shouldFail) {
      return { success: false, data: null, error: this._errorMessage };
    }

    return { success: true, data: defaultSuccessData, error: null };
  }

  /**
   * Generate a simple deterministic mock ID for a given prefix and input.
   *
   * @param {string} prefix
   * @param {string|number} seed
   * @returns {string}
   * @private
   */
  _mockId(prefix, seed) {
    const hash = String(seed)
      .split('')
      .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0xffffffff, 0)
      .toString(16)
      .replace('-', '');
    return `${prefix}_mock_${hash}`;
  }

  // ---------------------------------------------------------------------------
  // Interface implementation
  // ---------------------------------------------------------------------------

  getName() {
    return 'mock';
  }

  async init() {
    await this._resolve('init', [], {});
  }

  async createPayment(params) {
    const id = this._mockId('pay', `${params.amount}_${params.currency}`);
    return this._resolve('createPayment', [params], {
      id,
      amount: params.amount,
      currency: params.currency,
      status: 'requires_capture',
      customerId: params.customerId || null,
      metadata: params.metadata || {},
    });
  }

  async capturePayment(paymentId) {
    return this._resolve('capturePayment', [paymentId], {
      id: paymentId,
      status: 'succeeded',
      capturedAt: new Date(0).toISOString(),
    });
  }

  async cancelPayment(paymentId) {
    return this._resolve('cancelPayment', [paymentId], {
      id: paymentId,
      status: 'canceled',
    });
  }

  async refundPayment(params) {
    const id = this._mockId('re', params.paymentId);
    return this._resolve('refundPayment', [params], {
      id,
      paymentId: params.paymentId,
      amount: params.amount !== undefined ? params.amount : null,
      status: 'succeeded',
    });
  }

  async getPaymentStatus(paymentId) {
    return this._resolve('getPaymentStatus', [paymentId], {
      id: paymentId,
      status: 'succeeded',
    });
  }

  async createCustomer(params) {
    const id = this._mockId('cus', params.email);
    return this._resolve('createCustomer', [params], {
      id,
      email: params.email,
      name: params.name || null,
      metadata: params.metadata || {},
    });
  }

  async attachPaymentMethod(params) {
    return this._resolve('attachPaymentMethod', [params], {
      customerId: params.customerId,
      paymentMethodId: params.paymentMethodId,
      attached: true,
    });
  }
}

module.exports = MockAdapter;
