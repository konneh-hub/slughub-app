const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbac = require('../services/rbacService');

async function listRoles(req, res) {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } }
    }
  });
  return res.json(roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions.map((rp) => rp.permission)
  })));
}

async function getRole(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid role id' });
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } }
    }
  });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  return res.json({
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions.map((rp) => rp.permission)
  });
}

async function createRole(req, res) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Role name is required' });
  const role = await prisma.role.create({ data: { name, description } });
  await auditService.log({ userId: req.user.id, action: 'role.create', meta: { roleId: role.id } });
  return res.status(201).json(role);
}

async function assignRole(req, res) {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) return res.status(400).json({ error: 'userId and roleId are required' });
  const r = await rbac.assignRoleToUser(userId, roleId);
  await auditService.log({ userId: req.user.id, action: 'role.assign', meta: { targetUser: userId, roleId } });
  return res.json(r);
}

module.exports = { listRoles, getRole, createRole, assignRole };
