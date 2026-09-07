/* Content invariants. Opened as a page, because there is no build step and no
   node runner here: selftest.html is the test suite.

   The generators are random, so this is the only thing standing between a bad
   edit and a problem that cannot be solved. It builds tens of thousands of
   chains and checks every one of them adds up. */

import { GYMS, ALL, BY_STRATEGY, make, makeForShape, fitting } from './strategies.js';
import { SHAPES, SHAPES_FOR } from './shapes.js';
import { LINES, ALL_DEX, form, stageForLevel, EVOLVE_AT, anim, still } from './roster.js';
import { render } from './board.js';

let pass = 0;
const fails = [];
const seenFail = new Set();
/* Failures are deduplicated on their shape, not their text: a broken generator
   fires the same fault on thousands of random problems, and a page listing it
   thousands of times hides the second, different fault underneath it. */
function ok(cond, msg) {
  if (cond) { pass++; return; }
  const shape = String(msg).replace(/-?\d+/g, '#');
  if (seenFail.has(shape)) return;
  seenFail.add(shape);
  fails.push(msg);
}
export function failCount() { return seenFail.size; }

const truth = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b };

/* The focus vocabulary, and the same resolver js/solve.js uses. Kept as its own
   copy on purpose: if the two ever disagree this test is what notices. */
const TOKENS = ['all', 'ones', 'tens', 'hundreds', 'head', 'head2', 'tail', 'tail2'];
function resolve(text, token) {
  const n = String(text).length;
  const r = { all: [0, n], ones: [n - 1, n], tail: [n - 1, n], tens: [n - 2, n - 1],
              hundreds: [n - 3, n - 2], head: [0, n - 1], head2: [0, n - 2], tail2: [n - 2, n] }[token];
  if (!r) return null;
  const a = Math.max(0, r[0]), b = Math.min(n, r[1]);
  return b > a ? [a, b] : null;
}

