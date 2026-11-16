# Seaside Sushi Bar

CIS045-3 Distributed Service Architectures coursework. A browser game (HTML, CSS, JavaScript) with a PHP + MySQL backend on WAMP, using the Fish Game API.

## Run it
1. Copy the `sushi-bar` folder to `C:\wamp64\www\`.
2. In phpMyAdmin, run `api/database.sql` once (creates the database and tables).
3. Make sure the PHP **curl** extension is on (WAMP icon → PHP → PHP extensions → curl).
4. Open `http://localhost/sushi-bar/` (not by double-clicking the file).

## Files
| File | Job |
|---|---|
| `js/config.js` | All settings: ingredients, recipes, timings |
| `js/eventBus.js` | Publish/subscribe events between the parts |
| `js/kitchen.js` | The plate and the fish stock |
| `js/customers.js` | Seats, customers, patience |
| `js/engine.js` | Game rules: days, clock, hearts, coins, serving |
| `js/delivery.js` | Fish API puzzle popup |
| `js/ui.js` | Draws the screen, handles clicks and keys |
| `js/api.js` | The only file that talks to the PHP server |
| `js/game-main.js` | Starts the game page and connects the parts |
| `js/auth-page.js`, `js/leaderboard-page.js` | Login page, leaderboard page |
| `api/common.php` | Session, database connection, helpers (used by every PHP file) |
| `api/signup.php`, `login.php`, `logout.php`, `me.php` | Accounts and sessions |
| `api/fish_puzzle.php`, `fish_answer.php` | Calls the Fish API, checks answers |
| `api/save_score.php`, `leaderboard.php` | Scores |

## Controls
`1`–`5` ingredients · `Q` `W` `E` serve seats 1–3 · `X` clear plate

## References
- Code generated with Claude (Anthropic), November 2026, then simplified with Claude and reviewed by me. Marked at the top of each file.
- Fish Game API by Marc Conrad: https://marcconrad.com/uob/fish/doc.php
- `api/cacert.pem`: trusted certificate list from https://curl.se/docs/caextract.html
- Fonts: Fredoka and Nunito, Google Fonts (SIL Open Font License).
