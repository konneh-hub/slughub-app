const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbac = require('../services/rbacService');

const ROLE_RESPONSIBILITIES = {
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

function getResponsibilitiesForRole(roleName) {
  return ROLE_RESPONSIBILITIES[roleName] || [];
}

function formatRole(role) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: (role.permissions || []).map((rp) => rp.permission),
    responsibilities: getResponsibilitiesForRole(role.name)
  };
}

async function listRoles(req, res) {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } }
    }
  });
  return res.json(roles.map((role) => formatRole(role)));
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
  return res.json(formatRole(role));
}

async function listRoleResponsibilities(req, res) {
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } }
    }
  });
  return res.json(roles.map((role) => formatRole(role)));
}

async function getRoleResponsibilities(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid role id' });
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } }
    }
  });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  return res.json(formatRole(role));
}

async function createRole(req, res) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Role name is required' });
  const role = await prisma.role.create({ data: { name, description } });
  await auditService.log({ userId: req.user.id, action: 'role.create', meta: { roleId: role.id } });
  return res.status(201).json(formatRole({ ...role, permissions: [] }));
}

async function assignRole(req, res) {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) return res.status(400).json({ error: 'userId and roleId are required' });
  const r = await rbac.assignRoleToUser(userId, roleId);
  await auditService.log({ userId: req.user.id, action: 'role.assign', meta: { targetUser: userId, roleId } });
  return res.json(r);
}

module.exports = { listRoles, getRole, createRole, assignRole, listRoleResponsibilities, getRoleResponsibilities };

