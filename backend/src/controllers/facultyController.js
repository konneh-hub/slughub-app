const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Faculty Management - University Admin only
async function listFaculties(req, res) {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        departments: { select: { id: true, name: true, code: true } },
        deans: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } }
      }
    });
    return res.json(faculties);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getFaculty(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid faculty id' });
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        departments: true,
        deans: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } }
      }
    });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    return res.json(faculty);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createFaculty(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Faculty name is required' });
    const faculty = await prisma.faculty.create({
      data: { name, description }
    });
    await auditService.log({ userId: req.user.id, action: 'faculty.create', meta: { facultyId: faculty.id } });
    return res.status(201).json(faculty);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Faculty name already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateFaculty(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid faculty id' });
    const { name, description } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const faculty = await prisma.faculty.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'faculty.update', meta: { facultyId: id } });
    return res.json(faculty);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Faculty not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Faculty name already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteFaculty(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid faculty id' });
    await prisma.faculty.delete({ where: { id } });
    await auditService.log({ userId: req.user.id, action: 'faculty.delete', meta: { facultyId: id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Faculty not found' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listFaculties, getFaculty, createFaculty, updateFaculty, deleteFaculty };
