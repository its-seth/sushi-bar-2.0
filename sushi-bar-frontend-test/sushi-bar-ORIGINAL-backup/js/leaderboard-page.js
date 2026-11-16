/*
 * leaderboard-page.js
 * Shows each player's best game from the server and highlights the logged-in player.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import * as api from './api.js';

async function start() {
  const backend = await api.detectBackend();
  document.getElementById('demo-badge').hidden = backend;
  const session = await api.me();
  if (!session.ok) { location.href = 'index.html'; return; }
  const me = session.user.username;

  const body = document.getElementById('board-body');
  const status = document.getElementById('board-status');
  try {
    const res = await api.leaderboard();
    if (!res.ok) throw new Error();
    if (!res.rows.length) { status.textContent = 'No scores yet. Play a round to get on the board.'; return; }
    status.hidden = true;
    res.rows.forEach((row, i) => {
      const tr = document.createElement('tr');
      if (row.username === me) tr.className = 'is-me';
      const cells = [i + 1, row.username + (row.username === me ? ' (you)' : ''), row.score, `Day ${row.day}`, row.games ?? 1];
      for (const value of cells) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
  } catch {
    status.textContent = 'The leaderboard can’t be loaded. Check that WAMP is running.';
  }

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api.logout();
    location.href = 'index.html';
  });
}

start();
