/*
 * customers.js
 * The seats at the counter: who is sitting where, what they want,
 * and how much patience they have left.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import { CREATURES, SEAT_COUNT } from './config.js';

export class Customers {
  constructor(bus) {
    this.bus = bus;
    this.seats = [];
    for (let i = 0; i < SEAT_COUNT; i++) this.seats.push(null); // null = empty seat
  }

  // Put a new customer in the first free seat. They order something from today's menu.
  addCustomer(patience, menu) {
    const seat = this.seats.indexOf(null);
    if (seat === -1) return; // every seat is taken

    const customer = {
      seat: seat,
      creature: randomItem(CREATURES),
      recipe: randomItem(menu),
      patience: patience,     // seconds left
      maxPatience: patience,
    };
    this.seats[seat] = customer;
    this.bus.emit('customer:arrived', customer);
  }

  // Called every frame: everyone's patience goes down.
  update(seconds) {
    for (const customer of this.seats) {
      if (customer === null) continue;
      customer.patience = customer.patience - seconds;
      if (customer.patience <= 0) {
        this.remove(customer.seat);
        this.bus.emit('customer:gave-up', customer);
      }
    }
  }

  remove(seat) {
    this.seats[seat] = null;
    this.bus.emit('customer:left', seat);
  }

  removeAll() {
    for (let i = 0; i < this.seats.length; i++) {
      if (this.seats[i] !== null) this.remove(i);
    }
  }
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}