/* ------------------------------------------------- every chain adds up ----- */
const PER = 500;
for (const g of GYMS) {
  for (const s of g.list) {
    ok(s.op === g.op, s.id + ' is filed under ' + g.op + ' but says ' + s.op);
    ok(s.levels >= 1 && s.levels <= 3, s.id + ' has ' + s.levels + ' levels');
    ok(!!s.move && !!s.name && !!s.blurb, s.id + ' is missing a name, move or blurb');
    for (let lv = 1; lv <= s.levels; lv++) {
      for (let i = 0; i < PER; i++) {
        const c = make(s.id, lv, i * 7919 + lv * 104729 + s.id.length);
        const p = c.problem;
        const label = s.id + ' L' + lv + ' ' + c.title;

        if (g.op === 'div') {
          const q = Math.floor(p.n / p.d);
          ok(c.answer === q, label + ': answer ' + c.answer + ' should be ' + q);
          ok(p.d > 1, label + ': dividing by ' + p.d);
          if (s.id !== 'div.leftover') ok(p.n % p.d === 0, label + ': does not divide evenly');
          else ok(p.n % p.d > 0, label + ': leftover strategy with no leftover');
        } else {
          const want = truth[g.op](p.a, p.b);
          ok(c.answer === want, label + ': answer ' + c.answer + ' should be ' + want);
          if (g.op === 'sub') ok(want > 0, label + ': goes negative');
        }

        ok(!!c.oper && !!c.lhs && !!c.rhs,
           label + ': the title "' + c.title + '" does not split into two numbers, so it cannot be lit up');
        ok(c.lhs + ' ' + c.oper + ' ' + c.rhs === c.title, label + ': title parts do not rebuild the title');
        ok(c.steps.length >= 2, label + ': only ' + c.steps.length + ' step');
        ok(c.steps.length <= 5, label + ': ' + c.steps.length + ' steps is too many to hold');
        ok(c.steps[c.steps.length - 1].answer === c.answer,
           label + ': the last step answers ' + c.steps[c.steps.length - 1].answer + ' but the problem is ' + c.answer);

        for (let k = 0; k < c.steps.length; k++) {
          const st = c.steps[k];
          const at = label + ' step ' + (k + 1);
          ok(Number.isInteger(st.answer), at + ': answer is not a whole number (' + st.answer + ')');
          ok(st.answer >= 0, at + ': answer is negative (' + st.answer + ')');
          ok(st.answer < 100000, at + ': answer is enormous (' + st.answer + ')');
          ok(String(st.line).split('?').length === 2, at + ': line needs exactly one blank, has "' + st.line + '"');
          ok(!!st.prompt && st.prompt.length > 8, at + ': prompt too short');
          ok(st.prompt.length < 170, at + ': prompt is ' + st.prompt.length + ' characters, too long to read');
          /* A hint must not simply contain the answer, or the first miss hands
             it over and the second chance teaches nothing. */
          if (st.hint) {
            const bare = new RegExp('(^|[^0-9])' + st.answer + '([^0-9]|$)');
            ok(!bare.test(st.hint), at + ': hint gives away ' + st.answer + ' ("' + st.hint + '")');
          }
          /* Every step has to say which part of the problem it is touching, and
             that part has to actually exist. lit('hundreds') on a two digit
             number lights up nothing at all, which is invisible on screen and
             therefore exactly the sort of thing that rots quietly. */
          ok(!!st.focus, at + ': no focus, so nothing lights up while he reads it');
          if (st.focus) {
            for (const side of ['a', 'b']) {
              const token = st.focus[side];
              if (!token) continue;
              ok(TOKENS.indexOf(token) >= 0, at + ': unknown focus token "' + token + '"');
              const text = side === 'a' ? c.lhs : c.rhs;
              ok(!!resolve(text, token), at + ': focus ' + side + ':' + token + ' lands on nothing in "' + text + '"');
            }
            ok(!!(st.focus.a || st.focus.b), at + ': focus names neither side');
          }

          /* A nested chain has to land on the very number its parent step wants,
             or breaking a step down would answer a different question. */
          if (st.more) {
            ok(st.more.answer === st.answer,
               at + ': nested chain answers ' + st.more.answer + ' but the step wants ' + st.answer);
            ok(st.more.steps.length >= 2, at + ': nested chain is empty');
            for (const sub of st.more.steps) {
              ok(Number.isInteger(sub.answer) && sub.answer >= 0, at + ': nested step answer ' + sub.answer);
              ok(String(sub.line).split('?').length === 2, at + ': nested line "' + sub.line + '"');
            }
          }
        }

        /* Boards must render at every point in the chain without throwing, and
           must not reference a step that does not exist. */
        if (c.board) {
          const parts = c.board.jumps || c.board.piles || c.board.parts || [];
          for (const part of parts) {
            ok(part.after === undefined || part.after === -1 || (part.after >= 0 && part.after < c.steps.length),
               label + ': board part reveals after step ' + part.after + ' of ' + c.steps.length);
          }
          if (c.board.k === 'line') {
            for (const j of c.board.jumps) {
              ok(j.from >= c.board.lo - 0.01 && j.from <= c.board.hi + 0.01, label + ': jump starts at ' + j.from + ', off a line from ' + c.board.lo + ' to ' + c.board.hi);
              ok(j.to >= c.board.lo - 0.01 && j.to <= c.board.hi + 0.01, label + ': jump ends at ' + j.to + ', off a line from ' + c.board.lo + ' to ' + c.board.hi);
            }
            ok(c.board.hi > c.board.lo, label + ': number line has no width');
          }
          if (c.board.k === 'area') {
            ok(c.board.rows >= 1, label + ': area board has ' + c.board.rows + ' rows');
            for (const p2 of c.board.parts) ok(p2.w >= 1, label + ': area part is ' + p2.w + ' wide');
          }
          if (i < 3) {
            for (let up = 0; up <= c.steps.length; up++) {
              let threw = null;
              try { render(c.board, up); } catch (e) { threw = e.message; }
              ok(!threw, label + ': board threw at step ' + up + ' (' + threw + ')');
            }
          }
        }
      }
    }
  }
}

/* ================================================================ THE LADDER */
/* The rungs are what he actually picks, so they get their own pass. A rung is
   correct when its numbers always find a strategy honest enough to explain
   them, and when those numbers really are the shape the rung's name promises. */
