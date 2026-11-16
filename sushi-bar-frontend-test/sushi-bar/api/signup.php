<?php
/*
 * signup.php  (POST { username, email, password })
 * Creates an account and logs the new player in.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/common.php';

$data     = read_json();
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Check the input on the server too (anyone can skip the browser's checks).
if (strlen($username) < 3 || strlen($username) > 30) {
    send_json(['ok' => false, 'error' => 'Username must be 3 to 30 characters.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(['ok' => false, 'error' => 'Enter a valid email address.']);
}
if (strlen($password) < 8) {
    send_json(['ok' => false, 'error' => 'Password must be at least 8 characters.']);
}

// Is the username or email already used?
// "?" placeholders = prepared statement, so this is safe from SQL injection.
$query = $db->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
$query->execute([$username, $email]);
if ($query->fetch()) {
    send_json(['ok' => false, 'error' => 'That username or email is already used.']);
}

// Save the user. We store a HASH of the password (bcrypt), never the password itself.
$hash  = password_hash($password, PASSWORD_DEFAULT);
$query = $db->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
$query->execute([$username, $email, $hash]);

// Log them in straight away.
session_regenerate_id(true); // new session ID after login (stops "session fixation")
$_SESSION['user_id']  = $db->lastInsertId();
$_SESSION['username'] = $username;

send_json(['ok' => true]);
