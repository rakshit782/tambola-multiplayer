// Temporary Authentication Routes for Testing
const express = require('express');
const router = express.Router();

// Temporary in-memory user storage (for testing only)
const users = [
  {
    id: 1,
    username: 'host_demo',
    email: 'host@tambola.com',
    password: 'host123',
    role: 'host',
    balance: 5000,
    gamesHosted: 15
  },
  {
    id: 2,
    username: 'player_demo',
    email: 'player@tambola.com',
    password: 'player123',
    role: 'user',
    balance: 250,
    gamesPlayed: 42
  },
  {
    id: 3,
    username: 'john_doe',
    email: 'john@example.com',
    password: 'test123',
    role: 'user',
    balance: 100,
    gamesPlayed: 8
  }
];

let nextUserId = 4;
const sessions = {}; // Simple session storage

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid email or password' 
    });
  }
  
  // Create session token
  const token = 'temp_token_' + Math.random().toString(36).substr(2, 9);
  sessions[token] = user.id;
  
  // Return user data (excluding password)
  const { password: _, ...userData } = user;
  
  res.json({
    success: true,
    token,
    user: userData
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  const { username, email, password, role } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: 'Email already registered'
    });
  }
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({
      success: false,
      error: 'Username already taken'
    });
  }
  
  // Create new user
  const newUser = {
    id: nextUserId++,
    username,
    email,
    password, // In production, hash this!
    role: role || 'user',
    balance: 100, // Starting balance
    gamesPlayed: 0,
    gamesHosted: 0
  };
  
  users.push(newUser);
  
  // Create session
  const token = 'temp_token_' + Math.random().toString(36).substr(2, 9);
  sessions[token] = newUser.id;
  
  // Return user data
  const { password: _, ...userData } = newUser;
  
  res.json({
    success: true,
    token,
    user: userData
  });
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
  
  const userId = sessions[token];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const { password: _, ...userData } = user;
  
  res.json({
    success: true,
    user: userData
  });
});

// Logout
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && sessions[token]) {
    delete sessions[token];
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get test accounts (for demo purposes)
router.get('/test-accounts', (req, res) => {
  res.json({
    success: true,
    accounts: [
      {
        type: 'Host',
        email: 'host@tambola.com',
        password: 'host123',
        description: 'Use this to create and manage games'
      },
      {
        type: 'Player',
        email: 'player@tambola.com',
        password: 'player123',
        description: 'Use this to join and play games'
      }
    ]
  });
});

module.exports = router;
