const DoctorModel = require('../models/doctorModel');
const ScheduleModel = require('../models/scheduleModel');
const AppointmentModel = require('../models/appointmentModel');

function parseTimeToMinutes(timeStr) {
  // Accepts "09:00", "09:00:00", "9:00"
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function formatMinutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH < 10 ? '0' : ''}${displayH}:${displayM} ${ampm}`;
}

class DoctorController {
  static async getAll(req, res, next) {
    try {
      const doctors = await DoctorModel.getAll();
      return res.json(doctors);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const doctor = await DoctorModel.findById(id);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      return res.json(doctor);
    } catch (err) {
      next(err);
    }
  }

  static async getSlots(req, res, next) {
    try {
      const doctorId = parseInt(req.params.id, 10);
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
      }

      const doctor = await DoctorModel.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      if (!doctor.available) {
        return res.json({
          available: false,
          reason: 'Doctor is currently marked as unavailable',
          slots: []
        });
      }

      const schedule = await ScheduleModel.findByDoctorAndDate(doctorId, date);
      if (!schedule) {
        return res.json({
          available: false,
          reason: 'No schedule configured for this doctor on selected date',
          slots: []
        });
      }

      // Generate slots from start_time to end_time
      const startMin = parseTimeToMinutes(schedule.start_time);
      const endMin = parseTimeToMinutes(schedule.end_time);
      const duration = schedule.slot_duration || 15;
      const maxPatients = schedule.max_patients || 20;

      // Fetch booked slots
      const existingAppointments = await AppointmentModel.findByDoctorAndDate(doctorId, date);
      const activeAppointments = existingAppointments.filter((a) => a.status !== 'CANCELLED');
      const bookedSlotsSet = new Set(activeAppointments.map((a) => a.slot));

      const isCapacityReached = activeAppointments.length >= maxPatients;

      const slots = [];
      for (let min = startMin; min < endMin; min += duration) {
        const slotLabel = formatMinutesToTime(min);
        const isBooked = bookedSlotsSet.has(slotLabel);
        const isAvailable = !isBooked && !isCapacityReached;

        slots.push({
          time: slotLabel,
          available: isAvailable,
          isBooked,
          isFull: !isBooked && isCapacityReached
        });
      }

      return res.json({
        available: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          roomNumber: doctor.room_number
        },
        date,
        capacityReached: isCapacityReached,
        maxPatients,
        bookedCount: activeAppointments.length,
        slots
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DoctorController;
