/* The solve screen. One problem, one blank at a time.

   The rules that matter, and why:

   - ONE blank is live. Everything above it is already answered and stays on
     screen in his own numbers; everything below it is not shown at all. A step
     he cannot see is a step he cannot panic about.
   - A wrong answer costs nothing. First miss gets a hint that does not contain
     the number. Second miss shows the answer and the reason, and he still has
     to type it, because typing it is what puts it in his hands.
   - "Break it down" opens a nested chain on the spot. That is the recursion at
     the centre of the whole idea: any step you cannot do is just a smaller
     problem, and the way to do it is the same way.
   - "I can do this in my head" is always there. Getting good at this means
     needing fewer steps, so the app has to let him prove it and pay him extra
     when he is right. */

import { el, qs, clear, button, toast, sparkle, pips } from './ui.js';
import { render } from './board.js';
import { sfx } from './audio.js';
import * as B from './buddy.js';
import { S, save, addXp, noteResult, levelOf } from './state.js';
import { form, stageForLevel } from './roster.js';
import { BY_STRATEGY, gymOf, makeFresh } from './strategies.js';

const RUN = 5;                 // problems in one training run

/* flowtest.html clicks the real buttons, so it needs to know what the right
   answer is without asking the thing it is testing to hand it over. This is
   the only door: an export, so nothing is bolted onto window and a bored kid
   with the dev tools open finds nothing useful. */
export function peek() { return { title: view && view.title, idx, nested: stack.length, step: view && view.steps[idx], run }; }

let say = '';                  // what the buddy is currently saying
/* Whatever blank is on screen right now, and what to do about it. The step
   screen and the in-my-head screen both draw one blank and one pad, but they
   want different numbers in it, so the pad asks here rather than reaching into
   the chain itself. Wiring the pad straight to the step was a real bug: the
   in-my-head screen shows one blank for the WHOLE problem and its Check button
   was quietly grading the first step. */
let live = null;               // { answer, accept(), reject(got) }
let run = null;                // the run in progress
let view = null;               // the chain currently on screen (may be a nested one)
let stack = [];                // parent chains, when he has broken a step down
let idx = 0;                   // steps answered in `view`
let misses = 0;                // misses on the current step
let dirty = false;             // did he miss anything at all this problem
let soloMode = false;
let buddyImg = null;
let onDone = null;

function buddyForm() {
  const id = S.buddy || 'chikorita';
  return form(id, stageForLevel(id, S.level));
}

export function start(opts) {
  run = {
    op: opts.op,
    strategyIds: opts.strategyIds,
    mixed: opts.mixed,
    n: 0, solved: 0, perfect: 0, xp: 0,
    caught: null, evolved: null, levelled: 0
  };
  soloMode = !!opts.solo;
  onDone = opts.onDone;
  nextProblem();
}

function pickStrategy() {
  const ids = run.strategyIds;
  return ids[Math.floor(Math.random() * ids.length)];
}

function nextProblem() {
  if (run.n >= RUN) { onDone(run); return; }
  run.n++;
  const sid = pickStrategy();
  const chain = makeFresh(sid, levelOf(sid), view && view.title);
  view = chain; stack = []; idx = 0; misses = 0; dirty = false; say = '';   // a fresh opener
  sfx.page();
  if (soloMode) soloAsk(); else draw();
}

/* ------------------------------------------------------------------ paint -- */

