/* The save file. One key, one object, written straight after anything that
   matters, because an eight year old closes tabs without warning.

   Three slots, so a brother or a friend can have their own team without
   arguing about it. */

const KEY = 'nd.save.v1';
const SLOT = 'nd.slot';

export function activeSlot() {
  try { const s = localStorage.getItem(SLOT); return (s === '2' || s === '3') ? s : '1'; } catch (e) { return '1'; }
}
export function setSlot(s) {
  try { localStorage.setItem(SLOT, String(s)); } catch (e) {}
}
function keyFor(slot) { return slot === '1' ? KEY : KEY + '.s' + slot; }

function blank() {
  return {
    name: '',
    buddy: null,          // line id of the active buddy
    team: [],             // line ids owned
    xp: 0,
    level: 1,
    lv: {},               // strategy id -> difficulty level 1..3
    done: {},             // strategy id -> problems finished
    clean: {},            // strategy id -> problems finished with no misses
    seen: {},             // strategy id -> true once the demo has been watched
    badges: [],           // op ids earned
    sessions: {},         // op id -> sessions completed
    best: 0,              // longest streak of correct steps ever
    streak: 0,
    sound: true,
    theme: 'auto',
    steps: 0,             // total blanks filled correctly, all time
    solo: {},             // op id -> problems answered without stepping through
    run: {},              // strategy id -> clean problems in a row, for levelling
    shownStage: undefined // the buddy form he has actually been shown, for evolutions
  };
}

export let S = blank();

export function load() {
  const slot = activeSlot();
  let raw = null;
  try { raw = localStorage.getItem(keyFor(slot)); } catch (e) {}
  S = Object.assign(blank(), raw ? safe(raw) : null);
  /* Objects added to blank() after a save was written come back undefined, so
     every map gets defaulted rather than trusted. */
  for (const k of ['lv', 'done', 'clean', 'seen', 'sessions', 'solo', 'run']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
  for (const k of ['team', 'badges']) if (!Array.isArray(S[k])) S[k] = [];
  return S;
}

function safe(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }

export function save() {
  try { localStorage.setItem(keyFor(activeSlot()), JSON.stringify(S)); } catch (e) {}
}

export function reset() { S = blank(); save(); }

/* Levelling. The bar grows by a fixed amount rather than a multiplier: an
   exponential curve looks generous on paper and then stops paying out, which
   for a kid is the same as the game being broken. Ten to reach level 2, and
   about ten problems' work to reach level 5, where the first evolution is. */
export const XP_FOR = lvl => 10 + 6 * (lvl - 1);

export function addXp(n) {
  S.xp += n;
  let up = 0;
  while (S.xp >= XP_FOR(S.level)) { S.xp -= XP_FOR(S.level); S.level++; up++; }
  return up;
}

export function levelOf(id) { return Math.max(1, Math.min(3, S.lv[id] || 1)); }

/* Difficulty moves on a whole problem, not a whole session, and it only moves
   up after three clean runs in a row at the current level. Anything faster and
   he gets a wall; anything slower and it is boring. */
export function noteResult(id, cleanRun) {
  S.done[id] = (S.done[id] || 0) + 1;
  if (cleanRun) {
    S.clean[id] = (S.clean[id] || 0) + 1;
    S.run[id] = (S.run[id] || 0) + 1;
    if (S.run[id] >= 3 && levelOf(id) < 3) { S.lv[id] = levelOf(id) + 1; S.run[id] = 0; return 'up'; }
  } else {
    S.run[id] = 0;
  }
  return null;
}
