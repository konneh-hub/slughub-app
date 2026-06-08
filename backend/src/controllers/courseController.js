const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Course Management
async function listCourses(req, res) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, name: true } },
        academicLevel: { select: { id: true, name: true } },
        allocations: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true } } } } } }
      }
    });
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCourse(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid course id' });
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        programme: true,
        semester: true,
        academicLevel: true,
        allocations: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } },
        registrations: { select: { id: true, student: { select: { matricNumber: true, user: { select: { firstName: true, lastName: true } } } } } }
      }
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createCourse(req, res) {
  try {
    const { code, title, description, creditUnits, departmentId, programmeId, academicLevelId, semesterId } = req.body;
    if (!code || !title || !creditUnits || !departmentId || !programmeId || !academicLevelId || !semesterId) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const course = await prisma.course.create({
      data: { code, title, description, creditUnits, departmentId, programmeId, academicLevelId, semesterId }
    });
    await auditService.log({ userId: req.user.id, action: 'course.create', meta: { courseId: course.id } });
    return res.status(201).json(course);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Course code already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateCourse(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid course id' });
    const { title, description, creditUnits } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (creditUnits !== undefined) data.creditUnits = creditUnits;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const course = await prisma.course.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'course.update', meta: { courseId: id } });
    return res.json(course);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Course not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteCourse(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid course id' });
    await prisma.course.delete({ where: { id } });
    await auditService.log({ userId: req.user.id, action: 'course.delete', meta: { courseId: id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Course not found' });
    return res.status(500).json({ error: err.message });
  }
}

// Allocate course to lecturer
async function allocateCourse(req, res) {
  try {
    const { courseId, lecturerId, academicSessionId, semesterId } = req.body;
    if (!courseId || !lecturerId || !academicSessionId || !semesterId) {
      return res.status(400).json({ error: 'courseId, lecturerId, academicSessionId, and semesterId are required' });
    }
    
    const allocation = await prisma.courseAllocation.create({
      data: { courseId, lecturerId, academicSessionId, semesterId }
    });
    await auditService.log({ userId: req.user.id, action: 'course.allocate', meta: { allocationId: allocation.id } });
    return res.status(201).json(allocation);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Course already allocated to this lecturer' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, allocateCourse };
