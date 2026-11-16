/*
 * kitchen.js
 * The plate you are building and how much fish you have.
 * It never touches the screen: it only emits events when something changes.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import { MAX_PLATE_ITEMS } from './config.js';

export class Kitchen {
  constructor(bus) {
    this.bus = bus;
    this.plate = []; // e.g. ['rice', 'fish']
    this.fish = 0;
  }

  reset() {
    this.plate = [];
    this.fish = 0;
    this.bus.emit('plate:changed', this.plate);
    this.bus.emit('fish:changed', this.fish);
  }

  addFish(amount) {
    this.fish = this.fish + amount;
    this.bus.emit('fish:changed', this.fish);
  }

  addIngredient(name) {
    if (this.plate.length >= MAX_PLATE_ITEMS) {
      this.bus.emit('message', 'The plate is full.');
      return;
    }
    if (name === 'fish') {
      if (this.fish === 0) {
        this.bus.emit('message', 'Out of fish! Press "Order more fish".');
        return;
      }
      this.addFish(-1); // fish is taken from stock
    }
    this.plate.push(name);
    this.bus.emit('plate:changed', this.plate);
  }

  // Empty the plate. Any fish on it goes back into stock.
  clearPlate() {
    const fishOnPlate = this.plate.filter(item => item === 'fish').length;
    this.plate = [];
    this.addFish(fishOnPlate);
    this.bus.emit('plate:changed', this.plate);
  }

  // Give the plate to a customer (the fish on it is used up).
  takePlate() {
    const plate = this.plate;
    this.plate = [];
    this.bus.emit('plate:changed', this.plate);
    return plate;
  }
}

// True if the plate has exactly the recipe's ingredients, in any order.
export function sameDish(plate, recipeIngredients) {
  return [...plate].sort().join() === [...recipeIngredients].sort().join();
}
