<?php
/*
 * me.php  (GET)
 * Tells the browser who is logged in (from the session cookie),
 * plus that player's saved coins and best day.
 * Returns { ok, username, coins, bestDay }.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';

$userId = require_login(); // stops with { ok: false } if nobody is logged in

$query = $db->prepare('SELECT username, coins, best_day FROM users WHERE id = ?');
$query->execute([$userId]);
$user = $query->fetch();

if (!$user) {
    send_json(['ok' => false, 'error' => 'Please log in first.']);
}

send_json([
    'ok'       => true,
    'username' => $user['username'],
    'coins'    => (int) $user['coins'],
    'bestDay'  => (int) $user['best_day'],
]);