function draw() {
  const app = clear(qs('#app'));
  app.className = 'screen solve';
  const strat = BY_STRATEGY[stack.length ? stack[0].strategy : view.strategy];
  const gym = gymOf(strat.id);
  document.body.dataset.hue = gym.hue;

  /* header: which problem of the run, and a way out */
  const head = el('div', 'solve-head');
  head.appendChild(button('‹ Back', 'chip ghost', () => onDone(run, true)));
  head.appendChild(pips(run.n - 1, RUN, 'runpips'));
  const chip = el('span', 'chip move');
  chip.textContent = strat.move;
  chip.title = strat.name;
  head.appendChild(chip);
  app.appendChild(head);

  /* the problem itself, always visible, always the biggest thing on screen */
  const top = el('div', 'problem');
  if (stack.length) {
    const crumb = el('div', 'crumb');
    crumb.appendChild(el('span', '', stack.map(c => c.title).join(' → ') + ' → '));
    crumb.appendChild(el('b', '', view.title));
    top.appendChild(crumb);
  }
  top.appendChild(el('div', 'bigsum', view.title + ' = ?'));
  top.appendChild(el('div', 'stratline', strat.name + '. ' + strat.blurb));
  app.appendChild(top);

  /* the picture */
  const boardWrap = el('div', 'boardwrap');
  const svg = render(view.board, idx);
  if (svg) boardWrap.appendChild(svg); else boardWrap.classList.add('empty');
  app.appendChild(boardWrap);

  /* the working out so far, then the live blank */
  const work = el('div', 'work');
  for (let i = 0; i < idx; i++) {
    const st = view.steps[i];
    const row = el('div', 'wrow done');
    row.appendChild(el('span', 'wn', i + 1));
    row.appendChild(el('span', 'wline', st.line.replace('?', String(st.answer))));
    row.appendChild(el('span', 'wtick', '✓'));
    work.appendChild(row);
  }
  if (idx < view.steps.length) {
    live = { answer: view.steps[idx].answer, accept: right, reject: wrong };
    work.appendChild(liveRow(view.steps[idx]));
  } else {
    live = null;
  }
  app.appendChild(work);

  /* buddy and what it is saying */
  const side = el('div', 'buddybar');
  buddyImg = B.sprite(S.buddy || 'chikorita', stageForLevel(S.buddy || 'chikorita', S.level), 'big');
  side.appendChild(buddyImg);
  const bub = el('div', 'bubble');
  bub.id = 'bubble';
  if (!say) say = B.opener(view.answer + run.n);
  bub.textContent = say;
  side.appendChild(bub);
  app.appendChild(side);

  if (idx < view.steps.length) app.appendChild(pad());
  app.appendChild(extras());
  focusInput();
}

function speak(msg, kind) {
  say = msg;
  const b = qs('#bubble');
  if (b) { b.textContent = msg; b.classList.remove('warm', 'cool'); if (kind) b.classList.add(kind); }
}

function liveRow(st) {
  const row = el('div', 'wrow live');
  row.appendChild(el('span', 'wn', idx + 1));
  const q = el('div', 'wq');
  q.appendChild(el('div', 'prompt', st.prompt));
  const line = el('div', 'wline big');
  const parts = st.line.split('?');
  line.appendChild(el('span', '', parts[0]));
  const inp = el('input', 'blank');
  inp.id = 'blank';
  inp.type = 'text';
  inp.inputMode = 'numeric';
  inp.autocomplete = 'off';
  inp.setAttribute('aria-label', st.prompt);
  inp.size = Math.max(2, String(st.answer).length);
  inp.addEventListener('input', onType);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  line.appendChild(inp);
  if (parts[1]) line.appendChild(el('span', '', parts[1]));
  q.appendChild(line);
  if (st.unit) q.appendChild(el('div', 'unit', 'answer in ' + st.unit));
  row.appendChild(q);
  return row;
}

function focusInput() {
  const i = qs('#blank');
  if (i && window.matchMedia('(min-width: 700px)').matches) i.focus();
}

/* ------------------------------------------------------------------ input -- */

function pad() {
  const p = el('div', 'pad');
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'go'].forEach(k => {
    const b = button(k === 'del' ? '⌫' : k === 'go' ? 'Check' : k, 'key' + (k === 'go' ? ' go' : k === 'del' ? ' del' : ''), () => {
      const i = qs('#blank'); if (!i) return;
      if (k === 'del') i.value = i.value.slice(0, -1);
      else if (k === 'go') return submit();
      else { i.value = (i.value + k).slice(0, 7); sfx.tap(); }
      onType();
    });
    p.appendChild(b);
  });
  return p;
}

