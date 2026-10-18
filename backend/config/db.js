/**
 * Database access layer for the Campus OPD backend.
 *
 * In production (Netlify Functions) this uses the Netlify Database
 * (@netlify/database) which exposes a standard pg-compatible Pool.
 *
 * The models and services only rely on `db.query(text, params)` returning
 * `{ rows, rowCount }`, which the pg Pool provides out of the box.
 */

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const { getDatabase } = require('@netlify/database');
  const netlifyDb = getDatabase();

  dbInstance = {
    query: async (text, params = []) => netlifyDb.pool.query(text, params),
    exec: async (text) => netlifyDb.pool.query(text),
    pool: netlifyDb.pool,
    close: async () => {}
  };

  return dbInstance;
}

async function query(text, params = []) {
  const db = await getDb();
  return db.query(text, params);
}

async function exec(text) {
  const db = await getDb();
  return db.exec(text);
}

// Schema is managed by Netlify Database migrations (netlify/database/migrations).
// Kept as a no-op for compatibility with local dev scripts (server.js, seed.js).
async function initDb() {
  return;
}

module.exports = {
  getDb,
  query,
  exec,
  initDb
};
