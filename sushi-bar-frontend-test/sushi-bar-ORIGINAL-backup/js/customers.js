/*
 * customers.js
 * Manages the seats at the counter: who is sitting where, what they ordered
 * and how much patience they have left.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import { CREATURES, SEAT_COUNT } from './config.js';

let nextId = 1;

export class CustomerManager {
  constructor(bus) {
    this.bus = bus;
    this.seats = new Array(SEAT_COUNT).fill(null);
  }

  hasFreeSeat() { return this.seats.some(s => s === null); }

  /** Seats a new customer with a random order from the dishes available today. */
  spawn(availableRecipes, patienceSeconds) {
    const free = this.seats.map((s, i) => (s ? null : i)).filter(i => i !== null);
    if (!free.length) return null;
    const seat = free[Math.floor(Math.random() * free.length)];
    const seatedNames = this.seats.filter(Boolean).map(c => c.creature.name);
    const options = CREATURES.filter(c => !seatedNames.includes(c.name));
    const customer = {
      id: nextId++,
      seat,
      creature: options[Math.floor(Math.random() * options.length)],
      recipe: availableRecipes[Math.floor(Math.random() * availableRecipes.length)],
      patience: patienceSeconds,
      maxPatience: patienceSeconds,
    };
    this.seats[seat] = customer;
    this.bus.emit('customer:arrived', { customer });
    return customer;
  }

  /** Called every frame: patience runs down while customers wait. */
  update(dt) {
    for (const customer of this.seats) {
      if (!customer) continue;
      customer.patience -= dt;
      if (customer.patience <= 0) this.leave(customer.seat, 'angry', 'patience');
    }
  }

  /** mood: 'happy' or 'angry'. reason: 'served', 'wrong-dish', 'patience' or 'closing'. */
  leave(seat, mood, reason) {
    const customer = this.seats[seat];
    if (!customer) return;
    this.seats[seat] = null;
    this.bus.emit('customer:left', { customer, mood, reason });
  }

  /** Everyone leaves without penalty (end of day). */
  clearAll() {
    this.seats.forEach((c, i) => { if (c) this.leave(i, 'happy', 'closing'); });
  }
}
