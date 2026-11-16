/*
 * kitchen.js
 * Owns the plate you are building and the fish stock. Knows nothing about the
 * screen: it only emits events when something changes.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import { MAX_PLATE_ITEMS } from './config.js';

export class Kitchen {
  constructor(bus) {
    this.bus = bus;
    this.plate = [];
    this.fish = 0;
  }

  setFish(amount) { this.fish = amount; this.bus.emit('stock:changed', { fish: this.fish }); }
  addFish(amount) { this.setFish(this.fish + amount); }

  /** Adds an ingredient to the plate. Fish is taken from stock straight away. */
  add(ingredientId) {
    if (this.plate.length >= MAX_PLATE_ITEMS) {
      this.bus.emit('kitchen:plate-full');
      return false;
    }
    if (ingredientId === 'fish') {
      if (this.fish <= 0) { this.bus.emit('kitchen:out-of-fish'); return false; }
      this.setFish(this.fish - 1);
    }
    this.plate.push(ingredientId);
    this.bus.emit('plate:changed', { plate: [...this.plate] });
    return true;
  }

  /** Empties the plate and puts any fish back in stock. */
  clear() {
    const fishOnPlate = this.plate.filter(i => i === 'fish').length;
    if (fishOnPlate) this.addFish(fishOnPlate);
    this.plate = [];
    this.bus.emit('plate:changed', { plate: [] });
  }

  /** Hands the plate over to a customer. The fish on it is used up. */
  takePlate() {
    const plate = this.plate;
    this.plate = [];
    this.bus.emit('plate:changed', { plate: [] });
    return plate;
  }
}

/** True if two ingredient lists contain the same items, in any order. */
export function sameIngredients(a, b) {
  if (a.length !== b.length) return false;
  const x = [...a].sort().join(','), y = [...b].sort().join(',');
  return x === y;
}
