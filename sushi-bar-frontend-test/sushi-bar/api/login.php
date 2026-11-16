<?php
/*
 * login.php  (POST { username, password })
 * Checks the password. If it is right, the player is logged in (session).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';

$data     = read_json();
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

$query = $db->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
$query->execute([$username]);
$user = $query->fetch();

// password_verify hashes what they typed and compares it with the stored hash.
// Same message for "no such user" and "wrong password", so nobody can find out which usernames exist.
if (!$user || !password_verify($password, $user['password_hash'])) {
    send_json(['ok' => false, 'error' => 'Wrong username or password.']);
}

session_regenerate_id(true); // new session ID after login (stops "session fixation")
$_SESSION['user_id']  = $user['id'];
$_SESSION['username'] = $user['username'];

send_json(['ok' => true]);
