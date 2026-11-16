<?php
/*
 * logout.php  (POST)
 * Forgets who you are: deletes the session on the server.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';

$_SESSION = [];
session_destroy();

send_json(['ok' => true]);
