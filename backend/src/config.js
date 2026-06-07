require('dotenv').config();

const config = {
  port: process.env.PORT || 4000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  saltRounds: parseInt(process.env.SALT_ROUNDS || '12', 10),
};

module.exports = config;
