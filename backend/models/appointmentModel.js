const db = require('../config/db');

class AppointmentModel {
  static async create({
    student_id,
    doctor_id,
    date,
    slot,
    token_number,
    status = 'WAITING',
    symptoms,
    medical_history = ''
  }) {
    const res = await db.query(
      `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history]
    );
    return res.rows[0];
  }

  static async findById(id) {
    const res = await db.query(
      `SELECT a.*, 
              s.name AS student_name, s.email AS student_email, s.student_id AS student_roll_no,
              d.room_number, d.specialization,
              u.name AS doctor_name, u.email AS doctor_email
       FROM appointments a
       JOIN users s ON a.student_id = s.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async findByDoctorAndDate(doctorId, date) {
    const res = await db.query(
      `SELECT a.*, 
              s.name AS student_name, s.email AS student_email, s.student_id AS student_roll_no,
              d.room_number, d.specialization,
              u.name AS doctor_name
       FROM appointments a
       JOIN users s ON a.student_id = s.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.doctor_id = $1 AND a.date = $2
       ORDER BY a.id ASC`,
      [doctorId, date]
    );
    return res.rows;
  }

  static async findActiveByDoctorAndSlot(doctorId, date, slot) {
    const res = await db.query(
      `SELECT * FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND slot = $3 AND status != 'CANCELLED'`,
      [doctorId, date, slot]
    );
    return res.rows[0] || null;
  }

  static async findByStudentId(studentId) {
    const res = await db.query(
      `SELECT a.*, 
              d.room_number, d.specialization,
              u.name AS doctor_name, u.email AS doctor_email
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.student_id = $1
       ORDER BY a.date DESC, a.id DESC`,
      [studentId]
    );
    return res.rows;
  }

  static async getUpcomingByStudent(studentId, currentDate) {
    const res = await db.query(
      `SELECT a.*, 
              d.room_number, d.specialization,
              u.name AS doctor_name, u.email AS doctor_email
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.student_id = $1 
         AND a.date >= $2
         AND a.status IN ('BOOKED', 'WAITING', 'IN_PROGRESS')
       ORDER BY a.date ASC, a.id ASC
       LIMIT 1`,
      [studentId, currentDate]
    );
    return res.rows[0] || null;
  }

  static async updateStatus(id, status) {
    const res = await db.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  static async countBookedForDoctorAndDate(doctorId, date) {
    const res = await db.query(
      `SELECT COUNT(*) as count FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND status != 'CANCELLED'`,
      [doctorId, date]
    );
    return parseInt(res.rows[0].count, 10);
  }

  static async getAllForDoctorToday(doctorId, date) {
    const res = await db.query(
      `SELECT a.*, 
              s.name AS student_name, s.email AS student_email, s.student_id AS student_roll_no,
              d.room_number, d.specialization
       FROM appointments a
       JOIN users s ON a.student_id = s.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.doctor_id = $1 AND a.date = $2
       ORDER BY 
         CASE a.status 
           WHEN 'IN_PROGRESS' THEN 1 
           WHEN 'WAITING' THEN 2 
           WHEN 'BOOKED' THEN 3
           WHEN 'COMPLETED' THEN 4
           WHEN 'CANCELLED' THEN 5
         END, a.id ASC`,
      [doctorId, date]
    );
    return res.rows;
  }
}

module.exports = AppointmentModel;
