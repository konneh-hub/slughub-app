require('dotenv').config();

function parseOrigins(value) {
  if (!value) {
    return null;
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

const config = {
  port: process.env.PORT || 4000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'change-me-access-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'change-me-refresh-secret',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  saltRounds: parseInt(process.env.SALT_ROUNDS || '12', 10),
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  allowLocalOrigins: !process.env.CORS_ORIGINS,
};

module.exports = config;
