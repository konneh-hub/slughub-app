const authService = require('../services/authService');
const auditService = require('../services/auditService');

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;
    const user = await authService.register({ email, password, firstName, lastName });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const ip = req.ip;
  const r = await authService.login({ email, password, ip });
  if (r.error) return res.status(400).json({ error: r.error });
  res.json({ user: { id: r.user.id, email: r.user.email }, accessToken: r.accessToken, refreshToken: r.refreshToken });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  const r = await authService.refreshToken(refreshToken);
  if (r.error) return res.status(400).json({ error: r.error });
  res.json({ accessToken: r.accessToken });
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken, req.ip);
  res.json({ ok: true });
}

module.exports = { register, login, refresh, logout };
