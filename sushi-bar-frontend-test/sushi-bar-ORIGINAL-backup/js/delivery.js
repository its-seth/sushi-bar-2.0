/*
 * delivery.js
 * The fish delivery screen. When the engine asks for a delivery, this fetches a
 * Fish API puzzle (through api.js), lets the player answer, asks the server
 * whether the answer was right, and reports back with a 'delivery:resolved' event.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import * as api from './api.js';
import { DELIVERY, PUZZLE_SECONDS } from './config.js';

const TEXT = {
  morning: {
    title: 'The morning catch has arrived',
    intro: 'Count the crate correctly to get the full delivery.',
    win: () => `Full delivery: ${DELIVERY.morning.correctFish} fish.`,
    lose: () => `The fisherman only leaves ${DELIVERY.morning.wrongFish} fish.`,
  },
  emergency: {
    title: 'Emergency fish delivery',
    intro: 'Count the crate to restock your fish.',
    win: () => `+${DELIVERY.emergency.correctFish} fish added to your stock.`,
    lose: () => `Only +${DELIVERY.emergency.wrongFish} fish this time.`,
  },
  rescue: {
    title: 'Out of hearts!',
    intro: 'One last chance: count the crate correctly to win a heart back.',
    win: () => 'You win a heart back. Keep serving!',
    lose: () => 'No heart this time. The sushi bar closes.',
  },
};

export class DeliveryModal {
  constructor(bus) {
    this.bus = bus;
    this.el = document.getElementById('overlay-delivery');
    this.titleEl = this.el.querySelector('[data-title]');
    this.introEl = this.el.querySelector('[data-intro]');
    this.imgEl = this.el.querySelector('[data-image]');
    this.loadingEl = this.el.querySelector('[data-loading]');
    this.questionEl = this.el.querySelector('[data-question]');
    this.optionsEl = this.el.querySelector('[data-options]');
    this.timerEl = this.el.querySelector('[data-timer]');
    this.resultEl = this.el.querySelector('[data-result]');
    this.continueBtn = this.el.querySelector('[data-continue]');
    this.state = null;

    bus.on('delivery:request', ({ reason }) => this.open(reason));
    this.continueBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => this.onKey(e));
  }

  async open(reason) {
    const text = TEXT[reason];
    this.state = { reason, puzzle: null, answered: false, timer: null, result: null };
    this.titleEl.textContent = text.title;
    this.introEl.textContent = text.intro;
    this.el.dataset.reason = reason;
    this.imgEl.hidden = true;
    this.loadingEl.hidden = false;
    this.loadingEl.textContent = 'Opening the crate…';
    this.questionEl.textContent = '';
    this.optionsEl.innerHTML = '';
    this.resultEl.hidden = true;
    this.continueBtn.hidden = true;
    this.timerEl.textContent = '';
    this.el.hidden = false;

    try {
      const puzzle = await api.getPuzzle();
      if (!puzzle.ok) throw new Error(puzzle.error || 'No puzzle');
      this.state.puzzle = puzzle;
      this.imgEl.src = puzzle.image;
      this.imgEl.hidden = false;
      this.loadingEl.hidden = true;
      this.questionEl.textContent = puzzle.question;
      puzzle.options.forEach((option, i) => {
        const b = document.createElement('button');
        b.className = 'btn btn-answer';
        b.type = 'button';
        const key = document.createElement('span');
        key.className = 'key';
        key.textContent = i === 0 ? '←' : '→';
        b.append(key, document.createTextNode(option));
        b.addEventListener('click', () => this.answer(option));
        this.optionsEl.appendChild(b);
      });
      this.startTimer();
    } catch {
      // The Fish API (or our server) didn't answer. Don't punish the player for it.
      this.loadingEl.textContent = 'The fish supplier can’t be reached right now. You get a small delivery.';
      this.state.result = { correct: false, unavailable: true };
      this.showResult(false, 'Supplier offline');
    }
  }

  startTimer() {
    let left = PUZZLE_SECONDS;
    this.timerEl.textContent = `${left}s`;
    this.state.timer = setInterval(() => {
      left--;
      this.timerEl.textContent = `${left}s`;
      if (left <= 0) this.answer(null); // ran out of time counts as wrong
    }, 1000);
  }

  async answer(choice) {
    if (!this.state || this.state.answered || !this.state.puzzle) return;
    this.state.answered = true;
    clearInterval(this.state.timer);
    this.optionsEl.querySelectorAll('button').forEach(b => (b.disabled = true));

    let result;
    try {
      result = choice === null
        ? await api.answerPuzzle(this.state.puzzle.puzzleId, '__timeout__')
        : await api.answerPuzzle(this.state.puzzle.puzzleId, choice);
    } catch {
      result = { ok: false };
    }
    const correct = !!(result.ok && result.correct);
    this.state.result = { correct, chests: result.chests || 0 };

    const detail = result.ok
      ? `${choice === null ? 'Time’s up. ' : ''}The answer was ${result.answer} (${result.fish} fish, ${result.chests} chest${result.chests === 1 ? '' : 's'}).`
      : 'Couldn’t check the answer.';
    this.showResult(correct, detail);
  }

  showResult(correct, detail) {
    const text = TEXT[this.state.reason];
    this.resultEl.hidden = false;
    this.resultEl.className = 'delivery-result ' + (correct ? 'is-right' : 'is-wrong');
    const head = document.createElement('strong');
    head.textContent = correct ? 'Correct! ' : 'Not quite. ';
    const outcome = document.createElement('span');
    outcome.className = 'delivery-outcome';
    outcome.textContent = correct ? text.win() : text.lose();
    this.resultEl.replaceChildren(head, document.createTextNode(detail), outcome);
    this.continueBtn.hidden = false;
    this.continueBtn.focus();
  }

  close() {
    if (!this.state) return;
    const { reason, result } = this.state;
    clearInterval(this.state.timer);
    this.el.hidden = true;
    this.state = null;
    this.bus.emit('delivery:resolved', { reason, correct: result?.correct ?? false, chests: result?.chests ?? 0 });
  }

  onKey(e) {
    if (this.el.hidden || !this.state) return;
    const buttons = this.optionsEl.querySelectorAll('button');
    if (!this.state.answered && buttons.length === 2) {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { e.preventDefault(); buttons[0].click(); }
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') { e.preventDefault(); buttons[1].click(); }
    } else if (!this.continueBtn.hidden && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); this.close();
    }
  }
}
