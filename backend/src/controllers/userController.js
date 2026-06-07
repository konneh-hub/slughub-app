const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

async function listUsers(req, res) {
  const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true } });
  res.json(users);
}

async function getUser(req, res) {
  const id = parseInt(req.params.id, 10);
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, firstName: true, lastName: true, isActive: true } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
}

async function updateUser(req, res) {
  const id = parseInt(req.params.id, 10);
  const data = {};
  const { firstName, lastName, isActive } = req.body;
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (isActive !== undefined) data.isActive = isActive;
  const user = await prisma.user.update({ where: { id }, data });
  await auditService.log({ userId: req.user.id, action: 'user.update', meta: { targetUser: id } });
  res.json({ id: user.id, email: user.email });
}

async function deleteUser(req, res) {
  const id = parseInt(req.params.id, 10);
  // soft-delete: disable account
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await auditService.log({ userId: req.user.id, action: 'user.disable', meta: { targetUser: id } });
  res.json({ ok: true });
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
