const prisma = require('../prismaClient');

async function assignRoleToUser(userId, roleId) {
  return prisma.userRole.create({ data: { userId, roleId } });
}

async function assignPermissionToRole(roleId, permissionId) {
  return prisma.rolePermission.create({ data: { roleId, permissionId } });
}

async function userHasRole(userId, roleName) {
  const ur = await prisma.userRole.findFirst({
    where: { userId, role: { name: roleName } },
    include: { role: true }
  });
  return !!ur;
}

async function userHasPermission(userId, permissionName) {
  const roles = await prisma.userRole.findMany({ where: { userId }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  for (const ur of roles) {
    const perms = ur.role.permissions || [];
    for (const rp of perms) {
      if (rp.permission && rp.permission.name === permissionName) return true;
    }
  }
  return false;
}

module.exports = { assignRoleToUser, assignPermissionToRole, userHasRole, userHasPermission };
