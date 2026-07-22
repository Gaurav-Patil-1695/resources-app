/**
 * PaymentAdapterInterface
 *
 * Duck-type contract that every payment provider adapter must satisfy.
 * Concrete adapters should extend this class (or at minimum implement all methods).
 *
 * All async methods return a plain result object of the shape:
 *   { success: boolean, data: object|null, error: string|null }
 */
class PaymentAdapterInterface {
  /**
   * Initialise or authenticate the adapter.
   * Called once before any other method.
   *
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error('PaymentAdapterInterface.init() must be implemented by subclass');
  }

  /**
   * Create a payment intent / charge.
   *
   * @param {object} params
   * @param {number}  params.amount      - Amount in the smallest currency unit (e.g. cents).
   * @param {string}  params.currency    - ISO 4217 currency code (e.g. 'usd').
   * @param {string}  [params.customerId] - Optional provider customer identifier.
   * @param {object}  [params.metadata]  - Arbitrary key-value metadata.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async createPayment(params) {
    throw new Error('PaymentAdapterInterface.createPayment() must be implemented by subclass');
  }

  /**
   * Capture a previously authorised payment.
   *
   * @param {string} paymentId - Provider-specific payment / intent identifier.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async capturePayment(paymentId) {
    throw new Error('PaymentAdapterInterface.capturePayment() must be implemented by subclass');
  }

  /**
   * Cancel / void a payment that has not yet been captured.
   *
   * @param {string} paymentId - Provider-specific payment / intent identifier.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async cancelPayment(paymentId) {
    throw new Error('PaymentAdapterInterface.cancelPayment() must be implemented by subclass');
  }

  /**
   * Issue a full or partial refund for a captured payment.
   *
   * @param {object} params
   * @param {string}  params.paymentId  - Provider-specific payment identifier.
   * @param {number}  [params.amount]   - Amount to refund in smallest currency unit.
   *                                     Omit or set to undefined for a full refund.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async refundPayment(params) {
    throw new Error('PaymentAdapterInterface.refundPayment() must be implemented by subclass');
  }

  /**
   * Retrieve the current status of a payment.
   *
   * @param {string} paymentId - Provider-specific payment / intent identifier.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error('PaymentAdapterInterface.getPaymentStatus() must be implemented by subclass');
  }

  /**
   * Create or retrieve a provider customer record.
   *
   * @param {object} params
   * @param {string}  params.email       - Customer e-mail address.
   * @param {string}  [params.name]      - Customer display name.
   * @param {object}  [params.metadata]  - Arbitrary key-value metadata.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async createCustomer(params) {
    throw new Error('PaymentAdapterInterface.createCustomer() must be implemented by subclass');
  }

  /**
   * Attach a payment method (e.g. card token) to a customer.
   *
   * @param {object} params
   * @param {string}  params.customerId       - Provider customer identifier.
   * @param {string}  params.paymentMethodId  - Provider payment-method identifier.
   * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
   */
  async attachPaymentMethod(params) {
    throw new Error('PaymentAdapterInterface.attachPaymentMethod() must be implemented by subclass');
  }

  /**
   * Returns the canonical name / identifier of the adapter (e.g. 'stripe', 'mock').
   *
   * @returns {string}
   */
  getName() {
    throw new Error('PaymentAdapterInterface.getName() must be implemented by subclass');
  }
}

module.exports = PaymentAdapterInterface;
