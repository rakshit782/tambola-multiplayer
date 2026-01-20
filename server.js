// Tambola Multiplayer Server - Owner-Based System
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
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
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

app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/game-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game-room.html'));
});

app.get('/host-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host-dashboard.html'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    system: 'owner-based (55%-30%-15%)'
  });
});

// API Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

try {
  const gameRoutes = require('./routes/game');
  app.use('/api/game', gameRoutes);
  console.log('✓ Game routes loaded (Owner-Based System)');
} catch (error) {
  console.log('ℹ️  Game routes not yet available');
}

try {
  const paymentRoutes = require('./routes/payment');
  app.use('/api/payment', paymentRoutes);
  console.log('✓ Payment routes loaded');
} catch (error) {
  console.log('ℹ️  Payment routes not yet available');
}

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================

const activeGames = new Map();

function initializeGame(gameCode, gameData) {
  activeGames.set(gameCode, {
    ...gameData,
    players: new Map(),
    calledNumbers: [],
    prizes: {
      early_five: { claimed: false, winner: null },
      top_line: { claimed: false, winner: null },
      middle_line: { claimed: false, winner: null },
      bottom_line: { claimed: false, winner: null },
      full_house: { claimed: false, winner: null }
    },
    numberCallInterval: null,
    status: 'waiting'
  });
}

function startAutoNumberCalling(gameCode) {
  const game = activeGames.get(gameCode);
  if (!game || game.numberCallInterval) return;
  
  const availableNumbers = Array.from({length: 90}, (_, i) => i + 1);
  
  game.numberCallInterval = setInterval(() => {
    if (game.calledNumbers.length >= 90) {
      endGame(gameCode);
      return;
    }
    
    // Pick random uncalled number
    const remaining = availableNumbers.filter(n => !game.calledNumbers.includes(n));
    if (remaining.length === 0) {
      endGame(gameCode);
      return;
    }
    
    const number = remaining[Math.floor(Math.random() * remaining.length)];
    game.calledNumbers.push(number);
    
    // Broadcast to all players in game
    io.to(gameCode).emit('number-called', {
      number,
      totalCalled: game.calledNumbers.length,
      calledNumbers: game.calledNumbers
    });
    
    console.log(`[${gameCode}] Number called: ${number} (${game.calledNumbers.length}/90)`);
  }, 3000); // Call every 3 seconds
}

function endGame(gameCode) {
  const game = activeGames.get(gameCode);
  if (!game) return;
  
  if (game.numberCallInterval) {
    clearInterval(game.numberCallInterval);
    game.numberCallInterval = null;
  }
  
  game.status = 'completed';
  
  io.to(gameCode).emit('game-ended', {
    prizes: game.prizes,
    calledNumbers: game.calledNumbers,
    message: 'Game completed!'
  });
  
  console.log(`[${gameCode}] Game ended`);
  
  // Clean up after 5 minutes
  setTimeout(() => {
    activeGames.delete(gameCode);
  }, 300000);
}

// ==========================================
// SOCKET.IO CONNECTION HANDLING
// ==========================================

