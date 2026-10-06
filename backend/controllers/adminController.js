const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const DoctorModel = require('../models/doctorModel');
const ScheduleModel = require('../models/scheduleModel');
const AppointmentModel = require('../models/appointmentModel');
const QueueService = require('../services/queueService');
const db = require('../config/db');

class AdminController {
  static async getOverview(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const usersCountRes = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['STUDENT']);
      const doctorsCountRes = await db.query('SELECT COUNT(*) as count FROM doctors');
      const todayApptsRes = await db.query(
        'SELECT status, COUNT(*) as count FROM appointments WHERE date = $1 GROUP BY status',
        [today]
      );

      const statusCounts = {
        total: 0,
        waiting: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
      };

      todayApptsRes.rows.forEach((r) => {
        const c = parseInt(r.count, 10);
        statusCounts.total += c;
        if (r.status === 'WAITING' || r.status === 'BOOKED') statusCounts.waiting += c;
        if (r.status === 'IN_PROGRESS') statusCounts.inProgress += c;
        if (r.status === 'COMPLETED') statusCounts.completed += c;
        if (r.status === 'CANCELLED') statusCounts.cancelled += c;
      });

      return res.json({
        studentsCount: parseInt(usersCountRes.rows[0].count, 10),
        doctorsCount: parseInt(doctorsCountRes.rows[0].count, 10),
        today: {
          date: today,
          ...statusCounts
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // Doctor Management
  static async getAllDoctors(req, res, next) {
    try {
      const doctors = await DoctorModel.getAll(false);
      return res.json(doctors);
    } catch (err) {
      next(err);
    }
  }

  static async createDoctor(req, res, next) {
    try {
      const { name, email, password, specialization, roomNumber, available = true } = req.body;

      if (!name || !email || !password || !specialization || !roomNumber) {
        return res.status(400).json({
          error: 'Name, email, password, specialization, and roomNumber are required'
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const user = await UserModel.create({
        name,
        email,
        password_hash,
        role: 'DOCTOR'
      });

      const doctor = await DoctorModel.create({
        user_id: user.id,
        specialization,
        room_number: roomNumber,
        available: available === undefined ? true : Boolean(available)
      });

      return res.status(201).json({
        message: 'Doctor created successfully',
        doctor: {
          id: doctor.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          specialization: doctor.specialization,
          roomNumber: doctor.room_number,
          available: doctor.available
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateDoctor(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { specialization, roomNumber, available, name } = req.body;

      const existingDoctor = await DoctorModel.findById(id);
      if (!existingDoctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      if (name) {
        await db.query('UPDATE users SET name = $1 WHERE id = $2', [name, existingDoctor.user_id]);
      }

      const updated = await DoctorModel.update(id, {
        specialization,
        room_number: roomNumber,
        available
      });

      const fullDoctor = await DoctorModel.findById(id);

      return res.json({
        message: 'Doctor updated successfully',
        doctor: fullDoctor
      });
    } catch (err) {
      next(err);
    }
  }

  // Schedule Management
  static async getAllSchedules(req, res, next) {
    try {
      const schedules = await ScheduleModel.getAll();
      return res.json(schedules);
    } catch (err) {
      next(err);
    }
  }

  static async createSchedule(req, res, next) {
    try {
      const { doctorId, date, startTime, endTime, slotDuration, maxPatients } = req.body;

      if (!doctorId || !date || !startTime || !endTime) {
        return res.status(400).json({
          error: 'Doctor, date, startTime, and endTime are required'
        });
      }

      const doctor = await DoctorModel.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      // Check existing schedule for this doctor and date
      const existing = await ScheduleModel.findByDoctorAndDate(doctorId, date);
      if (existing) {
        return res.status(409).json({
          error: `A schedule already exists for ${doctor.name} on ${date}. Please edit the existing schedule.`
        });
      }

      const newSchedule = await ScheduleModel.create({
        doctor_id: doctorId,
        date,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration ? parseInt(slotDuration, 10) : 15,
        max_patients: maxPatients ? parseInt(maxPatients, 10) : 20
      });

      const fullSchedule = await ScheduleModel.findById(newSchedule.id);

      return res.status(201).json({
        message: 'Schedule created successfully',
        schedule: fullSchedule
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSchedule(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const { date, startTime, endTime, slotDuration, maxPatients } = req.body;

      const existing = await ScheduleModel.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const updated = await ScheduleModel.update(id, {
        date,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration !== undefined ? parseInt(slotDuration, 10) : undefined,
        max_patients: maxPatients !== undefined ? parseInt(maxPatients, 10) : undefined
      });

      const fullSchedule = await ScheduleModel.findById(id);

      return res.json({
        message: 'Schedule updated successfully',
        schedule: fullSchedule
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const schedule = await ScheduleModel.findById(id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      await ScheduleModel.delete(id);
      return res.json({ message: 'Schedule deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Queue Monitor & Advance
  static async advanceQueue(req, res, next) {
    try {
      const doctorId = parseInt(req.params.doctorId, 10);
      const date = req.body.date || new Date().toISOString().split('T')[0];

      const result = await QueueService.advanceQueue(doctorId, date);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
