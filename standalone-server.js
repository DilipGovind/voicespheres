const http = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track rooms and participants in memory
  const roomsState = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room
    socket.on('room:join', ({ roomId, user }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;

      if (!roomsState.has(roomId)) {
        roomsState.set(roomId, new Map());
      }
      roomsState.get(roomId).set(user.id, user);

      // Broadcast join to peers in this room
      socket.to(roomId).emit('user:joined', { roomId, user });
      console.log(`[Socket] User ${user.name} joined room ${roomId}`);
    });

    // Leave room
    socket.on('room:leave', ({ roomId, userId }) => {
      socket.leave(roomId);
      if (roomsState.has(roomId)) {
        roomsState.get(roomId).delete(userId);
      }
      socket.to(roomId).emit('user:left', { roomId, userId });
      console.log(`[Socket] User ${userId} left room ${roomId}`);
    });

    // Mute toggle
    socket.on('user:mute', ({ userId, isMuted }) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('user:mute', { userId, isMuted });
      }
    });

    // Speaking toggle
    socket.on('user:speaking', ({ userId, isSpeaking }) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('user:speaking', { userId, isSpeaking });
      }
    });

    // Hand raise toggle
    socket.on('user:hand', ({ userId, isRaised }) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('user:hand', { userId, isRaised });
      }
    });

    // Real-time caption broadcast
    socket.on('caption:new', (caption) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('caption:new', caption);
      }
    });

    // Chat message broadcast
    socket.on('chat:message', (message) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('chat:message', message);
      }
    });

    // Stage progression
    socket.on('stage:change', (data) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('stage:change', data);
      }
    });

    // Moderator action
    socket.on('moderator:action', (action) => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit('moderator:action', action);
      }
    });

    // WebRTC Peer-to-Peer Signaling (Offer, Answer, ICE Candidate)
    socket.on('rtc:signal', ({ targetUserId, signal }) => {
      io.to(targetUserId).emit('rtc:signal', {
        senderUserId: socket.data.user?.id,
        signal,
      });
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      const user = socket.data.user;
      if (roomId && user) {
        if (roomsState.has(roomId)) {
          roomsState.get(roomId).delete(user.id);
        }
        socket.to(roomId).emit('user:left', { roomId, userId: user.id });
        console.log(`[Socket] User ${user.name} disconnected from room ${roomId}`);
      }
    });
  });

  server.listen(port, () => {
    console.log(`> VoiceSphere running on http://${hostname}:${port}`);
  });
});