const SHAPE_PER = 400;
for (const sh of SHAPES) {
  ok(sh.levels >= 1 && sh.levels <= 3, sh.id + ' has ' + sh.levels + ' levels');
  ok(!!sh.example && !!sh.name, sh.id + ' has no example or name');
  ok(sh.uses.length >= 1, sh.id + ' offers no strategies');
  for (const id of sh.uses) ok(!!BY_STRATEGY[id], sh.id + ' names a strategy that does not exist: ' + id);
  for (const id of sh.uses) ok(BY_STRATEGY[id] && BY_STRATEGY[id].op === sh.op,
    sh.id + ' is a ' + sh.op + ' rung but uses ' + id);

  const usedBy = {};
  for (let lv = 1; lv <= sh.levels; lv++) {
    let firstTry = 0;
    const titles = new Set();
    for (let i = 0; i < SHAPE_PER; i++) {
      const seed = i * 7919 + lv * 104729 + sh.id.length;
      const c = makeForShape(sh.id, lv, seed);
      const label = sh.id + ' L' + lv + ' ' + c.title;
      titles.add(c.title);
      usedBy[c.strategy] = (usedBy[c.strategy] || 0) + 1;

      ok(c.fitted > 0, label + ': no strategy in [' + sh.uses.join(', ') + '] can explain these numbers');
      if (c.tries === 1) firstTry++;
      ok(BY_STRATEGY[c.strategy].fits(c.problem), label + ': built with ' + c.strategy + ' which does not fit it');

      /* Same arithmetic check as the strategy pass, because a rung can pair a
         perfectly good generator with a perfectly good strategy and still
         produce nonsense if fits() is wrong about the pairing. */
      if (sh.op === 'div') {
        ok(c.answer === Math.floor(c.problem.n / c.problem.d), label + ': wrong quotient');
      } else {
        const want = truth[sh.op](c.problem.a, c.problem.b);
        ok(c.answer === want, label + ': answer ' + c.answer + ' should be ' + want);
        if (sh.op === 'sub') ok(want > 0, label + ': goes negative');
      }
      for (const st of c.steps) {
        ok(Number.isInteger(st.answer) && st.answer >= 0, label + ': step answer ' + st.answer);
      }

      /* And the rung's promise about digit counts. "Two digits plus one" that
         quietly serves a three digit number is a broken ladder even if every
         individual problem is solvable. */
      const shp = digitShape(sh, c);
      ok(shp.ok, label + ': ' + shp.why);
    }
    /* A generator that usually has to be redrawn is one bad edit away from
       running out of retries and forcing a method onto numbers it cannot do. */
    ok(firstTry >= SHAPE_PER * 0.9,
       sh.id + ' L' + lv + ': ' + (SHAPE_PER - firstTry) + ' of ' + SHAPE_PER + ' draws had to be thrown away and redrawn');
    ok(titles.size >= 14, sh.id + ' L' + lv + ' only makes ' + titles.size + ' different problems');
  }
  /* Every strategy a rung claims to use should actually turn up. One that never
     does is either dead configuration or a fits() that is too strict. */
  for (const id of sh.uses) {
    ok(usedBy[id] > 0, sh.id + ' lists ' + id + ' but never once used it');
  }
}

/* The digit counts each rung's name promises. */
function digitShape(sh, c) {
  const d = n => String(n).length;
  const p = c.problem;
  const pass = { ok: true, why: '' };
  const fail = why => ({ ok: false, why });
  switch (sh.id) {
    case 'add.s1': return d(p.a) === 2 && d(p.b) === 1 ? pass : fail('should be two digits plus one');
    case 'add.s2': return d(p.a) === 3 && d(p.b) === 1 ? pass : fail('should be three digits plus one');
    case 'add.s3': return p.b % 10 === 0 && p.a % 10 !== 0 ? pass : fail('should be adding whole tens');
    case 'add.s4': return d(p.a) === 2 && d(p.b) === 2 ? pass : fail('should be two digits plus two');
    case 'add.s5': return d(p.a) === 3 && d(p.b) === 3 ? pass : fail('should be three digits plus three');
    case 'sub.s1': return d(p.a) === 2 && d(p.b) === 1 ? pass : fail('should be two digits take one');
    case 'sub.s2': return d(p.a) === 3 && d(p.b) === 1 ? pass : fail('should be three digits take one');
    case 'sub.s3': return p.b % 10 === 0 && p.a % 10 !== 0 ? pass : fail('should be taking whole tens');
    case 'sub.s4': return d(p.a) === 2 && d(p.b) === 2 ? pass : fail('should be two digits take two');
    case 'sub.s5': return d(p.a) === 3 && d(p.b) === 3 ? pass : fail('should be three digits take three');
    case 'mul.s1': return d(p.a) === 1 && d(p.b) === 1 ? pass : fail('should be a times table fact');
    case 'mul.s2': return d(p.a) === 1 && p.b % 10 === 0 ? pass : fail('should be times whole tens');
    case 'mul.s3': return d(p.a) === 1 && d(p.b) === 2 ? pass : fail('should be two digits times one');
    case 'mul.s4': return d(p.a) === 1 && d(p.b) === 3 ? pass : fail('should be three digits times one');
    case 'div.s1': return p.n % p.d === 0 && p.n / p.d <= 9 ? pass : fail('should be a division fact');
    case 'div.s2': return p.n % p.d !== 0 ? pass : fail('should have something left over');
    case 'div.s3': return p.n % 10 === 0 ? pass : fail('should be sharing whole tens');
    case 'div.s4': return p.n % p.d === 0 && p.n / p.d >= 11 ? pass : fail('should give more than ten each');
    default: return fail('no digit shape rule for ' + sh.id);
  }
}

