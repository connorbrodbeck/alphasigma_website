-- Run this once in MySQL Workbench or CLI to set up the database

CREATE DATABASE IF NOT EXISTS alphasigma;
USE alphasigma;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  force_password_change TINYINT(1) NOT NULL DEFAULT 1
);

-- If DB already exists, run: ALTER TABLE users ADD COLUMN force_password_change TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS holdings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('stock', 'etf') NOT NULL,
  position ENUM('long', 'short') NOT NULL,
  purchase_price DECIMAL(10, 4) NOT NULL,
  close_price DECIMAL(10, 4) NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- If DB already exists, run: server/scripts/add_close_position.sql
