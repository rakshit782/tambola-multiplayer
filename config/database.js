// Database Configuration for Multi-Region Setup
const { Pool } = require('pg');
const Redis = require('ioredis');

// PostgreSQL Connection Pool
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tambola_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Multi-region replication settings
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis for real-time game state and caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3
});

// Redis Pub/Sub for cross-server communication
const redisPub = redis.duplicate();
const redisSub = redis.duplicate();

module.exports = {
  pgPool,
  redis,
  redisPub,
  redisSub
};
