/* DOM plumbing. Nothing here knows any math. */

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = String(text);
  return e;
}
export const qs = s => document.querySelector(s);
export const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); return n; };

export function button(label, cls, fn) {
  const b = el('button', cls || 'btn', label);
  b.type = 'button';
  if (fn) b.addEventListener('click', fn);
  return b;
}

/* A short message across the bottom. Never used for anything he has to act on:
   it can be missed, so nothing important lives here. */
let toastTimer = null;
export function toast(msg, ms) {
  const t = qs('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms || 2200);
}

/* The one modal. Used for the team sheet, the how-to and the grown-up page. */
export function sheet(title, build) {
  const wrap = qs('#sheet'), body = qs('#sheet-body');
  clear(body);
  if (title) body.appendChild(el('h2', 'sheet-title', title));
  build(body);
  wrap.classList.remove('hidden');
  const close = () => wrap.classList.add('hidden');
  qs('#sheet-close').onclick = close;
  wrap.onclick = e => { if (e.target === wrap) close(); };
  return close;
}
export function closeSheet() { qs('#sheet').classList.add('hidden'); }

/* Sparkles. Cheap, short, and capped, because a hundred divs on a school
   Chromebook is a slideshow. */
export function sparkle(target, n) {
  if (!target) return;
  const host = qs('#fx');
  const r = target.getBoundingClientRect();
  const count = Math.min(n || 10, 18);
  for (let i = 0; i < count; i++) {
    const s = el('i', 'spark');
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const d = 40 + Math.random() * 70;
    s.style.left = (r.left + r.width / 2) + 'px';
    s.style.top = (r.top + r.height / 2) + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    s.style.setProperty('--wait', (i * 12) + 'ms');
    host.appendChild(s);
    setTimeout(() => s.remove(), 900 + i * 12);
  }
}

/* A confetti burst for the big moments only: catching, evolving, a badge. */
export function confetti() {
  const host = qs('#fx');
  const colors = ['#ffd45e', '#58d68d', '#6ec6ff', '#f2777a', '#c9a0ff'];
  for (let i = 0; i < 44; i++) {
    const c = el('i', 'confetti');
    c.style.left = (10 + Math.random() * 80) + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
    c.style.setProperty('--wait', (Math.random() * 400) + 'ms');
    c.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
    host.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}

/* Progress bars and pips, used in three places each. */
export function bar(frac, cls) {
  const w = el('div', 'bar ' + (cls || ''));
  const f = el('i', 'bar-fill');
  f.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
  w.appendChild(f);
  return w;
}
export function pips(done, total, cls) {
  const w = el('div', 'pips ' + (cls || ''));
  for (let i = 0; i < total; i++) w.appendChild(el('i', 'pip' + (i < done ? ' on' : '')));
  return w;
}
