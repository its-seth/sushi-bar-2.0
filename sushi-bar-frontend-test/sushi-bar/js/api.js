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
  try {
    const response = await fetch('api/' + phpFile, options);
    return await response.json();
  } catch {
    return { ok: false, error: 'Cannot reach the server. Is WAMP running?' };
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
