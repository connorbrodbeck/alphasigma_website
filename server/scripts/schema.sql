-- Run this once in the Supabase SQL editor to create your tables

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  force_password_change BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS holdings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('stock', 'etf')),
  position VARCHAR(10) NOT NULL CHECK (position IN ('long', 'short')),
  purchase_price DECIMAL(10, 4) NOT NULL,
  close_price DECIMAL(10, 4) NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
