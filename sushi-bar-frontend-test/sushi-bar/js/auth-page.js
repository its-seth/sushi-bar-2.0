/*
 * auth-page.js
 * The log in / create account page. Sends the form to the PHP server.
 * If the server says OK, it has started a session (cookie) and we go to the game.
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

import * as api from './api.js';

const $ = (id) => document.getElementById(id);

// Already logged in? Go straight to the game.
api.whoAmI().then((me) => {
  if (me.ok) location.href = 'game.html';
});

// Switch between the two forms.
function showForm(name) {
  $('login-form').hidden = name !== 'login';
  $('signup-form').hidden = name !== 'signup';
  $('show-login').setAttribute('aria-selected', name === 'login');
  $('show-signup').setAttribute('aria-selected', name === 'signup');
  $('auth-error').hidden = true;
}
$('show-login').addEventListener('click', () => showForm('login'));
$('show-signup').addEventListener('click', () => showForm('signup'));

function showError(text) {
  $('auth-error').textContent = text;
  $('auth-error').hidden = false;
}

// Log in
$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser reloading the page
  const form = event.target;
  const result = await api.login(form.username.value, form.password.value);
  if (result.ok) location.href = 'game.html';
  else showError(result.error);
});

// Create account
$('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.password.value !== form.confirm.value) {
    showError('The two passwords don’t match.');
    return;
  }
  const result = await api.signup(form.username.value, form.email.value, form.password.value);
  if (result.ok) location.href = 'game.html';
  else showError(result.error);
});
