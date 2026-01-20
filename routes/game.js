// Game Management Routes
const express = require('express');
const router = express.Router();
const { pgPool, redis } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { createPaymentOrder } = require('../config/payment');

// Create New Game (Host)
router.post('/create', authenticate, async (req, res) => {
  const { title, ticketPrice, currency, maxTickets, prizes } = req.body;
  const hostId = req.user.id;
  
  try {
    // Generate unique game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await pgPool.query(
      `INSERT INTO games (game_code, host_user_id, title, ticket_price, currency, max_tickets,
       prize_early_five, prize_top_line, prize_middle_line, prize_bottom_line, prize_full_house)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [gameCode, hostId, title, ticketPrice, currency, maxTickets,
       prizes.earlyFive, prizes.topLine, prizes.middleLine, prizes.bottomLine, prizes.fullHouse]
    );
    
    // Cache game in Redis
    await redis.set(`game:${gameCode}`, JSON.stringify(result.rows[0]), 'EX', 86400);
    
    res.json({ success: true, game: result.rows[0] });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Get Active Games
router.get('/active', async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT g.*, u.username as host_name 
       FROM games g 
       JOIN users u ON g.host_user_id = u.id 
       WHERE g.status IN ('waiting', 'active') 
       ORDER BY g.created_at DESC LIMIT 50`
    );
    res.json({ games: result.rows });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Buy Ticket
router.post('/buy-ticket', authenticate, async (req, res) => {
  const { gameCode } = req.body;
  const userId = req.user.id;
  
  try {
    // Get game details
    const gameResult = await pgPool.query(
      'SELECT * FROM games WHERE game_code = $1 AND status = $2',
      [gameCode, 'waiting']
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or already started' });
    }
    
    const game = gameResult.rows[0];
    
    if (game.tickets_sold >= game.max_tickets) {
      return res.status(400).json({ error: 'Game is full' });
    }
    
    // Generate unique ticket with Tambola grid
    const ticketGrid = generateTambolaTicket();
    const ticketNumber = `T${game.id}${Date.now()}`;
    
    // Create payment order
    const paymentOrder = await createPaymentOrder(
      game.ticket_price,
      game.currency,
      userId,
      game.id
    );
    
    // Save ticket with pending payment
    await pgPool.query(
      `INSERT INTO tickets (game_id, user_id, ticket_number, grid_data, purchase_price, currency, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [game.id, userId, ticketNumber, JSON.stringify(ticketGrid), game.ticket_price, game.currency, paymentOrder.orderId]
    );
    
    res.json({ 
      success: true, 
      ticket: { number: ticketNumber, grid: ticketGrid },
      payment: paymentOrder
    });
  } catch (error) {
    console.error('Error buying ticket:', error);
    res.status(500).json({ error: 'Failed to purchase ticket' });
  }
});

// Generate Tambola Ticket (3x9 grid)
function generateTambolaTicket() {
  const grid = Array(3).fill().map(() => Array(9).fill(0));
  
  // Each column can have numbers: 0:1-9, 1:10-19, 2:20-29, etc.
  for (let col = 0; col < 9; col++) {
    const min = col === 0 ? 1 : col * 10;
    const max = col === 8 ? 90 : (col + 1) * 10 - 1;
    const numbers = [];
    
    for (let i = min; i <= max; i++) {
      numbers.push(i);
    }
    
    // Shuffle and pick 3 numbers per column (or 2 for some columns)
    const count = col === 0 || col === 8 ? 1 : (Math.random() > 0.5 ? 2 : 3);
    const selected = numbers.sort(() => Math.random() - 0.5).slice(0, count);
    selected.sort((a, b) => a - b);
    
    let row = 0;
    selected.forEach(num => {
      while (grid[row][col] !== 0 && row < 3) row++;
      if (row < 3) grid[row][col] = num;
      row++;
    });
  }
  
  return grid;
}

module.exports = router;
