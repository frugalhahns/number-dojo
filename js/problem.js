/* Drawing the problem itself, with the part being worked on lit up.

   This is its own module because two screens need exactly the same picture and
   they must not drift: the solve screen lights the live step, and the "show me"
   walkthrough lights whichever step it has just revealed. Reading `185 + 4` and
   then being told "add the ones" only helps if the 5 and the 4 are visibly the
   ones being talked about, and that has to be true in the explanation as well
   as in the exercise. */

import { el } from './ui.js';

/* Which digits of a number a focus token points at, as a [start, end) slice of
   its digit string. Anything that does not land on real digits comes back null
   and the number is simply left alone, so a token can never blank out a number
   or light up nothing at all. selftest.js keeps its own copy of this table and
   checks every step against it, so a token that stopped resolving would be
   caught rather than silently doing nothing. */
export function slice(text, token) {
  const n = String(text).length;
  const r = { all: [0, n], ones: [n - 1, n], tail: [n - 1, n], tens: [n - 2, n - 1],
              hundreds: [n - 3, n - 2], head: [0, n - 1], head2: [0, n - 2], tail2: [n - 2, n] }[token];
  if (!r) return null;
  const a = Math.max(0, r[0]), b = Math.min(n, r[1]);
  return b > a ? [a, b] : null;
}

/* One side of the problem. `dimRest` pushes back everything that is not lit,
   but only once something IS lit: dimming the whole problem because no step has
   a focus would just make it look switched off. */
function operand(text, token, dimRest) {
  const wrap = el('span', 'operand');
  const r = token ? slice(text, token) : null;
  if (!r) {
    wrap.appendChild(el('span', dimRest ? 'dimd' : '', text));
    return wrap;
  }
  if (r[0] > 0) wrap.appendChild(el('span', 'dimd', text.slice(0, r[0])));
  wrap.appendChild(el('span', 'lit', text.slice(r[0], r[1])));
  if (r[1] < text.length) wrap.appendChild(el('span', 'dimd', text.slice(r[1])));
  return wrap;
}

/* The problem, big, with `focus` lit. Pass a null focus for a plain one.
   `tail` is what goes after the equals: '?' while he is working, or the answer
   once he is not. */
export function bigSum(chain, focus, tail) {
  const wrap = el('div', 'bigsum');
  if (!chain.oper) { wrap.textContent = chain.title + ' = ' + (tail === undefined ? '?' : tail); return wrap; }
  const any = !!(focus && (focus.a || focus.b));
  wrap.appendChild(operand(chain.lhs, any ? focus.a : null, any));
  wrap.appendChild(el('span', 'oper', chain.oper));
  wrap.appendChild(operand(chain.rhs, any ? focus.b : null, any));
  wrap.appendChild(el('span', 'oper', '='));
  const t = tail === undefined ? '?' : String(tail);
  wrap.appendChild(el('span', t === '?' ? 'qmark' : 'answer', t));
  return wrap;
}
