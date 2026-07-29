const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const JSON_FILE = path.join(__dirname, '..', 'data', 'users.json');

const PG_CONFIG = {
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'identity_db',
  port: parseInt(process.env.PGPORT || '5432', 10)
};

class DatabaseAdapter {
  constructor() {
    this.pool = null;
    this.usePostgreSQL = false;
    this.initDatabase();
  }

  ensureDataDir() {
    const dir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async initDatabase() {
    try {
      const { Pool } = require('pg');
      this.pool = new Pool(PG_CONFIG);
      const res = await this.pool.query('SELECT NOW()');
      if (res) {
        this.usePostgreSQL = true;
        console.log(`[PostgreSQL] Connected to ${PG_CONFIG.host}:${PG_CONFIG.port}/${PG_CONFIG.database}`);
        this.initTables();
      }
    } catch (err) {
      this.usePostgreSQL = false;
      console.log(`[Database] PostgreSQL connection unavailable (${err.message}). Using JSON DB mode.`);
    }
  }

  async initTables() {
    if (!this.usePostgreSQL || !this.pool) return;
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await this.pool.query(schemaSql);
    } catch (err) {
      console.error('[PostgreSQL Schema Notice]', err.message);
    }
  }

  async getUsers() {
    if (this.usePostgreSQL && this.pool) {
      try {
        const res = await this.pool.query(
          'SELECT id, email, username, password_hash as "passwordHash", full_name as "fullName", provider, created_at as "createdAt" FROM users'
        );
        return res.rows;
      } catch (err) {
        console.error('[PostgreSQL Query Notice]', err.message);
      }
    }
    // Fallback to JSON DB
    this.ensureDataDir();
    if (!fs.existsSync(JSON_FILE)) return [];
    try {
      return JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    } catch {
      return [];
    }
  }

  async saveUser(user) {
    if (this.usePostgreSQL && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (id, email, username, password_hash, full_name, provider, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET email = $2, username = $3, password_hash = $4, full_name = $5`,
          [
            user.id,
            user.email,
            user.username,
            user.passwordHash,
            user.fullName,
            user.provider || 'local',
            user.createdAt || new Date().toISOString()
          ]
        );
        return;
      } catch (err) {
        console.error('[PostgreSQL Save Notice]', err.message);
      }
    }

    // Fallback to JSON DB
    this.ensureDataDir();
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    fs.writeFileSync(JSON_FILE, JSON.stringify(users, null, 2), 'utf8');
  }
}

module.exports = new DatabaseAdapter();