/* Typing the right number is enough. Waiting for a Check tap after he has
   plainly got it just adds a beat of doubt to every single step. A wrong
   number of the right length does nothing, so a typo is never a miss. */
function onType() {
  const i = qs('#blank'); if (!i || !live) return;
  i.value = i.value.replace(/[^0-9]/g, '');
  if (i.value !== '' && Number(i.value) === live.answer) submit();
}

function submit() {
  const i = qs('#blank'); if (!i || !live || i.value === '') return;
  const got = Number(i.value);
  if (got === live.answer) live.accept(); else live.reject(got);
}

function right() {
  const st = view.steps[idx];
  S.streak++;
  if (S.streak > S.best) S.best = S.streak;
  S.steps++;
  if (misses === 0) { run.xp += 1; addXp(1); }
  sfx.step(S.streak);
  const row = qs('.wrow.live');
  if (row) { row.classList.add('pop'); sparkle(row, 8); }
  B.react(buddyImg, 'hop');
  speak(B.cheer(S.streak, st.answer + idx), 'warm');
  idx++;
  misses = 0;
  save();
  setTimeout(() => { if (idx >= view.steps.length) finishChain(); else draw(); }, 260);
}

function wrong(got) {
  const st = view.steps[idx];
  misses++;
  dirty = true;
  S.streak = 0;
  sfx.miss();
  B.react(buddyImg, 'wobble');
  const i = qs('#blank');
  if (i) { i.classList.add('shake'); setTimeout(() => i.classList.remove('shake'), 400); i.select(); }
  if (misses === 1) {
    speak(B.consol(got) + (st.hint ? ' ' + st.hint : ''), 'cool');
  } else {
    speak((st.why || ('It is ' + st.answer + '.')) + ' Type ' + st.answer + ' and carry on.', 'cool');
    const row = qs('.wrow.live');
    if (row) row.classList.add('told');
  }
  save();
}

/* ------------------------------------------------------- nesting and exits -- */

function breakDown() {
  const st = view.steps[idx];
  if (!st.more) return;
  stack.push(view);
  view = st.more;
  idx = 0; misses = 0;
  speak('Same trick, smaller numbers.', 'warm');
  sfx.page();
  draw();
}

function finishChain() {
  if (stack.length) {
    /* A nested chain just answered the parent's live blank. Fill it in and
       carry the parent on, so the detour reads as one continuous piece of work. */
    const done = view;
    view = stack.pop();
    const st = view.steps[idx];
    if (st.answer === done.answer) { idx++; misses = 0; }
    speak('So that one is ' + done.answer + '. Back to ' + view.title + '.', 'warm');
    sfx.step(S.streak);
    if (idx >= view.steps.length) return finishChain();
    draw();
    return;
  }
  solved();
}

function solved() {
  run.solved++;
  const clean = !dirty;
  if (clean) { run.perfect++; run.xp += 5; addXp(5); }
  const bumped = noteResult(view.strategy, clean);
  save();
  clean ? sfx.perfect() : sfx.solved();
  B.react(buddyImg, 'spin');
  showSolved(clean, bumped);
}

/* Solo: he says he can do it in his head, so the whole chain collapses to one
   blank worth double. Getting it wrong is not a punishment, it just opens the
   steps up again with nothing lost. */
