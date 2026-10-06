const db = require('../config/db');

class DoctorModel {
  static async getAll(availableOnly = false) {
    let sql = `
      SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.room_number, d.available, d.created_at
      FROM doctors d
      JOIN users u ON d.user_id = u.id
    `;
    if (availableOnly) {
      sql += ' WHERE d.available = TRUE';
    }
    sql += ' ORDER BY d.id ASC';
    const res = await db.query(sql);
    return res.rows;
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.room_number, d.available, d.created_at
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findByUserId(userId) {
    const res = await db.query(
      `SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.room_number, d.available, d.created_at
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  static async create({ user_id, specialization, room_number, available = true }) {
    const res = await db.query(
      `INSERT INTO doctors (user_id, specialization, room_number, available)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, specialization, room_number, available]
    );
    return res.rows[0];
  }

  static async update(id, { specialization, room_number, available }) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const newSpec = specialization !== undefined ? specialization : existing.specialization;
    const newRoom = room_number !== undefined ? room_number : existing.room_number;
    const newAvail = available !== undefined ? available : existing.available;

    const res = await db.query(
      `UPDATE doctors
       SET specialization = $1, room_number = $2, available = $3
       WHERE id = $4
       RETURNING *`,
      [newSpec, newRoom, newAvail, id]
    );
    return res.rows[0];
  }
}

module.exports = DoctorModel;
