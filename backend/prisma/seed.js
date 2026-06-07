require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const config = require('../src/config');

const prisma = new PrismaClient();

async function upsertRole(name, description = null) {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description }
  });
}

async function upsertPermission(name, description = null) {
  return prisma.permission.upsert({
    where: { name },
    update: { description },
    create: { name, description }
  });
}

async function main() {
  console.log('Seeding roles and permissions...');
  const roles = [
    'University Admin',
    'Dean',
    'HOD',
    'Exam Officer',
    'Lecturer',
    'Student'
  ];
  const createdRoles = {};
  for (const r of roles) {
    createdRoles[r] = await upsertRole(r);
  }

  const permissions = [
    { name: 'manage_users' },
    { name: 'view_users' },
    { name: 'assign_roles' },
    { name: 'assign_permissions' }
  ];
  const createdPerms = {};
  for (const p of permissions) {
    const cp = await upsertPermission(p.name, p.description || null);
    createdPerms[p.name] = cp;
  }

  // Assign all permissions to University Admin
  for (const pName of Object.keys(createdPerms)) {
    const perm = createdPerms[pName];
    try {
      await prisma.rolePermission.create({ data: { roleId: createdRoles['University Admin'].id, permissionId: perm.id } });
    } catch (e) { /* ignore duplicates */ }
  }

  // Assign view_users to Lecturer and Student
  try { await prisma.rolePermission.create({ data: { roleId: createdRoles['Lecturer'].id, permissionId: createdPerms['view_users'].id } }); } catch (e) {}
  try { await prisma.rolePermission.create({ data: { roleId: createdRoles['Student'].id, permissionId: createdPerms['view_users'].id } }); } catch (e) {}

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@university.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  let admin;
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, config.saltRounds);
    admin = await prisma.user.create({ data: { email: adminEmail, password: hashed, firstName: 'Super', lastName: 'Admin' } });
    console.log('Created admin user:', adminEmail);
  } else {
    admin = existing;
    console.log('Admin user already exists:', adminEmail);
  }

  // Assign University Admin role to admin user
  try {
    await prisma.userRole.create({ data: { userId: admin.id, roleId: createdRoles['University Admin'].id } });
  } catch (e) { /* ignore duplicates */ }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
