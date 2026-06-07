const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../prismaClient');
const auditService = require('../services/auditService');

async function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.accessTokenSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      await auditService.log({ userId: payload.sub, action: 'access_denied', ip: req.ip, meta: { reason: 'inactive_or_missing_user' } });
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authenticateJWT;
