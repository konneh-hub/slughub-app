const authService = require('../services/authService');

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await authService.register({ email, password, firstName, lastName });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const ip = req.ip;
  const r = await authService.login({ email, password, ip });
  if (r.error) return res.status(400).json({ error: r.error });
  return res.json({ user: { id: r.user.id, email: r.user.email }, accessToken: r.accessToken, refreshToken: r.refreshToken });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  const r = await authService.refreshToken(refreshToken);
  if (r.error) return res.status(400).json({ error: r.error });
  return res.json({ accessToken: r.accessToken });
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    const r = await authService.changePassword(req.user.id, currentPassword, newPassword);
    if (r.error) return res.status(400).json({ error: r.error });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });
  await authService.logout(refreshToken, req.ip);
  return res.json({ ok: true });
}

async function me(req, res) {
  const user = req.user;
  return res.json(user);
}

module.exports = { register, login, refresh, logout, changePassword, me };
