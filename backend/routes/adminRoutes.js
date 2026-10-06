const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/overview', AdminController.getOverview);

// Doctor management
router.get('/doctors', AdminController.getAllDoctors);
router.post('/doctors', AdminController.createDoctor);
router.patch('/doctors/:id', AdminController.updateDoctor);

// Schedule management
router.get('/schedules', AdminController.getAllSchedules);
router.post('/schedules', AdminController.createSchedule);
router.patch('/schedules/:id', AdminController.updateSchedule);
router.delete('/schedules/:id', AdminController.deleteSchedule);

// Queue advance
router.post('/queue/:doctorId/next', AdminController.advanceQueue);

module.exports = router;
