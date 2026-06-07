const rbac = require('../services/rbacService');
const auditService = require('../services/auditService');

function authorizePermission(permissionName) {
  return async (req, res, next) => {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const ok = await rbac.userHasPermission(userId, permissionName);
    if (!ok) {
      await auditService.log({ userId, action: 'access_denied_permission', ip: req.ip, meta: { permissionName } });
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = authorizePermission;
