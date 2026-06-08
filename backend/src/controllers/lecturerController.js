const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Lecturer Management
async function listLecturers(req, res) {
  try {
    const lecturers = await prisma.lecturer.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, code: true } }
      }
    });
    return res.json(lecturers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getLecturer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: true,
        allocations: { include: { course: { select: { code: true, title: true } } } }
      }
    });
    
    if (!lecturer) return res.status(404).json({ error: 'Lecturer not found' });
    return res.json(lecturer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createLecturer(req, res) {
  try {
    const { userId, staffNumber, departmentId, title } = req.body;
    if (!userId || !staffNumber || !departmentId || !title) {
      return res.status(400).json({ error: 'userId, staffNumber, departmentId, and title are required' });
    }
    
    const lecturer = await prisma.lecturer.create({
      data: { userId, staffNumber, departmentId, title }
    });
    
    await auditService.log({ userId: req.user.id, action: 'lecturer.create', meta: { lecturerId: lecturer.id } });
    return res.status(201).json(lecturer);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Staff number already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateLecturer(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const { title } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const lecturer = await prisma.lecturer.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'lecturer.update', meta: { lecturerId: id } });
    return res.json(lecturer);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Lecturer not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function getLecturerCourses(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const allocations = await prisma.courseAllocation.findMany({
      where: { lecturerId: id },
      include: {
        course: { select: { id: true, code: true, title: true, creditUnits: true } },
        academicSession: { select: { name: true } }
      }
    });
    
    return res.json(allocations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function assignAsHOD(req, res) {
  try {
    const lecturerId = parseInt(req.params.id, 10);
    if (Number.isNaN(lecturerId)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const { departmentId } = req.body;
    if (!departmentId) return res.status(400).json({ error: 'departmentId is required' });
    
    const hod = await prisma.hod.create({
      data: { lecturerId, departmentId }
    });
    
    await auditService.log({ userId: req.user.id, action: 'lecturer.assignHOD', meta: { lecturerId, departmentId } });
    return res.status(201).json(hod);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Lecturer is already a HOD' });
    return res.status(500).json({ error: err.message });
  }
}

async function assignAsDean(req, res) {
  try {
    const lecturerId = parseInt(req.params.id, 10);
    if (Number.isNaN(lecturerId)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const { facultyId } = req.body;
    if (!facultyId) return res.status(400).json({ error: 'facultyId is required' });
    
    const dean = await prisma.dean.create({
      data: { lecturerId, facultyId }
    });
    
    await auditService.log({ userId: req.user.id, action: 'lecturer.assignDean', meta: { lecturerId, facultyId } });
    return res.status(201).json(dean);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Lecturer is already a Dean' });
    return res.status(500).json({ error: err.message });
  }
}

async function assignAsExamOfficer(req, res) {
  try {
    const lecturerId = parseInt(req.params.id, 10);
    if (Number.isNaN(lecturerId)) return res.status(400).json({ error: 'Invalid lecturer id' });
    
    const { facultyId } = req.body;
    if (!facultyId) return res.status(400).json({ error: 'facultyId is required' });
    
    const examOfficer = await prisma.examOfficer.create({
      data: { lecturerId, facultyId }
    });
    
    await auditService.log({ userId: req.user.id, action: 'lecturer.assignExamOfficer', meta: { lecturerId, facultyId } });
    return res.status(201).json(examOfficer);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Lecturer is already an Exam Officer' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listLecturers,
  getLecturer,
  createLecturer,
  updateLecturer,
  getLecturerCourses,
  assignAsHOD,
  assignAsDean,
  assignAsExamOfficer
};
