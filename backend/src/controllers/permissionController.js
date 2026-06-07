const prisma = require('../prismaClient');
const rbac = require('../services/rbacService');
const auditService = require('../services/auditService');

async function createPermission(req, res) {
  const { name, description } = req.body;
  const p = await prisma.permission.create({ data: { name, description } });
  await auditService.log({ userId: req.user.id, action: 'permission.create', meta: { permissionId: p.id } });
  res.status(201).json(p);
}

async function assignPermissionToRole(req, res) {
  const { roleId, permissionId } = req.body;
  const r = await rbac.assignPermissionToRole(roleId, permissionId);
  await auditService.log({ userId: req.user.id, action: 'permission.assign', meta: { roleId, permissionId } });
  res.json(r);
}

module.exports = { createPermission, assignPermissionToRole };
