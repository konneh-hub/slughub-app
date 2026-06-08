const prisma = require('../prismaClient');
const auditService = require('../services/auditService');
const rbacService = require('../services/rbacService');

async function canManageRegistration(userId, studentId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { student: true } });
  if (!user) return false;
  if (user.student && user.student.id === studentId) return true;

  const adminRoles = ['University Admin', 'Dean', 'HOD', 'Exam Officer'];
  for (const role of adminRoles) {
    if (await rbacService.userHasRole(userId, role)) return true;
  }
  return false;
}

async function registerCourse(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (Number.isNaN(studentId)) return res.status(400).json({ error: 'Invalid student id' });

    const { courseId, academicSessionId, semesterId, status = 'Registered' } = req.body;
    if (!courseId || !academicSessionId || !semesterId) {
      return res.status(400).json({ error: 'courseId, academicSessionId, and semesterId are required' });
    }

    if (!(await canManageRegistration(req.user.id, studentId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const registration = await prisma.courseRegistration.create({
      data: {
        studentId,
        courseId,
        academicSessionId,
        semesterId,
        status
      }
    });

    await auditService.log({ userId: req.user.id, action: 'registration.create', meta: { registrationId: registration.id, studentId, courseId } });
    return res.status(201).json(registration);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'This registration already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteRegistration(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    const registrationId = parseInt(req.params.registrationId, 10);
    if (Number.isNaN(studentId) || Number.isNaN(registrationId)) {
      return res.status(400).json({ error: 'Invalid student id or registration id' });
    }

    const registration = await prisma.courseRegistration.findUnique({ where: { id: registrationId } });
    if (!registration || registration.studentId !== studentId) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (!(await canManageRegistration(req.user.id, studentId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.courseRegistration.delete({ where: { id: registrationId } });
    await auditService.log({ userId: req.user.id, action: 'registration.delete', meta: { registrationId, studentId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCourseRegistrations(req, res) {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) return res.status(400).json({ error: 'Invalid course id' });

    const registrations = await prisma.courseRegistration.findMany({
      where: { courseId },
      include: {
        student: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        academicSession: true,
        semester: true,
        course: true
      }
    });

    return res.json(registrations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStudentRegistrations(req, res) {
  try {
    const studentId = parseInt(req.params.id, 10);
    if (Number.isNaN(studentId)) return res.status(400).json({ error: 'Invalid student id' });

    if (!(await canManageRegistration(req.user.id, studentId))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const registrations = await prisma.courseRegistration.findMany({
      where: { studentId },
      include: {
        course: true,
        academicSession: true,
        semester: true
      }
    });

    return res.json(registrations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  registerCourse,
  deleteRegistration,
  getCourseRegistrations,
  getStudentRegistrations
};