io.on('connection', (socket) => {
  console.log('\x1b[32m%s\x1b[0m', `✓ Client connected: ${socket.id}`);

  // Join Game Room
  socket.on('join-game', (data) => {
    const { gameCode, playerName, userId } = data;
    
    socket.join(gameCode);
    
    let game = activeGames.get(gameCode);
    if (!game) {
      initializeGame(gameCode, { gameCode });
      game = activeGames.get(gameCode);
    }
    
    game.players.set(socket.id, {
      socketId: socket.id,
      playerName,
      userId,
      joinedAt: new Date()
    });
    
    console.log(`[${gameCode}] Player ${playerName} joined (${game.players.size} players)`);
    
    // Send current game state to new player
    socket.emit('game-state', {
      gameCode,
      calledNumbers: game.calledNumbers,
      prizes: game.prizes,
      playerCount: game.players.size,
      status: game.status
    });
    
    // Notify other players
    socket.to(gameCode).emit('player-joined', {
      playerName,
      playerCount: game.players.size
    });
  });

  // Start Game (when min tickets sold)
  socket.on('start-game', (data) => {
    const { gameCode, gameData } = data;
    
    let game = activeGames.get(gameCode);
    if (!game) {
      initializeGame(gameCode, gameData);
      game = activeGames.get(gameCode);
    }
    
    game.status = 'active';
    
    io.to(gameCode).emit('game-started', {
      message: 'Game is starting!',
      gameCode,
      prizePool: gameData.prizePool
    });
    
    console.log(`[${gameCode}] Game started - Auto-calling numbers`);
    
    // Start auto number calling
    startAutoNumberCalling(gameCode);
  });

  // Mark Number on Ticket (auto-mark when number called)
  socket.on('mark-number', (data) => {
    const { gameCode, ticketNumber, number } = data;
    console.log(`[${gameCode}] Ticket ${ticketNumber} marked ${number}`);
    
    socket.emit('number-marked', {
      ticketNumber,
      number,
      success: true
    });
  });

  // Claim Prize
  socket.on('claim-prize', async (data) => {
    const { gameCode, ticketNumber, prizeType, userId, markedNumbers } = data;
    
    const game = activeGames.get(gameCode);
    if (!game) {
      socket.emit('claim-result', { success: false, error: 'Game not found' });
      return;
    }
    
    // Check if prize already claimed
    if (game.prizes[prizeType]?.claimed) {
      socket.emit('claim-result', { 
        success: false, 
        error: 'Prize already claimed',
        winner: game.prizes[prizeType].winner
      });
      return;
    }
    
    // Verify pattern (simplified - should call API)
    const isValid = verifyPattern(prizeType, markedNumbers, game.calledNumbers);
    
    if (!isValid) {
      socket.emit('claim-result', { 
        success: false, 
        error: 'Invalid claim - pattern not complete'
      });
      return;
    }
    
    // Mark prize as claimed
    game.prizes[prizeType] = {
      claimed: true,
      winner: userId,
      ticketNumber,
      claimedAt: new Date()
    };
    
    const player = Array.from(game.players.values()).find(p => p.userId === userId);
    
    // Notify all players
    io.to(gameCode).emit('prize-claimed', {
      prizeType,
      winner: player?.playerName || 'Unknown',
      ticketNumber
    });
    
    socket.emit('claim-result', {
      success: true,
      prizeType,
      message: `Congratulations! You won ${prizeType}!`
    });
    
    console.log(`[${gameCode}] ${prizeType} claimed by ${player?.playerName}`);
    
    // Check if all prizes claimed
    const allClaimed = Object.values(game.prizes).every(p => p.claimed);
    if (allClaimed) {
      endGame(gameCode);
    }
  });

  // Get Game Statistics
  socket.on('get-stats', (data) => {
    const { gameCode } = data;
    const game = activeGames.get(gameCode);
    
    if (game) {
      socket.emit('game-stats', {
        playerCount: game.players.size,
        numbersCalled: game.calledNumbers.length,
        prizesRemaining: Object.values(game.prizes).filter(p => !p.claimed).length,
        status: game.status
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('\x1b[31m%s\x1b[0m', `✗ Client disconnected: ${socket.id}`);
    
    // Remove player from all games
    activeGames.forEach((game, gameCode) => {
      if (game.players.has(socket.id)) {
        const player = game.players.get(socket.id);
        game.players.delete(socket.id);
        
        socket.to(gameCode).emit('player-left', {
          playerName: player.playerName,
          playerCount: game.players.size
        });
        
        console.log(`[${gameCode}] Player ${player.playerName} left (${game.players.size} remaining)`);
      }
    });
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function verifyPattern(prizeType, markedNumbers, calledNumbers) {
  // Ensure all marked numbers were actually called
  const allMarkedCalled = markedNumbers.every(num => calledNumbers.includes(num));
  if (!allMarkedCalled) return false;
  
  switch (prizeType) {
    case 'early_five':
      return markedNumbers.length >= 5 && calledNumbers.length <= 30;
    case 'full_house':
      return markedNumbers.length === 15; // All 15 numbers on ticket
    default:
      return markedNumbers.length >= 5; // Lines have 5 numbers
  }
}

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', '\n================================================');
  console.log('\x1b[35m%s\x1b[0m', '   🎲 TAMBOLA LIVE - OWNER-BASED SYSTEM 🎲');
  console.log('\x1b[36m%s\x1b[0m', '================================================');
  console.log('\x1b[32m%s\x1b[0m', `✓ Server: http://localhost:${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `✓ Environment: ${NODE_ENV}`);
  console.log('\x1b[32m%s\x1b[0m', `✓ Socket.IO: Ready (Auto number calling)`);
  console.log('\x1b[32m%s\x1b[0m', `✓ System: Owner-Based (55%-30%-15%)`);
  console.log('\x1b[36m%s\x1b[0m', '================================================');
  console.log('\x1b[33m%s\x1b[0m', '\n📊 REVENUE SPLIT:');
  console.log('\x1b[36m%s\x1b[0m', '   🏆 Winners: 55%');
  console.log('\x1b[36m%s\x1b[0m', '   💼 Owner: 30%');
  console.log('\x1b[36m%s\x1b[0m', '   🏢 Platform: 15%');
  console.log('\x1b[33m%s\x1b[0m', '\n🎮 GAME SETTINGS:');
  console.log('\x1b[36m%s\x1b[0m', '   📋 Tickets: 10-15 per game');
  console.log('\x1b[36m%s\x1b[0m', '   💵 Price: $5-$50 per ticket');
  console.log('\x1b[36m%s\x1b[0m', '   ⏱️  Auto-call: Every 3 seconds');
  console.log('\x1b[36m%s\x1b[0m', '   ✅ Auto-claim: Instant verification');
  console.log('\x1b[33m%s\x1b[0m', '\n👉 OPEN YOUR BROWSER:');
  console.log('\x1b[1m%s\x1b[0m', `   http://localhost:${PORT}`);
  console.log('\x1b[1m%s\x1b[0m', `   http://localhost:${PORT}/auth`);
  console.log('\x1b[1m%s\x1b[0m', `   http://localhost:${PORT}/host-dashboard\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\x1b[33m%s\x1b[0m', '\n⚠️  SIGTERM signal received: closing server');
  
  // Stop all active games
  activeGames.forEach((game, gameCode) => {
    if (game.numberCallInterval) {
      clearInterval(game.numberCallInterval);
    }
  });
  
  server.close(() => {
    console.log('\x1b[32m%s\x1b[0m', '✓ Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
