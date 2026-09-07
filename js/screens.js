/* Everything that is not the solve screen.
   Home is four doors. A gym is a move list. The reward screen is the only place
   an animal is ever caught, so it is the only reason to finish a run. */

import { el, qs, clear, button, sheet, closeSheet, sparkle, confetti, bar, pips } from './ui.js';
import { sfx } from './audio.js';
import * as B from './buddy.js';
import { S, save, load, reset, XP_FOR, levelOf, setSlot, activeSlot } from './state.js';
import { LINES, BY_ID, STARTERS, EVOLVE_AT, form, stageForLevel } from './roster.js';
import { GYMS, BY_OP, BY_STRATEGY, makeForShape, fitting } from './strategies.js';
import { SHAPES_FOR } from './shapes.js';
import * as Solve from './solve.js';
import { render } from './board.js';
import { bigSum } from './problem.js';

const SESSIONS_FOR_BADGE = 6;

/* --------------------------------------------------------------- top bar --- */

export function topbar() {
  const t = clear(qs('#topbar'));
  if (!S.buddy) { t.classList.add('hidden'); return; }
  t.classList.remove('hidden');
  const f = buddyForm();
  const img = B.sprite(S.buddy, f.stage, 'small');
  img.addEventListener('click', () => teamSheet());
  t.appendChild(img);
  const info = el('div', 'tinfo');
  const nameRow = el('div', 'trow');
  nameRow.appendChild(el('b', '', f.name));
  nameRow.appendChild(el('span', 'lvl', 'Lv ' + S.level));
  info.appendChild(nameRow);
  info.appendChild(bar(S.xp / XP_FOR(S.level), 'xp'));
  t.appendChild(info);
  const badges = el('div', 'badges');
  for (const g of GYMS) {
    const b = el('i', 'badge b-' + g.hue + (S.badges.includes(g.op) ? ' won' : ''));
    b.title = g.name + (S.badges.includes(g.op) ? ' badge earned' : ' badge not yet earned');
    badges.appendChild(b);
  }
  t.appendChild(badges);
  t.appendChild(button('Team', 'chip ghost', teamSheet));
  t.appendChild(button('?', 'chip ghost', helpSheet));
}

function buddyForm() { return form(S.buddy, stageForLevel(S.buddy, S.level)); }

/* ------------------------------------------------------------------ home --- */

export function home() {
  document.body.dataset.hue = 'home';
  if (!S.buddy) return pickBuddy();
  const app = clear(qs('#app'));
  app.className = 'screen home';
  topbar();

  app.appendChild(el('h1', 'title', 'Number Dojo'));
  app.appendChild(el('p', 'kicker', 'Big numbers are just small numbers stuck together. Pull them apart.'));

  const grid = el('div', 'gyms');
  for (const g of GYMS) {
    const card = el('button', 'gym g-' + g.hue);
    card.type = 'button';
    card.appendChild(el('div', 'gsign', g.sign));
    card.appendChild(el('div', 'gname', g.what));
    card.appendChild(el('div', 'gwhat', SHAPES_FOR(g.op).length + ' kinds, ' + g.name));
    const runs = S.sessions[g.op] || 0;
    card.appendChild(pips(Math.min(runs, SESSIONS_FOR_BADGE), SESSIONS_FOR_BADGE, 'small'));
    if (S.badges.includes(g.op)) card.appendChild(el('div', 'gbadge', '★ badge earned'));
    card.addEventListener('click', () => { sfx.page(); gym(g.op); });
    grid.appendChild(card);
  }
  app.appendChild(grid);

  const foot = el('div', 'extras');
  foot.appendChild(button('My team (' + S.team.length + ')', 'btn ghost', teamSheet));
  foot.appendChild(button('How this works', 'btn ghost', helpSheet));
  foot.appendChild(button('Grown-ups', 'btn ghost', grownupSheet));
  app.appendChild(foot);

  const stats = el('div', 'stats');
  stats.appendChild(el('span', '', S.steps + ' steps worked out'));
  stats.appendChild(el('span', '', 'best streak ' + S.best));
  app.appendChild(stats);
}

