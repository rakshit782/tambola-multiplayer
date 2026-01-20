-- Tambola Global Multi-User Database Schema

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  country_code VARCHAR(2),
  preferred_currency VARCHAR(3) DEFAULT 'USD',
  preferred_language VARCHAR(5) DEFAULT 'en',
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  total_games_played INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Games Table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  game_code VARCHAR(10) UNIQUE NOT NULL,
  host_user_id INT REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  ticket_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  max_tickets INT DEFAULT 100,
  tickets_sold INT DEFAULT 0,
  prize_early_five DECIMAL(10, 2),
  prize_top_line DECIMAL(10, 2),
  prize_middle_line DECIMAL(10, 2),
  prize_bottom_line DECIMAL(10, 2),
  prize_full_house DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, active, completed, cancelled
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  ended_at TIMESTAMP,
  region VARCHAR(50),
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  user_id INT REFERENCES users(id),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  grid_data JSONB NOT NULL, -- Stores the 3x9 ticket grid
  purchase_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game Numbers Called
CREATE TABLE game_numbers (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  number_called INT NOT NULL,
  called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_by INT REFERENCES users(id)
);

-- Claims Table
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  game_id INT REFERENCES games(id),
  user_id INT REFERENCES users(id),
  ticket_id INT REFERENCES tickets(id),
  claim_type VARCHAR(20) NOT NULL, -- early_five, top_line, middle_line, bottom_line, full_house
  is_valid BOOLEAN,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  prize_amount DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending' -- pending, approved, rejected
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  transaction_type VARCHAR(20) NOT NULL, -- deposit, ticket_purchase, prize_win, withdrawal
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_gateway VARCHAR(20),
  payment_id VARCHAR(255),
  game_id INT REFERENCES games(id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_host ON games(host_user_id);
CREATE INDEX idx_tickets_game ON tickets(game_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_game_numbers_game ON game_numbers(game_id);
CREATE INDEX idx_claims_game ON claims(game_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
