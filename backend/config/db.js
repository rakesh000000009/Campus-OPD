const fs = require('fs');
const path = require('path');
const config = require('./config');

let dbInstance = null;
let isPgPool = false;

async function getDb() {
  if (dbInstance) return dbInstance;

  if (config.databaseUrl) {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: config.databaseUrl });
      // Test connection
      const client = await pool.connect();
      client.release();
      console.log('Connected to PostgreSQL via DATABASE_URL');
      dbInstance = {
        query: async (text, params = []) => pool.query(text, params),
        exec: async (text) => pool.query(text),
        close: async () => pool.end()
      };
      isPgPool = true;
      return dbInstance;
    } catch (err) {
      console.warn('PostgreSQL connection failed, falling back to embedded PGlite:', err.message);
    }
  }

  // Fallback to embedded PGlite
  const { PGlite } = require('@electric-sql/pglite');
  const dir = config.dataDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const pglite = new PGlite(dir);
  console.log(`Connected to embedded PostgreSQL (PGlite) at: ${dir}`);

  dbInstance = {
    query: async (text, params = []) => {
      const res = await pglite.query(text, params);
      return {
        rows: res.rows || [],
        rowCount: res.affectedRows !== undefined ? res.affectedRows : (res.rows ? res.rows.length : 0)
      };
    },
    exec: async (text) => {
      await pglite.exec(text);
    },
    close: async () => {
      await pglite.close();
    }
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

async function initDb(schemaPath = path.join(__dirname, '../../database/schema.sql'), force = false) {
  const db = await getDb();
  if (!force) {
    try {
      const check = await db.query("SELECT to_regclass('public.users') as table_exists;");
      if (check.rows[0]?.table_exists) {
        return; // Schema already initialized
      }
    } catch (e) {
      // Table doesn't exist, proceed to initialize
    }
  }

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Initializing database schema...');
    await db.exec(schemaSql);
    console.log('Database schema successfully initialized.');
  } else {
    console.warn(`Schema file not found at ${schemaPath}`);
  }
}

module.exports = {
  getDb,
  query,
  exec,
  initDb
};