/* ----------------------------------------------------------- pick a buddy -- */

function pickBuddy() {
  const app = clear(qs('#app'));
  app.className = 'screen pick';
  qs('#topbar').classList.add('hidden');
  app.appendChild(el('h1', 'title', 'Number Dojo'));
  app.appendChild(el('p', 'kicker', 'Pick who is coming with you.'));
  const row = el('div', 'choices');
  for (const id of STARTERS) {
    const f = form(id, 0);
    const g = GYMS.find(x => x.starter === id);
    const c = el('button', 'choice g-' + g.hue);
    c.type = 'button';
    c.appendChild(B.sprite(id, 0, 'big'));
    c.appendChild(el('div', 'gname', f.name));
    c.appendChild(el('div', 'gwhat', g.name));
    c.addEventListener('click', () => {
      S.buddy = id;
      S.shownStage = 0;
      if (!S.team.includes(id)) S.team.push(id);
      save(); sfx.caught(); confetti();
      setTimeout(home, 500);
    });
    row.appendChild(c);
  }
  app.appendChild(row);
  const foot = el('div', 'extras');
  foot.appendChild(button('Switch player', 'btn ghost', slotSheet));
  app.appendChild(foot);
}

/* ------------------------------------------------------------------- gym --- */

export function gym(op) {
  const g = BY_OP[op];
  document.body.dataset.hue = g.hue;
  const app = clear(qs('#app'));
  app.className = 'screen gymroom';
  topbar();

  const head = el('div', 'solve-head');
  head.appendChild(button('‹ Home', 'chip ghost', home));
  head.appendChild(el('span', 'chip move', g.name));
  app.appendChild(head);

  app.appendChild(el('h1', 'title small', g.what));
  app.appendChild(el('p', 'idea', 'Pick the kind of problem you want to practice. They get harder as you go down.'));

  /* The ladder. He picks what the problem LOOKS like, not which method to use:
     the method is chosen per problem from whichever ones fit those numbers, so
     the same rung teaches several ways without ever asking him to choose one. */
  const list = el('div', 'moves');
  SHAPES_FOR(op).forEach((sh, i) => {
    const card = el('button', 'movecard rung');
    card.type = 'button';

    const top = el('div', 'mtop');
    top.appendChild(el('span', 'rnum', i + 1));
    top.appendChild(el('b', 'rex', sh.example));
    const lv = levelOf(sh.id);
    const pip = el('span', 'mlv');
    for (let k = 1; k <= sh.levels; k++) pip.appendChild(el('i', 'pip' + (k <= lv ? ' on' : '')));
    top.appendChild(pip);
    card.appendChild(top);

    card.appendChild(el('div', 'mblurb', sh.name));
    const live = makeForShape(sh.id, lv, 4242 + i * 977);
    const n = S.done[sh.id] || 0;
    card.appendChild(el('div', 'mdone', (n ? n + ' done' : 'new') + '  ·  like ' + live.title));

    card.addEventListener('click', () => rungSheet(sh, g));
    list.appendChild(card);
  });
  app.appendChild(list);

  const foot = el('div', 'extras');
  foot.appendChild(button('Mixed: all of them', 'btn primary', () =>
    begin(g, SHAPES_FOR(op).map(sh => sh.id), false)));
  foot.appendChild(button('In my head only', 'btn ghost', () =>
    begin(g, SHAPES_FOR(op).map(sh => sh.id), true)));
  app.appendChild(foot);
}

/* Tapping a rung shows one worked all the way through before he is asked to do
   one. Watching first is not cheating, it is how anybody learns a method, and
   it is also where the method gets named: he sees "Bridge to Ten" happen rather
   than being asked to pick it off a list. */
