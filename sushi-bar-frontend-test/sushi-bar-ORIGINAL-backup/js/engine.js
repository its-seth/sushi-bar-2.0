/*
 * engine.js
 * The rules of the game: days, the game loop, hearts, coins, serving, and what
 * each Fish API puzzle gives you. It talks to the rest of the game only through
 * the kitchen, the customer manager and events.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import { RECIPES, START_HEARTS, DELIVERY, difficulty } from './config.js';
import { sameIngredients } from './kitchen.js';

export class GameEngine {
  constructor(bus, kitchen, customers) {
    this.bus = bus;
    this.kitchen = kitchen;
    this.customers = customers;
    this.running = false;   // service is open
    this.paused = false;    // player pressed pause
    this.blocked = false;   // a Fish API puzzle is open
    this.lastFrame = null;

    // A customer who runs out of patience costs a heart.
    bus.on('customer:left', ({ mood, reason }) => {
      if (mood === 'angry' && reason === 'patience') { this.dayStats.missed++; this.loseHeart('A customer gave up waiting'); }
    });
    // The delivery screen tells us the puzzle result.
    bus.on('delivery:resolved', (result) => this.resolveDelivery(result));

    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------- Game flow ----------
  newGame() {
    this.day = 0;
    this.coins = 0;
    this.nextDay();
  }

  nextDay() {
    this.day++;
    this.rules = difficulty(this.day);
    this.hearts = START_HEARTS;
    this.timeLeft = this.rules.dayLength;
    this.spawnTimer = 1;
    this.rescueUsed = false;
    this.emergencyLeft = DELIVERY.emergency.perDay;
    this.dayStats = { coins: 0, served: 0, missed: 0, wrong: 0 };
    this.kitchen.clear();
    this.kitchen.setFish(0);
    this.bus.emit('day:started', { day: this.day, recipes: this.availableRecipes() });
    this.bus.emit('hearts:changed', { hearts: this.hearts });
    this.bus.emit('coins:changed', { coins: this.coins });
    this.bus.emit('emergency:changed', { left: this.emergencyLeft });
    this.requestDelivery('morning'); // every day starts with a Fish API delivery
  }

  availableRecipes() { return RECIPES.filter(r => r.unlockDay <= this.day); }

  // ---------- Game loop (runs every animation frame) ----------
  loop(timestamp) {
    const dt = this.lastFrame === null ? 0 : Math.min(0.1, (timestamp - this.lastFrame) / 1000);
    this.lastFrame = timestamp;

    if (this.running && !this.paused && !this.blocked) {
      this.timeLeft -= dt;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.timeLeft > 8 && this.customers.hasFreeSeat()) {
        this.customers.spawn(this.availableRecipes(), this.rules.patience);
        this.spawnTimer = this.rules.spawnEvery * (0.8 + Math.random() * 0.4);
      }
      this.customers.update(dt);
      this.bus.emit('tick', { timeLeft: Math.max(0, this.timeLeft), dayLength: this.rules.dayLength });
      if (this.timeLeft <= 0) this.endDay();
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------- Player actions ----------
  serve(seat) {
    if (!this.running || this.paused || this.blocked) return;
    const customer = this.customers.seats[seat];
    if (!customer) { this.bus.emit('notice', { text: 'Nobody is sitting there yet.' }); return; }
    if (!this.kitchen.plate.length) { this.bus.emit('notice', { text: 'Build a dish on the plate first.' }); return; }

    const plate = this.kitchen.takePlate();
    if (sameIngredients(plate, customer.recipe.ingredients)) {
      const tip = Math.round(customer.recipe.price * 0.5 * (customer.patience / customer.maxPatience));
      const earned = customer.recipe.price + tip;
      this.coins += earned;
      this.dayStats.coins += earned;
      this.dayStats.served++;
      this.bus.emit('customer:served', { seat, earned, tip });
      this.bus.emit('coins:changed', { coins: this.coins });
      this.customers.leave(seat, 'happy', 'served');
    } else {
      this.dayStats.wrong++;
      this.bus.emit('customer:wrong-dish', { seat, wanted: customer.recipe });
      this.customers.leave(seat, 'angry', 'wrong-dish');
      this.loseHeart('Wrong dish');
    }
  }

  orderEmergencyFish() {
    if (!this.running || this.paused || this.blocked) return;
    if (this.emergencyLeft <= 0) { this.bus.emit('notice', { text: 'No more deliveries today.' }); return; }
    this.emergencyLeft--;
    this.bus.emit('emergency:changed', { left: this.emergencyLeft });
    this.requestDelivery('emergency');
  }

  togglePause() {
    if (!this.running || this.blocked) return;
    this.paused = !this.paused;
    this.bus.emit('game:paused', { paused: this.paused });
  }

  // ---------- Hearts ----------
  loseHeart(reason) {
    this.hearts = Math.max(0, this.hearts - 1);
    this.bus.emit('hearts:changed', { hearts: this.hearts, reason });
    if (this.hearts > 0) return;
    if (!this.rescueUsed) {
      this.rescueUsed = true;
      this.requestDelivery('rescue'); // one last chance: a Fish API puzzle for a heart
    } else {
      this.gameOver();
    }
  }

  // ---------- Fish API deliveries ----------
  requestDelivery(reason) {
    this.blocked = true;
    this.bus.emit('delivery:request', { reason });
  }

  resolveDelivery({ reason, correct, chests = 0 }) {
    this.blocked = false;
    if (reason === 'morning') {
      const cfg = DELIVERY.morning;
      this.kitchen.setFish(correct ? cfg.correctFish : cfg.wrongFish);
      if (correct && chests > 0) {
        const bonus = chests * cfg.coinsPerChest;
        this.coins += bonus; this.dayStats.coins += bonus;
        this.bus.emit('coins:changed', { coins: this.coins });
      }
      this.running = true;
      this.bus.emit('service:opened', { day: this.day });
    } else if (reason === 'emergency') {
      const cfg = DELIVERY.emergency;
      this.kitchen.addFish(correct ? cfg.correctFish : cfg.wrongFish);
    } else if (reason === 'rescue') {
      if (correct) {
        this.hearts = DELIVERY.rescue.hearts;
        this.bus.emit('hearts:changed', { hearts: this.hearts });
      } else {
        this.gameOver();
      }
    }
  }

  // ---------- Endings ----------
  endDay() {
    this.running = false;
    this.customers.clearAll();
    this.kitchen.clear();
    this.bus.emit('day:ended', { day: this.day, stats: { ...this.dayStats }, totalCoins: this.coins });
  }

  gameOver() {
    this.running = false;
    this.blocked = false;
    this.customers.clearAll();
    this.kitchen.clear();
    this.bus.emit('game:over', { day: this.day, stats: { ...this.dayStats }, totalCoins: this.coins });
  }
}
