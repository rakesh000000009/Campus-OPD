const DoctorModel = require('../models/doctorModel');
const AppointmentModel = require('../models/appointmentModel');
const UserModel = require('../models/userModel');
const QueueService = require('../services/queueService');

class DoctorDashboardController {
  static async getAppointments(req, res, next) {
    try {
      const doctorProfile = await DoctorModel.findByUserId(req.user.id);
      if (!doctorProfile) {
        return res.status(403).json({ error: 'Current user has no associated doctor profile' });
      }

      const date = req.query.date || new Date().toISOString().split('T')[0];
      const appointments = await AppointmentModel.getAllForDoctorToday(doctorProfile.id, date);

      return res.json({
        doctor: doctorProfile,
        date,
        appointments
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientDetails(req, res, next) {
    try {
      const patientId = parseInt(req.params.id, 10);
      const student = await UserModel.findById(patientId);
      if (!student) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Fetch patient's past appointments
      const history = await AppointmentModel.findByStudentId(patientId);

      return res.json({
        patient: student,
        history
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAppointmentStatus(req, res, next) {
    try {
      const appointmentId = parseInt(req.params.id, 10);
      const { status } = req.body;

      const validStatuses = ['BOOKED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check doctor ownership
      if (req.user.role === 'DOCTOR') {
        const doctorProfile = await DoctorModel.findByUserId(req.user.id);
        if (!doctorProfile || doctorProfile.id !== appointment.doctor_id) {
          return res.status(403).json({ error: 'You are not assigned to this appointment' });
        }
      }

      // If starting consultation (status -> IN_PROGRESS), check if another appointment is already IN_PROGRESS for this doctor
      if (status === 'IN_PROGRESS') {
        const existingServing = await AppointmentModel.findByDoctorAndDate(appointment.doctor_id, appointment.date);
        const inProgress = existingServing.find((a) => a.status === 'IN_PROGRESS' && a.id !== appointmentId);
        if (inProgress) {
          // Auto complete the previous one
          await QueueService.setStatus(inProgress.id, 'COMPLETED');
        }
      }

      const updated = await QueueService.setStatus(appointmentId, status);

      return res.json({
        message: `Appointment status updated to ${status}`,
        appointment: updated
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DoctorDashboardController;
