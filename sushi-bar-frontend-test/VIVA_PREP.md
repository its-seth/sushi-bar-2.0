# Viva guide (simple version)

Read this top to bottom twice. Then open each file it mentions and find the line it talks about.

---

## Part 1: What the game does (say this first, about 30 seconds)

> "It's a sushi bar game. Sea creatures sit at the counter and order a dish. I click the ingredients to build the dish and press Serve. Right dish = coins. Wrong dish, or the customer waits too long = I lose a heart. 3 hearts lost = game over.
>
> Fish runs out. To get fish I must solve a puzzle from the **Fish Game API**: count the fish in a picture. Right answer = 8 fish, wrong = 2 fish. Every day starts with one puzzle, and I can order more any time.
>
> You must log in to play. Your coins are saved to your account, so they carry over to your next game, and the leaderboard shows each player once."

### What is a "day"?

A **day is one round of the game that lasts 60 seconds** (like one shift at the sushi bar).

1. **Start of the day:** hearts go back to 3, and a fish delivery puzzle appears.
2. **During the day:** customers arrive, you serve them, the 60-second clock counts down.
3. **End of the day** (clock reaches 0): a "Day over" screen shows your coins and says how the next day will be harder. Your coins are **saved on the server** now.
4. **Next day:** harder (see below). You keep your coins and your fish.
5. **Game over:** if you lose all 3 hearts during a day. Your coins are saved. "Play again" starts at Day 1, but **you keep your coins**.

**How each day gets harder** (one function, `difficulty(day)` in `config.js`):

| Day | Customer waits | New customer every | Menu |
|---|---|---|---|
| 1 | 25 s | 6 s | 3 easy dishes |
| 2 | 22 s | 5.5 s | + Cucumber roll (3 ingredients) |
| 3 | 19 s | 5 s | + Deluxe roll (4 ingredients) |
| 4 | 16 s | 4.5 s | same |
| … | −3 s each day, never below 8 s | −0.5 s each day, never below 2.5 s | |

> "All the difficulty rules are in **one function** in `config.js`. The game asks it 'how hard is day 3?' and gets back the numbers. If I want to change the balance, I only touch that one function. That's high cohesion."

---

## Part 2: The big picture

There are **4 separate systems** talking to each other:

```
 [ Browser: JavaScript ]  --HTTP + JSON-->  [ My PHP server (WAMP) ]  --HTTPS + JSON-->  [ Fish Game API (Marc Conrad's server) ]
                                                      |
                                                      v
                                               [ MySQL database ]
```

**The most important idea in the whole project:**
The browser **never** talks to the Fish API. My PHP server does. The PHP server keeps the right answer and only sends the picture to the browser. So a player **can't cheat** by looking in the browser's developer tools.

---

## Part 3: The files (what each one does in ONE sentence)

**JavaScript (in the browser): `sushi-bar/js/`**

| File | One sentence |
|---|---|
| `config.js` | All the settings: ingredients, recipes, how long a day is, and `difficulty(day)`: how hard each day is. |
| `eventBus.js` | A tiny message system so the parts can tell each other things. |
| `kitchen.js` | The plate you are building and how many fish you have. |
| `customers.js` | Who is sitting in each seat and how patient they are. |
| `engine.js` | The game rules: clock, hearts, coins, serving, deliveries. |
| `delivery.js` | The fish puzzle popup. |
| `ui.js` | Draws everything on the screen and reacts to clicks and keys. |
| `api.js` | The **only** file that talks to the PHP server. |
| `game-main.js` | Starts everything and connects the parts together. |
| `auth-page.js` | The login / sign-up page. |
| `leaderboard-page.js` | The leaderboard page. |

**PHP (on the server): `sushi-bar/api/`**

