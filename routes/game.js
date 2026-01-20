// Owner-Based Game System
// Revenue Split: 55% Prizes | 30% Owner | 15% Platform
const express = require('express');
const router = express.Router();
const { pgPool, redis } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ==========================================
// GAME CREATION (Any player becomes owner)
// ==========================================

router.post('/create', authenticate, async (req, res) => {
  const { title, ticketPrice, maxTickets } = req.body;
  const ownerId = req.user.id;
  
  try {
    // Validate inputs
    if (ticketPrice < 5 || ticketPrice > 50) {
      return res.status(400).json({ error: 'Ticket price must be between $5 and $50' });
    }
    
    if (maxTickets < 10 || maxTickets > 15) {
      return res.status(400).json({ error: 'Max tickets must be between 10 and 15' });
    }
    
    // Generate unique game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Calculate revenue split (per ticket)
    const prizePool = ticketPrice * 0.55;  // 55% to prizes
    const ownerCommission = ticketPrice * 0.30;  // 30% to owner
    const platformFee = ticketPrice * 0.15;  // 15% to platform
    
    // Prize distribution from prize pool
    const prizes = {
      earlyFive: prizePool * 0.15,   // 15% of prize pool
      topLine: prizePool * 0.25,     // 25% of prize pool
      middleLine: prizePool * 0.25,  // 25% of prize pool
      bottomLine: prizePool * 0.25,  // 25% of prize pool
      fullHouse: prizePool * 0.10    // 10% of prize pool
    };
    
    const result = await pgPool.query(
      `INSERT INTO games (
        game_code, owner_user_id, title, ticket_price, max_tickets, min_tickets,
        prize_pool_percentage, owner_commission_percentage, platform_fee_percentage,
        prize_early_five, prize_top_line, prize_middle_line, prize_bottom_line, prize_full_house,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *`,
      [
        gameCode, ownerId, title, ticketPrice, maxTickets, 10,
        55, 30, 15,
        prizes.earlyFive, prizes.topLine, prizes.middleLine, prizes.bottomLine, prizes.fullHouse,
        'waiting'
      ]
    );
    
    const game = result.rows[0];
    
    // Cache game in Redis for quick access
    await redis.set(`game:${gameCode}`, JSON.stringify(game), 'EX', 86400);
    
    res.json({ 
      success: true, 
      game: {
        ...game,
        revenue_split: {
          prize_pool: `${(prizePool * maxTickets).toFixed(2)} (55%)`,
          owner_commission: `${(ownerCommission * maxTickets).toFixed(2)} (30%)`,
          platform_fee: `${(platformFee * maxTickets).toFixed(2)} (15%)`
        }
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// ==========================================
// GET AVAILABLE GAMES (Browse)
// ==========================================

router.get('/available', async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT g.*, u.username as owner_name,
        (SELECT COUNT(*) FROM tickets WHERE game_id = g.id AND payment_status = 'completed') as tickets_sold
       FROM games g 
       JOIN users u ON g.owner_user_id = u.id 
       WHERE g.status IN ('waiting', 'active')
       ORDER BY g.created_at DESC 
       LIMIT 20`
    );
    
    const games = result.rows.map(game => ({
      ...game,
      is_filling: game.tickets_sold < game.min_tickets,
      can_join: game.tickets_sold < game.max_tickets,
      starts_at: game.tickets_sold >= game.min_tickets ? 'Ready to start' : `${game.min_tickets - game.tickets_sold} more needed`
    }));
    
    res.json({ success: true, games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// ==========================================
// GET SINGLE GAME DETAILS
// ==========================================

router.get('/:gameCode', async (req, res) => {
  const { gameCode } = req.params;
  
  try {
    // Try Redis cache first
    let game = await redis.get(`game:${gameCode}`);
    
    if (game) {
      game = JSON.parse(game);
    } else {
      // Fetch from database
      const result = await pgPool.query(
        `SELECT g.*, u.username as owner_name,
          (SELECT COUNT(*) FROM tickets WHERE game_id = g.id AND payment_status = 'completed') as tickets_sold,
          (SELECT json_agg(json_build_object('username', u2.username, 'tickets', count(*)))
           FROM tickets t 
           JOIN users u2 ON t.user_id = u2.id 
           WHERE t.game_id = g.id AND t.payment_status = 'completed'
           GROUP BY u2.username) as players
         FROM games g 
         JOIN users u ON g.owner_user_id = u.id 
         WHERE g.game_code = $1`,
        [gameCode]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      game = result.rows[0];
      await redis.set(`game:${gameCode}`, JSON.stringify(game), 'EX', 300); // Cache 5 min
    }
    
    res.json({ success: true, game });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// ==========================================
// BUY TICKETS (Players join game)
// ==========================================

router.post('/buy-tickets', authenticate, async (req, res) => {
  const { gameCode, ticketCount } = req.body;
  const userId = req.user.id;
  
  try {
    // Validate ticket count
    if (ticketCount < 1 || ticketCount > 15) {
      return res.status(400).json({ error: 'Can buy 1-15 tickets per player' });
    }
    
    // Get game details
    const gameResult = await pgPool.query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM tickets WHERE game_id = g.id AND payment_status = 'completed') as tickets_sold
       FROM games g 
       WHERE g.game_code = $1 AND g.status IN ('waiting', 'active')`,
      [gameCode]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or already completed' });
    }
    
    const game = gameResult.rows[0];
    const remainingSlots = game.max_tickets - game.tickets_sold;
    
    if (ticketCount > remainingSlots) {
      return res.status(400).json({ 
        error: `Only ${remainingSlots} tickets available`,
        available: remainingSlots
      });
    }
    
    // Calculate total cost
    const totalCost = game.ticket_price * ticketCount;
    
    // Create escrow entry
    const escrowResult = await pgPool.query(
      `INSERT INTO escrow_accounts (
        game_id, total_collected, prize_pool, owner_commission, platform_fee, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (game_id) DO UPDATE SET
        total_collected = escrow_accounts.total_collected + $2,
        prize_pool = escrow_accounts.prize_pool + $3,
        owner_commission = escrow_accounts.owner_commission + $4,
        platform_fee = escrow_accounts.platform_fee + $5
      RETURNING *`,
      [
        game.id,
        totalCost,
        totalCost * 0.55,  // 55% to prize pool
        totalCost * 0.30,  // 30% to owner
        totalCost * 0.15   // 15% to platform
      ]
    );
    
    // Generate tickets
    const tickets = [];
    for (let i = 0; i < ticketCount; i++) {
      const ticketGrid = generateTambolaTicket();
      const ticketNumber = `${gameCode}-T${Date.now()}-${i}`;
      
      const ticketResult = await pgPool.query(
        `INSERT INTO tickets (
          game_id, user_id, ticket_number, grid_data, purchase_price, payment_status
        ) VALUES ($1, $2, $3, $4, $5, 'completed')
        RETURNING *`,
        [game.id, userId, ticketNumber, JSON.stringify(ticketGrid), game.ticket_price]
      );
      
      tickets.push({
        ticket_number: ticketNumber,
        grid: ticketGrid
      });
    }
    
    // Update tickets sold count
    const newTicketsSold = game.tickets_sold + ticketCount;
    await pgPool.query(
      'UPDATE games SET tickets_sold = $1 WHERE id = $2',
      [newTicketsSold, game.id]
    );
    
    // Check if game should start (minimum 10 tickets)
    let gameStarted = false;
    if (newTicketsSold >= game.min_tickets && game.status === 'waiting') {
      await pgPool.query(
        'UPDATE games SET status = $1, started_at = NOW() WHERE id = $2',
        ['active', game.id]
      );
      gameStarted = true;
    }
    
    // Invalidate cache
    await redis.del(`game:${gameCode}`);
    
    res.json({ 
      success: true, 
      tickets,
      total_cost: totalCost,
      game_status: gameStarted ? 'started' : 'waiting',
      tickets_sold: newTicketsSold,
      message: gameStarted ? 'Game is starting!' : `${game.min_tickets - newTicketsSold} more tickets needed to start`
    });
    
  } catch (error) {
    console.error('Error buying tickets:', error);
    res.status(500).json({ error: 'Failed to purchase tickets' });
  }
});

// ==========================================
// CLAIM PRIZE (Auto-verification)
// ==========================================

router.post('/claim-prize', authenticate, async (req, res) => {
  const { gameCode, ticketNumber, prizeType } = req.body;
  const userId = req.user.id;
  
  try {
    // Get game and ticket
    const result = await pgPool.query(
      `SELECT g.*, t.*, t.grid_data, t.marked_numbers
       FROM games g
       JOIN tickets t ON g.id = t.game_id
       WHERE g.game_code = $1 AND t.ticket_number = $2 AND t.user_id = $3`,
      [gameCode, ticketNumber, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const game = result.rows[0];
    const ticket = result.rows[0];
    
    // Verify pattern
    const isValid = verifyPattern(ticket.grid_data, ticket.marked_numbers, prizeType);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid claim - pattern not complete' });
    }
    
    // Check if prize already claimed
    const prizeCheck = await pgPool.query(
      'SELECT * FROM prize_claims WHERE game_id = $1 AND prize_type = $2',
      [game.id, prizeType]
    );
    
    if (prizeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Prize already claimed' });
    }
    
    // Get prize amount
    const prizeField = `prize_${prizeType.toLowerCase().replace(' ', '_')}`;
    const prizeAmount = game[prizeField];
    
    // Transfer from escrow to player
    await pgPool.query(
      `INSERT INTO prize_claims (
        game_id, user_id, ticket_number, prize_type, amount, claimed_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [game.id, userId, ticketNumber, prizeType, prizeAmount]
    );
    
    // Update player balance
    await pgPool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [prizeAmount, userId]
    );
    
    // Update escrow
    await pgPool.query(
      'UPDATE escrow_accounts SET prizes_distributed = prizes_distributed + $1 WHERE game_id = $2',
      [prizeAmount, game.id]
    );
    
    res.json({ 
      success: true, 
      prize: prizeType,
      amount: prizeAmount,
      message: `Congratulations! You won $${prizeAmount}!`
    });
    
  } catch (error) {
    console.error('Error claiming prize:', error);
    res.status(500).json({ error: 'Failed to claim prize' });
  }
});

// ==========================================
// END GAME & SETTLE (Distribute owner commission)
// ==========================================

router.post('/end-game', authenticate, async (req, res) => {
  const { gameCode } = req.body;
  
  try {
    const gameResult = await pgPool.query(
      'SELECT * FROM games WHERE game_code = $1 AND status = $2',
      [gameCode, 'active']
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or not active' });
    }
    
    const game = gameResult.rows[0];
    
    // Get escrow details
    const escrowResult = await pgPool.query(
      'SELECT * FROM escrow_accounts WHERE game_id = $1',
      [game.id]
    );
    
    const escrow = escrowResult.rows[0];
    
    // Pay owner commission
    await pgPool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [escrow.owner_commission, game.owner_user_id]
    );
    
    // Mark game as completed
    await pgPool.query(
      'UPDATE games SET status = $1, ended_at = NOW() WHERE id = $2',
      ['completed', game.id]
    );
    
    // Mark escrow as settled
    await pgPool.query(
      'UPDATE escrow_accounts SET status = $1, settled_at = NOW() WHERE game_id = $2',
      ['settled', game.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Game ended successfully',
      owner_commission: escrow.owner_commission,
      prizes_distributed: escrow.prizes_distributed
    });
    
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Generate Tambola Ticket (3x9 grid, 15 numbers)
function generateTambolaTicket() {
  const grid = Array(3).fill().map(() => Array(9).fill(0));
  const numbersPerRow = 5;
  
  // Each column: 0:1-9, 1:10-19, 2:20-29, ..., 8:80-90
  for (let col = 0; col < 9; col++) {
    const min = col === 0 ? 1 : col * 10;
    const max = col === 8 ? 90 : (col + 1) * 10 - 1;
    
    // Get available numbers for this column
    const availableNumbers = [];
    for (let i = min; i <= max; i++) {
      availableNumbers.push(i);
    }
    
    // Shuffle
    availableNumbers.sort(() => Math.random() - 0.5);
    
    // Decide how many numbers in this column (1-3)
    const count = Math.floor(Math.random() * 3) + 1;
    const selected = availableNumbers.slice(0, count).sort((a, b) => a - b);
    
    // Place in random rows
    const availableRows = [0, 1, 2].sort(() => Math.random() - 0.5);
    selected.forEach((num, idx) => {
      if (idx < availableRows.length) {
        grid[availableRows[idx]][col] = num;
      }
    });
  }
  
  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    const rowNumbers = grid[row].filter(n => n > 0);
    while (rowNumbers.length < numbersPerRow) {
      // Add more numbers
      const emptyCol = grid[row].findIndex(n => n === 0);
      if (emptyCol !== -1) {
        const min = emptyCol === 0 ? 1 : emptyCol * 10;
        const max = emptyCol === 8 ? 90 : (emptyCol + 1) * 10 - 1;
        grid[row][emptyCol] = Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }
    while (rowNumbers.length > numbersPerRow) {
      // Remove numbers
      const filledCol = grid[row].findIndex(n => n > 0);
      if (filledCol !== -1) grid[row][filledCol] = 0;
    }
  }
  
  return grid;
}

// Verify winning pattern
function verifyPattern(gridData, markedNumbers, prizeType) {
  const grid = JSON.parse(gridData);
  const marked = JSON.parse(markedNumbers || '[]');
  
  switch (prizeType) {
    case 'early_five':
      return marked.length >= 5;
      
    case 'top_line':
      return grid[0].every(num => num === 0 || marked.includes(num));
      
    case 'middle_line':
      return grid[1].every(num => num === 0 || marked.includes(num));
      
    case 'bottom_line':
      return grid[2].every(num => num === 0 || marked.includes(num));
      
    case 'full_house':
      return grid.flat().every(num => num === 0 || marked.includes(num));
      
    default:
      return false;
  }
}

module.exports = router;
