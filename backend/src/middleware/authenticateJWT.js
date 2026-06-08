const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

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
  roleNames.forEach((roleName) => {
    const items = responsibilitiesMap[roleName] || [];
    items.forEach((item) => responsibilities.add(item));
  });
  return Array.from(responsibilities);
}

async function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.accessTokenSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        }
      }
    });
    if (!user || !user.isActive) {
      await auditService.log({ userId: payload.sub, action: 'access_denied', ip: req.ip, meta: { reason: 'inactive_or_missing_user' } });
      return res.status(403).json({ error: 'Access denied' });
    }

    const roles = user.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      permissions: ur.role.permissions.map((rp) => rp.permission.name)
    }));
    const permissions = Array.from(new Set(roles.flatMap((role) => role.permissions)));

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
      responsibilities: buildResponsibilities(roles.map((role) => role.name))
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticateJWT;
