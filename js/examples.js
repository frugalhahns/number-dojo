/* The worked examples page.
   Lots of solved problems, all the way through, one rung at a time.

   The point is exposure. The app itself shows one walkthrough and then asks him
   to work, which is right for practice but thin if what he actually wants is to
   watch the method happen ten times before touching it. This page is that, and
   because it prints, it is also the thing to hand to a grown-up who wants to see
   what he is being taught or to sit next to him with a pencil.

   Every step restates the problem with the digits that step is working on lit
   up, which is the same rendering the app uses, from the same module. */

import { el, clear, button } from './ui.js';
import { bigSum } from './problem.js';
import { makeForShape, BY_STRATEGY } from './strategies.js';
import { GYMS } from './strategies.js';
import { SHAPES_FOR } from './shapes.js';
import * as Theme from './theme.js';
import { S, load, save } from './state.js';

let op = 'add';
let perRung = 3;
let level = 0;          // 0 means "one of each level"

/* One solved problem, steps and all. */
function example(shapeId, lv, n) {
  const c = makeForShape(shapeId, lv, (Math.random() * 1e9) | 0);
  const strat = BY_STRATEGY[c.strategy];
  const box = el('div', 'ex');

  const head = el('div', 'exhead');
  head.appendChild(el('span', 'exn', n));
  head.appendChild(bigSum(c, null, c.answer));
  head.appendChild(el('span', 'exmethod', strat.name));
  head.appendChild(el('span', 'exlv', 'level ' + lv));
  box.appendChild(head);

  const steps = el('ol', 'exsteps');
  for (const st of c.steps) {
    const li = el('li', '');
    /* The problem again, small, with this step's digits lit. Repeating it on
       every line is the whole reason this page is worth reading: you can see
       the attention move across the numbers as the method goes. */
    const mini = bigSum(c, st.focus, '');
    mini.classList.add('mini');
    li.appendChild(mini);
    li.appendChild(el('span', 'exline', st.line.replace('?', String(st.answer))));
    li.appendChild(el('span', 'exsay', st.prompt));
    steps.appendChild(li);
  }
  box.appendChild(steps);
  if (c.recap) box.appendChild(el('div', 'exrecap', c.recap));
  return box;
}

function draw() {
  const gym = GYMS.find(g => g.op === op);
  document.body.dataset.hue = gym.hue;
  const main = clear(document.getElementById('sheetpage'));

  const bar = el('div', 'exbar');
  for (const g of GYMS) {
    bar.appendChild(button(g.what, 'btn' + (g.op === op ? ' primary' : ' ghost'), () => { op = g.op; draw(); }));
  }
  bar.appendChild(el('span', 'exgap', ''));
  for (const n of [1, 3, 6, 10]) {
    bar.appendChild(button(n + ' each', 'btn' + (perRung === n ? ' primary' : ' ghost'), () => { perRung = n; draw(); }));
  }
  bar.appendChild(el('span', 'exgap', ''));
  for (const [v, label] of [[0, 'all levels'], [1, 'level 1'], [2, 'level 2'], [3, 'level 3']]) {
    bar.appendChild(button(label, 'btn' + (level === v ? ' primary' : ' ghost'), () => { level = v; draw(); }));
  }
  bar.appendChild(el('span', 'exgap', ''));
  bar.appendChild(button('New batch', 'btn ghost', draw));
  bar.appendChild(button('Print', 'btn ghost', () => window.print()));
  bar.appendChild(button(Theme.ICON[S.theme || 'auto'] + '  ' + Theme.LABEL[S.theme || 'auto'], 'btn ghost', () => {
    S.theme = Theme.next(S.theme || 'auto');
    Theme.apply(S.theme);
    save();
    draw();
  }));
  main.appendChild(bar);

  main.appendChild(el('h1', 'title small', gym.what + ': worked examples'));
  main.appendChild(el('p', 'idea', 'Every problem taken all the way apart. The lit digits on each line are the ones that step is working on.'));

  for (const sh of SHAPES_FOR(op)) {
    const sec = el('section', 'exsec');
    /* Heading by name, with the canonical example demoted to small muted text.
       Set in the same big monospace as a real problem it reads as one, and the
       page is wall to wall real problems. */
    const h = el('h2', 'exsech');
    h.appendChild(el('b', '', sh.name));
    h.appendChild(el('span', 'exeg', 'the ' + sh.example + ' kind'));
    sec.appendChild(h);
    let n = 0;
    for (let i = 0; i < perRung; i++) {
      /* With no level chosen, walk the levels so a rung shows its easy case and
         its hard case side by side rather than three of the same. */
      const lv = level || ((i % Math.min(3, sh.levels)) + 1);
      sec.appendChild(example(sh.id, Math.min(lv, sh.levels), ++n));
    }
    main.appendChild(sec);
  }
  document.documentElement.dataset.done = '1';
}

load();
/* widthtest.html drives this page in both themes, and a grown-up may want to
   force one for printing without changing the child's setting. */
const forced = new URLSearchParams(location.search).get('theme');
if (forced === 'light' || forced === 'dark') S.theme = forced;
Theme.apply(S.theme || 'auto');
Theme.watch(() => S.theme || 'auto');

/* Deep links, so a rung can be handed over as a URL and so widthtest.html can
   load a known page rather than whatever was last clicked. */
const q = new URLSearchParams(location.search);
if (q.get('op')) op = q.get('op');
if (q.get('n')) perRung = Math.max(1, Math.min(20, +q.get('n') || 3));
if (q.get('level')) level = Math.max(0, Math.min(3, +q.get('level') || 0));
draw();
