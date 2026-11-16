<?php
/*
 * config.php
 * Database settings. These are WAMP's defaults (user "root", no password).
 * Change them here only.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

const DB_HOST = 'localhost';
const DB_NAME = 'sushi_bar';
const DB_USER = 'root';
const DB_PASS = '';

// Fish Game API (https://marcconrad.com/uob/fish/doc.php)
const FISH_API_JSON = 'https://marcconrad.com/uob/fish/api.php?out=json&base64=yes';
const FISH_API_CSV  = 'https://marcconrad.com/uob/fish/api.php?out=csv&base64=yes';
const PUZZLE_SECONDS_ALLOWED = 60; // a puzzle must be answered within this time
