<?php
/*
 * bootstrap.php
 * Included at the top of every API file. It:
 *   - starts a secure session (the session cookie is how the server knows who you are),
 *   - connects to the database with PDO,
 *   - provides small helpers for reading JSON and sending JSON back.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/config.php';

// ---------- Session (virtual identity) ----------
session_set_cookie_params([
    'lifetime' => 0,          // cookie disappears when the browser closes
    'path'     => '/',
    'httponly' => true,       // JavaScript can't read the cookie (protects against XSS stealing it)
    'samesite' => 'Lax',      // cookie isn't sent on cross-site POSTs (protects against CSRF)
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

// Never show PHP error details to the player; log them instead.
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error. Try again.']);
});

// ---------- Database ----------
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // real prepared statements (stops SQL injection)
            ]
        );
    }
    return $pdo;
}

// ---------- JSON helpers ----------
function respond(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'Use POST for this request.'], 405);
    }
}

/** Reads the JSON body that api.js sends. */
function json_body(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// ---------- Logged-in user ----------
function log_user_in(array $user): void
{
    session_regenerate_id(true); // new session ID after login (stops session fixation)
    $_SESSION['user_id']  = (int) $user['id'];
    $_SESSION['username'] = $user['username'];
}

/** Returns ['id' => ..., 'username' => ...] or null if nobody is logged in. */
function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return ['id' => $_SESSION['user_id'], 'username' => $_SESSION['username']];
}

/** Stops the request with an error if nobody is logged in. */
function require_login(): array
{
    $user = current_user();
    if ($user === null) {
        respond(['ok' => false, 'error' => 'Please log in first.'], 401);
    }
    return $user;
}
