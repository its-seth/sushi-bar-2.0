# Seaside Sushi Bar (frontend)

CIS045-3 Distributed Service Architectures coursework. Plain HTML, CSS and JavaScript (ES modules), built to run on WAMP with a PHP backend.

## Run it
1. Copy the `sushi-bar` folder to `C:\wamp64\www\`.
2. Start WAMP (green icon) and open `http://localhost/sushi-bar/`.
3. Until the PHP files exist in `api/`, the game runs in **demo mode** (yellow badge): any username works and a stand-in puzzle replaces the Fish Game API.

Opening `index.html` by double-clicking won't work: browsers block ES modules on `file://`. Always use `http://localhost/...`.

## How the code is organised
| File | Job |
|---|---|
| `js/eventBus.js` | Publish/subscribe events so modules don't call each other directly |
| `js/config.js` | Ingredients, recipes, customers, difficulty, rewards |
| `js/kitchen.js` | The plate being built and fish stock |
| `js/customers.js` | Seats, arrivals, patience |
| `js/engine.js` | Game rules: days, game loop, hearts, coins, serving, delivery rewards |
| `js/delivery.js` | Fish delivery puzzle screen (Fish Game API) |
| `js/ui.js` | Draws the game screen and handles clicks and keys |
| `js/api.js` | All requests to the PHP backend (plus demo mode) |
| `js/demoPuzzle.js` | Demo-only stand-in for the Fish Game API |
| `js/game-main.js` | Game page start-up: checks login, wires modules together |
| `js/auth-page.js`, `js/leaderboard-page.js` | Login/sign-up and leaderboard pages |

## Controls
`1`–`5` ingredients · `Q` `W` `E` serve seats 1–3 · `X` clear plate · `P` pause · `←` `→` answer a delivery puzzle

## References
- Code generated with Claude (Anthropic), November 2026, then reviewed and adapted by me. Marked at the top of each file.
- Fish Game API: https://marcconrad.com/uob/fish/doc.php
- Fonts: Fredoka and Nunito, Google Fonts (SIL Open Font License).
- Emoji are drawn by the operating system's emoji font.
