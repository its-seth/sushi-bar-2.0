/*
 * leaderboard-page.js
 * Shows the 10 players with the most coins (one row each) and highlights you.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import * as api from './api.js';

const $ = (id) => document.getElementById(id);

async function start() {
  const me = await api.whoAmI();
  if (!me.ok) {
    location.href = 'index.html';
    return;
  }
  $('logout-btn').addEventListener('click', async () => {
    await api.logout();
    location.href = 'index.html';
  });

  const result = await api.getLeaderboard();
  if (!result.ok) {
    $('board-status').textContent = 'The leaderboard can’t be loaded.';
    return;
  }
  if (result.rows.length === 0) {
    $('board-status').textContent = 'Nobody on the board yet. Finish a day to get on it.';
    return;
  }
  $('board-status').hidden = true;

  result.rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    if (row.username === me.username) tr.className = 'is-me';
    for (const value of [index + 1, row.username, row.coins, 'Day ' + row.best_day]) {
      const td = document.createElement('td');
      td.textContent = value; // textContent, not innerHTML: a username can't inject HTML
      tr.appendChild(td);
    }
    $('board-body').appendChild(tr);
  });
}

start();
