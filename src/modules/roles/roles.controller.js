const rolesService = require('./roles.service');

async function getAllRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

async function getRoleById(req, res, next) {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }
    const role = await rolesService.createRole({ name, description });
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { name, description } = req.body;
    const role = await rolesService.updateRole(req.params.id, { name, description });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    const deleted = await rolesService.deleteRole(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function getUsersByRole(req, res, next) {
  try {
    const users = await rolesService.getUsersByRole(req.params.id);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

async function assignRoleToUser(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required' });
    }
    const assignment = await rolesService.assignRoleToUser({ userId, roleId });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
}

async function removeRoleFromUser(req, res, next) {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId and roleId are required' });
    }
    const removed = await rolesService.removeRoleFromUser({ userId, roleId });
    if (!removed) {
      return res.status(404).json({ success: false, message: 'User-role assignment not found' });
    }
    res.json({ success: true, message: 'Role removed from user successfully' });
  } catch (err) {
    next(err);
  }
}

async function getRolesByUser(req, res, next) {
  try {
    const roles = await rolesService.getRolesByUser(req.params.userId);
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesByUser,
};
