// Tambola Multiplayer Server
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API Routes (to be added)
try {
  const gameRoutes = require('./routes/game');
  const paymentRoutes = require('./routes/payment');
  
  app.use('/api/game', gameRoutes);
  app.use('/api/payment', paymentRoutes);
} catch (error) {
  console.log('⚠️  Note: Some route files not found yet. They will be created when you run the app.');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('\x1b[32m%s\x1b[0m', `✓ Client connected: ${socket.id}`);

  socket.on('join-game', (data) => {
    const { gameCode } = data;
    socket.join(gameCode);
    console.log(`Player ${socket.id} joined game: ${gameCode}`);
    
    // Notify other players
    socket.to(gameCode).emit('player-joined', {
      playerId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('call-number', (data) => {
    const { gameCode, number } = data;
    io.to(gameCode).emit('number-called', {
      number,
      timestamp: new Date()
    });
    console.log(`Number ${number} called in game ${gameCode}`);
  });

  socket.on('claim-prize', (data) => {
    const { gameCode, claimType, ticketNumber } = data;
    console.log(`Prize claim: ${claimType} by ${ticketNumber} in ${gameCode}`);
    
    // Verify claim (simplified for now)
    socket.emit('claim-result', {
      valid: true,
      claimType,
      prizeAmount: 100,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('\x1b[31m%s\x1b[0m', `✗ Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', '\n========================================');
  console.log('\x1b[35m%s\x1b[0m', '   🎲 TAMBOLA LIVE SERVER RUNNING 🎲');
  console.log('\x1b[36m%s\x1b[0m', '========================================');
  console.log('\x1b[32m%s\x1b[0m', `✓ Server: http://localhost:${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `✓ Environment: ${NODE_ENV}`);
  console.log('\x1b[32m%s\x1b[0m', `✓ Socket.IO: Ready`);
  console.log('\x1b[36m%s\x1b[0m', '========================================\n');
  console.log('\x1b[33m%s\x1b[0m', '👉 Open your browser and visit:');
  console.log('\x1b[1m%s\x1b[0m', `   http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\x1b[33m%s\x1b[0m', '\n⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('\x1b[32m%s\x1b[0m', '✓ HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
