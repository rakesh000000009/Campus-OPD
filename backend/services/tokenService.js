const db = require('../config/db');

class TokenService {
  /**
   * Generates a token like 'A-17' based on doctor and appointment sequence for the day.
   */
  static async generateToken(doctorId, date, roomNumber = '101') {
    // Determine letter prefix from doctor or room
    let prefix = 'A';
    if (roomNumber) {
      const match = roomNumber.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        prefix = String.fromCharCode(65 + ((num - 101) % 26));
      }
    }
    if (!prefix || prefix.charCodeAt(0) < 65 || prefix.charCodeAt(0) > 90) {
      prefix = String.fromCharCode(65 + ((doctorId - 1) % 26));
    }

    // Get sequence count of appointments booked for this doctor on this date
    const countRes = await db.query(
      `SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND date = $2`,
      [doctorId, date]
    );
    const seq = parseInt(countRes.rows[0].count, 10) + 1;

    return `${prefix}-${seq}`;
  }
}

module.exports = TokenService;
