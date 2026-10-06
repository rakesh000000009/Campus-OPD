const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, AppointmentController.create);
router.get('/my', authenticate, AppointmentController.getMyAppointments);
router.get('/upcoming', authenticate, AppointmentController.getUpcoming);
router.get('/:id', authenticate, AppointmentController.getById);
router.patch('/:id/cancel', authenticate, AppointmentController.cancel);

module.exports = router;
