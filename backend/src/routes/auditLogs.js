const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

router.use(authenticateJWT);

router.get('/', authorizeRole(['University Admin', 'Dean', 'HOD', 'Exam Officer']), async (req, res) => {
  try {
    const { userId, action, startDate, endDate } = req.query;
    const where = {};

    if (userId) where.userId = parseInt(userId, 10);
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
