/*
 * auth-page.js
 * Log in / create account page. Sends the form to the PHP backend (api.js);
 * the backend checks the password and starts a session cookie.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

import * as api from './api.js';

const $ = (id) => document.getElementById(id);

function showTab(name) {
  for (const tab of document.querySelectorAll('[role="tab"]')) {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', active);
    $(tab.getAttribute('aria-controls')).hidden = !active;
  }
  $('auth-error').hidden = true;
}

function showError(message) {
  const el = $('auth-error');
  el.textContent = message;
  el.hidden = false;
}

async function submit(form, action) {
  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const res = action === 'login'
      ? await api.login(data.username.trim(), data.password)
      : await api.signup(data.username.trim(), data.email.trim(), data.password);
    if (res.ok) location.href = 'game.html';
    else showError(res.error || 'Something went wrong. Try again.');
  } catch {
    showError('The server can’t be reached. Check that WAMP is running.');
  } finally {
    button.disabled = false;
  }
}

async function start() {
  const backend = await api.detectBackend();
  $('demo-badge').hidden = backend;
  if (!backend) $('demo-note').hidden = false;

  const session = await api.me();
  if (session.ok) { location.href = 'game.html'; return; }

  for (const tab of document.querySelectorAll('[role="tab"]')) tab.addEventListener('click', () => showTab(tab.dataset.tab));

  $('login-form').addEventListener('submit', (e) => { e.preventDefault(); submit(e.target, 'login'); });
  $('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.password.value.length < 8) return showError('Use at least 8 characters for your password.');
    if (f.password.value !== f.confirm.value) return showError('The two passwords don’t match.');
    submit(f, 'signup');
  });
}

start();
