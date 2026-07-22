const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getUserByEmail, createUser, savePasswordResetToken, getPasswordResetToken, deletePasswordResetToken, updateUserPassword, invalidateToken } = require('../../repositories/user.repository');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const RESET_TOKEN_EXPIRES_MINUTES = 30;

const issueToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const register = async ({ email, password, name }) => {
  const existing = await getUserByEmail(email);
  if (existing) {
    const error = new Error('Email is already registered.');
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ email, password: hashedPassword, name, role: 'user', isGuest: false });
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};

const login = async ({ email, password }) => {
  const user = await getUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};

const logout = async (token) => {
  if (token) {
    await invalidateToken(token);
  }
};

const forgotPassword = async (email) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return;
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
  await savePasswordResetToken({ userId: user.id, token: hashedToken, expiresAt });
  // In a real implementation, send email with resetToken here.
};

const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const record = await getPasswordResetToken(hashedToken);
  if (!record) {
    const error = new Error('Password reset token is invalid or has expired.');
    error.statusCode = 400;
    throw error;
  }
  if (new Date() > new Date(record.expiresAt)) {
    await deletePasswordResetToken(hashedToken);
    const error = new Error('Password reset token is invalid or has expired.');
    error.statusCode = 400;
    throw error;
  }
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(record.userId, hashedPassword);
  await deletePasswordResetToken(hashedToken);
};

const guestRegister = async ({ name }) => {
  const guestEmail = `guest_${crypto.randomBytes(8).toString('hex')}@guest.local`;
  const guestPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(guestPassword, SALT_ROUNDS);
  const user = await createUser({ email: guestEmail, password: hashedPassword, name: name || 'Guest', role: 'guest', isGuest: true });
  const token = issueToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};
