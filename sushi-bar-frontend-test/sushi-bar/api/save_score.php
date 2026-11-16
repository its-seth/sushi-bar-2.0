<?php
/*
 * save_score.php  (POST { score, day })
 * Saves a finished game for the logged-in player.
 * WHO the player is comes from the session, never from the browser's data,
 * so you can't save a score under someone else's name.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';
$userId = require_login();

$data  = read_json();
$score = max(0, (int) ($data['score'] ?? 0));
$day   = max(1, (int) ($data['day'] ?? 1));

$query = $db->prepare('INSERT INTO scores (user_id, score, day) VALUES (?, ?, ?)');
$query->execute([$userId, $score, $day]);

send_json(['ok' => true]);
