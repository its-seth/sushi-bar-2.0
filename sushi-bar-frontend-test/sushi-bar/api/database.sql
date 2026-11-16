-- database.sql
-- Creates the Seaside Sushi Bar database. Run it once in phpMyAdmin (SQL tab).
-- Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>

CREATE DATABASE IF NOT EXISTS sushi_bar
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sushi_bar;

-- One row per player account. Passwords are never stored, only a bcrypt hash.
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One row per finished game. Belongs to a user.
CREATE TABLE IF NOT EXISTS scores (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT      NOT NULL,
  score     INT      NOT NULL,
  day       INT      NOT NULL,
  played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_score (score)
);
