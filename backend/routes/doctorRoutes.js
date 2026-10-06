const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');

router.get('/', DoctorController.getAll);
router.get('/:id', DoctorController.getById);
router.get('/:id/slots', DoctorController.getSlots);

module.exports = router;
