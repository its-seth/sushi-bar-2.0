<?php
/*
 * login.php  (POST { username, password })
 * Checks the password against the stored bcrypt hash. If it matches, the
 * session is started and the browser keeps the session cookie.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/bootstrap.php';
require_post();

$body     = json_body();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

$find = db()->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
$find->execute([$username]);
$user = $find->fetch();

// Same message whether the username or the password is wrong,
// so nobody can use this page to find out which usernames exist.
if (!$user || !password_verify($password, $user['password_hash'])) {
    respond(['ok' => false, 'error' => 'Wrong username or password.'], 401);
}

// If PHP's default hashing gets stronger in future, upgrade this user's hash.
if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    $update = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $update->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}

log_user_in($user);
respond(['ok' => true, 'user' => ['username' => $user['username']]]);
