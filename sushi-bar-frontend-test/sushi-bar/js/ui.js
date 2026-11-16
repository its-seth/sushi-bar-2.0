/*
 * ui.js
 * Everything on the game screen.
 *   1) It LISTENS to game events and updates the page.
 *   2) It turns the player's clicks and key presses into calls on the game.
 * The game rules (engine.js) never touch the page; only this file does.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import { INGREDIENTS, RECIPES, SEAT_COUNT, START_HEARTS, DAY_SECONDS } from './config.js';
import * as api from './api.js';

const $ = (id) => document.getElementById(id);
const SERVE_KEYS = ['q', 'w', 'e']; // Q serves seat 1, W seat 2, E seat 3

export class GameScreen {
  constructor(bus, game, kitchen, customers) {
    this.game = game;
    this.kitchen = kitchen;
    this.customers = customers;

    this.drawSeats();
    this.drawIngredients();
    this.drawMenu();
    this.drawHearts(START_HEARTS);
    this.drawPlate([]);

    // 1) Game events -> update the screen
    bus.on('day:started', (day) => { $('day-label').textContent = 'Day ' + day; this.hidePopups(); });
    bus.on('clock', (timeLeft) => this.drawClock(timeLeft));
    bus.on('hearts:changed', (hearts) => this.drawHearts(hearts));
    bus.on('coins:changed', (coins) => { $('coins').textContent = coins; });
    bus.on('fish:changed', (fish) => { $('fish').textContent = fish; $('fish-stock').textContent = fish + ' left'; });
    bus.on('plate:changed', (plate) => this.drawPlate(plate));
    bus.on('customer:arrived', (customer) => this.drawCustomer(customer));
    bus.on('customer:left', (seat) => this.seat(seat).classList.add('is-empty'));
    bus.on('message', (text) => this.showMessage(text));
    bus.on('day:ended', (info) => this.showDayOver(info));
    bus.on('game:over', (info) => this.showGameOver(info));

    // 2) Player events (clicks and keys) -> tell the game
    $('start-btn').addEventListener('click', () => game.newGame());
    $('play-again-btn').addEventListener('click', () => game.newGame());
    $('next-day-btn').addEventListener('click', () => game.startDay());
    $('quit-btn').addEventListener('click', () => this.saveAndQuit());
    $('clear-btn').addEventListener('click', () => kitchen.clearPlate());
    $('order-fish-btn').addEventListener('click', () => { if (game.running) game.orderFish(); });
    document.addEventListener('keydown', (event) => this.onKey(event.key.toLowerCase()));
  }

  onKey(key) {
    if (!this.game.running) return; // ignore keys while a popup is open

    for (const name in INGREDIENTS) {
      if (INGREDIENTS[name].key === key) this.kitchen.addIngredient(name);
    }
    const seat = SERVE_KEYS.indexOf(key);
    if (seat !== -1) this.game.serve(seat);
    if (key === 'x') this.kitchen.clearPlate();
  }

  // ---------- Drawing ----------
  drawSeats() {
    for (let i = 0; i < SEAT_COUNT; i++) {
      const seat = document.createElement('div');
      seat.className = 'seat is-empty';
      seat.id = 'seat-' + i;
      seat.innerHTML = `
        <div class="seat-empty">Free seat</div>
        <div class="seat-customer">
          <div class="bubble"><span class="bubble-dish"></span><span class="bubble-name"></span><span class="bubble-items"></span></div>
          <div class="creature"></div>
          <div class="creature-name"></div>
          <div class="patience"><div class="patience-fill"></div></div>
          <button class="btn btn-serve" type="button">Serve <span class="key">${SERVE_KEYS[i].toUpperCase()}</span></button>
        </div>`;
      seat.querySelector('.btn-serve').addEventListener('click', () => this.game.serve(i));
      $('seats').appendChild(seat);
    }
  }

  drawIngredients() {
    for (const name in INGREDIENTS) {
      const ingredient = INGREDIENTS[name];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ingredient';
      button.innerHTML = `
        <span class="ingredient-emoji">${ingredient.emoji}</span>
        <span class="ingredient-label">${ingredient.label}</span>
        <span class="ingredient-key">Key ${ingredient.key}</span>`;
      if (name === 'fish') button.innerHTML += '<span id="fish-stock" class="ingredient-stock">0 left</span>';
      button.addEventListener('click', () => { if (this.game.running) this.kitchen.addIngredient(name); });
      $('ingredients').appendChild(button);
    }
  }

  drawMenu() {
    for (const recipe of RECIPES) {
      const item = document.createElement('li');
      item.innerHTML = `
        <span class="recipe-dish">${recipe.emoji}</span>
        <span class="recipe-name">${recipe.name}</span>
        <span class="recipe-items">${this.emojis(recipe.ingredients)}</span>
        <span class="recipe-price">${recipe.price}</span>`;
      $('recipe-list').appendChild(item);
    }
  }

  drawCustomer(customer) {
    const seat = this.seat(customer.seat);
    seat.querySelector('.creature').textContent = customer.creature.emoji;
    seat.querySelector('.creature-name').textContent = customer.creature.name;
    seat.querySelector('.bubble-dish').textContent = customer.recipe.emoji;
    seat.querySelector('.bubble-name').textContent = customer.recipe.name;
    seat.querySelector('.bubble-items').textContent = this.emojis(customer.recipe.ingredients);
    seat.querySelector('.patience-fill').style.width = '100%';
    seat.classList.remove('is-empty');
  }

  drawClock(timeLeft) {
    $('time-fill').style.width = (timeLeft / DAY_SECONDS * 100) + '%';
    $('time-left').textContent = Math.max(0, Math.ceil(timeLeft)) + 's';
    // Shrink each customer's patience bar.
    for (const customer of this.customers.seats) {
      if (customer === null) continue;
      const percent = customer.patience / customer.maxPatience * 100;
      this.seat(customer.seat).querySelector('.patience-fill').style.width = percent + '%';
    }
  }

  drawHearts(hearts) {
    let html = '';
    for (let i = 0; i < START_HEARTS; i++) {
      html += i < hearts ? '<span class="heart">♥</span>' : '<span class="heart is-lost">♥</span>';
    }
    $('hearts').innerHTML = html;
  }

  drawPlate(plate) {
    if (plate.length === 0) {
      $('plate').innerHTML = '<span class="plate-empty">Tap ingredients to build a dish</span>';
    } else {
      $('plate').innerHTML = plate.map(name => `<span class="plate-item">${INGREDIENTS[name].emoji}</span>`).join('');
    }
  }

  // ---------- Popups and messages ----------
  hidePopups() {
    $('overlay-start').hidden = true;
    $('overlay-day').hidden = true;
    $('overlay-over').hidden = true;
  }

  showMessage(text) {
    $('toast').textContent = text;
    $('toast').classList.add('is-showing');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => $('toast').classList.remove('is-showing'), 2000);
  }

  showDayOver(info) {
    $('day-end-title').textContent = `Day ${info.day} is over`;
    $('day-end-coins').textContent = info.coins;
    $('overlay-day').hidden = false;
  }

  async showGameOver(info) {
    $('over-score').textContent = info.coins;
    $('over-day').textContent = `You made it to day ${info.day}.`;
    $('over-save').textContent = 'Saving your score…';
    $('overlay-over').hidden = false;
    const result = await api.saveScore(info.coins, info.day);
    $('over-save').textContent = result.ok ? 'Score saved to the leaderboard.' : 'Score not saved: ' + result.error;
  }

  async saveAndQuit() {
    await api.saveScore(this.game.coins, this.game.day);
    location.href = 'leaderboard.html';
  }

  // ---------- Helpers ----------
  seat(i) { return $('seat-' + i); }

  emojis(ingredientNames) { return ingredientNames.map(name => INGREDIENTS[name].emoji).join(' '); }
}
