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

import { INGREDIENTS, SEAT_COUNT, START_HEARTS, DAY_SECONDS } from './config.js';
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
    this.drawHearts(START_HEARTS);
    this.drawPlate([]);

    // 1) Game events -> update the screen
    bus.on('day:started', (info) => this.showNewDay(info));
    bus.on('clock', (timeLeft) => this.drawClock(timeLeft));
    bus.on('hearts:changed', (hearts) => this.drawHearts(hearts));
    bus.on('coins:changed', (coins) => { $('coins').textContent = coins; });
    bus.on('fish:changed', (fish) => { $('fish').textContent = fish; $('fish-stock').textContent = fish + ' left'; });
    bus.on('plate:changed', (plate) => this.drawPlate(plate));
    bus.on('customer:arrived', (customer) => this.drawCustomer(customer));
    bus.on('customer:left', (seat) => this.seat(seat).classList.add('is-empty'));
    bus.on('message', (text) => this.showMessage(text));
    bus.on('heart:lost', (info) => this.showHeartLost(info));
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
        </div>
        <div class="seat-reaction"></div>`;
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

  // Today's menu (more dishes on later days).
  drawMenu(menu) {
    $('recipe-list').innerHTML = '';
    for (const recipe of menu) {
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
      if (i < hearts) html += '<span class="heart">♥</span>';
      else if (i === hearts) html += '<span class="heart is-lost is-breaking">♥</span>'; // the one just lost
      else html += '<span class="heart is-lost">♥</span>';
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

  // isBad = true shows a bigger red message.
  showMessage(text, isBad = false) {
    $('toast').textContent = text;
    $('toast').classList.toggle('is-bad', isBad);
    $('toast').classList.add('is-showing');
    clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => $('toast').classList.remove('is-showing'), isBad ? 3000 : 2000);
  }

  // Make losing a heart hard to miss: red flash, screen shake, a symbol over the seat, red message.
  showHeartLost(info) {
    const left = info.heartsLeft === 1 ? '1 heart left' : `${info.heartsLeft} hearts left`;
    this.showMessage(`💔 ${info.reason}. ${left}!`, true);

    const reaction = this.seat(info.seat).querySelector('.seat-reaction');
    reaction.textContent = info.symbol;
    this.replayAnimation(reaction, 'seat-reaction is-angry', 'is-showing');
    this.replayAnimation(document.body, document.body.className.replace(/\b(hurt|shake)\b/g, '').trim(), 'hurt shake');
  }

  // CSS animations only play when a class is added, so: reset the classes,
  // force the browser to notice (reading offsetWidth), then add the animation classes again.
  replayAnimation(element, baseClasses, animationClasses) {
    element.className = baseClasses;
    void element.offsetWidth;
    element.className = baseClasses + ' ' + animationClasses;
  }

  showNewDay(info) {
    $('day-label').textContent = 'Day ' + info.day;
    $('patience-info').textContent = `Customers wait ${info.level.patience}s`;
    this.drawMenu(info.level.menu);
    this.lastMenuSize = info.level.menu.length;
    this.hidePopups();
  }

  showDayOver(info) {
    $('day-end-title').textContent = `Day ${info.day} is over`;
    $('day-end-coins').textContent = info.coins;
    // Tell the player how tomorrow will be harder.
    const next = info.nextLevel;
    let text = `Day ${info.day + 1} is harder: customers wait only ${next.patience} seconds `
             + `and a new one arrives every ${next.newCustomerEvery} seconds.`;
    if (next.menu.length > this.lastMenuSize) text += ` New dish on the menu: ${next.menu[next.menu.length - 1].name}!`;
    $('day-end-next').textContent = text;
    $('overlay-day').hidden = false;
    this.save(info.coins, info.day, 'day-end-save');
  }

  showGameOver(info) {
    $('over-earned').textContent = info.earned;
    $('over-score').textContent = info.coins;
    $('over-day').textContent = `You made it to day ${info.day}.`;
    $('overlay-over').hidden = false;
    this.save(info.coins, info.day, 'over-save');
  }

  // Save coins and day on the server (shown on the leaderboard).
  async save(coins, day, statusId) {
    $(statusId).textContent = 'Saving your coins…';
    this.saving = api.saveProgress(coins, day);
    const result = await this.saving;
    $(statusId).textContent = result.ok ? 'Coins saved.' : 'Not saved: ' + result.error;
  }

  // Coins were already saved at the end of the day, so just wait for that and leave.
  async saveAndQuit() {
    await this.saving;
    location.href = 'leaderboard.html';
  }

  // ---------- Helpers ----------
  seat(i) { return $('seat-' + i); }

  emojis(ingredientNames) { return ingredientNames.map(name => INGREDIENTS[name].emoji).join(' '); }
}
