const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Academic Session Management
async function listAcademicSessions(req, res) {
  try {
    const sessions = await prisma.academicSession.findMany({
      include: {
        allocations: { select: { id: true } },
        registrations: { select: { id: true } }
      }
    });
    return res.json(sessions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getAcademicSession(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid session id' });
    
    const session = await prisma.academicSession.findUnique({
      where: { id },
      include: {
        allocations: { select: { id: true, course: { select: { code: true, title: true } } } },
        registrations: { select: { id: true } }
      }
    });
    
    if (!session) return res.status(404).json({ error: 'Academic session not found' });
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getCurrentAcademicSession(req, res) {
  try {
    const session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: {
        allocations: { select: { id: true, course: { select: { code: true, title: true } } } },
        registrations: { select: { id: true } }
      }
    });
    if (!session) return res.status(404).json({ error: 'Current academic session not found' });
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createAcademicSession(req, res) {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'name, startDate, and endDate are required' });
    }
    
    const session = await prisma.academicSession.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: false }
    });
    
    await auditService.log({ userId: req.user.id, action: 'session.create', meta: { sessionId: session.id } });
    return res.status(201).json(session);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Session name already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateAcademicSession(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid session id' });
    
    const { name, startDate, endDate, isCurrent } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (isCurrent !== undefined) data.isCurrent = isCurrent;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const session = await prisma.academicSession.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'session.update', meta: { sessionId: id } });
    return res.json(session);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Academic session not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function setCurrentSession(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid session id' });
    
    // First, unset all other sessions as current
    await prisma.academicSession.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false }
    });
    
    // Set the new session as current
    const session = await prisma.academicSession.update({
      where: { id },
      data: { isCurrent: true }
    });
    
    await auditService.log({ userId: req.user.id, action: 'session.setCurrent', meta: { sessionId: id } });
    return res.json(session);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Academic session not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteAcademicSession(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid session id' });
    
    await prisma.academicSession.delete({ where: { id } });
    await auditService.log({ userId: req.user.id, action: 'session.delete', meta: { sessionId: id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Academic session not found' });
    return res.status(500).json({ error: err.message });
  }
}

// Semester Management
async function listSemesters(req, res) {
  try {
    const semesters = await prisma.semester.findMany();
    return res.json(semesters);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createSemester(req, res) {
  try {
    const { name, sequence, startDate, endDate } = req.body;
    if (!name || !sequence || !startDate || !endDate) {
      return res.status(400).json({ error: 'name, sequence, startDate, and endDate are required' });
    }
    
    const semester = await prisma.semester.create({
      data: { name, sequence, startDate: new Date(startDate), endDate: new Date(endDate) }
    });
    
    await auditService.log({ userId: req.user.id, action: 'semester.create', meta: { semesterId: semester.id } });
    return res.status(201).json(semester);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Semester name already exists' });
    return res.status(500).json({ error: err.message });
  }
}

// Academic Level Management
async function listAcademicLevels(req, res) {
  try {
    const levels = await prisma.academicLevel.findMany();
    return res.json(levels);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createAcademicLevel(req, res) {
  try {
    const { name, sequence } = req.body;
    if (!name || sequence === undefined) {
      return res.status(400).json({ error: 'name and sequence are required' });
    }
    
    const level = await prisma.academicLevel.create({
      data: { name, sequence }
    });
    
    await auditService.log({ userId: req.user.id, action: 'academicLevel.create', meta: { levelId: level.id } });
    return res.status(201).json(level);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Academic level name already exists' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listAcademicSessions,
  getAcademicSession,
  createAcademicSession,
  updateAcademicSession,
  setCurrentSession,
  deleteAcademicSession,
  listSemesters,
  createSemester,
  listAcademicLevels,
  createAcademicLevel
};
