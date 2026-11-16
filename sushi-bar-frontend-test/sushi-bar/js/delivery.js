/*
 * delivery.js
 * The fish delivery popup. When the game emits 'puzzle:needed', this gets a
 * Fish API puzzle from our PHP server, lets the player answer, asks the server
 * if the answer was right, and emits 'puzzle:answered' (true / false).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import * as api from './api.js';
import { PUZZLE_SECONDS, FISH_IF_CORRECT, FISH_IF_WRONG } from './config.js';

const $ = (id) => document.getElementById(id);

export class PuzzlePopup {
  constructor(bus) {
    this.bus = bus;
    this.correct = false;

    bus.on('puzzle:needed', () => this.open());
    $('puzzle-continue').addEventListener('click', () => this.close());
  }

  async open() {
    // Reset the popup and show it.
    $('puzzle').hidden = false;
    $('puzzle-loading').hidden = false;
    $('puzzle-loading').textContent = 'Opening the crate…';
    $('puzzle-image').hidden = true;
    $('puzzle-question').textContent = '';
    $('puzzle-answers').innerHTML = '';
    $('puzzle-result').hidden = true;
    $('puzzle-continue').hidden = true;
    $('puzzle-timer').textContent = '';
    this.correct = false;

    const puzzle = await api.getPuzzle();
    if (!puzzle.ok) {
      $('puzzle-loading').textContent = 'The fish supplier can’t be reached.';
      this.showResult(false, `No puzzle this time. You get ${FISH_IF_WRONG} fish.`);
      return;
    }

    // Show the picture and one button per answer.
    this.puzzleId = puzzle.puzzleId;
    $('puzzle-loading').hidden = true;
    $('puzzle-image').src = puzzle.image;
    $('puzzle-image').hidden = false;
    $('puzzle-question').textContent = 'How many fish are in the crate?';
    for (const option of puzzle.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-answer';
      button.textContent = option;
      button.addEventListener('click', () => this.answer(option));
      $('puzzle-answers').appendChild(button);
    }
    this.startTimer();
  }

  startTimer() {
    let secondsLeft = PUZZLE_SECONDS;
    $('puzzle-timer').textContent = secondsLeft + 's';
    this.timer = setInterval(() => {
      secondsLeft = secondsLeft - 1;
      $('puzzle-timer').textContent = secondsLeft + 's';
      if (secondsLeft <= 0) this.answer(''); // out of time counts as wrong
    }, 1000);
  }

  async answer(choice) {
    clearInterval(this.timer);
    $('puzzle-answers').innerHTML = ''; // remove the buttons so you can't answer twice

    // The SERVER decides if the answer is right (the browser never knows the answer).
    const result = await api.checkAnswer(this.puzzleId, choice);
    if (!result.ok) {
      this.showResult(false, `Couldn’t check the answer. You get ${FISH_IF_WRONG} fish.`);
    } else if (result.correct) {
      this.correct = true;
      this.showResult(true, `Correct! You get ${FISH_IF_CORRECT} fish.`);
    } else {
      this.showResult(false, `Wrong: there were ${result.fish} fish. You only get ${FISH_IF_WRONG} fish.`);
    }
  }

  showResult(isRight, text) {
    $('puzzle-timer').textContent = '';
    $('puzzle-result').textContent = text;
    $('puzzle-result').className = 'delivery-result ' + (isRight ? 'is-right' : 'is-wrong');
    $('puzzle-result').hidden = false;
    $('puzzle-continue').hidden = false;
    $('puzzle-continue').focus();
  }

  close() {
    $('puzzle').hidden = true;
    this.bus.emit('puzzle:answered', this.correct);
  }
}
