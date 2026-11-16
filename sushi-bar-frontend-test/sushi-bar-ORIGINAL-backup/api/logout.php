<?php
/*
 * logout.php  (POST)
 * Ends the session on the server and deletes the session cookie in the browser.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_post();

$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires'  => time() - 3600,
    'path'     => $params['path'],
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_destroy();

respond(['ok' => true]);
