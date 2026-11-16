/*
 * api.js
 * Every request to the PHP backend goes through this file, so the rest of the
 * game never deals with URLs, fetch or JSON (interoperability lives in one place).
 *
 * If no backend answers (e.g. the files are opened before the PHP part exists),
 * the game switches to DEMO MODE: no real accounts, and a stand-in puzzle instead
 * of the Fish Game API. Demo mode is for testing the UI only.
 *
 * Expected PHP endpoints (all return JSON, the session cookie identifies the user):
 *   GET  api/me.php            -> { ok, user: { username } }       ok:false if not logged in
 *   POST api/signup.php        { username, email, password } -> { ok, user } | { ok:false, error }
 *   POST api/login.php         { username, password }        -> { ok, user } | { ok:false, error }
 *   POST api/logout.php        -> { ok }
 *   GET  api/fish_puzzle.php   -> { ok, puzzleId, image, question, options:[a,b] }  (answer stays on the server)
 *   POST api/fish_answer.php   { puzzleId, choice } -> { ok, correct, answer, fish, chests }
 *   POST api/save_score.php    { score, day } -> { ok }
 *   GET  api/leaderboard.php   -> { ok, rows:[{ username, score, day, playedAt }] }
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import { createDemoPuzzle, checkDemoAnswer } from './demoPuzzle.js';

const BASE = 'api/';
let demo = false;

class BackendUnavailable extends Error {}

async function request(path, body) {
  let response;
  try {
    response = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin', // send the PHP session cookie
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new BackendUnavailable(); // no server at all (e.g. opened from file://)
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new BackendUnavailable(); // 404 page or PHP error instead of JSON
  }
}

/** Checks whether the PHP backend is running. Call once when a page loads. */
export async function detectBackend() {
  try {
    await request('me.php');
    demo = false;
  } catch {
    demo = true;
  }
  return !demo;
}

export function isDemo() { return demo; }

// ---------- Demo storage (browser only, not secure, testing only) ----------
const DEMO_USER = 'ssb_demo_user';
const DEMO_SCORES = 'ssb_demo_scores';
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
}

// ---------- Public API ----------
export async function me() {
  if (demo) {
    const username = readJSON(DEMO_USER, null);
    return username ? { ok: true, user: { username } } : { ok: false };
  }
  return request('me.php');
}

export async function signup(username, email, password) {
  if (demo) { writeJSON(DEMO_USER, username); return { ok: true, user: { username } }; }
  return request('signup.php', { username, email, password });
}

export async function login(username, password) {
  if (demo) { writeJSON(DEMO_USER, username); return { ok: true, user: { username } }; }
  return request('login.php', { username, password });
}

export async function logout() {
  if (demo) { localStorage.removeItem(DEMO_USER); return { ok: true }; }
  return request('logout.php', {});
}

export async function getPuzzle() {
  if (demo) return createDemoPuzzle();
  return request('fish_puzzle.php');
}

export async function answerPuzzle(puzzleId, choice) {
  if (demo) return checkDemoAnswer(puzzleId, choice);
  return request('fish_answer.php', { puzzleId, choice });
}

export async function saveScore(score, day) {
  if (demo) {
    const rows = readJSON(DEMO_SCORES, []);
    const username = readJSON(DEMO_USER, 'guest');
    rows.push({ username, score, day, playedAt: new Date().toISOString() });
    writeJSON(DEMO_SCORES, rows);
    return { ok: true };
  }
  return request('save_score.php', { score, day });
}

export async function leaderboard() {
  if (demo) {
    const sample = [
      { username: 'coral_kim', score: 412, day: 5 },
      { username: 'nemo_n', score: 305, day: 4 },
      { username: 'bubbles99', score: 188, day: 3 },
    ];
    // One row per player: their best game, plus how many games they played.
    const best = new Map();
    for (const row of [...sample, ...readJSON(DEMO_SCORES, [])]) {
      const prev = best.get(row.username);
      const games = (prev?.games ?? 0) + 1;
      if (!prev || row.score > prev.score) best.set(row.username, { ...row, games });
      else prev.games = games;
    }
    const rows = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    return { ok: true, rows };
  }
  return request('leaderboard.php');
}
