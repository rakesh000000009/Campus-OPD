const AppointmentModel = require('../models/appointmentModel');
const DoctorModel = require('../models/doctorModel');
const ScheduleModel = require('../models/scheduleModel');
const TokenService = require('../services/tokenService');
const QueueService = require('../services/queueService');
const socketService = require('../services/socketService');

class AppointmentController {
  static async create(req, res, next) {
    try {
      const studentId = req.user.id;
      const { doctorId, date, slot, symptoms, medicalHistory } = req.body;

      if (!doctorId || !date || !slot || !symptoms) {
        return res.status(400).json({
          error: 'Doctor, date, slot, and symptoms are required'
        });
      }

      // 1. Verify doctor exists and is available
      const doctor = await DoctorModel.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      if (!doctor.available) {
        return res.status(400).json({ error: 'Doctor is currently not available for bookings' });
      }

      // 2. Check schedule
      const schedule = await ScheduleModel.findByDoctorAndDate(doctorId, date);
      if (!schedule) {
        return res.status(400).json({ error: 'Doctor has no schedule available for the selected date' });
      }

      // 3. Check capacity limit
      const activeCount = await AppointmentModel.countBookedForDoctorAndDate(doctorId, date);
      if (activeCount >= schedule.max_patients) {
        return res.status(400).json({ error: 'Doctor schedule is full for this date' });
      }

      // 4. Check slot conflict (double booking)
      const existingSlot = await AppointmentModel.findActiveByDoctorAndSlot(doctorId, date, slot);
      if (existingSlot) {
        return res.status(409).json({ error: 'This time slot is already booked. Please choose another slot.' });
      }

      // 5. Generate token number
      const tokenNumber = await TokenService.generateToken(doctorId, date, doctor.room_number);

      // 6. Create appointment
      const newAppointment = await AppointmentModel.create({
        student_id: studentId,
        doctor_id: doctorId,
        date,
        slot,
        token_number: tokenNumber,
        status: 'WAITING',
        symptoms,
        medical_history: medicalHistory || ''
      });

      // 7. Calculate queue position and people ahead
      const peopleAhead = await QueueService.calculatePeopleAhead(newAppointment.id, doctorId, date);

      // 8. Trigger real-time queue update
      const updatedQueue = await QueueService.getDoctorQueue(doctorId, date);
      socketService.emitQueueUpdate(doctorId, updatedQueue);

      return res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: {
          id: newAppointment.id,
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialization: doctor.specialization,
          roomNumber: doctor.room_number,
          date: newAppointment.date,
          slot: newAppointment.slot,
          tokenNumber: newAppointment.token_number,
          status: newAppointment.status,
          peopleAhead,
          symptoms: newAppointment.symptoms,
          medicalHistory: newAppointment.medical_history
        }
      });
    } catch (err) {
      if (err.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ error: 'This time slot was just booked by another student. Please pick another.' });
      }
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const appointment = await AppointmentModel.findById(id);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Ensure students only see their own appointments (doctors and admins can view any)
      if (req.user.role === 'STUDENT' && appointment.student_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You cannot view another student’s appointment' });
      }

      const peopleAhead = await QueueService.calculatePeopleAhead(
        appointment.id,
        appointment.doctor_id,
        appointment.date
      );

      return res.json({
        ...appointment,
        peopleAhead
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyAppointments(req, res, next) {
    try {
      const studentId = req.user.id;
      const appointments = await AppointmentModel.findByStudentId(studentId);

      // Enhance with real-time people ahead
      const enhanced = await Promise.all(
        appointments.map(async (a) => {
          const peopleAhead = await QueueService.calculatePeopleAhead(a.id, a.doctor_id, a.date);
          return {
            ...a,
            peopleAhead
          };
        })
      );

      return res.json(enhanced);
    } catch (err) {
      next(err);
    }
  }

  static async getUpcoming(req, res, next) {
    try {
      const studentId = req.user.id;
      const today = new Date().toISOString().split('T')[0];
      const upcoming = await AppointmentModel.getUpcomingByStudent(studentId, today);

      if (!upcoming) {
        return res.json({ upcoming: null });
      }

      const peopleAhead = await QueueService.calculatePeopleAhead(
        upcoming.id,
        upcoming.doctor_id,
        upcoming.date
      );

      return res.json({
        upcoming: {
          ...upcoming,
          peopleAhead
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const appointment = await AppointmentModel.findById(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (req.user.role === 'STUDENT' && appointment.student_id !== req.user.id) {
        return res.status(403).json({ error: 'You are not authorized to cancel this appointment' });
      }

      if (appointment.status === 'COMPLETED') {
        return res.status(400).json({ error: 'Cannot cancel an already completed appointment' });
      }

      const updated = await AppointmentModel.updateStatus(id, 'CANCELLED');

      // Refresh queue
      const updatedQueue = await QueueService.getDoctorQueue(appointment.doctor_id, appointment.date);
      socketService.emitQueueUpdate(appointment.doctor_id, updatedQueue);

      return res.json({
        message: 'Appointment cancelled successfully',
        appointment: updated
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
