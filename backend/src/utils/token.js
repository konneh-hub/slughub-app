const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.accessTokenSecret, { expiresIn: config.accessTokenExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.accessTokenSecret);
}

function signRefreshTokenPayload() {
  // create a secure random token
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { signAccessToken, verifyAccessToken, signRefreshTokenPayload, hashToken };
