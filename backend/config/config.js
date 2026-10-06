const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'campus-opd-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databaseUrl: process.env.DATABASE_URL || '',
  dataDir: process.env.PG_DATA_DIR || path.join(__dirname, '../../database/pgdata'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