function rungSheet(sh, g) {
  const lv = levelOf(sh.id);
  const demo = makeForShape(sh.id, lv, (Math.random() * 1e9) | 0);
  const strat = BY_STRATEGY[demo.strategy];
  sheet(sh.example, body => {
    body.appendChild(el('p', 'idea', sh.name + '. ' + g.idea));
    /* The problem sits above the walkthrough and is redrawn on every click, so
       the digits being changed light up as each step is revealed. Watching
       somebody explain 185 + 4 is no use if you cannot see which number they
       just did something to. */
    const sumWrap = el('div', 'sumwrap');
    body.appendChild(sumWrap);
    body.appendChild(el('div', 'stratline', 'One way to do this one: ' + strat.name + '. ' + strat.blurb));
    const svgWrap = el('div', 'boardwrap');
    body.appendChild(svgWrap);
    const work = el('div', 'work demo');
    body.appendChild(work);
    const paint = k => {
      clear(work); clear(svgWrap); clear(sumWrap);
      /* Light the step just revealed, and nothing before the first click. */
      const shown = k > 0 ? demo.steps[k - 1] : null;
      sumWrap.appendChild(bigSum(demo, shown && shown.focus,
        k >= demo.steps.length ? demo.answer : '?'));
      const svg = render(demo.board, k);
      if (svg) svgWrap.appendChild(svg);
      for (let i = 0; i < k; i++) {
        const st = demo.steps[i];
        const row = el('div', 'wrow done');
        row.appendChild(el('span', 'wn', i + 1));
        const q = el('div', 'wq');
        q.appendChild(el('div', 'prompt', st.prompt));
        q.appendChild(el('div', 'wline', st.line.replace('?', String(st.answer))));
        if (st.why) q.appendChild(el('div', 'unit', st.why));
        row.appendChild(q);
        work.appendChild(row);
      }
      if (k >= demo.steps.length) work.appendChild(el('div', 'recap', demo.recap));
    };
    let k = 0;
    paint(0);
    const row = el('div', 'extras');
    const nextBtn = button('Show me the first step', 'btn primary', () => {
      k = Math.min(demo.steps.length, k + 1);
      paint(k);
      sfx.tap();
      nextBtn.textContent = k >= demo.steps.length ? 'That is the whole thing' : 'Then what?';
      nextBtn.disabled = k >= demo.steps.length;
    });
    row.appendChild(nextBtn);
    row.appendChild(button('I will try it', 'btn ghost', () => {
      S.seen[sh.id] = true; save(); closeSheet(); begin(g, [sh.id], false);
    }));
    body.appendChild(row);
  });
}

function begin(g, ids, solo) {
  sfx.page();
  Solve.start({
    op: g.op, shapeIds: ids, solo,
    onDone: (run, bailed) => bailed ? gym(g.op) : reward(g, run)
  });
}

/* ---------------------------------------------------------------- reward --- */

