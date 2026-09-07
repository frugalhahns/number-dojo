/* The picture.
   Four kinds of drawing, all inline SVG so they scale on a phone and print on
   paper, and all of them fill in AS HE WORKS: every part carries `after`, the
   index of the step that reveals it, so the drawing is a record of his own
   thinking rather than a diagram he was handed.

   after === -1  visible from the start
   after === n   visible once step n has been answered */

const NS = 'http://www.w3.org/2000/svg';
const el = (n, attrs, text) => {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text !== undefined) e.textContent = text;
  return e;
};

/* Nice round tick spacing for a given span, so a line from 47 to 130 gets tens
   and a line from 0 to 900 gets hundreds. */
function tickStep(span) {
  const raw = span / 9;
  for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (s >= raw) return s;
  return 1000;
}

function svg(w, h) {
  const s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'board', role: 'img' });
  s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return s;
}

/* ------------------------------------------------------------------ line --- */
function drawLine(b, upto) {
  const W = 760, H = 150, L = 30, R = W - 30, Y = 108;
  const s = svg(W, H);
  const lo = b.lo, hi = b.hi, span = Math.max(1, hi - lo);
  const x = v => L + ((v - lo) / span) * (R - L);

  s.appendChild(el('line', { x1: L, y1: Y, x2: R, y2: Y, class: 'axis' }));
  const stepv = tickStep(span);
  const first = Math.ceil(lo / stepv) * stepv;
  for (let v = first; v <= hi + 0.001; v += stepv) {
    s.appendChild(el('line', { x1: x(v), y1: Y - 6, x2: x(v), y2: Y + 6, class: 'tick' }));
    s.appendChild(el('text', { x: x(v), y: Y + 26, class: 'tickno' }, String(v)));
  }

  /* Arcs above the line, stacked so two jumps from the same place do not sit on
     top of each other. */
  let lane = 0, lastTo = null;
  b.jumps.forEach((j, i) => {
    const shown = j.after === -1 || j.after < upto;
    if (!shown) return;
    if (lastTo !== null && j.from !== lastTo) lane = lane ? 0 : 1;   // a new start means a new lane
    lastTo = j.to;
    const x1 = x(j.from), x2 = x(j.to);
    const top = Y - 34 - lane * 34;
    const g = el('g', { class: 'jump' + (i === upto - 1 ? ' fresh' : '') });
    g.appendChild(el('path', {
      d: 'M ' + x1 + ' ' + Y + ' C ' + x1 + ' ' + top + ', ' + x2 + ' ' + top + ', ' + x2 + ' ' + Y,
      class: 'arc'
    }));
    g.appendChild(el('circle', { cx: x2, cy: Y, r: 4, class: 'dot' }));
    g.appendChild(el('circle', { cx: x1, cy: Y, r: 4, class: 'dot' }));
    g.appendChild(el('text', { x: (x1 + x2) / 2, y: top + 6, class: 'jlabel' }, j.label));
    s.appendChild(g);
  });
  return s;
}

/* ---------------------------------------------------------------- blocks --- */
/* Base ten blocks: hundred squares, ten rods, one cubes. The point of drawing
   them is that "40 + 30" stops being two symbols and becomes seven rods. */
function pile(n) {
  const g = el('g', {});
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  let x = 0;
  for (let i = 0; i < h; i++) { g.appendChild(el('rect', { x, y: 0, width: 34, height: 34, rx: 3, class: 'blk hund' })); x += 39; }
  for (let i = 0; i < t; i++) { g.appendChild(el('rect', { x, y: 0, width: 8, height: 34, rx: 2, class: 'blk ten' })); x += 12; }
  x += o ? 5 : 0;
  for (let i = 0; i < o; i++) {
    g.appendChild(el('rect', { x: x + (i % 5) * 10, y: (i < 5 ? 0 : 12), width: 8, height: 8, rx: 2, class: 'blk one' }));
  }
  const wide = x + (o ? Math.min(o, 5) * 10 : 0);
  return { g, w: Math.max(20, wide) };
}

function drawBlocks(b, upto) {
  const rows = b.piles.filter(p => p.after === -1 || p.after < upto);
  const H = 40 + rows.length * 56, W = 760;
  const s = svg(W, Math.max(70, H));
  rows.forEach((p, i) => {
    const y = 18 + i * 56;
    s.appendChild(el('text', { x: 24, y: y + 22, class: 'plabel' }, p.label));
    const { g } = pile(p.n);
    g.setAttribute('transform', 'translate(200,' + y + ')');
    s.appendChild(g);
  });
  return s;
}

