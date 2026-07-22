const crypto = require('crypto');

const TOKEN_BYTE_LENGTH = 32;

/**
 * Generate a cryptographically secure random reset token.
 *
 * Returns both the plain token (to be sent to the user) and a SHA-256 hash
 * of that token (to be persisted in the database).
 *
 * @returns {{ token: string, hashedToken: string }}
 */
const generateResetToken = () => {
  const token = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
  const hashedToken = hashToken(token);
  return { token, hashedToken };
};

/**
 * Hash a plain token using SHA-256.
 *
 * @param {string} token - Plain hex token string
 * @returns {string} Hex-encoded SHA-256 digest
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify that a plain token matches a previously stored hash.
 *
 * @param {string} token       - Plain token supplied by the user
 * @param {string} hashedToken - SHA-256 hash stored in the database
 * @returns {boolean}
 */
const verifyResetToken = (token, hashedToken) => {
  const incoming = hashToken(token);
  // Constant-time comparison to mitigate timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming, 'hex'),
      Buffer.from(hashedToken, 'hex')
    );
  } catch {
    return false;
  }
};

module.exports = { generateResetToken, hashToken, verifyResetToken };
