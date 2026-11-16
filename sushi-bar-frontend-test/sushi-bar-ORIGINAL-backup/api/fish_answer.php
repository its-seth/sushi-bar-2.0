<?php
/*
 * fish_answer.php  (POST { puzzleId, choice })
 * Checks the player's answer against the one stored in their session.
 * Each puzzle can only be answered once, and only within PUZZLE_SECONDS_ALLOWED.
 * Returns { ok, correct, answer, fish, chests }.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_post();
require_login();

$body     = json_body();
$puzzleId = (string) ($body['puzzleId'] ?? '');
$choice   = (string) ($body['choice'] ?? '');

$puzzle = $_SESSION['puzzles'][$puzzleId] ?? null;
if ($puzzle === null) {
    respond(['ok' => false, 'error' => 'That puzzle has already been answered or doesn’t exist.'], 404);
}
unset($_SESSION['puzzles'][$puzzleId]); // one answer per puzzle: no second tries

$inTime  = (time() - $puzzle['created']) <= PUZZLE_SECONDS_ALLOWED;
$correct = $inTime && hash_equals($puzzle['answer'], $choice);

respond([
    'ok'      => true,
    'correct' => $correct,
    'answer'  => $puzzle['answer'],
    'fish'    => $puzzle['fish'],
    'chests'  => $puzzle['chests'],
]);
