const db = require('../config/db');
const DoctorModel = require('../models/doctorModel');
const AppointmentModel = require('../models/appointmentModel');
const socketService = require('./socketService');

class QueueService {
  /**
   * Returns complete queue state for a doctor on a specific date.
   */
  static async getDoctorQueue(doctorId, date) {
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const appointmentsRes = await db.query(
      `SELECT a.*, 
              s.name AS student_name, s.email AS student_email, s.student_id AS student_roll_no
       FROM appointments a
       JOIN users s ON a.student_id = s.id
       WHERE a.doctor_id = $1 AND a.date = $2
       ORDER BY a.id ASC`,
      [doctorId, date]
    );

    const appointments = appointmentsRes.rows;

    const currentlyServing = appointments.find((a) => a.status === 'IN_PROGRESS') || null;
    const waitingQueue = appointments.filter((a) => a.status === 'WAITING' || a.status === 'BOOKED');
    const completedList = appointments.filter((a) => a.status === 'COMPLETED');
    const cancelledList = appointments.filter((a) => a.status === 'CANCELLED');

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        roomNumber: doctor.room_number,
        available: doctor.available
      },
      date,
      currentlyServing: currentlyServing
        ? {
            id: currentlyServing.id,
            tokenNumber: currentlyServing.token_number,
            studentName: currentlyServing.student_name,
            slot: currentlyServing.slot,
            status: currentlyServing.status
          }
        : null,
      waitingQueue: waitingQueue.map((a) => ({
        id: a.id,
        tokenNumber: a.token_number,
        studentName: a.student_name,
        slot: a.slot,
        status: a.status
      })),
      waitingCount: waitingQueue.length,
      completedCount: completedList.length,
      totalCount: appointments.length,
      appointments // full list for doctor/admin view
    };
  }

  /**
   * Calculates people ahead in line for a specific appointment.
   */
  static async calculatePeopleAhead(appointmentId, doctorId, date) {
    const appt = await AppointmentModel.findById(appointmentId);
    if (!appt || appt.status === 'COMPLETED' || appt.status === 'IN_PROGRESS' || appt.status === 'CANCELLED') {
      return 0;
    }

    // Check if there is someone currently IN_PROGRESS
    const currentRes = await db.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND date = $2 AND status = 'IN_PROGRESS'`,
      [doctorId, date]
    );
    const hasServing = currentRes.rows.length > 0;

    // Count people ahead who are WAITING or BOOKED with id < current appointment id
    const aheadRes = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = $1 AND date = $2 
         AND status IN ('WAITING', 'BOOKED')
         AND id < $3`,
      [doctorId, date, appointmentId]
    );
    const waitingAhead = parseInt(aheadRes.rows[0].count, 10);

    return waitingAhead + (hasServing ? 1 : 0);
  }

  /**
   * Advance queue for doctor:
   * Completes current IN_PROGRESS (if any), moves next WAITING to IN_PROGRESS.
   */
  static async advanceQueue(doctorId, date) {
    // 1. If someone is IN_PROGRESS, mark COMPLETED
    const currentRes = await db.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND date = $2 AND status = 'IN_PROGRESS'`,
      [doctorId, date]
    );
    if (currentRes.rows.length > 0) {
      const currentId = currentRes.rows[0].id;
      await AppointmentModel.updateStatus(currentId, 'COMPLETED');
    }

    // 2. Find next WAITING
    const nextRes = await db.query(
      `SELECT id FROM appointments 
       WHERE doctor_id = $1 AND date = $2 AND status IN ('WAITING', 'BOOKED')
       ORDER BY id ASC
       LIMIT 1`,
      [doctorId, date]
    );

    let nextAppt = null;
    if (nextRes.rows.length > 0) {
      const nextId = nextRes.rows[0].id;
      nextAppt = await AppointmentModel.updateStatus(nextId, 'IN_PROGRESS');
    }

    const updatedQueue = await this.getDoctorQueue(doctorId, date);
    socketService.emitQueueUpdate(doctorId, updatedQueue);

    return {
      message: nextAppt ? `Queue advanced to token ${nextAppt.token_number}` : 'No more waiting patients.',
      queue: updatedQueue
    };
  }

  /**
   * Set status directly (for Doctor actions: Start Consultation, Complete Consultation)
   */
  static async setStatus(appointmentId, status) {
    const updated = await AppointmentModel.updateStatus(appointmentId, status);
    if (!updated) {
      throw new Error('Appointment not found');
    }

    // Also notify queue
    const full = await AppointmentModel.findById(appointmentId);
    const queueData = await this.getDoctorQueue(full.doctor_id, full.date);
    socketService.emitQueueUpdate(full.doctor_id, queueData);
    socketService.emitAppointmentUpdate(full);

    return full;
  }
}

module.exports = QueueService;
