const express = require('express');
const router = express.Router();
const DoctorDashboardController = require('../controllers/doctorDashboardController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('DOCTOR', 'ADMIN'));

router.get('/appointments', DoctorDashboardController.getAppointments);
router.get('/patients/:id', DoctorDashboardController.getPatientDetails);
router.patch('/appointments/:id/status', DoctorDashboardController.updateAppointmentStatus);

module.exports = router;
