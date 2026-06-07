const rbac = require('../services/rbacService');
const auditService = require('../services/auditService');

function authorizeRole(requiredRoles) {
  if (!Array.isArray(requiredRoles)) requiredRoles = [requiredRoles];
  return async (req, res, next) => {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    for (const r of requiredRoles) {
      const ok = await rbac.userHasRole(userId, r);
      if (ok) return next();
    }
    await auditService.log({ userId, action: 'access_denied_role', ip: req.ip, meta: { requiredRoles } });
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = authorizeRole;
