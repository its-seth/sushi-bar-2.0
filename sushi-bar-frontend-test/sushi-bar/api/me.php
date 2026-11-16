<?php
/*
 * me.php  (GET)
 * Tells the browser who is logged in, using the session cookie.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';

require_login(); // stops with { ok: false } if nobody is logged in
send_json(['ok' => true, 'username' => $_SESSION['username']]);