function reward(g, run) {
  S.sessions[g.op] = (S.sessions[g.op] || 0) + 1;
  const runs = S.sessions[g.op];
  let newBadge = false, caught = null, evolvedTo = null;

  /* Evolution is announced by comparing against the form he was last SHOWN,
     not against the form at the start of this run. Levelling up on the last
     problem of a run he then closes the tab on would otherwise swallow the
     announcement, and an evolution nobody saw happen is a bug to an eight
     year old. */
  const before = S.shownStage === undefined ? stageForLevel(S.buddy, S.level) : S.shownStage;
  if (run.perfect >= 3) {
    const wild = LINES.filter(l => !S.team.includes(l.id) && l.type === g.type);
    const any = LINES.filter(l => !S.team.includes(l.id));
    const pool = wild.length ? wild : any;
    if (pool.length) {
      caught = pool[Math.floor(Math.random() * pool.length)].id;
      S.team.push(caught);
    }
  }
  if (runs >= SESSIONS_FOR_BADGE && !S.badges.includes(g.op)) { S.badges.push(g.op); newBadge = true; }
  const after = stageForLevel(S.buddy, S.level);
  if (after > before) evolvedTo = after;
  S.shownStage = after;
  save();

  document.body.dataset.hue = g.hue;
  const app = clear(qs('#app'));
  app.className = 'screen reward';
  topbar();
  app.appendChild(el('h1', 'title', run.perfect === 5 ? 'Perfect run!' : 'Run finished'));
  app.appendChild(el('div', 'score', run.solved + ' of 5 solved  ·  ' + run.perfect + ' with no misses  ·  +' + run.xp + ' XP'));
  app.appendChild(pips(run.perfect, 5, 'big'));

  const stage = el('div', 'rewardstage');
  const img = B.sprite(S.buddy, after, 'huge');
  stage.appendChild(img);
  app.appendChild(stage);

  const notes = el('div', 'notes');
  if (evolvedTo) {
    const f = form(S.buddy, evolvedTo);
    notes.appendChild(el('div', 'note big', 'Your buddy evolved into ' + f.name + '!'));
    sfx.evolve(); confetti(); setTimeout(() => B.react(img, 'grow'), 60);
  } else if (caught) {
    const f = form(caught, 0);
    const c = el('div', 'note big');
    c.appendChild(B.sprite(caught, 0, 'mid'));
    c.appendChild(el('span', '', f.name + ' watched you work and joined the team!'));
    notes.appendChild(c);
    sfx.caught(); confetti();
  } else {
    notes.appendChild(el('div', 'note', run.perfect >= 2
      ? 'Three clean problems in one run and something wild turns up. You got ' + run.perfect + '.'
      : 'Keep going. Three problems with no misses and something wild turns up.'));
    sfx.solved();
  }
  if (newBadge) {
    notes.appendChild(el('div', 'note big', '★ ' + g.name + ' badge earned. ' + g.leader + ' is impressed.'));
    sfx.badge(); confetti();
  } else {
    notes.appendChild(el('div', 'note dim', (SESSIONS_FOR_BADGE - Math.min(runs, SESSIONS_FOR_BADGE)) + ' more runs here for the ' + g.name + ' badge.'));
  }
  app.appendChild(notes);
  sparkle(img, 16);

  const row = el('div', 'extras');
  row.appendChild(button('Another run', 'btn primary', () => begin(g, run.shapeIds, false)));
  row.appendChild(button('Back to ' + g.name, 'btn ghost', () => gym(g.op)));
  row.appendChild(button('Home', 'btn ghost', home));
  app.appendChild(row);
}

/* ----------------------------------------------------------------- team ---- */

function teamSheet() {
  sheet('Your team', body => {
    const grid = el('div', 'teamgrid');
    for (const l of LINES) {
      const owned = S.team.includes(l.id);
      /* Every owned animal is drawn at the form your level entitles it to, not
         just the active one. Showing a baby form next to "tap to swap in" and
         then swapping in a fully grown one is a small lie the sheet does not
         need to tell. */
      const st = owned ? stageForLevel(l.id, S.level) : 0;
      const f = form(l.id, st);
      const c = el('button', 'tcard' + (owned ? '' : ' locked') + (l.id === S.buddy ? ' active' : ''));
      c.type = 'button';
      if (owned) c.appendChild(B.sprite(l.id, st, 'mid'));
      else c.appendChild(el('div', 'silhouette', '?'));
      c.appendChild(el('div', 'tname', owned ? f.name : '???'));
      if (owned && l.id !== S.buddy) {
        c.appendChild(el('div', 'tswap', 'tap to swap in'));
        c.addEventListener('click', () => {
          S.buddy = l.id; S.shownStage = stageForLevel(l.id, S.level);
          save(); sfx.caught(); closeSheet(); topbar(); home();
        });
      } else if (owned) {
        const nextAt = EVOLVE_AT[stageForLevel(l.id, S.level) + 1];
        const canGrow = stageForLevel(l.id, 99) > stageForLevel(l.id, S.level);
        c.appendChild(el('div', 'tswap', canGrow ? 'evolves at Lv ' + nextAt : 'with you'));
      }
      grid.appendChild(c);
    }
    body.appendChild(grid);
    body.appendChild(el('p', 'dim', S.team.length + ' of ' + LINES.length + ' found. Finish a run with three clean problems and something new turns up.'));
  });
}

/* ----------------------------------------------------------------- help ---- */

