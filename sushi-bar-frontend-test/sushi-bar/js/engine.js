/*
 * engine.js
 * The game rules: days, the clock, hearts, coins, serving, and fish deliveries.
 * It never touches the screen and never talks to the server. It tells the rest
 * of the game what happened by emitting events.
 *
 * What is a "day"? One 60-second round of service.
 *   - A day starts with 3 hearts and a fish delivery puzzle.
 *   - Customers arrive, you serve them, the clock counts down.
 *   - Clock reaches 0 -> the day is over -> the next day is harder.
 *   - Hearts reach 0 -> game over.
 * Coins are kept between days AND between games (they are saved on the server).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import { START_HEARTS, DAY_SECONDS, FISH_IF_CORRECT, FISH_IF_WRONG, difficulty } from './config.js';
import { sameDish } from './kitchen.js';

export class Game {
  // savedCoins = the coins this player already has (loaded from the server).
  constructor(bus, kitchen, customers, savedCoins) {
    this.bus = bus;
    this.kitchen = kitchen;
    this.customers = customers;
    this.running = false; // true while the bar is open and the clock is ticking
    this.day = 0;
    this.coins = savedCoins;

    // Events from other parts of the game:
    bus.on('customer:gave-up', () => this.loseHeart('A customer got tired of waiting'));
    bus.on('puzzle:answered', (correct) => this.fishDelivered(correct));

    // Start the game loop (runs about 60 times a second).
    this.lastTime = performance.now();
    requestAnimationFrame((now) => this.loop(now));
  }

  // A new game starts again from day 1, but you KEEP your coins.
  newGame() {
    this.day = 0;
    this.coinsAtStart = this.coins;
    this.kitchen.reset();
    this.bus.emit('coins:changed', this.coins);
    this.startDay();
  }

  startDay() {
    this.day = this.day + 1;
    this.hearts = START_HEARTS;
    this.timeLeft = DAY_SECONDS;
    this.nextCustomerIn = 1;
    this.level = difficulty(this.day); // gets harder every day (see config.js)

    this.bus.emit('day:started', { day: this.day, level: this.level });
    this.bus.emit('hearts:changed', this.hearts);
    this.orderFish(); // every day starts with a Fish API puzzle
  }

  // The game loop. "seconds" = time since the last frame.
  loop(now) {
    const seconds = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.running) {
      this.timeLeft = this.timeLeft - seconds;
      this.nextCustomerIn = this.nextCustomerIn - seconds;

      if (this.nextCustomerIn <= 0) {
        this.customers.addCustomer(this.level.patience, this.level.menu);
        this.nextCustomerIn = this.level.newCustomerEvery;
      }
      this.customers.update(seconds);
      this.bus.emit('clock', this.timeLeft);

      if (this.running && this.timeLeft <= 0) this.endDay();
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  // The player serves the plate to the customer in this seat.
  serve(seat) {
    if (!this.running) return;
    const customer = this.customers.seats[seat];
    if (customer === null) {
      this.bus.emit('message', 'Nobody is sitting there.');
      return;
    }
    if (this.kitchen.plate.length === 0) {
      this.bus.emit('message', 'Make a dish first.');
      return;
    }

    const plate = this.kitchen.takePlate();
    this.customers.remove(seat);

    if (sameDish(plate, customer.recipe.ingredients)) {
      this.coins = this.coins + customer.recipe.price;
      this.bus.emit('coins:changed', this.coins);
      this.bus.emit('message', `+${customer.recipe.price} coins!`);
    } else {
      this.loseHeart('Wrong dish');
    }
  }

  loseHeart(reason) {
    this.hearts = this.hearts - 1;
    this.bus.emit('hearts:changed', this.hearts);
    this.bus.emit('message', `${reason}. You lost a heart.`);
    if (this.hearts <= 0) this.gameOver();
  }

  // Pause the game and ask for a Fish API puzzle (the puzzle popup listens for this).
  orderFish() {
    this.running = false;
    this.bus.emit('puzzle:needed');
  }

  // The puzzle popup tells us whether the answer was right.
  fishDelivered(correct) {
    this.kitchen.addFish(correct ? FISH_IF_CORRECT : FISH_IF_WRONG);
    this.running = true;
  }

  endDay() {
    this.running = false;
    this.customers.removeAll();
    this.kitchen.clearPlate();
    this.bus.emit('day:ended', { day: this.day, coins: this.coins, nextLevel: difficulty(this.day + 1) });
  }

  gameOver() {
    this.running = false;
    this.customers.removeAll();
    this.kitchen.clearPlate();
    this.bus.emit('game:over', { day: this.day, coins: this.coins, earned: this.coins - this.coinsAtStart });
  }
}
