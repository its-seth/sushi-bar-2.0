/*
 * game-main.js
 * Starts the game page: checks who is logged in, then creates each part of the
 * game and connects them with one shared event bus.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import * as api from './api.js';
import { EventBus } from './eventBus.js';
import { Kitchen } from './kitchen.js';
import { CustomerManager } from './customers.js';
import { GameEngine } from './engine.js';
import { DeliveryModal } from './delivery.js';
import { GameUI } from './ui.js';

async function start() {
  const backend = await api.detectBackend();
  const session = await api.me();
  if (!session.ok) { location.href = 'index.html'; return; } // must be logged in to play

  document.getElementById('username').textContent = session.user.username;
  document.getElementById('demo-badge').hidden = backend;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api.logout();
    location.href = 'index.html';
  });

  const bus = new EventBus();
  const kitchen = new Kitchen(bus);
  const customers = new CustomerManager(bus);
  const engine = new GameEngine(bus, kitchen, customers);
  new DeliveryModal(bus);
  const ui = new GameUI(bus, engine, kitchen, customers);

  ui.renderHearts(3);
  ui.renderPlate([]);
  ui.showStart();
}

start();
