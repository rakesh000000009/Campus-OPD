const express = require('express');
const router = express.Router();
const QueueController = require('../controllers/queueController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/:doctorId', QueueController.getQueue);
router.post('/:doctorId/next', authenticate, authorize('DOCTOR', 'ADMIN'), QueueController.advanceNext);

module.exports = router;
