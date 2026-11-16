<?php
/*
 * signup.php  (POST { username, email, password })
 * Creates an account. The password is hashed with bcrypt (password_hash) and only
 * the hash is stored. On success the new player is logged in straight away.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_post();

$body     = json_body();
$username = trim($body['username'] ?? '');
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

// Check the input on the server too: the browser's checks can be bypassed.
if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
    respond(['ok' => false, 'error' => 'Usernames are 3–30 letters, numbers or underscores.'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['ok' => false, 'error' => 'Enter a valid email address.'], 422);
}
if (strlen($password) < 8) {
    respond(['ok' => false, 'error' => 'Use at least 8 characters for your password.'], 422);
}

$check = db()->prepare('SELECT username, email FROM users WHERE username = ? OR email = ?');
$check->execute([$username, $email]);
foreach ($check->fetchAll() as $row) {
    if (strcasecmp($row['username'], $username) === 0) {
        respond(['ok' => false, 'error' => 'That username is taken. Try another.'], 409);
    }
    respond(['ok' => false, 'error' => 'An account with that email already exists.'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT); // bcrypt, with a random salt built in
$insert = db()->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
$insert->execute([$username, $email, $hash]);

$user = ['id' => (int) db()->lastInsertId(), 'username' => $username];
log_user_in($user);
respond(['ok' => true, 'user' => ['username' => $username]]);
