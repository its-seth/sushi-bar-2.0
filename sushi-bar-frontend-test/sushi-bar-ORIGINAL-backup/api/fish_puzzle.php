<?php
/*
 * fish_puzzle.php  (GET)
 * Gets a crate from the Fish Game API, picks a question about it and sends the
 * picture, question and two options to the browser.
 *
 * The correct answer is NOT sent. It is kept in the player's session on the
 * server, so it can't be read in the browser's developer tools.
 * Returns { ok, puzzleId, image, question, options: [a, b] }.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/fish_client.php';
require_login();

try {
    $crate = fetch_fish_crate();
} catch (RuntimeException $e) {
    error_log($e->getMessage());
    respond(['ok' => false, 'error' => 'The fish supplier can’t be reached right now.'], 502);
}

$fish   = $crate['fish'];
$chests = $crate['chests']; // null if the API didn't give a chest count

// Pick a question type. Chest questions only if we know the number of chests.
$types = ['fish', 'fish'];
if ($chests !== null) {
    array_push($types, 'chests', 'total');
    if ($fish !== $chests) $types[] = 'more';
}
$type = $types[array_rand($types)];

if ($type === 'more') {
    $question = 'Are there more fish or more chests?';
    $answer   = $fish > $chests ? 'Fish' : 'Chests';
    $options  = ['Fish', 'Chests'];
} else {
    $correct = match ($type) {
        'fish'   => $fish,
        'chests' => $chests,
        'total'  => $fish + $chests,
    };
    $question = match ($type) {
        'fish'   => 'How many fish are in the crate?',
        'chests' => 'How many treasure chests are in the crate?',
        'total'  => 'How many fish and chests altogether?',
    };
    // One believable wrong answer: 1 or 2 away, never negative.
    do {
        $wrong = $correct + (random_int(0, 1) ? 1 : -1) * random_int(1, 2);
    } while ($wrong < 0 || $wrong === $correct);
    $answer  = (string) $correct;
    $options = [(string) $correct, (string) $wrong];
    shuffle($options);
}

// Remember the answer on the server, keyed by a random puzzle ID.
$puzzleId = bin2hex(random_bytes(8));
$_SESSION['puzzles'] = array_slice($_SESSION['puzzles'] ?? [], -4, null, true); // keep only recent ones
$_SESSION['puzzles'][$puzzleId] = [
    'answer'  => $answer,
    'fish'    => $fish,
    'chests'  => $chests ?? 0,
    'created' => time(),
];

respond([
    'ok'       => true,
    'puzzleId' => $puzzleId,
    'image'    => $crate['image'],
    'question' => $question,
    'options'  => $options,
]);
