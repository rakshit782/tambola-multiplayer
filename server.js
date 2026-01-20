const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static('public'));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const games = new Map();
const users = new Map();

class TambolaGame {
  constructor(gameId, hostId, hostName, entryFee) {
    this.gameId = gameId;
    this.hostId = hostId;
    this.hostName = hostName;
    this.entryFee = entryFee;
    this.players = new Map();
    this.calledNumbers = [];
    this.status = 'waiting'; // waiting, active, finished
    this.winners = { earlyFive: null, topLine: null, middleLine: null, bottomLine: null, fullHouse: null };
    this.prizePool = 0;
  }

  addPlayer(playerId, playerName, ticket, paymentId) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      ticket: ticket,
      paymentId: paymentId,
      markedNumbers: []
    });
    this.prizePool += this.entryFee;
  }

  callNumber() {
    if (this.calledNumbers.length >= 90) return null;
    let number;
    do {
      number = Math.floor(Math.random() * 90) + 1;
    } while (this.calledNumbers.includes(number));
    this.calledNumbers.push(number);
    return number;
  }

  generateTicket() {
    const ticket = Array(3).fill(null).map(() => Array(9).fill(0));
    const columns = Array(9).fill(null).map((_, i) => {
      const min = i === 0 ? 1 : i * 10;
      const max = i === 8 ? 90 : (i + 1) * 10 - 1;
      const nums = [];
      for (let n = min; n <= max; n++) nums.push(n);
      return nums.sort(() => Math.random() - 0.5);
    });

    for (let row = 0; row < 3; row++) {
      let count = 0;
      const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 5; i++) {
        const col = positions[i];
        ticket[row][col] = columns[col].pop();
      }
    }

    return ticket;
  }

  verifyWin(playerId, claimType) {
    const player = this.players.get(playerId);
    if (!player) return false;

    const ticket = player.ticket;
    const marked = player.markedNumbers;

    switch (claimType) {
      case 'earlyFive':
        return marked.length >= 5;
      case 'topLine':
        return ticket[0].filter(n => n !== 0 && marked.includes(n)).length === 5;
      case 'middleLine':
        return ticket[1].filter(n => n !== 0 && marked.includes(n)).length === 5;
      case 'bottomLine':
        return ticket[2].filter(n => n !== 0 && marked.includes(n)).length === 5;
      case 'fullHouse':
        const allNumbers = ticket.flat().filter(n => n !== 0);
        return allNumbers.every(n => marked.includes(n));
      default:
        return false;
    }
  }
}

app.post('/api/create-game', async (req, res) => {
  const { hostName, entryFee } = req.body;
  const gameId = uuidv4().substring(0, 8).toUpperCase();
  const hostId = uuidv4();
  
  const game = new TambolaGame(gameId, hostId, hostName, entryFee || 100);
  games.set(gameId, game);
  
  res.json({ gameId, hostId, game });
});

app.post('/api/create-order', async (req, res) => {
  const { amount } = req.body;
  
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: uuidv4()
    });
    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-game', ({ gameId, playerId, playerName, paymentId }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    const ticket = game.generateTicket();
    game.addPlayer(playerId, playerName, ticket, paymentId);
    socket.join(gameId);
    users.set(socket.id, { gameId, playerId });

    socket.emit('ticket-generated', { ticket, playerId });
    io.to(gameId).emit('player-joined', {
      playerId,
      playerName,
      totalPlayers: game.players.size,
      prizePool: game.prizePool
    });
  });

  socket.on('start-game', ({ gameId, hostId }) => {
    const game = games.get(gameId);
    if (!game || game.hostId !== hostId) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    game.status = 'active';
    io.to(gameId).emit('game-started', { gameId });
  });

  socket.on('call-number', ({ gameId, hostId }) => {
    const game = games.get(gameId);
    if (!game || game.hostId !== hostId) return;

    const number = game.callNumber();
    if (number) {
      io.to(gameId).emit('number-called', { number, calledNumbers: game.calledNumbers });
    } else {
      io.to(gameId).emit('game-finished', { message: 'All numbers called' });
    }
  });

  socket.on('mark-number', ({ gameId, playerId, number }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.get(playerId);
    if (player && !player.markedNumbers.includes(number)) {
      player.markedNumbers.push(number);
    }
  });

  socket.on('claim-win', ({ gameId, playerId, claimType }) => {
    const game = games.get(gameId);
    if (!game || game.winners[claimType]) {
      socket.emit('claim-rejected', { message: 'Already claimed' });
      return;
    }

    const isValid = game.verifyWin(playerId, claimType);
    if (isValid) {
      game.winners[claimType] = playerId;
      const player = game.players.get(playerId);
      io.to(gameId).emit('winner-declared', {
        claimType,
        playerId,
        playerName: player.name
      });
    } else {
      socket.emit('claim-rejected', { message: 'Invalid claim' });
    }
  });

  socket.on('disconnect', () => {
    const userData = users.get(socket.id);
    if (userData) {
      const game = games.get(userData.gameId);
      if (game) {
        io.to(userData.gameId).emit('player-left', { playerId: userData.playerId });
      }
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});