| File | One sentence |
|---|---|
| `config.php` | Database settings and the Fish API address. |
| `common.php` | Used by every PHP file: starts the session, connects to the database, small helpers. |
| `signup.php` | Makes a new account (stores a **hash** of the password). |
| `login.php` | Checks the password and logs you in. |
| `me.php` | Tells the browser who is logged in, plus their saved coins. |
| `logout.php` | Logs you out (deletes the session). |
| `fish_puzzle.php` | Gets a puzzle from the Fish API, keeps the answer, sends the picture. |
| `fish_answer.php` | Checks your answer. |
| `save_progress.php` | Saves your coins and best day (end of every day and at game over). |
| `leaderboard.php` | Gets the top 10 players by coins (one row per player). |
| `database.sql` | Creates the `users` table (username, email, password hash, **coins**, **best_day**). |
| `upgrade.sql` | Only for an old database: adds the coins and best_day columns. |

**Why the leaderboard shows each player only once:** coins are stored **in the `users` table** (one row per player). The old version saved every game as a new row in a `scores` table, so the same player appeared many times.

---

## Part 4: The 4 themes

For each theme: **what it means**, **where it is in my code**, **why I did it**, and **another way I could have done it**. The rubric gives top marks for that last part.

### Theme 1: Low coupling and high cohesion

**What it means (simple):**
- **High cohesion** = each file does **one job**.
- **Low coupling** = files **don't depend on each other's insides**. You can change one without breaking the others.

**Where in my code:**
- Each file has one job (see the table above). For example, `kitchen.js` only cares about the plate and fish.
- `engine.js` (the rules) **never touches the screen**. Only `ui.js` does. So I could change the whole look without touching the rules.
- `api.js` is the **only** file that talks to the server. If the server changed, I'd only fix that one file.
- All the numbers are in `config.js`, so I can make the game easier or harder without touching any logic.
- The parts talk through the **event bus** (`eventBus.js`), not by calling each other directly.
- Server side: `common.php` holds the shared code once, so the other PHP files stay short.

**Be honest about one weakness (this gets extra marks):**
> "It's not perfect. `ui.js` still calls the game directly, for example `game.serve(seat)`. I think that's fine: the screen *needs* to tell the game what the player did. But the game never calls the screen. It only sends events. So the coupling only goes one way."

**Another way I could have done it:**
> "I could have put everything in one big file. That's quicker at the start but very hard to change later. Or I could have used a framework like React. It would organise the code for me, but it hides the ideas, and I wanted to show the structure myself."

### Theme 2: Event-driven programming

**What it means (simple):** the program doesn't run top to bottom. It **waits for things to happen** (a click, a key press, a timer, a reply from the server) and then runs the code for that event. That code is called an **event handler** or **listener**.

**Where in my code, 4 kinds of events:**
1. **Player events**: clicks and key presses. `addEventListener('click', ...)` and `addEventListener('keydown', ...)` in `ui.js`. Keys 1–5 add ingredients; Q/W/E serve.
2. **My own game events** using the event bus (`eventBus.js`):
   - `bus.on('coins:changed', ...)` = "when coins change, run this" (**subscribe / listen**)
   - `bus.emit('coins:changed', 10)` = "coins changed, tell everyone" (**publish**)
   - This is called the **publish/subscribe** or **Observer** pattern.
3. **Timer events**:
   - `requestAnimationFrame` runs the game loop about 60 times a second (`engine.js`, the `loop` function).
   - `setInterval` counts down the 15-second puzzle timer (`delivery.js`).
4. **Server reply events**: `await fetch(...)` in `api.js`. The game keeps running while it waits for the server.

**Best example to explain (practise this one):**
> "When a customer waits too long, `customers.js` emits `customer:gave-up`. `engine.js` is listening for that, so it runs `loseHeart()`. That emits `hearts:changed`. `ui.js` is listening for that, so it redraws the hearts. **`customers.js` doesn't know the hearts exist, and the game rules don't know the screen exists.** They're only connected by events."