/* ------------------------------------------------------------------ area --- */
/* The rectangle, cut. Widths are the factor pieces, so 4x23 really is drawn
   with the 20 part five times wider than the 3 part. */
function drawArea(b, upto) {
  const W = 760, H = 240, L = 74, T = 34, RW = W - L - 34, RH = H - T - 42;
  const s = svg(W, H);
  const total = b.parts.reduce((a, p) => a + p.w, 0) || 1;
  let x = L;
  b.parts.forEach((p, i) => {
    const w = (p.w / total) * RW;
    const shown = p.after === -1 || p.after < upto;
    const g = el('g', { class: 'apart' + (shown ? '' : ' dim') });
    g.appendChild(el('rect', { x, y: T, width: w, height: RH, rx: 4, class: 'arect a' + (i % 3) }));
    /* Faint unit lines, but only when there are few enough to read. */
    if (p.w <= 12 && b.rows <= 12) {
      for (let c = 1; c < p.w; c++) g.appendChild(el('line', { x1: x + (c / p.w) * w, y1: T, x2: x + (c / p.w) * w, y2: T + RH, class: 'grid' }));
      for (let rr = 1; rr < b.rows; rr++) g.appendChild(el('line', { x1: x, y1: T + (rr / b.rows) * RH, x2: x + w, y2: T + (rr / b.rows) * RH, class: 'grid' }));
    }
    g.appendChild(el('text', { x: x + w / 2, y: T - 12, class: 'alabel' }, String(p.w)));
    if (shown) g.appendChild(el('text', { x: x + w / 2, y: T + RH / 2 + 6, class: 'ainner' }, p.label));
    s.appendChild(g);
    x += w;
  });
  s.appendChild(el('text', { x: 40, y: T + RH / 2 + 6, class: 'alabel' }, b.rowLabel));
  return s;
}

/* ---------------------------------------------------------------- groups --- */
/* Dots dropped into groups, with any leftovers off to one side and obviously
   homeless. This is the only board that makes a remainder look like a fact
   about the world rather than a letter r. */
function drawGroups(b, upto) {
  const per = b.per, total = b.total;
  const full = Math.floor(total / per), rem = total % per;
  const cols = Math.min(full, 6), rows = Math.ceil(full / 6) || 1;
  const CW = 104, CH = 84, W = 760;
  const s = svg(W, 30 + rows * CH + (rem ? 18 : 0));
  const shown = b.after === -1 || b.after < upto;
  for (let i = 0; i < full; i++) {
    const gx = 30 + (i % 6) * CW, gy = 14 + Math.floor(i / 6) * CH;
    const g = el('g', { class: shown ? 'grp' : 'grp dim' });
    g.appendChild(el('rect', { x: gx, y: gy, width: CW - 14, height: CH - 18, rx: 12, class: 'ring' }));
    for (let d = 0; d < per; d++) {
      g.appendChild(el('circle', { cx: gx + 16 + (d % 4) * 20, cy: gy + 18 + Math.floor(d / 4) * 20, r: 7, class: 'pip' }));
    }
    s.appendChild(g);
  }
  if (rem) {
    const gx = 30 + (full % 6) * CW, gy = 14 + Math.floor(full / 6) * CH;
    const g = el('g', { class: 'grp left' });
    for (let d = 0; d < rem; d++) {
      g.appendChild(el('circle', { cx: gx + 16 + (d % 4) * 20, cy: gy + 18 + Math.floor(d / 4) * 20, r: 7, class: 'pip over' }));
    }
    g.appendChild(el('text', { x: gx + 6, y: gy + CH - 4, class: 'jlabel' }, 'left over'));
    s.appendChild(g);
  }
  void cols;
  return s;
}

/* Render `board` with `upto` steps already answered. Returns an <svg>, or null
   when the strategy has no picture worth drawing. */
export function render(board, upto) {
  if (!board) return null;
  if (board.k === 'line') return drawLine(board, upto);
  if (board.k === 'blocks') return drawBlocks(board, upto);
  if (board.k === 'area') return drawArea(board, upto);
  if (board.k === 'groups') return drawGroups(board, upto);
  return null;
}
