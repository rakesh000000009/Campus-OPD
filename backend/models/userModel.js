const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const res = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await db.query(
      'SELECT id, name, email, role, student_id, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  static async create({ name, email, password_hash, role, student_id = null }) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, student_id, created_at`,
      [name, email.toLowerCase(), password_hash, role, student_id]
    );
    return res.rows[0];
  }

  static async getAll() {
    const res = await db.query('SELECT id, name, email, role, student_id, created_at FROM users ORDER BY id ASC');
    return res.rows;
  }
}

module.exports = UserModel;
