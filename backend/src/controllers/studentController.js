const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Student Management
async function listStudents(req, res) {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, code: true } },
        programme: { select: { id: true, name: true, code: true } },
        academicLevel: { select: { id: true, name: true } }
      }
    });
    return res.json(students);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStudent(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid student id' });
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: true,
        programme: true,
        academicLevel: true,
        courseRegistrations: { include: { course: { select: { code: true, title: true } } } }
      }
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json(student);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createStudent(req, res) {
  try {
    const { userId, matricNumber, departmentId, programmeId, academicLevelId, admissionYear, status } = req.body;
    if (!userId || !matricNumber || !departmentId || !programmeId || !academicLevelId || !admissionYear) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    const student = await prisma.student.create({
      data: {
        userId,
        matricNumber,
        departmentId,
        programmeId,
        academicLevelId,
        admissionYear,
        status: status || 'Active'
      }
    });
    await auditService.log({ userId: req.user.id, action: 'student.create', meta: { studentId: student.id } });
    return res.status(201).json(student);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Matric number already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateStudent(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid student id' });
    const { status, academicLevelId } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (academicLevelId !== undefined) data.academicLevelId = academicLevelId;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const student = await prisma.student.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'student.update', meta: { studentId: id } });
    return res.json(student);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function getStudentResults(req, res) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) return res.status(400).json({ error: 'Invalid student id' });
    
    const results = await prisma.resultHeader.findMany({
      where: { studentId },
      include: {
        courseAllocation: {
          include: {
            course: { select: { code: true, title: true, creditUnits: true } },
            lecturer: { include: { user: { select: { firstName: true, lastName: true } } } }
          }
        },
        academicSession: { select: { name: true } },
        grades: { select: { id: true, grade: true, score: true } }
      }
    });
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStudentGPA(req, res) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) return res.status(400).json({ error: 'Invalid student id' });
    
    const gpaRecords = await prisma.gpaRecord.findMany({
      where: { studentId },
      include: {
        academicSession: { select: { name: true } },
        semester: { select: { name: true } }
      }
    });
    return res.json(gpaRecords);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStudentTranscript(req, res) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (Number.isNaN(studentId)) return res.status(400).json({ error: 'Invalid student id' });
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        programme: true,
        resultHeaders: {
          include: {
            courseAllocation: { include: { course: true } },
            grades: true
          }
        },
        cgpaRecords: true
      }
    });
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json(student);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  getStudentResults,
  getStudentGPA,
  getStudentTranscript
};
