/*
 * config.js
 * All the game's numbers and content in one place, so balancing the game
 * never means digging through the logic.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

// Keyboard key = the number shown on each ingredient button.
export const INGREDIENTS = {
  rice:     { label: 'Rice',     emoji: '🍚', key: '1' },
  fish:     { label: 'Fish',     emoji: '🐟', key: '2' }, // uses fish stock
  seaweed:  { label: 'Seaweed',  emoji: '🌿', key: '3' },
  egg:      { label: 'Egg',      emoji: '🥚', key: '4' },
  cucumber: { label: 'Cucumber', emoji: '🥒', key: '5' },
};

// unlockDay: the first day this dish can be ordered.
export const RECIPES = [
  { id: 'nigiri',  name: 'Salmon nigiri', emoji: '🍣', ingredients: ['rice', 'fish'],                        price: 8,  unlockDay: 1 },
  { id: 'onigiri', name: 'Onigiri',       emoji: '🍙', ingredients: ['rice', 'seaweed'],                     price: 6,  unlockDay: 1 },
  { id: 'tamago',  name: 'Tamago',        emoji: '🍳', ingredients: ['rice', 'egg'],                         price: 7,  unlockDay: 1 },
  { id: 'kappa',   name: 'Cucumber roll', emoji: '🥒', ingredients: ['rice', 'seaweed', 'cucumber'],         price: 9,  unlockDay: 2 },
  { id: 'deluxe',  name: 'Deluxe roll',   emoji: '🍱', ingredients: ['rice', 'fish', 'seaweed', 'cucumber'], price: 14, unlockDay: 3 },
];

// The sushi bar's regulars are sea creatures.
export const CREATURES = [
  { emoji: '🐙', name: 'Octavia' },
  { emoji: '🦀', name: 'Crabby Pete' },
  { emoji: '🐧', name: 'Pip' },
  { emoji: '🐢', name: 'Grandpa Shell' },
  { emoji: '🐡', name: 'Puff' },
  { emoji: '🦭', name: 'Selma' },
  { emoji: '🐳', name: 'Big Wally' },
  { emoji: '🦦', name: 'Otto' },
  { emoji: '🦞', name: 'Lady Lobster' },
  { emoji: '🐬', name: 'Flip' },
];

export const SEAT_COUNT = 3;
export const MAX_PLATE_ITEMS = 4;
export const START_HEARTS = 3;

/** How hard each day is. Later days: customers arrive faster and wait less. */
export function difficulty(day) {
  return {
    dayLength: 75,                                  // seconds of service per day
    spawnEvery: Math.max(3.5, 8 - (day - 1) * 0.9), // seconds between customers
    patience: Math.max(12, 26 - (day - 1) * 2.5),   // seconds a customer will wait
  };
}

// What each Fish API puzzle gives you.
export const DELIVERY = {
  morning:   { correctFish: 10, wrongFish: 4, coinsPerChest: 5 },
  emergency: { correctFish: 6,  wrongFish: 2, perDay: 2 },
  rescue:    { hearts: 1 }, // once per day, when you run out of hearts
};

export const PUZZLE_SECONDS = 15; // time to answer a Fish API puzzle
