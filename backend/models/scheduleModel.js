const db = require('../config/db');

class ScheduleModel {
  static async findByDoctorAndDate(doctorId, date) {
    const res = await db.query(
      `SELECT s.*, d.room_number, d.specialization, u.name as doctor_name
       FROM doctor_schedules s
       JOIN doctors d ON s.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE s.doctor_id = $1 AND s.date = $2`,
      [doctorId, date]
    );
    return res.rows[0] || null;
  }

  static async findByDoctor(doctorId) {
    const res = await db.query(
      `SELECT s.*, d.room_number, d.specialization, u.name as doctor_name
       FROM doctor_schedules s
       JOIN doctors d ON s.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE s.doctor_id = $1
       ORDER BY s.date ASC, s.start_time ASC`,
      [doctorId]
    );
    return res.rows;
  }

  static async getAll() {
    const res = await db.query(
      `SELECT s.*, d.room_number, d.specialization, u.name as doctor_name
       FROM doctor_schedules s
       JOIN doctors d ON s.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       ORDER BY s.date DESC, s.start_time ASC`
    );
    return res.rows;
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT s.*, d.room_number, d.specialization, u.name as doctor_name
       FROM doctor_schedules s
       JOIN doctors d ON s.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create({ doctor_id, date, start_time, end_time, slot_duration = 15, max_patients = 20 }) {
    const res = await db.query(
      `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [doctor_id, date, start_time, end_time, slot_duration, max_patients]
    );
    return res.rows[0];
  }

  static async update(id, { date, start_time, end_time, slot_duration, max_patients }) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const res = await db.query(
      `UPDATE doctor_schedules
       SET date = COALESCE($1, date),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           slot_duration = COALESCE($4, slot_duration),
           max_patients = COALESCE($5, max_patients)
       WHERE id = $6
       RETURNING *`,
      [date, start_time, end_time, slot_duration, max_patients, id]
    );
    return res.rows[0];
  }

  static async delete(id) {
    const res = await db.query('DELETE FROM doctor_schedules WHERE id = $1 RETURNING *', [id]);
    return res.rows[0] || null;
  }
}

module.exports = ScheduleModel;
