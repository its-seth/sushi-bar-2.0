<?php
/*
 * leaderboard.php  (GET)
 * Returns the 10 players with the most coins. Each player appears ONCE,
 * because we read from the users table (one row per player).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';
require_login();

// best_day > 0 hides players who have never finished a day.
$rows = $db->query(
    'SELECT username, coins, best_day
       FROM users
      WHERE best_day > 0
      ORDER BY coins DESC
      LIMIT 10'
)->fetchAll();

send_json(['ok' => true, 'rows' => $rows]);
