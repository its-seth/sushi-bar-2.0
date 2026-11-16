<?php
/*
 * leaderboard.php  (GET)
 * Returns the 10 best games, with the player's username.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';
require_login();

// JOIN links each score to its user (scores.user_id = users.id) to get the username.
$rows = $db->query(
    'SELECT users.username, scores.score, scores.day
       FROM scores
       JOIN users ON users.id = scores.user_id
      ORDER BY scores.score DESC
      LIMIT 10'
)->fetchAll();

send_json(['ok' => true, 'rows' => $rows]);
