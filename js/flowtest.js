/* The flow test. It clicks the real buttons on the real page.

   selftest.js proves the math is right. This proves the app is playable: that
   a run starts, that the pad enters digits, that a right answer moves on and a
   wrong one does not, that breaking a step down comes back to where it left
   off, and that finishing a run pays out. Between them they cover the two ways
   this thing can break, which are bad numbers and a dead button. */

import { peek } from './solve.js';
import { S, setSlot, load, save } from './state.js';

const log = [];
let fails = 0;
function ok(cond, msg) { log.push((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; }
function note(msg) { log.push('     ' + msg); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const btn = t => $$('button').find(b => b.textContent.trim() === t)
              || $$('button').find(b => b.textContent.includes(t));

async function until(fn, what, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 4000)) { if (fn()) return true; await sleep(40); }
  ok(false, 'timed out waiting for ' + what);
  return false;
}

/* Enter a number the way he does: one pad key at a time. */
async function tap(n) {
  for (const ch of String(n)) {
    const k = $$('.key').find(b => b.textContent === ch);
    if (!k) { ok(false, 'no pad key for ' + ch); return; }
    k.click();
    await sleep(12);
  }
}

/* Work one whole problem, honestly, through the pad. */
async function solveProblem() {
  for (let guard = 0; guard < 20; guard++) {
    const p = peek();
    if (!p.step) return true;                       // chain finished
    const want = p.step.answer;
    const before = p.idx + ':' + p.nested + ':' + p.title;
    await tap(want);
    await sleep(340);
    const after = peek();
    if (!after.step) return true;
    if ((after.idx + ':' + after.nested + ':' + after.title) === before) {
      ok(false, 'typing ' + want + ' into "' + p.step.line + '" did not move on');
      return false;
    }
  }
  ok(false, 'a problem took more than twenty steps');
  return false;
}

export async function run() {
  /* Player 3 is the test slot, wiped first so results do not depend on whoever
     was using this browser. */
  setSlot('3');
  try { localStorage.removeItem('nd.save.v1.s3'); } catch (e) {}
  load();
  save();

  await import('./main.js');
  await until(() => document.documentElement.dataset.ready === '1', 'the page to boot');

  /* ------------------------------------------------------- pick a buddy --- */
  ok($$('.choice').length === 4, 'four starters offered, saw ' + $$('.choice').length);
  const spark = $$('.choice').find(c => c.textContent.includes('Pikachu'));
  ok(!!spark, 'Pikachu is one of the starters');
  spark.click();
  await until(() => !!$('.gyms'), 'home to appear after picking');
  ok(S.buddy === 'pikachu', 'Pikachu was saved as the buddy, got ' + S.buddy);
  ok(S.team.includes('pikachu'), 'Pikachu joined the team');
  ok(!$('#topbar').classList.contains('hidden'), 'the top bar is showing');
  ok($$('.gym').length === 4, 'four gyms on the home screen, saw ' + $$('.gym').length);

  /* -------------------------------------------- every gym opens and runs -- */
  for (let g = 0; g < 4; g++) {
    const card = $$('.gym')[g];
    const gymName = card.querySelector('.gname').textContent;
    card.click();
    await until(() => $$('.movecard').length > 0, gymName + ' to open');
    ok($$('.movecard').length >= 4, gymName + ' lists a ladder, saw ' + $$('.movecard').length + ' rungs');
    ok($$('.rex').length === $$('.movecard').length, gymName + ' every rung shows its example');

    /* the demo: every step, then in to try it */
    $$('.movecard')[g % $$('.movecard').length].click();
    await until(() => !$('#sheet').classList.contains('hidden'), 'the move sheet to open');
    ok($$('#sheet .bigsum .lit').length === 0, gymName + ' the walkthrough starts with nothing lit');
    /* The difficulty is his to pick. Level one carries nothing by design, and a
       child already past that should not have to grind to reach the rest. */
    {
      const picks = $$('#sheet .lvrow .btn');
      ok(picks.length >= 2, gymName + ' the rung offers a difficulty to pick, saw ' + picks.length);
      const before = $('#sheet .bigsum').textContent;
      const last = picks[picks.length - 1];
      const wasPrimary = last.classList.contains('primary');
      last.click();
      await sleep(90);
      const nowPicks = $$('#sheet .lvrow .btn');
      ok(nowPicks[nowPicks.length - 1].classList.contains('primary'),
         gymName + ' picking the hardest level marks it as chosen');
      if (!wasPrimary) {
        ok($('#sheet .bigsum').textContent !== before,
           gymName + ' and re-rolls the example at that level (' + before + ' then ' + $('#sheet .bigsum').textContent + ')');
      }
      picks[0].click();                       // back to the gentle one for the rest of the run
      await sleep(90);
    }
    /* Only one number sentence in here, and it is the one being worked. A
       second sum in the title corner is a reading puzzle. */
    ok(!/\d+\s*[+\u2212\u00d7\u00f7-]\s*\d+/.test($('#sheet .sheet-title').textContent),
       gymName + ' the sheet title names the rung rather than showing a second sum ("' + $('#sheet .sheet-title').textContent + '")');
    ok($$('#sheet .bigsum').length === 1,
       gymName + ' exactly one problem on screen in the walkthrough, saw ' + $$('#sheet .bigsum').length);
    {
      const first = btn('Show me the first step');
      first.click();
      await sleep(60);
      const lit = $$('#sheet .bigsum .lit').map(e => e.textContent).join('+');
      ok(lit.length > 0, gymName + ' the first step of the walkthrough lights something up');
      note(gymName + ' walkthrough step 1 lights: ' + lit + '  of  ' + $('#sheet .bigsum').textContent);
      /* The step he just uncovered has to be marked, and only that one. */
      ok($$('#sheet .wrow.just').length === 1, gymName + ' exactly one step is marked as the one he is on');
      ok($$('#sheet .wrow')[0].classList.contains('just'), gymName + ' step 1 is the marked one');
      if (btn('Then what?')) {
        btn('Then what?').click();
        await sleep(60);
        const rows = $$('#sheet .wrow');
        ok($$('#sheet .wrow.just').length === 1, gymName + ' still exactly one marked step after the second click');
        ok(rows[rows.length - 1].classList.contains('just'),
           gymName + ' the mark moved to step ' + rows.length + ' when he pressed then what');
        ok(!rows[0].classList.contains('just'), gymName + ' and came off the step before it');
      }
    }
    let clicks = 2;
    while (clicks < 8) {
      const b = btn('Show me the first step') || btn('Then what?');
      if (!b || b.disabled) break;
      b.click(); clicks++; await sleep(30);
    }
    ok(clicks >= 2, gymName + ' demo walked ' + clicks + ' steps');
    ok(!!$('.stratline'), gymName + ' demo names the method it is using');
    ok($$('#sheet .bigsum .lit').length > 0,
       gymName + ' the walkthrough lights up the digits it is changing, not just the exercise');

    /* Lots of worked examples is the point of this sheet, so a finished one has
       to lead straight into another, and the next one should not simply be the
       same problem again. */
    {
      const first = $('#sheet .bigsum').textContent;
      const another = btn('Another example');
      ok(!!another, gymName + ' a finished walkthrough offers another example');
      if (another) {
        another.click();
        await sleep(120);
        ok($('#sheet .bigsum').textContent !== first,
           gymName + ' the second example is a different problem (' + first + ' then ' + $('#sheet .bigsum').textContent + ')');
        ok($$('#sheet .bigsum .lit').length === 0, gymName + ' the new example starts unlit');
        ok(!!btn('Show me the first step'), gymName + ' the new example starts at step one');
        /* and the shortcut that skips to the end */
        btn('All of it at once').click();
        await sleep(80);
        ok($$('#sheet .work.demo .wrow').length >= 2,
           gymName + ' "all of it at once" shows the whole solution, saw ' + $$('#sheet .work.demo .wrow').length + ' steps');
        note(gymName + ' second example: ' + $('#sheet .bigsum').textContent);
      }
    }
    ok(!!$('.work.demo .wrow'), gymName + ' demo showed working out');
    btn('I will try it').click();
    await until(() => !!$('.wrow.live'), gymName + ' run to start');
    ok($('#sheet').classList.contains('hidden'), 'the sheet closed when the run started');

    /* five problems, all the way through */
    for (let n = 1; n <= 5; n++) {
      const p = peek();
      ok(!!p.step, gymName + ' problem ' + n + ' has a live step');
      const done = await solveProblem();
      if (!done) return finish();
      await until(() => !!btn('Next one') || !!btn('Finish the run'), 'the solved screen');
      ok(!!$('.bigsum.win'), gymName + ' problem ' + n + ' showed a finished answer');
      (btn('Next one') || btn('Finish the run')).click();
      await sleep(120);
    }
    await until(() => !!$('.screen.reward'), gymName + ' reward screen');
    ok(S.sessions[['add', 'sub', 'mul', 'div'][g]] >= 1, gymName + ' counted the run');
    note(gymName + ': run finished, buddy is level ' + S.level + ', team of ' + S.team.length);
    btn('Home').click();
    await until(() => !!$('.gyms'), 'home again');
  }

  /* ------------------------------------------------- getting one wrong ---- */
  $$('.gym')[0].click();
  await until(() => $$('.movecard').length > 0, 'the Sprout Gym');
  $$('.movecard')[0].click();
  await until(() => !$('#sheet').classList.contains('hidden'), 'the move sheet');
  btn('I will try it').click();
  await until(() => !!$('.wrow.live'), 'a run to start');
  {
    const p = peek();
    const wrong = p.step.answer + 1;
    const said = $('#bubble').textContent;
    await tap(wrong);
    btn('Check').click();
    await sleep(60);
    ok(peek().idx === p.idx, 'a wrong answer does not move on');
    ok($('#bubble').textContent !== said, 'the buddy said something about it');
    ok(!$('.wrow.live.told'), 'the first miss does not give the answer away');
    /* second miss: now it tells him, and he still has to type it */
    $$('.key').find(b => b.textContent === '⌫').click();
    await sleep(20);
    $$('.key').find(b => b.textContent === '⌫').click();
    await sleep(20);
    await tap(wrong);
    btn('Check').click();
    await sleep(60);
    ok(!!$('.wrow.live.told'), 'the second miss shows the answer');
    ok($('#bubble').textContent.indexOf(String(p.step.answer)) >= 0, 'the answer is in what the buddy says');
    $$('.key').filter(b => b.textContent === '⌫').forEach(b => { for (let i = 0; i < 4; i++) b.click(); });
    await sleep(30);
    await tap(p.step.answer);
    await sleep(340);
    ok(peek().idx === p.idx + 1, 'typing the answer it gave him still moves on');
  }

  /* ---------------------------------------------------- the highlight ----- */
  {
    if (btn('‹ Back')) btn('‹ Back').click();
    await until(() => $$('.movecard').length > 0, 'the gym');
    $$('.movecard')[3].click();                       // two digits plus two
    await until(() => !$('#sheet').classList.contains('hidden'), 'the rung sheet');
    btn('I will try it').click();
    await until(() => !!$('.wrow.live'), 'a run to start');
    const seen = [];
    for (let k = 0; k < 3 && peek().step; k++) {
      const lit = $$('.bigsum .lit').map(e => e.textContent).join('+');
      const whole = $('.bigsum').textContent;
      ok($$('.bigsum .lit').length > 0, 'step ' + (k + 1) + ' lights up part of the problem');
      ok(lit.length > 0 && whole.indexOf(lit.split('+')[0]) >= 0,
         'step ' + (k + 1) + ' lights up "' + lit + '", which is part of "' + whole + '"');
      seen.push(lit);
      await tap(peek().step.answer);
      await sleep(340);
    }
    ok(new Set(seen).size > 1, 'the highlight moves as the steps go by, saw ' + JSON.stringify(seen));
    note('highlight walked: ' + seen.join('  then  '));
  }

  /* ------------------------------------- the walkthrough opens sub-steps --- */
  {
    /* Work in Tens at level 2 always has a step that carries a nested chain, so
       its walkthrough must always show that chain rather than leaping over it.
       This is the whole complaint that prompted it: "32 + 41 = 73" straight up
       is the one step he cannot do. */
    S.lv['add.s3'] = 2; save();
    if (btn('‹ Back')) btn('‹ Back').click();
    await until(() => $$('.movecard').length > 0, 'the gym');
    if (btn('‹ Home')) { btn('‹ Home').click(); await until(() => !!$('.gyms'), 'home'); }
    $$('.gym')[0].click();
    await until(() => $$('.movecard').length > 0, 'the Sprout Gym ladder');
    $$('.movecard').find(c => c.textContent.includes('Adding whole tens')).click();
    await until(() => !$('#sheet').classList.contains('hidden'), 'the rung sheet');
    btn('All of it at once').click();
    await sleep(120);
    const subs = $$('#sheet .wrow.sub');
    ok(subs.length >= 2, 'the walkthrough opens the nested step up rather than leaping it, saw ' + subs.length + ' sub-steps');
    ok($$('#sheet .wrow').length > $$('#sheet .wrow.sub').length,
       'and still shows the top level steps around them');
    note('nested walkthrough: ' + $$('#sheet .wrow').map(r => (r.classList.contains('sub') ? '   ' : '') +
      (r.querySelector('.wline') || {}).textContent).join(' / '));
    $('#sheet-close').click();
    await sleep(40);
  }

  /* --------------------------------------------- breaking a step down ----- */
  {
    /* Work through until a step offers a nested chain, then take it. Work in
       Tens at level 2 always offers one, so the level is forced first. */
    S.lv['add.s3'] = 2; save();
    let found = false;
    for (let attempt = 0; attempt < 14 && !found; attempt++) {
      /* Tolerant of where the previous section left off: on a solve screen
         there is a Back chip, on the gym ladder there is not. */
      if (btn('‹ Back')) btn('‹ Back').click();
      await until(() => $$('.movecard').length > 0, 'the gym');
      const card = $$('.movecard').find(c => c.textContent.includes('Adding whole tens'));
      card.click();
      await until(() => !$('#sheet').classList.contains('hidden'), 'the sheet');
      btn('I will try it').click();
      await until(() => !!$('.wrow.live'), 'the run');
      const p0 = peek();
      await tap(p0.step.answer);                        // step 1: pocket the ones
      await sleep(340);
      if (btn('Break it up')) {
        const parent = peek();
        btn('Break it up').click();
        await sleep(120);
        const sub = peek();
        ok(sub.nested === 1, 'breaking down opened a nested chain');
        ok(sub.title !== parent.title, 'the nested chain is a smaller problem (' + sub.title + ' inside ' + parent.title + ')');
        note('nested: ' + parent.title + ' → ' + sub.title);
        while (peek().nested === 1 && peek().step) { await tap(peek().step.answer); await sleep(340); }
        ok(peek().nested === 0, 'finishing the nested chain came back out');
        ok(!peek().step || peek().idx === parent.idx + 1, 'and it filled in the step it was standing on');
        found = true;
      }
    }
    ok(found, 'a step that can be broken down turned up');
  }

  /* ------------------------------------------------------ in my head ------ */
  {
    if (btn('‹ Back')) btn('‹ Back').click();
    await until(() => $$('.movecard').length > 0, 'the gym');
    btn('In my head only').click();
    await until(() => !!$('.screen.solve.solo'), 'the in-my-head screen');
    ok(!$('.wrow.live'), 'no steps are shown in my head mode');
    const soloBefore = S.solo.add || 0;
    const xpBefore = totalXp();
    /* The answer is worked out here, from the title on screen, so the test
       never asks the app whether the app is right. */
    const want = evaluate($('.bigsum').textContent);
    ok(Number.isFinite(want), 'the in-my-head problem reads as a sum (' + $('.bigsum').textContent + ')');
    await tap(want);
    await until(() => !!$('.bigsum.win'), 'the solo answer to be accepted');
    ok((S.solo.add || 0) === soloBefore + 1, 'the in-my-head win was counted');
    ok(totalXp() > xpBefore + 5, 'it paid more than a stepped-through problem');
  }

  /* -------------------------------------------------------- the theme ----- */
  {
    const chip = $('.chip.theme');
    ok(!!chip, 'there is a theme button in the top bar');
    const seen = [];
    /* Three taps must walk all three settings and come back, and each one has
       to actually change the attribute the whole stylesheet hangs off. */
    for (let i = 0; i < 4; i++) {
      seen.push((S.theme || 'auto') + ':' + document.documentElement.dataset.theme);
      chip.click();
      await sleep(40);
    }
    ok(new Set(seen.map(x => x.split(':')[0])).size === 3,
       'tapping the theme button walks auto, light and dark, saw ' + JSON.stringify(seen));
    ok(seen[0] === seen[3], 'and comes back round to where it started');
    const lightAt = seen.find(x => x.startsWith('light:'));
    const darkAt = seen.find(x => x.startsWith('dark:'));
    ok(lightAt === 'light:light', 'the light setting really puts the page in light mode (' + lightAt + ')');
    ok(darkAt === 'dark:dark', 'the dark setting really puts the page in dark mode (' + darkAt + ')');
    S.theme = 'dark'; save();
    document.documentElement.dataset.theme = 'dark';
    note('theme walk: ' + seen.join('  '));
  }

  /* ------------------------------------------------------- the sheets ----- */
  ok(!!btn('‹ Back'), 'there is a way out of a finished problem mid-run');
  btn('‹ Back').click();
  await until(() => $$('.movecard').length > 0, 'the gym after backing out');
  btn('‹ Home').click();
  await until(() => !!$('.gyms'), 'home');
  for (const [label, marker] of [['My team', '.teamgrid'], ['How this works', '.howto'], ['Grown-ups', '.gtable']]) {
    btn(label).click();
    await until(() => !!$(marker), label + ' sheet');
    ok(!!$(marker), label + ' sheet has its content');
    $('#sheet-close').click();
    await sleep(40);
    ok($('#sheet').classList.contains('hidden'), label + ' sheet closed');
  }

  /* --------------------------------------------------------- the save ----- */
  ok(S.steps > 20, 'the save counted the steps worked out (' + S.steps + ')');
  ok(Object.keys(S.done).length >= 4, 'per-rung counts were written for ' + Object.keys(S.done).length + ' rungs');
  ok(Object.keys(S.method).length >= 4, 'which methods explained them was recorded (' + Object.keys(S.method).join(', ') + ')');
  ok(Object.values(S.sessions).filter(n => n > 0).length === 4, 'all four gyms recorded a finished run');
  const raw = localStorage.getItem('nd.save.v1.s3');
  ok(!!raw && JSON.parse(raw).buddy === 'pikachu', 'it all survived a round trip through localStorage');
  note('finished at level ' + S.level + ', team of ' + S.team.length + ', ' + S.steps + ' steps, best streak ' + S.best);
  return finish();
}

/* Work out what a problem's answer should be, from the title on screen and
   nothing else. "56 + 7" is evaluated here from scratch, so if the app and the
   test disagree the test wins. */
function evaluate(text) {
  const m = String(text).match(/(\d+)\s*([+\u2212\u00d7\u00f7])\s*(\d+)/);
  if (!m) return NaN;
  const a = Number(m[1]), b = Number(m[3]);
  return m[2] === '+' ? a + b : m[2] === '\u2212' ? a - b : m[2] === '\u00d7' ? a * b : Math.floor(a / b);
}

/* XP across level-ups, so "did it pay out" is one comparable number. */
function totalXp() {
  let t = S.xp;
  for (let l = 1; l < S.level; l++) t += 10 + 6 * (l - 1);
  return t;
}

function finish() {
  document.documentElement.dataset.done = '1';
  return { fails, log };
}

/* So a throw halfway through still reports everything that had already been
   checked. A stack trace on its own does not say which button was missing. */
export function report() { return { fails, log }; }
