'use strict';

/**
 * RBAC middleware factory.
 * Returns an Express middleware that checks whether req.user
 * holds at least one of the required roles.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('admin'), handler);
 *   router.get('/mod',   authenticate, authorize('admin', 'moderator'), handler);
 *
 * @param {...string} roles - One or more accepted role names.
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : req.user.role
      ? [req.user.role]
      : [];

    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        status: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      });
    }

    return next();
  };
}

module.exports = authorize;
