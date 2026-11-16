<?php
/*
 * save_progress.php  (POST { coins, day })
 * Saves the logged-in player's coins, and their best day if this one is further.
 * Called at the end of every day and at game over.
 * WHO the player is comes from the session, never from the browser's data,
 * so you can't save coins to someone else's account.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';
$userId = require_login();

$data  = read_json();
$coins = max(0, (int) ($data['coins'] ?? 0));
$day   = max(1, (int) ($data['day'] ?? 1));

// GREATEST keeps whichever is bigger: the saved best day or this day.
$query = $db->prepare('UPDATE users SET coins = ?, best_day = GREATEST(best_day, ?) WHERE id = ?');
$query->execute([$coins, $day, $userId]);

send_json(['ok' => true]);