function soloAsk() {
  const app = clear(qs('#app'));
  app.className = 'screen solve solo';
  app.appendChild(el('div', 'bigsum', view.title + ' = ?'));
  app.appendChild(el('div', 'stratline', 'The whole thing, in your head. Worth double.'));
  const line = el('div', 'wline big center');
  const inp = el('input', 'blank');
  inp.id = 'blank'; inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
  inp.setAttribute('aria-label', view.title);
  inp.addEventListener('input', onType);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  line.appendChild(inp);
  app.appendChild(line);

  const side = el('div', 'buddybar');
  buddyImg = B.sprite(S.buddy || 'chikorita', stageForLevel(S.buddy || 'chikorita', S.level), 'big');
  side.appendChild(buddyImg);
  const bub = el('div', 'bubble'); bub.id = 'bubble'; bub.textContent = 'Go on then.';
  side.appendChild(bub);
  app.appendChild(side);

  live = {
    answer: view.answer,
    accept() {
      run.solved++; run.perfect++; run.xp += 10; addXp(10);
      S.solo[run.op] = (S.solo[run.op] || 0) + 1;
      noteResult(view.strategy, true);
      save(); sfx.perfect(); B.react(buddyImg, 'spin');
      showSolved(true, null, true);
    },
    /* Getting it wrong here is not a punishment. It opens the steps up with
       nothing taken away, which is the only way he will ever risk guessing. */
    reject() {
      sfx.miss(); B.react(buddyImg, 'wobble');
      inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400);
      speak('Not quite. No harm done, let us walk it.', 'cool');
      dirty = true; soloMode = false;
      setTimeout(draw, 900);
    }
  };

  app.appendChild(pad());
  const row = el('div', 'extras');
  row.appendChild(button('Show me the steps instead', 'btn ghost', () => { soloMode = false; draw(); }));
  row.appendChild(button('‹ Back', 'btn ghost', () => onDone(run, true)));
  app.appendChild(row);
  setTimeout(() => { if (window.matchMedia('(min-width: 700px)').matches) inp.focus(); }, 30);
}

function showSolved(clean, bumped, solo) {
  const app = clear(qs('#app'));
  app.className = 'screen solved';
  app.appendChild(el('div', 'bigsum win', view.answerText));
  if (view.recap) app.appendChild(el('div', 'recap', view.recap));
  const svg = render(view.board, 99);
  if (svg) { const w = el('div', 'boardwrap'); w.appendChild(svg); app.appendChild(w); }
  /* His own working, all of it, one last time. This screen used to show only
     the recap line, which threw away the thing he had just built. */
  if (!solo) {
    const work = el('div', 'work');
    view.steps.forEach((st, i) => {
      const row = el('div', 'wrow done');
      row.appendChild(el('span', 'wn', i + 1));
      row.appendChild(el('span', 'wline', st.line.replace('?', String(st.answer))));
      row.appendChild(el('span', 'wtick', '✓'));
      work.appendChild(row);
    });
    app.appendChild(work);
  }
  const side = el('div', 'buddybar');
  const img = B.sprite(S.buddy || 'chikorita', stageForLevel(S.buddy || 'chikorita', S.level), 'big');
  side.appendChild(img);
  const bub = el('div', 'bubble warm');
  bub.textContent = solo ? 'In your head! That is the whole point.'
    : clean ? B.winner(view.answer) + ' No misses.' : B.winner(view.answer);
  side.appendChild(bub);
  app.appendChild(side);
  if (clean) sparkle(img, 14);
  if (bumped === 'up') toast('Harder numbers unlocked for ' + BY_STRATEGY[view.strategy].name + '.', 3000);
  const row = el('div', 'extras');
  row.appendChild(button(run.n >= RUN ? 'Finish the run' : 'Next one ›', 'btn primary', () => {
    if (run.n >= RUN) return onDone(run);
    nextProblem();
  }));
  /* A way out from here too. The step screen has one and this did not, which
     meant finishing a problem and then wanting to stop left him with nothing to
     press but the browser's back button. */
  if (run.n < RUN) row.appendChild(button('‹ Back', 'btn ghost', () => onDone(run, true)));
  app.appendChild(row);
  buddyImg = img;
}

function extras() {
  const row = el('div', 'extras');
  const st = view.steps[idx];
  if (st && st.more) row.appendChild(button('Break this step down', 'btn ghost', breakDown));
  if (st && misses === 0) {
    row.appendChild(button('Give me a hint', 'btn ghost', () => {
      speak(st.hint || 'Look at what changed from the line above.', 'cool');
      dirty = true;
    }));
  }
  if (!stack.length && idx === 0) {
    row.appendChild(button('I can do this in my head', 'btn ghost', () => { soloMode = true; soloAsk(); }));
  }
  return row;
}

