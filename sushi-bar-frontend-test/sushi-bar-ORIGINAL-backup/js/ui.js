/*
 * ui.js
 * Everything the player sees and clicks on the game screen. It listens for game
 * events to update the screen, and turns clicks and key presses into calls on
 * the engine and kitchen. The game rules never touch the DOM.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import { INGREDIENTS, SEAT_COUNT, START_HEARTS } from './config.js';
import * as api from './api.js';

const SEAT_KEYS = ['q', 'w', 'e'];
const $ = (id) => document.getElementById(id);

export class GameUI {
  constructor(bus, engine, kitchen, customers) {
    this.bus = bus;
    this.engine = engine;
    this.kitchen = kitchen;
    this.customers = customers;
    this.toastTimer = null;
    this.saved = false;

    this.buildSeats();
    this.buildIngredients();
    this.listen();
    this.bindControls();
  }

  // ---------- Building the screen ----------
  buildSeats() {
    const wrap = $('seats');
    wrap.innerHTML = '';
    for (let i = 0; i < SEAT_COUNT; i++) {
      const seat = document.createElement('div');
      seat.className = 'seat is-empty';
      seat.dataset.seat = i;
      seat.innerHTML = `
        <div class="seat-empty">Free seat</div>
        <div class="seat-customer">
          <div class="bubble"><span class="bubble-dish"></span><span class="bubble-name"></span><span class="bubble-items"></span></div>
          <div class="creature" aria-hidden="true"></div>
          <div class="creature-name"></div>
          <div class="patience"><div class="patience-fill"></div></div>
          <button class="btn btn-serve" type="button">Serve <span class="key">${SEAT_KEYS[i].toUpperCase()}</span></button>
        </div>
        <div class="seat-reaction" aria-hidden="true"></div>`;
      seat.querySelector('.btn-serve').addEventListener('click', () => this.engine.serve(i));
      wrap.appendChild(seat);
    }
  }

  buildIngredients() {
    const wrap = $('ingredients');
    wrap.innerHTML = '';
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ingredient';
      b.dataset.ingredient = id;
      b.title = `${ing.label} (keyboard shortcut: ${ing.key})`;
      b.innerHTML = `<span class="ingredient-emoji" aria-hidden="true">${ing.emoji}</span>`
        + `<span class="ingredient-label">${ing.label}</span>`
        + `<span class="ingredient-key">Key ${ing.key}</span>`
        + (id === 'fish' ? '<span class="ingredient-stock" data-fish-stock>0 left</span>' : '<span class="ingredient-stock is-unlimited">Unlimited</span>');
      b.addEventListener('click', () => this.addIngredient(id));
      wrap.appendChild(b);
    }
  }

  renderRecipes(recipes) {
    const list = $('recipe-list');
    list.innerHTML = '';
    for (const r of recipes) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="recipe-dish" aria-hidden="true">${r.emoji}</span>
        <span class="recipe-name">${r.name}</span>
        <span class="recipe-items">${r.ingredients.map(i => INGREDIENTS[i].emoji).join(' ')}</span>
        <span class="recipe-price">${r.price}</span>`;
      list.appendChild(li);
    }
  }

  // ---------- Reacting to game events ----------
  listen() {
    const b = this.bus;
    b.on('day:started', ({ day, recipes }) => {
      $('day-label').textContent = `Day ${day}`;
      $('time-fill').style.width = '100%';
      this.renderRecipes(recipes);
      this.hideOverlays();
    });
    b.on('service:opened', ({ day }) => this.toast(day === 1 ? 'The sushi bar is open!' : `Day ${day}: the sushi bar is open!`));
    b.on('tick', ({ timeLeft, dayLength }) => this.onTick(timeLeft, dayLength));
    b.on('hearts:changed', ({ hearts, reason }) => this.renderHearts(hearts, reason));
    b.on('coins:changed', ({ coins }) => { $('coins').textContent = coins; });
    b.on('stock:changed', ({ fish }) => this.renderStock(fish));
    b.on('emergency:changed', ({ left }) => {
      $('emergency-left').textContent = left === 1 ? '1 left today' : `${left} left today`;
      $('emergency-btn').disabled = left <= 0;
    });
    b.on('plate:changed', ({ plate }) => this.renderPlate(plate));
    b.on('customer:arrived', ({ customer }) => this.renderCustomer(customer));
    b.on('customer:left', ({ customer, mood, reason }) => this.customerLeft(customer, mood, reason));
    b.on('customer:served', ({ seat, earned }) => this.react(seat, `+${earned}`, 'is-happy'));
    b.on('customer:wrong-dish', ({ seat, wanted }) => { this.react(seat, '✗', 'is-angry'); this.toast(`Wrong dish. They wanted ${wanted.name}.`); });
    b.on('kitchen:out-of-fish', () => this.toast('Out of fish. Order an emergency delivery.'));
    b.on('kitchen:plate-full', () => this.toast('The plate is full. Clear it or serve it.'));
    b.on('notice', ({ text }) => this.toast(text));
    b.on('game:paused', ({ paused }) => { $('overlay-pause').hidden = !paused; $('pause-btn').textContent = paused ? 'Resume' : 'Pause'; });
    b.on('day:ended', (data) => this.showDayEnd(data));
    b.on('game:over', (data) => this.showGameOver(data));
  }

  onTick(timeLeft, dayLength) {
    $('time-fill').style.width = `${(timeLeft / dayLength) * 100}%`;
    $('time-left').textContent = `${Math.ceil(timeLeft)}s`;
    for (const customer of this.customers.seats) {
      if (!customer) continue;
      const seat = this.seatEl(customer.seat);
      const pct = Math.max(0, customer.patience / customer.maxPatience);
      const fill = seat.querySelector('.patience-fill');
      fill.style.width = `${pct * 100}%`;
      seat.classList.toggle('is-impatient', pct < 0.3);
    }
  }

  renderHearts(hearts, reason) {
    const el = $('hearts');
    el.innerHTML = '';
    for (let i = 0; i < START_HEARTS; i++) {
      const h = document.createElement('span');
      h.className = 'heart' + (i < hearts ? '' : ' is-lost');
      h.textContent = '♥';
      el.appendChild(h);
    }
    el.setAttribute('aria-label', `${hearts} hearts left`);
    if (reason) {
      this.toast(`${reason}. You lost a heart.`);
      document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
    }
  }

  renderStock(fish) {
    $('fish').textContent = fish;
    const fishBtn = document.querySelector('[data-ingredient="fish"]');
    if (fishBtn) fishBtn.classList.toggle('is-out', fish <= 0);
    const badge = document.querySelector('[data-fish-stock]');
    if (badge) {
      badge.textContent = fish <= 0 ? 'None left' : `${fish} left`;
      badge.classList.toggle('is-low', fish <= 2);
    }
    $('fish-chip').classList.toggle('is-low', fish <= 2);
  }

  renderPlate(plate) {
    const el = $('plate');
    el.innerHTML = '';
    if (!plate.length) { el.innerHTML = '<span class="plate-empty">Tap ingredients to build a dish</span>'; return; }
    for (const id of plate) {
      const s = document.createElement('span');
      s.className = 'plate-item';
      s.textContent = INGREDIENTS[id].emoji;
      s.title = INGREDIENTS[id].label;
      el.appendChild(s);
    }
  }

  renderCustomer(customer) {
    const seat = this.seatEl(customer.seat);
    seat.classList.remove('is-empty', 'is-leaving', 'is-impatient');
    seat.querySelector('.creature').textContent = customer.creature.emoji;
    seat.querySelector('.creature-name').textContent = customer.creature.name;
    seat.querySelector('.bubble-dish').textContent = customer.recipe.emoji;
    seat.querySelector('.bubble-name').textContent = customer.recipe.name;
    seat.querySelector('.bubble-items').textContent = customer.recipe.ingredients.map(i => INGREDIENTS[i].emoji).join(' ');
    seat.querySelector('.patience-fill').style.width = '100%';
    seat.classList.add('is-arriving');
    setTimeout(() => seat.classList.remove('is-arriving'), 400);
  }

  customerLeft(customer, mood, reason) {
    const seat = this.seatEl(customer.seat);
    if (reason === 'patience') this.react(customer.seat, '💢', 'is-angry');
    seat.classList.add('is-leaving');
    setTimeout(() => {
      if (!this.customers.seats[customer.seat]) seat.classList.add('is-empty');
      seat.classList.remove('is-leaving');
    }, 350);
  }

  react(seatIndex, text, cls) {
    const r = this.seatEl(seatIndex).querySelector('.seat-reaction');
    r.textContent = text;
    r.className = 'seat-reaction ' + cls;
    void r.offsetWidth;
    r.classList.add('is-showing');
  }

  // ---------- Overlays ----------
  hideOverlays() { ['overlay-start', 'overlay-day', 'overlay-over', 'overlay-pause'].forEach(id => ($(id).hidden = true)); }

  showStart() { $('overlay-start').hidden = false; $('start-btn').focus(); }

  showDayEnd({ day, stats, totalCoins }) {
    $('day-end-title').textContent = `Day ${day} is over`;
    $('day-end-stats').innerHTML = this.statsHTML(stats, totalCoins);
    $('overlay-day').hidden = false;
    $('next-day-btn').focus();
  }

  async showGameOver({ day, stats, totalCoins }) {
    $('over-score').textContent = totalCoins;
    $('over-day').textContent = `You made it to day ${day}.`;
    $('over-stats').innerHTML = this.statsHTML(stats, totalCoins);
    $('overlay-over').hidden = false;
    $('play-again-btn').focus();
    await this.saveScore(totalCoins, day, $('over-save'));
  }

  statsHTML(stats, total) {
    return `<div><dt>Served</dt><dd>${stats.served}</dd></div>
            <div><dt>Wrong dishes</dt><dd>${stats.wrong}</dd></div>
            <div><dt>Gave up waiting</dt><dd>${stats.missed}</dd></div>
            <div><dt>Coins today</dt><dd>${stats.coins}</dd></div>
            <div><dt>Total coins</dt><dd>${total}</dd></div>`;
  }

  async saveScore(score, day, statusEl) {
    if (this.saved) return;
    this.saved = true;
    statusEl.textContent = 'Saving your score…';
    try {
      const res = await api.saveScore(score, day);
      statusEl.textContent = res.ok ? 'Score saved to the leaderboard.' : `Score not saved: ${res.error || 'server error'}.`;
    } catch {
      statusEl.textContent = 'Score not saved: the server can’t be reached.';
    }
  }

  // ---------- Input ----------
  addIngredient(id) {
    if (!this.engine.running || this.engine.paused || this.engine.blocked) return;
    const ok = this.kitchen.add(id);
    const btn = document.querySelector(`[data-ingredient="${id}"]`);
    if (ok && btn) { btn.classList.remove('is-pressed'); void btn.offsetWidth; btn.classList.add('is-pressed'); }
  }

  bindControls() {
    $('clear-btn').addEventListener('click', () => this.kitchen.clear());
    $('emergency-btn').addEventListener('click', () => this.engine.orderEmergencyFish());
    $('pause-btn').addEventListener('click', () => this.engine.togglePause());
    $('resume-btn').addEventListener('click', () => this.engine.togglePause());
    $('start-btn').addEventListener('click', () => { this.saved = false; this.engine.newGame(); });
    $('play-again-btn').addEventListener('click', () => { this.saved = false; this.engine.newGame(); });
    $('next-day-btn').addEventListener('click', () => this.engine.nextDay());
    $('quit-btn').addEventListener('click', async () => {
      await this.saveScore(this.engine.coins, this.engine.day, $('day-end-save'));
      location.href = 'leaderboard.html';
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea') || !$('overlay-delivery').hidden) return;
      const key = e.key.toLowerCase();
      if (key === 'p' || key === 'escape') { this.engine.togglePause(); return; }
      if (!this.engine.running || this.engine.paused) return;
      const ingredient = Object.entries(INGREDIENTS).find(([, ing]) => ing.key === key);
      if (ingredient) { this.addIngredient(ingredient[0]); return; }
      const seat = SEAT_KEYS.indexOf(key);
      if (seat !== -1) { this.engine.serve(seat); return; }
      if (key === 'x' || key === 'backspace') { e.preventDefault(); this.kitchen.clear(); }
    });
  }

  // ---------- Helpers ----------
  seatEl(i) { return document.querySelector(`.seat[data-seat="${i}"]`); }

  toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('is-showing');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('is-showing'), 2200);
  }
}
