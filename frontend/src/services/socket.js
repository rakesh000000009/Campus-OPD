import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    // In dev with Vite proxy, connecting to current origin works seamlessly
    socket = io({
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('Real-time Socket.IO connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Real-time Socket.IO disconnected');
    });
  }
  return socket;
}

export function subscribeToDoctorQueue(doctorId, onQueueUpdate) {
  const s = getSocket();
  s.emit('join_doctor_queue', doctorId);

  const handler = (data) => {
    onQueueUpdate(data);
  };

  s.on('queue_update', handler);

  return () => {
    s.emit('leave_doctor_queue', doctorId);
    s.off('queue_update', handler);
  };
}
