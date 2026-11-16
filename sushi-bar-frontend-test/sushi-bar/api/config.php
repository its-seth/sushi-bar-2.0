<?php
/*
 * config.php
 * Settings. The database ones are WAMP's defaults (user "root", no password).
 *
 * Source: generated with Claude (Anthropic), November 2026, then simplified with Claude.
 * Reviewed and adapted by: <your name>
 */

const DB_HOST = 'localhost';
const DB_NAME = 'sushi_bar';
const DB_USER = 'root';
const DB_PASS = '';

// Fish Game API by Marc Conrad: https://marcconrad.com/uob/fish/doc.php
// Returns JSON: { "question": <picture as base64>, "fish": <number>, "chest": <number> }
const FISH_API_URL = 'https://marcconrad.com/uob/fish/api.php?out=json&base64=yes';
