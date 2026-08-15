import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { RoomManager } from './roomManager.js';
import { searchMovies } from './movieApi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'movie-bite', time: new Date().toISOString() });
});

app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string) || '';
  try {
    const results = await searchMovies(query);
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Fehler bei der Filmsuche' });
  }
});

app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Raum nicht gefunden' });
  }
  res.json(room);
});

// Socket.IO Real-Time Handlers
io.on('connection', (socket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('create_room', (data: { name: string; avatar: string }, callback) => {
    const playerId = socket.id;
    currentPlayerId = playerId;
    const room = roomManager.createRoom({
      id: playerId,
      name: data.name,
      avatar: data.avatar
    });
    currentRoomCode = room.code;
    socket.join(room.code);
    if (callback) callback({ success: true, room, playerId });
  });

  socket.on('join_room', (data: { code: string; name: string; avatar: string; playerId?: string }, callback) => {
    const code = data.code.toUpperCase().trim();
    const playerId = data.playerId || socket.id;
    currentPlayerId = playerId;
    
    const result = roomManager.joinRoom(code, {
      id: playerId,
      name: data.name,
      avatar: data.avatar
    });

    if ('error' in result) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    currentRoomCode = code;
    socket.join(code);
    io.to(code).emit('room_updated', result);
    if (callback) callback({ success: true, room: result, playerId });
  });

  socket.on('toggle_ready', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const updated = roomManager.toggleReady(currentRoomCode, currentPlayerId);
    if (updated) {
      io.to(currentRoomCode).emit('room_updated', updated);
    }
  });

  socket.on('start_phase', (phase) => {
    if (!currentRoomCode) return;
    const updated = roomManager.setPhase(currentRoomCode, phase);
    if (updated) {
      io.to(currentRoomCode).emit('room_updated', updated);
    }
  });

  socket.on('add_movie', (movie, callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const result = roomManager.addMovieSuggestion(currentRoomCode, currentPlayerId, movie);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }
    if (result.room) {
      io.to(currentRoomCode).emit('room_updated', result.room);
      if (callback) callback({ success: true, room: result.room });
    }
  });

  socket.on('remove_movie', (movieId: string) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const updated = roomManager.removeMovieSuggestion(currentRoomCode, currentPlayerId, movieId);
    if (updated) {
      io.to(currentRoomCode).emit('room_updated', updated);
    }
  });

  socket.on('submit_votes', (votes, callback) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const updated = roomManager.submitVotes(currentRoomCode, currentPlayerId, votes);
    if (updated) {
      io.to(currentRoomCode).emit('room_updated', updated);
      if (callback) callback({ success: true });
    }
  });

  socket.on('restart_game', () => {
    if (!currentRoomCode) return;
    const updated = roomManager.restartGame(currentRoomCode);
    if (updated) {
      io.to(currentRoomCode).emit('room_updated', updated);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const updated = roomManager.leaveRoom(currentRoomCode, currentPlayerId);
      if (updated) {
        io.to(currentRoomCode).emit('room_updated', updated);
      }
    }
  });
});

// Serve frontend build in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🎬 Movie-Bite Server läuft auf http://localhost:${PORT}`);
});
