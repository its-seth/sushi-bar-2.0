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

// The dishes customers can order. "fromDay" = the first day it appears on the menu.
export const RECIPES = [
  { name: 'Salmon nigiri', emoji: '🍣', ingredients: ['rice', 'fish'],                        price: 8,  fromDay: 1 },
  { name: 'Onigiri',       emoji: '🍙', ingredients: ['rice', 'seaweed'],                     price: 6,  fromDay: 1 },
  { name: 'Tamago',        emoji: '🍳', ingredients: ['rice', 'egg'],                         price: 7,  fromDay: 1 },
  { name: 'Cucumber roll', emoji: '🥒', ingredients: ['rice', 'seaweed', 'cucumber'],         price: 9,  fromDay: 2 },
  { name: 'Deluxe roll',   emoji: '🍱', ingredients: ['rice', 'fish', 'seaweed', 'cucumber'], price: 14, fromDay: 3 },
];

// How hard each day is. Every new day:
//   - customers wait 3 seconds less before giving up (never less than 8),
//   - customers arrive half a second sooner (never faster than every 2.5 seconds),
//   - bigger dishes join the menu (day 2 and day 3).
export function difficulty(day) {
  return {
    patience:         Math.max(8, 25 - (day - 1) * 3),
    newCustomerEvery: Math.max(2.5, 6 - (day - 1) * 0.5),
    menu:             RECIPES.filter(recipe => recipe.fromDay <= day),
  };
}

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
export const START_HEARTS = 3;        // lives at the start of every day
export const DAY_SECONDS = 60;        // length of one day
export const PUZZLE_SECONDS = 15;     // time to answer a Fish API puzzle
export const FISH_IF_CORRECT = 8;     // fish delivered for a right answer
export const FISH_IF_WRONG = 2;       // fish delivered for a wrong answer
