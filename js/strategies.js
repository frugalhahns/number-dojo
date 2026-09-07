/* The move list.
   Twenty strategies, five per operation. A GYM is one operation: a themed room
   with its own color, its own starter buddy and its own badge. */

import { ADD } from './ops/add.js';
import { SUB } from './ops/sub.js';
import { MUL } from './ops/mul.js';
import { DIV } from './ops/div.js';
import { rng, ri, pick } from './num.js';

export const GYMS = [
  { op: 'add', name: 'Sprout Gym',  what: 'Adding',      sign: '+', type: 'grass',    starter: 'chikorita', list: ADD,
    leader: 'Meganium', hue: 'grass',
    idea: 'Adding is moving forward on the number line. You are allowed to move in whatever chunks you like.' },
  { op: 'sub', name: 'Tide Gym',    what: 'Subtracting', sign: '−', type: 'water',    starter: 'wooper',    list: SUB,
    leader: 'Quagsire', hue: 'water',
    idea: 'Subtracting is the GAP between two numbers. You can walk it backwards, or forwards, or slide both numbers along.' },
  { op: 'mul', name: 'Spark Gym',   what: 'Multiplying', sign: '×', type: 'electric', starter: 'pikachu',   list: MUL,
    leader: 'Raichu', hue: 'electric',
    idea: 'A times fact is a rectangle. Cut the rectangle into easy pieces and add the pieces up.' },
  { op: 'div', name: 'Stone Gym',   what: 'Dividing',    sign: '÷', type: 'rock',     starter: 'geodude',   list: DIV,
    leader: 'Golem', hue: 'rock',
    idea: 'Dividing is asking how many groups fit. Take out big friendly chunks first and count the chunks.' }
];

export const BY_OP = {};
for (const g of GYMS) BY_OP[g.op] = g;

export const ALL = GYMS.flatMap(g => g.list);
export const BY_STRATEGY = {};
for (const s of ALL) BY_STRATEGY[s.id] = s;

export function gymOf(id) { return BY_OP[BY_STRATEGY[id].op]; }

/* Build one problem. `seed` makes it reproducible; the self test leans on that
   and so does the printable sheet, which has to show the same numbers twice. */
export function make(strategyId, level, seed) {
  const s = BY_STRATEGY[strategyId];
  if (!s) return null;
  const lv = Math.max(1, Math.min(s.levels, level | 0 || 1));
  const r = rng(seed);
  const p = s.gen(r, lv);
  const c = s.build(p);
  c.level = lv;
  c.seed = seed;
  c.problem = p;
  return c;
}

/* A problem that is not the one he just did. Repeating the same numbers twice in
   a row reads as a bug to a kid even when it is only chance. */
export function makeFresh(strategyId, level, avoidTitle) {
  for (let i = 0; i < 24; i++) {
    const c = make(strategyId, level, (Math.random() * 2000000000) | 0);
    if (!avoidTitle || c.title !== avoidTitle) return c;
  }
  return make(strategyId, level, (Math.random() * 2000000000) | 0);
}
