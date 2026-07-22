const usersService = require('./users.service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * GET /users/me
 */
async function getMe(req, res) {
  try {
    const user = await usersService.getUserById(req.user.id);
    return successResponse(res, 200, user);
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * PATCH /users/me
 */
async function updateMe(req, res) {
  try {
    const updated = await usersService.updateUser(req.user.id, req.body);
    return successResponse(res, 200, updated);
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * POST /users/me/change-password
 */
async function changePassword(req, res) {
  try {
    await usersService.changePassword(req.user.id, req.body);
    return successResponse(res, 200, { message: 'Password changed successfully.' });
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * GET /users  (admin)
 */
async function listUsers(req, res) {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await usersService.listUsers({ page, limit, search, role, status });
    return successResponse(res, 200, result);
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * GET /users/:userId  (admin)
 */
async function getUserById(req, res) {
  try {
    const user = await usersService.getUserById(req.params.userId);
    return successResponse(res, 200, user);
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * PATCH /users/:userId  (admin)
 */
async function updateUserById(req, res) {
  try {
    const updated = await usersService.adminUpdateUser(req.params.userId, req.body);
    return successResponse(res, 200, updated);
  } catch (err) {
    return errorResponse(res, err);
  }
}

/**
 * DELETE /users/:userId  (admin)
 */
async function deleteUserById(req, res) {
  try {
    await usersService.deleteUser(req.params.userId);
    return successResponse(res, 204, null);
  } catch (err) {
    return errorResponse(res, err);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
