const adminService = require('./admin.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

/**
 * GET /admin/reports
 * Aggregates cross-domain report data for admin dashboard.
 */
async function getReports(req, res) {
  try {
    const reports = await adminService.getReports(req.query);
    return sendSuccess(res, 200, 'Reports retrieved successfully', reports);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /admin/permissions
 * Lists all permissions in the system.
 */
async function getPermissions(req, res) {
  try {
    const permissions = await adminService.getAllPermissions();
    return sendSuccess(res, 200, 'Permissions retrieved successfully', permissions);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /admin/roles
 * Lists all roles.
 */
async function getRoles(req, res) {
  try {
    const roles = await adminService.getAllRoles();
    return sendSuccess(res, 200, 'Roles retrieved successfully', roles);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /admin/roles
 * Creates a new role.
 */
async function createRole(req, res) {
  try {
    const role = await adminService.createRole(req.body);
    return sendSuccess(res, 201, 'Role created successfully', role);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /admin/roles/:roleId
 * Retrieves a single role by ID.
 */
async function getRoleById(req, res) {
  try {
    const role = await adminService.getRoleById(req.params.roleId);
    return sendSuccess(res, 200, 'Role retrieved successfully', role);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * PUT /admin/roles/:roleId
 * Updates an existing role.
 */
async function updateRole(req, res) {
  try {
    const role = await adminService.updateRole(req.params.roleId, req.body);
    return sendSuccess(res, 200, 'Role updated successfully', role);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * DELETE /admin/roles/:roleId
 * Deletes a role by ID.
 */
async function deleteRole(req, res) {
  try {
    await adminService.deleteRole(req.params.roleId);
    return sendSuccess(res, 200, 'Role deleted successfully', null);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /admin/roles/:roleId/permissions
 * Lists permissions assigned to a role.
 */
async function getRolePermissions(req, res) {
  try {
    const permissions = await adminService.getRolePermissions(req.params.roleId);
    return sendSuccess(res, 200, 'Role permissions retrieved successfully', permissions);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /admin/roles/:roleId/permissions
 * Assigns a permission to a role.
 */
async function addPermissionToRole(req, res) {
  try {
    const result = await adminService.addPermissionToRole(req.params.roleId, req.body);
    return sendSuccess(res, 201, 'Permission assigned to role successfully', result);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 * Removes a permission from a role.
 */
async function removePermissionFromRole(req, res) {
  try {
    await adminService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    return sendSuccess(res, 200, 'Permission removed from role successfully', null);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * GET /admin/serviceable-pin-codes
 * Lists all serviceable pin codes.
 */
async function getServiceablePinCodes(req, res) {
  try {
    const pinCodes = await adminService.getAllServiceablePinCodes(req.query);
    return sendSuccess(res, 200, 'Serviceable pin codes retrieved successfully', pinCodes);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * POST /admin/serviceable-pin-codes
 * Creates a new serviceable pin code.
 */
async function createServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.createServiceablePinCode(req.body);
    return sendSuccess(res, 201, 'Serviceable pin code created successfully', pinCode);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * PUT /admin/serviceable-pin-codes/:pinCodeId
 * Updates an existing serviceable pin code.
 */
async function updateServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.updateServiceablePinCode(req.params.pinCodeId, req.body);
    return sendSuccess(res, 200, 'Serviceable pin code updated successfully', pinCode);
  } catch (error) {
    return sendError(res, error);
  }
}

/**
 * DELETE /admin/serviceable-pin-codes/:pinCodeId
 * Deletes a serviceable pin code.
 */
async function deleteServiceablePinCode(req, res) {
  try {
    await adminService.deleteServiceablePinCode(req.params.pinCodeId);
    return sendSuccess(res, 200, 'Serviceable pin code deleted successfully', null);
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  getReports,
  getPermissions,
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
