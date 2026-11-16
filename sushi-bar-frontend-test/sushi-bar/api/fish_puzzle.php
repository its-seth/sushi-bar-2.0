<?php
/*
 * fish_puzzle.php  (GET)
 * Gets a puzzle from the Fish Game API (a web service on another server),
 * keeps the right answer here on the server, and sends the browser only the
 * picture and two possible answers.
 * Returns { ok, puzzleId, image, options: [a, b] }.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 * Fish Game API by Marc Conrad: https://marcconrad.com/uob/fish/doc.php
 */

require_once __DIR__ . '/common.php';
require_login();

// Calls the Fish Game API over HTTPS and returns its JSON as an array (or null if it failed).
function ask_fish_api()
{
    $curl = curl_init(FISH_API_URL);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);  // give us the reply as a string
    curl_setopt($curl, CURLOPT_TIMEOUT, 10);           // don't wait more than 10 seconds
    curl_setopt($curl, CURLOPT_USERAGENT, 'SeasideSushiBar');
    curl_setopt($curl, CURLOPT_CAINFO, __DIR__ . '/cacert.pem'); // trusted certificates so HTTPS works on WAMP
    $reply = curl_exec($curl);
    curl_close($curl);

    $puzzle = json_decode($reply, true);
    if (!isset($puzzle['question'], $puzzle['fish'])) {
        return null;
    }
    return $puzzle;
}

// 1) Ask the Fish API. It sometimes refuses a request, so if the first try fails, try once more.
$puzzle = ask_fish_api() ?? ask_fish_api();
if ($puzzle === null) {
    send_json(['ok' => false, 'error' => 'The fish supplier can’t be reached.']);
}

// 2) The right answer, plus one wrong answer that is 1 or 2 away from it.
$correct = (int) $puzzle['fish'];
$wrong   = $correct + random_int(1, 2) * (random_int(0, 1) ? 1 : -1);
if ($wrong < 0) {
    $wrong = $correct + 2; // never offer a negative number
}
$options = [$correct, $wrong];
shuffle($options);

// 3) Keep the right answer in this player's SESSION (on the server).
//    The browser never receives it, so it can't be read in the developer tools.
$puzzleId = bin2hex(random_bytes(8)); // random id, e.g. "9f2c41a07be35d10"
$_SESSION['puzzles'][$puzzleId] = $correct;

// 4) Send the picture (base64 data from the API) and the two options.
send_json([
    'ok'       => true,
    'puzzleId' => $puzzleId,
    'image'    => 'data:image/png;base64,' . $puzzle['question'],
    'options'  => $options,
]);
