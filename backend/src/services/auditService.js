const prisma = require('../prismaClient');

async function log({ userId = null, action, ip = null, meta = null }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, ip, meta } });
  } catch (err) {
    // don't throw; logging failure shouldn't block main flow
    console.error('Audit log failed', err);
  }
}

module.exports = { log };
