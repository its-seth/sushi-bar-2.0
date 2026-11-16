/*
 * game-main.js
 * Starts the game page:
 *   1) checks that someone is logged in (otherwise back to the login page),
 *   2) creates each part of the game and connects them with ONE shared event bus.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import * as api from './api.js';
import { EventBus } from './eventBus.js';
import { Kitchen } from './kitchen.js';
import { Customers } from './customers.js';
import { Game } from './engine.js';
import { PuzzlePopup } from './delivery.js';
import { GameScreen } from './ui.js';

async function start() {
  // Who is logged in? The server knows from the session cookie.
  const me = await api.whoAmI();
  if (!me.ok) {
    location.href = 'index.html';
    return;
  }
  document.getElementById('username').textContent = me.username;
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api.logout();
    location.href = 'index.html';
  });

  // Build the game. Every part gets the same bus so they can send each other events.
  const bus = new EventBus();
  const kitchen = new Kitchen(bus);
  const customers = new Customers(bus);
  const game = new Game(bus, kitchen, customers);
  new PuzzlePopup(bus);
  new GameScreen(bus, game, kitchen, customers);

  document.getElementById('overlay-start').hidden = false;
}

start();
