const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Programme Management
async function listProgrammes(req, res) {
  try {
    const programmes = await prisma.programme.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        academicLevel: { select: { id: true, name: true } },
        students: { select: { id: true, matricNumber: true } }
      }
    });
    return res.json(programmes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getProgramme(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid programme id' });
    const programme = await prisma.programme.findUnique({
      where: { id },
      include: {
        department: true,
        academicLevel: true,
        courses: { select: { id: true, code: true, title: true, creditUnits: true } },
        students: { select: { id: true, matricNumber: true, user: { select: { firstName: true, lastName: true } } } }
      }
    });
    if (!programme) return res.status(404).json({ error: 'Programme not found' });
    return res.json(programme);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createProgramme(req, res) {
  try {
    const { name, code, departmentId, academicLevelId } = req.body;
    if (!name || !code || !departmentId || !academicLevelId) {
      return res.status(400).json({ error: 'Name, code, departmentId, and academicLevelId are required' });
    }
    
    const programme = await prisma.programme.create({
      data: { name, code, departmentId, academicLevelId }
    });
    await auditService.log({ userId: req.user.id, action: 'programme.create', meta: { programmeId: programme.id } });
    return res.status(201).json(programme);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Programme code already exists' });
    if (err.code === 'P2025') return res.status(400).json({ error: 'Department or Academic Level not found' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateProgramme(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid programme id' });
    const { name, code } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const programme = await prisma.programme.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'programme.update', meta: { programmeId: id } });
    return res.json(programme);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Programme not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Programme code already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteProgramme(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid programme id' });
    await prisma.programme.delete({ where: { id } });
    await auditService.log({ userId: req.user.id, action: 'programme.delete', meta: { programmeId: id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Programme not found' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listProgrammes, getProgramme, createProgramme, updateProgramme, deleteProgramme };
