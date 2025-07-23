import { Server } from 'socket.io';

const socketIO = {
  io: null,
};

export const initSocket = (server) => {
  if (!socketIO.io) {
    console.log('🔌 Initializing Socket.IO server...');
    socketIO.io = new Server(server, {
      path: '/api/socket_io',
      addTrailingSlash: false,
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    socketIO.io.on('connection', (socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`🚪 Client ${socket.id} joined room: ${room}`);
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`🚪 Client ${socket.id} left room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔥 Client disconnected: ${socket.id}`);
      });
    });
    console.log('✅ Socket.IO server initialized');
  }
  return socketIO.io;
};

export const getSocket = () => {
  if (!socketIO.io) {
    throw new Error('Socket.IO not initialized');
  }
  return socketIO.io;
};

