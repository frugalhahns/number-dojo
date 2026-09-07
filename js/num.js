/* Number helpers and the shape of a step.
   Every strategy in js/ops/ is built out of these, which is what keeps the
   twenty of them speaking one language: a strategy produces a CHAIN, a chain is
   a list of STEPS, and a step is one blank with one number in it. Nothing in
   the app ever asks two questions at once. */

/* A seeded generator, so a problem can be replayed exactly (the practice sheet
   and the self test both need that) while still feeling random to him. */
export function rng(seed) {
  let s = (seed | 0) || 1;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function ri(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
export function pick(r, arr) { return arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))]; }

export const floorTo = (n, p) => Math.floor(n / p) * p;
/* The next multiple of p STRICTLY above n. nextUp(60, 10) is 70, not 60: every
   bridging strategy needs a gap to jump, and a gap of zero is not a step. */
export const nextUp = (n, p) => Math.floor(n / p) * p + p;
export const digits = n => String(Math.abs(n)).length;

export function commaish(n) { return String(n); }

/* One blank.
   prompt  what the buddy says, in words an eight year old reads once
   line    the math, with ? where the blank goes
   answer  the only number that is right
   hint    shown after the first miss; never contains the answer
   why     shown after the second miss, alongside the answer
   more    an optional nested chain: "break this step down further" */
export function step(prompt, line, answer, opts) {
  const o = opts || {};
  return {
    prompt,
    line,
    answer,
    hint: o.hint || '',
    why: o.why || '',
    more: o.more || null,
    unit: o.unit || ''
  };
}

/* A finished chain. `board` is the picture; its parts carry `after`, the index
   of the step that makes them appear, so the drawing fills in as he works. */
export function chain(o) {
  return {
    title: o.title,
    strategy: o.strategy || '',
    steps: o.steps,
    answer: o.answer,
    answerText: o.answerText || (o.title + ' = ' + o.answer),
    board: o.board || null,
    recap: o.recap || ''
  };
}

/* Boards. Four kinds, drawn by js/board.js. */
export const numberLine = (lo, hi, jumps) => ({ k: 'line', lo, hi, jumps });
export const jump = (from, to, label, after) => ({ from, to, label, after });
export const blocks = piles => ({ k: 'blocks', piles });
export const area = (rows, parts, rowLabel) => ({ k: 'area', rows, parts, rowLabel });
export const groups = (total, per, after) => ({ k: 'groups', total, per, after });