**Losing a heart (one event, many effects):**
> "When you lose a heart, `engine.js` emits one event, `heart:lost`, with the reason and the seat. `ui.js` listens and does everything you see: the red flash, the screen shake, the ✗ or 💢 over the seat, and the red message. The engine doesn't know any of these effects exist. I added them later without changing the game rules: I just added a listener."

**Second example: the fish puzzle:**
> "The game emits `puzzle:needed` and stops the clock. `delivery.js` hears it and opens the popup. When the player finishes, it emits `puzzle:answered` with true or false. The game hears that and adds the fish. The game and the popup never call each other."

**Why / another way:**
> "I could have made the game call `ui.drawHearts()` directly. But then the rules would depend on the screen. With events, **many listeners** can react to one event, and I can add new ones without changing the code that sends it."

### Theme 3: Interoperability

**What it means (simple):** different programs, in **different languages, on different computers**, working together because they agree on a **protocol** (how to send: HTTP) and a **data format** (what to send: JSON).

**Where in my code, 3 connections:**

| Who talks to who | How (protocol) | What (format) | File |
|---|---|---|---|
| My JavaScript → my PHP | HTTP, using `fetch` | JSON | `api.js` |
| My PHP → **Fish Game API** (someone else's server) | **HTTPS**, using **cURL** | JSON | `fish_puzzle.php` |
| My PHP → MySQL | PDO (PHP's database library) | SQL | `common.php` |

**The Fish API part (most important for this theme):** in `fish_puzzle.php`:
1. `curl_init(FISH_API_URL)` sends a request to Marc Conrad's server over HTTPS.
2. It replies with JSON: `{ "question": <the picture as base64 text>, "fish": 5, "chest": 6 }`.
3. `json_decode` turns that into a PHP array.
4. I keep `fish` (the answer) in the session, make one wrong answer, and send the browser **only the picture and two options**.

So **JavaScript, PHP and someone else's PHP** all work together. **JSON** is the shared language they all understand.

**Things that show I thought about it:**
- **Timeout** of 10 seconds, so a slow Fish API doesn't freeze the game.
- If the Fish API fails, **try once more**. If it still fails, the game shows "supplier can't be reached" and carries on (you get 2 fish).
- **HTTPS certificates:** WAMP doesn't have the list of trusted certificates, so I added `cacert.pem`. I did **not** switch off certificate checking. That would "work", but it's insecure.

**Why go through my server instead of calling the Fish API from JavaScript?**
> "The lecturer's JavaScript example calls the Fish API straight from the browser. Then the answer arrives in the browser, and anyone can see it in the developer tools (Network tab). In my version, the answer stays on my server. The downside: there's an extra step, so it's a little slower, and if my server is down nothing works."

**Other ways:** SOAP with XML (older, heavier, stricter), or WebSockets (two-way live connection; not needed because the game only asks and gets one answer).

### Theme 4: Virtual identity

**What it means (simple):** how the system knows **who you are** online. Here: your **account** (username + password) and, after you log in, a **session cookie**.

**Step by step through my code:**
1. **Sign up** (`signup.php`): the server checks the input again, because anyone can skip the browser's checks. Then `password_hash()` turns the password into a **hash** (bcrypt) and only the hash is saved. **The real password is never stored.**
2. **Log in** (`login.php`): `password_verify()` checks the typed password against the hash. If it's wrong, it says *"Wrong username or password"*, the **same message either way**, so nobody can find out which usernames exist.
3. **Session cookie** (`common.php`): `session_start()` gives the browser a cookie called `PHPSESSID` with a random ID. The browser sends it with every request, so the server knows it's you. On login I save `$_SESSION['user_id']`.
   - `httponly`: JavaScript can't read the cookie, so a hacker's script can't steal it.
   - `samesite = Lax`: other websites can't use your cookie (protects against **CSRF**).
4. **New session ID on login**: `session_regenerate_id(true)` (stops **session fixation**, where an attacker plants a session ID on you before you log in).
5. **Protected pages**: `require_login()` at the top of PHP files. No session = "Please log in first."
6. **Saving coins**: `save_progress.php` takes **your ID from the session**, not from what the browser sends. So you can't put coins into someone else's account. When you come back later, `me.php` loads **your** coins. Your coins belong to your virtual identity.
7. **Log out** (`logout.php`): deletes the session.
8. **Bonus:** the puzzle answers are also stored in your session, so each player's answers are private to them.

**Other security points:**
- `?` in SQL (prepared statements) means **no SQL injection**.
- Leaderboard uses `textContent`, not `innerHTML`, so a username can't sneak HTML or JavaScript onto the page.

**Weaknesses: say these yourself before they ask:**
- "The **coins are sent by the browser**, so a clever player could fake them. A fix would be for the server to count the coins every time a dish is served."
- "Coins are saved at the end of each day. If you close the tab in the middle of a day, that day's coins are lost."
- "There's no limit on wrong password attempts. I'd add a lockout after 5 tries."
- "It runs on `http://localhost`, not HTTPS. On a real website I'd use HTTPS and add the `secure` flag to the cookie."
- "The database uses `root` with no password. That's WAMP's default and fine for testing, not for a real site."

**Other ways to do identity:**
- **JWT tokens** instead of sessions: the server doesn't have to remember anything, which is good with many servers. But it's harder to log someone out early.
- **"Sign in with Google" (OAuth)**: no passwords to store, but it depends on Google.
- **Two-factor login** (a code on your phone) for extra security.

---

## Part 5: Questions they might ask (short answers)

- **"Show me where the Fish API is called."** → `fish_puzzle.php`, the `ask_fish_api()` function, `curl_init(FISH_API_URL)`.
- **"How does the browser know who's logged in?"** → The session cookie. `game-main.js` calls `api.whoAmI()` → `me.php` reads `$_SESSION['username']`.
- **"What is the event bus?"** → `eventBus.js`. It has a list of listeners for each event name. `on` adds one; `emit` calls them all.
- **"What's a hash? Why not just store the password?"** → A hash is a one-way scramble that can't be turned back into the password. If the database leaks, the attacker doesn't get real passwords.
- **"Why can't the player answer the puzzle twice?"** → `fish_answer.php` deletes the answer after the first try (`unset`), and `delivery.js` removes the buttons.
- **"What is a day? How does it get harder?"** → One 60-second round. `difficulty(day)` in `config.js`: less patience, faster customers, bigger dishes each day. `engine.js` calls it in `startDay()`.
- **"Why does each player appear once on the leaderboard?"** → Coins live in the `users` table, one row per player. `leaderboard.php` just sorts users by coins.
- **"Where are coins saved and loaded?"** → Saved by `save_progress.php` at the end of each day and at game over (called from `ui.js`). Loaded by `me.php` when the game page opens (`game-main.js` passes them into the `Game`).
- **"What happens if the time runs out on a puzzle?"** → The timer sends an empty answer, which is always wrong.
- **"What's `async` / `await`?"** → Wait for the server's reply without freezing the page.
- **"What is `seconds` in the game loop?"** → Time since the last frame. The clock uses real time, so the game runs the same speed on a fast or slow computer.
- **"Did you use AI?"** → "Yes. The brief allows it for code, and it's referenced at the top of every file. I then had it simplified so I fully understand every part, and I tested it myself." Be ready to show you can explain any file.

---

## Part 6: Before you walk in

- [ ] Every file says `Reviewed and adapted by: <your name>`. **Put your name in.**
- [ ] Copy the new `sushi-bar` folder into `C:\wamp64\www\` (replace the old one) and play once: sign up, solve a puzzle, serve a dish, lose, check the leaderboard.
- [ ] **Database changed.** If you already have the `sushi_bar` database, run `api/upgrade.sql` once in phpMyAdmin (adds the coins columns, removes the old scores table). If you don't have it yet, run `api/database.sql`.
- [ ] Your old version is saved in `sushi-bar-ORIGINAL-backup` if you need it.
