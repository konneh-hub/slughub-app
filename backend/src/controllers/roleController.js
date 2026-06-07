const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbac = require('../services/rbacService');

async function createRole(req, res) {
  const { name, description } = req.body;
  const role = await prisma.role.create({ data: { name, description } });
  await auditService.log({ userId: req.user.id, action: 'role.create', meta: { roleId: role.id } });
  res.status(201).json(role);
}

async function assignRole(req, res) {
  const { userId, roleId } = req.body;
  const r = await rbac.assignRoleToUser(userId, roleId);
  await auditService.log({ userId: req.user.id, action: 'role.assign', meta: { targetUser: userId, roleId } });
  res.json(r);
}

module.exports = { createRole, assignRole };
