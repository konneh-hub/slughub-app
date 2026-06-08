const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const { hashPassword } = require('../utils/hash');
const rbacService = require('../services/rbacService');

async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      roles: {
        include: { role: { select: { id: true, name: true, description: true } } }
      }
    }
  });
  return res.json(users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    roles: user.roles.map((ur) => ur.role)
  })));
}

async function getUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roles: {
        include: { role: { select: { id: true, name: true, description: true } } }
      }
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: user.roles.map((ur) => ur.role)
  });
}

async function createUser(req, res) {
  const { email, password, firstName, lastName, isActive = true, roleNames } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashedPassword, firstName, lastName, isActive } });

  if (Array.isArray(roleNames) && roleNames.length) {
    for (const roleName of roleNames) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        try {
          await rbacService.assignRoleToUser(user.id, role.id);
        } catch (error) {
          // ignore duplicates or invalid assignments
        }
      }
    }
  }

  await auditService.log({ userId: req.user.id, action: 'user.create', meta: { targetUser: user.id } });
  return res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isActive: user.isActive });
}

async function updateUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  const data = {};
  const { firstName, lastName, isActive } = req.body;
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (isActive !== undefined) data.isActive = isActive;
  if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });

  try {
    const user = await prisma.user.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'user.update', meta: { targetUser: id } });
    return res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isActive: user.isActive });
  } catch (err) {
    return res.status(404).json({ error: 'User not found' });
  }
}

async function deleteUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });
  try {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    await auditService.log({ userId: req.user.id, action: 'user.disable', meta: { targetUser: id } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(404).json({ error: 'User not found' });
  }
}

async function getCurrentUser(req, res) {
  const id = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roles: {
        include: { role: { select: { id: true, name: true, description: true, permissions: { include: { permission: true } } } } }
      }
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const roles = user.roles.map((ur) => ({
    ...ur.role,
    permissions: ur.role.permissions.map((rp) => rp.permission)
  }));
  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles,
    responsibilities: buildResponsibilities(roles.map((role) => role.name))
  });
}

function buildResponsibilities(roleNames) {
  const responsibilitiesMap = {
    'University Admin': [
      'Manage all users and system roles',
      'Assign roles and permissions',
      'Configure faculties, departments, programmes, and courses',
      'Manage academic sessions, semesters, and levels',
      'View and audit all activity logs',
      'Oversee result workflows, transcripts, and student records'
    ],
    'Exam Officer': [
      'Review and approve uploaded course results',
      'Reject incorrect or incomplete results',
      'Publish results to students',
      'Manage exam-related approvals and reports',
      'Access student result records across departments'
    ],
    'Dean': [
      'Oversee faculty-level academic operations',
      'Review departmental results and performance',
      'Support HODs in course and student management',
      'Approve faculty-level reports and academic decisions',
      'Monitor faculty lecturers and students'
    ],
    'HOD': [
      'Manage department courses and lecturers',
      'Assign lecturers to department courses',
      'Oversee departmental student progress',
      'Review departmental results before approval',
      'Coordinate with faculty and exam office on academic matters'
    ],
    'Lecturer': [
      'Access assigned courses and student lists',
      'Upload CA and exam scores for registered students',
      'Update submitted results before final approval',
      'View course allocations and academic sessions',
      'Support student academic inquiries for assigned courses'
    ],
    'Student': [
      'View personal course results and grades',
      'Check GPA and transcript history',
      'Access current academic registration details',
      'Download unofficial result slips',
      'Track academic standing and progression'
    ]
  };

  const responsibilities = new Set();
  for (const roleName of roleNames) {
    const items = responsibilitiesMap[roleName] || [];
    items.forEach((item) => responsibilities.add(item));
  }
  return Array.from(responsibilities);
}

async function getUserResponsibilities(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: {
        include: { role: { select: { id: true, name: true, description: true } } }
      }
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const roles = user.roles.map((ur) => ur.role);
  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    responsibilities: buildResponsibilities(roles.map((role) => role.name))
  });
}

async function getCurrentUserResponsibilities(req, res) {
  const id = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      roles: {
        include: { role: { select: { id: true, name: true, description: true } } }
      }
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const roles = user.roles.map((ur) => ur.role);
  return res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    responsibilities: buildResponsibilities(roles.map((role) => role.name))
  });
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, getCurrentUser, getUserResponsibilities, getCurrentUserResponsibilities };