function helpSheet() {
  sheet('How this works', body => {
    body.appendChild(el('p', '', 'Nobody works out 564 + 70 in one go. You take it apart.'));
    const demo = makeForShape('add.s3', 2, 4242);
    body.appendChild(bigSum(demo, null, demo.answer));
    const work = el('div', 'work demo');
    demo.steps.forEach((st, i) => {
      const row = el('div', 'wrow done');
      row.appendChild(el('span', 'wn', i + 1));
      const q = el('div', 'wq');
      q.appendChild(el('div', 'prompt', st.prompt));
      q.appendChild(el('div', 'wline', st.line.replace('?', String(st.answer))));
      row.appendChild(q);
      work.appendChild(row);
    });
    body.appendChild(work);
    const ul = el('ul', 'howto');
    [
      'Pick adding, subtracting, multiplying or dividing.',
      'Pick the kind of problem, like "two digits plus two". They get harder down the list.',
      'Tap it to watch one done all the way through first.',
      'You only ever fill in one blank at a time.',
      'Getting one wrong costs nothing. You get a hint, then the answer.',
      'If a step is still too big, tap "break this step down" and do it the same way.',
      'When you can do a whole problem in your head, say so. It is worth double.',
      'Three problems with no misses in one run and a wild animal turns up.'
    ].forEach(t => ul.appendChild(el('li', '', t)));
    body.appendChild(ul);
  });
}

function grownupSheet() {
  sheet('For grown-ups', body => {
    body.appendChild(el('p', '', 'He picks the kind of problem. The app picks the method, per problem, from whichever of its twenty-three explanations honestly fit those exact numbers. Each kind has three levels: difficulty rises after three problems in a row with no misses and never falls, so a bad five minutes cannot undo a good week.'));
    const t = el('div', 'gtable');
    for (const g of GYMS) {
      t.appendChild(el('div', 'gt-head', g.what));
      for (const sh of SHAPES_FOR(g.op)) {
        const r = el('div', 'gt-row');
        r.appendChild(el('b', '', sh.example + '   ' + sh.name));
        const methods = sh.uses.map(id => BY_STRATEGY[id].name + (S.method[id] ? ' (' + S.method[id] + ')' : ''));
        r.appendChild(el('span', '', 'methods used: ' + methods.join(', ')));
        r.appendChild(el('span', 'dim', 'level ' + levelOf(sh.id) + '/' + sh.levels + ' · ' + (S.done[sh.id] || 0) + ' done · ' + (S.clean[sh.id] || 0) + ' clean'));
        t.appendChild(r);
      }
    }
    body.appendChild(t);
    const row = el('div', 'extras');
    row.appendChild(button('Sound: ' + (S.sound ? 'on' : 'off'), 'btn ghost', e => {
      S.sound = !S.sound; save();
      import('./audio.js').then(m => m.setSound(S.sound));
      e.target.textContent = 'Sound: ' + (S.sound ? 'on' : 'off');
    }));
    row.appendChild(button('Switch player', 'btn ghost', slotSheet));
    row.appendChild(button('Start this player over', 'btn danger', () => {
      if (confirm('Erase this player’s team, badges and progress?')) { reset(); closeSheet(); home(); }
    }));
    body.appendChild(row);
    body.appendChild(el('p', 'dim', 'Progress is saved in this browser only. Sprites are the Generation V artwork from the PokeAPI sprites project.'));
  });
}

function slotSheet() {
  sheet('Who is playing?', body => {
    const row = el('div', 'choices');
    ['1', '2', '3'].forEach(n => {
      const c = el('button', 'choice' + (activeSlot() === n ? ' active' : ''));
      c.type = 'button';
      c.appendChild(el('div', 'gsign', n));
      c.appendChild(el('div', 'gname', 'Player ' + n));
      c.addEventListener('click', () => { setSlot(n); load(); closeSheet(); topbar(); home(); });
      row.appendChild(c);
    });
    body.appendChild(row);
    body.appendChild(el('p', 'dim', 'Each player has their own team, badges and difficulty.'));
  });
}

export { teamSheet, helpSheet, grownupSheet };
