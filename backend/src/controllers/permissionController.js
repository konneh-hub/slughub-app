const prisma = require('../prismaClient');
const rbac = require('../services/rbacService');
const auditService = require('../services/auditService');

async function listPermissions(req, res) {
  const permissions = await prisma.permission.findMany({
    include: {
      roles: { include: { role: true } }
    }
  });
  return res.json(permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    description: permission.description,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
    roles: permission.roles.map((rp) => rp.role)
  })));
}

async function getPermission(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid permission id' });
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true } }
    }
  });
  if (!permission) return res.status(404).json({ error: 'Permission not found' });
  return res.json({
    id: permission.id,
    name: permission.name,
    description: permission.description,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
    roles: permission.roles.map((rp) => rp.role)
  });
}

async function createPermission(req, res) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Permission name is required' });
  const p = await prisma.permission.create({ data: { name, description } });
  await auditService.log({ userId: req.user.id, action: 'permission.create', meta: { permissionId: p.id } });
  return res.status(201).json(p);
}

async function assignPermissionToRole(req, res) {
  const { roleId, permissionId } = req.body;
  if (!roleId || !permissionId) return res.status(400).json({ error: 'roleId and permissionId are required' });
  const r = await rbac.assignPermissionToRole(roleId, permissionId);
  await auditService.log({ userId: req.user.id, action: 'permission.assign', meta: { roleId, permissionId } });
  return res.json(r);
}

module.exports = { listPermissions, getPermission, createPermission, assignPermissionToRole };
