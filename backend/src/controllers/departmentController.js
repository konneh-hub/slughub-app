const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

// Department Management
async function listDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        faculty: { select: { id: true, name: true } },
        hods: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } },
        lecturers: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }
      }
    });
    return res.json(departments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getDepartment(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid department id' });
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        faculty: true,
        hods: { include: { lecturer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } },
        lecturers: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        courses: { select: { id: true, code: true, title: true } }
      }
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    return res.json(department);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createDepartment(req, res) {
  try {
    const { name, code, facultyId } = req.body;
    if (!name || !code || !facultyId) return res.status(400).json({ error: 'Name, code, and facultyId are required' });
    
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) return res.status(400).json({ error: 'Faculty not found' });
    
    const department = await prisma.department.create({
      data: { name, code, facultyId }
    });
    await auditService.log({ userId: req.user.id, action: 'department.create', meta: { departmentId: department.id } });
    return res.status(201).json(department);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Department code already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function updateDepartment(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid department id' });
    const { name, code } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No update fields provided' });
    
    const department = await prisma.department.update({ where: { id }, data });
    await auditService.log({ userId: req.user.id, action: 'department.update', meta: { departmentId: id } });
    return res.json(department);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Department not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Department code already exists' });
    return res.status(500).json({ error: err.message });
  }
}

async function deleteDepartment(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid department id' });
    await prisma.department.delete({ where: { id } });
    await auditService.log({ userId: req.user.id, action: 'department.delete', meta: { departmentId: id } });
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Department not found' });
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { listDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
