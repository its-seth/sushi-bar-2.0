<?php
/*
 * save_score.php  (POST { score, day })
 * Saves a finished game for the logged-in player. The player is identified by
 * the session cookie, never by a username sent from the browser.
 *
 * Note for the video: the score itself still comes from the browser, so a
 * determined player could fake it. A stronger design would have the server
 * track coins as each dish is served.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_post();
$user = require_login();

$body  = json_body();
$score = filter_var($body['score'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100000]]);
$day   = filter_var($body['day'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000]]);

if ($score === false || $day === false) {
    respond(['ok' => false, 'error' => 'That score doesn’t look right.'], 422);
}

$insert = db()->prepare('INSERT INTO scores (user_id, score, day) VALUES (?, ?, ?)');
$insert->execute([$user['id'], $score, $day]);

respond(['ok' => true]);
