<?php
/*
 * fish_answer.php  (POST { puzzleId, choice })
 * Checks the player's answer against the one saved in their session.
 * Returns { ok, correct, fish }.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';
require_login();

$data     = read_json();
$puzzleId = $data['puzzleId'] ?? '';
$choice   = $data['choice'] ?? '';

if (!isset($_SESSION['puzzles'][$puzzleId])) {
    send_json(['ok' => false, 'error' => 'That puzzle doesn’t exist or was already answered.']);
}

$rightAnswer = $_SESSION['puzzles'][$puzzleId];
unset($_SESSION['puzzles'][$puzzleId]); // each puzzle can only be answered once

send_json([
    'ok'      => true,
    'correct' => (string) $choice === (string) $rightAnswer,
    'fish'    => $rightAnswer,
]);
