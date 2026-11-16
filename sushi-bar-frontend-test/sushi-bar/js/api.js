/*
 * api.js
 * The ONLY file that talks to the PHP server. Every request sends JSON and
 * gets JSON back. The browser sends the session cookie automatically, which
 * is how the server knows who you are.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

// Sends a request to one of the PHP files in the api/ folder.
// With data -> POST (data sent as JSON). Without data -> GET.
async function request(phpFile, data) {
  const options = { credentials: 'same-origin' }; // send the session cookie
  if (data) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  let response;
  try {
    response = await fetch('api/' + phpFile, options);
  } catch {
    return { ok: false, error: 'Cannot reach the server. Is WAMP running?' };
  }
  try {
    return await response.json();
  } catch {
    // The server answered, but not with JSON (usually a PHP error).
    return { ok: false, error: `Server error in ${phpFile} (HTTP ${response.status}). Check WAMP's PHP error log.` };
  }
}

export function whoAmI()                         { return request('me.php'); }
export function signup(username, email, password) { return request('signup.php', { username, email, password }); }
export function login(username, password)        { return request('login.php', { username, password }); }
export function logout()                         { return request('logout.php', {}); }
export function getPuzzle()                      { return request('fish_puzzle.php'); }
export function checkAnswer(puzzleId, choice)    { return request('fish_answer.php', { puzzleId, choice }); }
export function saveProgress(coins, day)         { return request('save_progress.php', { coins, day }); }
export function getLeaderboard()                 { return request('leaderboard.php'); }
