/*
 * config.js
 * All the game's settings in one place (no logic here).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

// The 5 ingredients. "key" is the keyboard shortcut.
export const INGREDIENTS = {
  rice:     { label: 'Rice',     emoji: '🍚', key: '1' },
  fish:     { label: 'Fish',     emoji: '🐟', key: '2' }, // the only one that runs out
  seaweed:  { label: 'Seaweed',  emoji: '🌿', key: '3' },
  egg:      { label: 'Egg',      emoji: '🥚', key: '4' },
  cucumber: { label: 'Cucumber', emoji: '🥒', key: '5' },
};

// The dishes customers can order.
export const RECIPES = [
  { name: 'Salmon nigiri', emoji: '🍣', ingredients: ['rice', 'fish'],                        price: 8 },
  { name: 'Onigiri',       emoji: '🍙', ingredients: ['rice', 'seaweed'],                     price: 6 },
  { name: 'Tamago',        emoji: '🍳', ingredients: ['rice', 'egg'],                         price: 7 },
  { name: 'Cucumber roll', emoji: '🥒', ingredients: ['rice', 'seaweed', 'cucumber'],         price: 9 },
  { name: 'Deluxe roll',   emoji: '🍱', ingredients: ['rice', 'fish', 'seaweed', 'cucumber'], price: 14 },
];

// The customers are sea creatures.
export const CREATURES = [
  { emoji: '🐙', name: 'Octavia' },
  { emoji: '🦀', name: 'Crabby Pete' },
  { emoji: '🐧', name: 'Pip' },
  { emoji: '🐢', name: 'Grandpa Shell' },
  { emoji: '🐡', name: 'Puff' },
  { emoji: '🦭', name: 'Selma' },
];

export const SEAT_COUNT = 3;          // seats at the counter
export const MAX_PLATE_ITEMS = 4;     // ingredients that fit on a plate
export const START_HEARTS = 3;        // lives per day
export const DAY_SECONDS = 60;        // length of one day
export const NEW_CUSTOMER_EVERY = 6;  // seconds between customers
export const PATIENCE_SECONDS = 25;   // how long a customer waits on day 1
export const PUZZLE_SECONDS = 15;     // time to answer a Fish API puzzle
export const FISH_IF_CORRECT = 8;     // fish delivered for a right answer
export const FISH_IF_WRONG = 2;       // fish delivered for a wrong answer