/* Each operation needs a ladder, and it has to be the one the gym screen draws. */
for (const g of GYMS) ok(SHAPES_FOR(g.op).length >= 4, g.what + ' has only ' + SHAPES_FOR(g.op).length + ' rungs');
ok(new Set(SHAPES.map(s => s.id)).size === SHAPES.length, 'two rungs share an id');

/* --------------------------------------------------- no repeated problems -- */
/* Two problems in a row with the same numbers reads as a bug. makeFresh avoids
   it, but only if the generator has enough room to avoid it in. */
for (const s of ALL) {
  for (let lv = 1; lv <= s.levels; lv++) {
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(make(s.id, lv, i * 2654435761 % 1000003).title);
    ok(seen.size >= 14, s.id + ' L' + lv + ' only makes ' + seen.size + ' different problems');
  }
}

/* ------------------------------------------------------------ the roster --- */
ok(new Set(LINES.map(l => l.id)).size === LINES.length, 'two lines share an id');
ok(new Set(ALL_DEX).size === ALL_DEX.length, 'two forms share a dex number');
for (const l of LINES) {
  ok(l.forms.length >= 1 && l.forms.length <= 3, l.id + ' has ' + l.forms.length + ' forms');
  ok(l.forms.length <= EVOLVE_AT.length, l.id + ' has more forms than there are evolution levels');
  for (const [dex, name] of l.forms) {
    ok(Number.isInteger(dex) && dex > 0, l.id + ' has a bad dex number');
    ok(!!name, l.id + ' has an unnamed form');
  }
  ok(stageForLevel(l.id, 1) === 0, l.id + ' starts evolved');
  ok(stageForLevel(l.id, 99) === l.forms.length - 1, l.id + ' never reaches its last form');
  ok(form(l.id, 99).last === true, l.id + ' last form is not flagged last');
}
for (const g of GYMS) ok(LINES.some(l => l.id === g.starter), g.name + ' starter ' + g.starter + ' is not in the roster');

/* ------------------------------------------------ house style: no em dash -- */
for (const s of ALL) {
  const strings = [s.name, s.move, s.blurb];
  for (let lv = 1; lv <= s.levels; lv++) {
    const c = make(s.id, lv, 999);
    strings.push(c.recap, c.answerText, c.title);
    for (const st of c.steps) strings.push(st.prompt, st.line, st.hint, st.why);
  }
  for (const t of strings) ok(!t || t.indexOf('—') === -1, s.id + ' uses an em dash in "' + t + '"');
}
for (const g of GYMS) ok(g.idea.indexOf('—') === -1, g.name + ' idea uses an em dash');

/* ------------------------------------ house style, held at the source ----- */
/* The loop above only sees strings a strategy builds. Everything else the page
   ever shows lives in screens.js, ui.js, buddy.js and index.html, so those are
   read as text and checked directly. selftest.js is skipped: it is the file
   holding the character being searched for. */
export async function checkStyle() {
  const files = ['index.html', 'css/dojo.css', 'js/screens.js', 'js/ui.js', 'js/buddy.js',
                 'js/solve.js', 'js/board.js', 'js/state.js', 'js/strategies.js', 'js/main.js',
                 'js/ops/add.js', 'js/ops/sub.js', 'js/ops/mul.js', 'js/ops/div.js',
                 'js/shapes.js', 'js/num.js', 'js/roster.js', 'js/audio.js'];
  await Promise.all(files.map(f => fetch(f).then(r => r.text()).then(t => {
    const i = t.indexOf('\u2014');
    ok(i === -1, f + ' uses an em dash: "' + t.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, ' ') + '"');
  })));
}

/* ------------------------------------------- the save key has not drifted -- */
/* index.html resolves the theme before the module loads, so it spells the
   localStorage key by hand. If js/state.js ever changes it, the theme silently
   stops being remembered, which is exactly the kind of bug nobody reports. */
export async function checkKeys() {
  const [html, state] = await Promise.all([
    fetch('index.html').then(r => r.text()),
    fetch('js/state.js').then(r => r.text())
  ]);
  ok(/nd\.save\.v1/.test(html) && /const KEY = 'nd\.save\.v1'/.test(state), 'the save key in index.html and js/state.js have drifted apart');
  ok(/nd\.slot/.test(html) && /const SLOT = 'nd\.slot'/.test(state), 'the slot key in index.html and js/state.js have drifted apart');
}

/* ----------------------------------------------------- every sprite loads -- */
export function checkSprites() {
  return Promise.all(ALL_DEX.flatMap(dex => [anim(dex), still(dex)].map(src => new Promise(res => {
    const i = new Image();
    i.onload = () => { ok(i.naturalWidth > 0, src + ' loaded empty'); res(); };
    i.onerror = () => { fails.push('missing sprite file ' + src); res(); };
    i.src = src;
  }))));
}

export function report() { return { pass, fails }; }
