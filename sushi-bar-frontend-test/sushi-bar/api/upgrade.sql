-- upgrade.sql
-- ONLY if you created the database with the OLD database.sql: run this once in phpMyAdmin.
-- It adds the two new columns to the users table. Existing accounts are kept.
-- Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>

USE sushi_bar;

ALTER TABLE users
  ADD COLUMN coins    INT NOT NULL DEFAULT 0,
  ADD COLUMN best_day INT NOT NULL DEFAULT 0;

-- The old "scores" table is not used any more.
DROP TABLE IF EXISTS scores;
