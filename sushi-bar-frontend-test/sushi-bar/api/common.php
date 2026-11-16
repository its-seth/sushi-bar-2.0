<?php
/*
 * common.php
 * Included at the top of every other PHP file. It:
 *   1) starts the session (how the server remembers who is logged in),
 *   2) connects to the database,
 *   3) has small helper functions for JSON and login checks.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

require_once __DIR__ . '/config.php';

// ---------- 1) Session ----------
// PHP gives the browser a cookie called PHPSESSID with a random ID.
// The browser sends it back with every request, so we know who it is.
session_set_cookie_params([
    'httponly' => true,  // JavaScript can't read the cookie (an XSS attack can't steal it)
    'samesite' => 'Lax', // other websites can't send it with their requests (protects against CSRF)
]);
session_start();

header('Content-Type: application/json');
ini_set('display_errors', '0'); // never show PHP errors to players

// ---------- 2) Database ----------
$db = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// ---------- 3) Helpers ----------

// Read the JSON that api.js sent.
function read_json()
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Send JSON back to the browser and stop.
function send_json($data)
{
    echo json_encode($data);
    exit;
}

// Stop here if nobody is logged in. Otherwise return the logged-in user's id.
function require_login()
{
    if (!isset($_SESSION['user_id'])) {
        send_json(['ok' => false, 'error' => 'Please log in first.']);
    }
    return $_SESSION['user_id'];
}
