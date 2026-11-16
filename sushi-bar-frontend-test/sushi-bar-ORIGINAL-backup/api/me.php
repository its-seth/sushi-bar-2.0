<?php
/*
 * me.php  (GET)
 * Tells the frontend who is logged in, based on the session cookie.
 * Returns { ok: true, user: { username } } or { ok: false } if nobody is logged in.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';

$user = current_user();
if ($user === null) {
    respond(['ok' => false]);
}
respond(['ok' => true, 'user' => ['username' => $user['username']]]);
