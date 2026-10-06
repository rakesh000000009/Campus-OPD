const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev / preview simplicity
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    // Client can subscribe to a specific doctor's queue room
    socket.on('join_doctor_queue', (doctorId) => {
      socket.join(`doctor_${doctorId}`);
    });

    socket.on('leave_doctor_queue', (doctorId) => {
      socket.leave(`doctor_${doctorId}`);
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emitQueueUpdate(doctorId, queueData) {
  if (!io) return;
  // Broadcast to doctor-specific room and global queue channel
  io.to(`doctor_${doctorId}`).emit('queue_update', queueData);
  io.emit('global_queue_update', { doctorId, ...queueData });
}

function emitAppointmentUpdate(appointment) {
  if (!io) return;
  io.emit('appointment_updated', appointment);
}

module.exports = {
  initSocket,
  getIo,
  emitQueueUpdate,
  emitAppointmentUpdate
};
