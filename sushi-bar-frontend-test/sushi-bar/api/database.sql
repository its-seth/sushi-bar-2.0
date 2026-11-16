-- database.sql
-- Creates the Seaside Sushi Bar database. Run it once in phpMyAdmin (SQL tab).
-- (Already made the database before? Run upgrade.sql instead.)
-- Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
-- Reviewed and adapted by: <your name>

CREATE DATABASE IF NOT EXISTS sushi_bar
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sushi_bar;

-- One row per player.
--   password_hash: only a bcrypt hash, never the real password
--   coins:         the player's saved coins (kept between games)
--   best_day:      the furthest day the player has reached
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  coins         INT          NOT NULL DEFAULT 0,
  best_day      INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
