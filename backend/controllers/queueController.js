const QueueService = require('../services/queueService');

class QueueController {
  static async getQueue(req, res, next) {
    try {
      const doctorId = parseInt(req.params.doctorId, 10);
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const appointmentId = req.query.appointmentId ? parseInt(req.query.appointmentId, 10) : null;

      const queueData = await QueueService.getDoctorQueue(doctorId, date);

      let userPosition = null;
      if (appointmentId) {
        const peopleAhead = await QueueService.calculatePeopleAhead(appointmentId, doctorId, date);
        userPosition = {
          appointmentId,
          peopleAhead
        };
      }

      return res.json({
        ...queueData,
        userPosition
      });
    } catch (err) {
      next(err);
    }
  }

  static async advanceNext(req, res, next) {
    try {
      const doctorId = parseInt(req.params.doctorId, 10);
      const date = req.body.date || req.query.date || new Date().toISOString().split('T')[0];

      const result = await QueueService.advanceQueue(doctorId, date);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QueueController;
