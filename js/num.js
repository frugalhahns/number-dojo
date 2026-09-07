/* Number helpers and the shape of a step.
   Every strategy in js/ops/ is built out of these, which is what keeps the
   twenty of them speaking one language: a strategy produces a CHAIN, a chain is
   a list of STEPS, and a step is one blank with one number in it. Nothing in
   the app ever asks two questions at once. */

/* A seeded generator, so a problem can be replayed exactly (the practice sheet
   and the self test both need that) while still feeling random to him. */
export function rng(seed) {
  /* Scramble the seed before use. A raw xorshift started on two nearby seeds
     draws two similar first numbers, which showed up as a page of worked
     examples containing 7 x 6 three times. */
  let s = Math.imul(seed | 0, 2654435761) | 0;
  s = (s ^ (s >>> 15)) | 0;
  if (s === 0) s = 1;
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

/* The place a "work in tens" problem is really working in.
   564 + 70 is a tens problem; 5647 + 700 is a hundreds problem; 564 + 7 is
   neither. Returns 100, 10, or 0 for "this is not that kind of problem", and
   is the single definition both the fits() test and the builder use, so they
   cannot disagree about whether a problem qualifies. */
export function scalePlace(b) {
  for (const p of [100, 10]) if (b % p === 0 && b / p >= 1 && b / p <= 9) return p;
  return 0;
}

/* The same idea for division: 240 / 6 is 24 / 6 wearing a zero, but only
   because 24 divides by 6. Prefers the biggest place that works. */
export function divPlace(n, d) {
  for (const p of [100, 10]) if (n % p === 0 && (n / p) % d === 0 && n / p >= 2) return p;
  return 0;
}

export function commaish(n) { return String(n); }

/* Which part of the problem this step is touching.
   `22 - 19` is two numbers, and a step that says "19 wants to be 20" is talking
   about exactly one of them. Saying so lets the big sum at the top of the screen
   light up the 19 while he reads it, which is the difference between following
   the explanation and hunting for what it refers to.

   Each side takes one token, resolved against the digits of that number:
     all  ones  tens  hundreds        one place, counted from the right
     head            everything except the ones digit   (the 56 of 564)
     head2           everything except the last two     (the 5 of 564)
     tail            the ones digit                     (the 4 of 564)
     tail2           the last two digits                (the 64 of 564)
   null means that side is not involved. */
export const lit = (a, b) => ({ a: a || null, b: b || null });

/* One blank.
   prompt  what the buddy says, in words an eight year old reads once
   line    the math, with ? where the blank goes
   answer  the only number that is right
   hint    shown after the first miss; never contains the answer
   why     shown after the second miss, alongside the answer
   more    an optional nested chain: "break this step down further"
   focus   which part of the problem to light up while this step is live */
export function step(prompt, line, answer, opts) {
  const o = opts || {};
  return {
    prompt,
    line,
    answer,
    hint: o.hint || '',
    why: o.why || '',
    more: o.more || null,
    unit: o.unit || '',
    focus: o.focus || null
  };
}

/* Split "564 + 70" back into its three pieces so the screen can draw the two
   numbers separately and light one of them up. Every title in the app is built
   as `number space operator space number`, and the self test holds that. */
const TITLE = /^(\d+) (.) (\d+)$/;

/* A finished chain. `board` is the picture; its parts carry `after`, the index
   of the step that makes them appear, so the drawing fills in as he works. */
export function chain(o) {
  const m = TITLE.exec(o.title);
  return {
    title: o.title,
    lhs: m ? m[1] : o.title,
    oper: m ? m[2] : '',
    rhs: m ? m[3] : '',
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
