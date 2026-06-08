const prisma = require('../prismaClient');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshTokenPayload, hashToken } = require('../utils/token');
const config = require('../config');
const auditService = require('./auditService');

async function register({ email, password, firstName, lastName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed, firstName, lastName } });
  await auditService.log({ userId: user.id, action: 'user.register' });
  return user;
}

async function login({ email, password, ip }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'Invalid credentials' };
  if (!user.isActive) return { error: 'Account disabled' };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: 'Account locked due to repeated failed logins' };
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: { increment: 1 } } });
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    if (refreshed.failedLoginAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: lockUntil } });
      await auditService.log({ userId: user.id, action: 'user.locked', ip });
    }
    await auditService.log({ userId: user.id, action: 'user.login_failed', ip });
    return { error: 'Invalid credentials' };
  }

  // successful login
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const rawRefresh = signRefreshTokenPayload();
  const refreshHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + parseDuration(config.refreshTokenExpiresIn));
  await prisma.refreshToken.create({ data: { tokenHash: refreshHash, userId: user.id, expiresAt } });
  await auditService.log({ userId: user.id, action: 'user.login_success', ip });
  return { user, accessToken, refreshToken: rawRefresh };
}

function parseDuration(str) {
  // simple parser for '7d', '15m', '1h'
  if (!str) return 1000 * 60 * 60 * 24 * 7;
  const num = parseInt(str.slice(0, -1), 10);
  const unit = str.slice(-1);
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'm') return num * 60 * 1000;
  return num;
}

async function refreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const tokenEntry = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!tokenEntry || tokenEntry.revoked || tokenEntry.expiresAt < new Date()) return { error: 'Invalid refresh token' };
  const user = await prisma.user.findUnique({ where: { id: tokenEntry.userId } });
  if (!user || !user.isActive) return { error: 'Invalid user' };
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { accessToken };
}

async function logout(rawToken, ip) {
  const tokenHash = hashToken(rawToken);
  const tokenEntry = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (tokenEntry) {
    await prisma.refreshToken.update({ where: { id: tokenEntry.id }, data: { revoked: true } });
    await auditService.log({ userId: tokenEntry.userId, action: 'user.logout', ip });
  }
  return { ok: true };
}

module.exports = { register, login, refreshToken, logout };
