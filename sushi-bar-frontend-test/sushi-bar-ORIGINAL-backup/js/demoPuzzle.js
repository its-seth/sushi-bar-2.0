/*
 * demoPuzzle.js
 * DEMO MODE ONLY. Used when the PHP backend isn't running yet, so the game can
 * be played and tested. It draws a fake "crate" picture with fish and treasure
 * chests and builds a question about it.
 *
 * In the real game the PHP backend calls the Fish Game API instead
 * (https://marcconrad.com/uob/fish/doc.php) and keeps the answer on the server.
 * Here the answer has to live in the browser, which is exactly the weakness the
 * backend version fixes.
 *
 * Source: generated with Claude (Anthropic), November 2026. Reviewed and adapted by: <your name>
 */

const FISH_COLOURS = ['#FF9F43', '#FF6B81', '#48DBFB', '#FECA57', '#A29BFE', '#1DD1A1'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(list) { return list.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]); }

/** Draws the sea, fish and chests on a canvas and returns it as an image (data URL). */
function drawCrate(fishCount, chestCount) {
  const w = 480, h = 270;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, '#3FA9D6'); sea.addColorStop(1, '#0F4C75');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#E3C08D';
  ctx.beginPath(); ctx.ellipse(w / 2, h + 30, w * 0.8, 80, 0, 0, Math.PI * 2); ctx.fill();

  // Fish go into a shuffled grid so they don't overlap.
  const cells = shuffle(Array.from({ length: 15 }, (_, i) => i)).slice(0, fishCount);
  for (const cell of cells) {
    const col = cell % 5, row = Math.floor(cell / 5);
    const x = 50 + col * 90 + rand(-12, 12), y = 40 + row * 55 + rand(-8, 8);
    const s = 0.8 + Math.random() * 0.4, flip = Math.random() < 0.5 ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(flip * s, s);
    ctx.fillStyle = FISH_COLOURS[rand(0, FISH_COLOURS.length - 1)];
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-40, -12); ctx.lineTo(-40, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#12355B'; ctx.beginPath(); ctx.arc(14, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < chestCount; i++) {
    const x = 40 + i * 140 + rand(0, 40), y = h - 58;
    ctx.fillStyle = '#8B5A2B'; ctx.fillRect(x, y + 14, 56, 32);
    ctx.fillStyle = '#A86B34'; ctx.beginPath(); ctx.roundRect(x, y, 56, 18, [12, 12, 0, 0]); ctx.fill();
    ctx.fillStyle = '#F5C04A'; ctx.fillRect(x + 24, y + 12, 8, 12);
  }
  return canvas.toDataURL('image/png');
}

/** Picks a question about the crate and one believable wrong answer. */
function buildQuestion(fish, chests) {
  const types = ['fish', 'fish', 'chests', 'total'];
  if (fish !== chests) types.push('more');
  const type = types[rand(0, types.length - 1)];

  if (type === 'more') {
    const answer = fish > chests ? 'Fish' : 'Chests';
    return { question: 'Are there more fish or more chests?', options: ['Fish', 'Chests'], answer };
  }
  const correct = type === 'fish' ? fish : type === 'chests' ? chests : fish + chests;
  const question = type === 'fish' ? 'How many fish are in the crate?'
    : type === 'chests' ? 'How many treasure chests are in the crate?'
    : 'How many fish and chests altogether?';
  let wrong;
  do { wrong = correct + (Math.random() < 0.5 ? -1 : 1) * rand(1, 2); } while (wrong < 0 || wrong === correct);
  return { question, options: shuffle([String(correct), String(wrong)]), answer: String(correct) };
}

const pending = new Map(); // puzzleId -> { answer, fish, chests }

export function createDemoPuzzle() {
  const fish = rand(1, 9), chests = rand(0, 3);
  const { question, options, answer } = buildQuestion(fish, chests);
  const puzzleId = 'demo-' + Date.now() + '-' + rand(0, 9999);
  pending.set(puzzleId, { answer, fish, chests });
  return { ok: true, puzzleId, image: drawCrate(fish, chests), question, options };
}

export function checkDemoAnswer(puzzleId, choice) {
  const p = pending.get(puzzleId);
  if (!p) return { ok: false, error: 'Puzzle not found' };
  pending.delete(puzzleId);
  return { ok: true, correct: choice === p.answer, answer: p.answer, fish: p.fish, chests: p.chests };
}
