/* The ladder.
   He does not think in strategy names, he thinks in what the problem looks like
   on the page: "two digits plus one", "three digits plus three". So that is what
   he picks, and the app works out which method those particular numbers want.

   A SHAPE owns the numbers. A STRATEGY owns the explanation. The join between
   them is strategy.fits(problem): the shape makes a problem, and whichever
   strategies can honestly handle it are the ones offered. That inversion is the
   whole reason the move list could go away without losing any of the teaching.

   Three levels inside every rung, so "two digits plus two" starts without
   carrying and ends with carrying, and he never has to know that is what
   changed. */

import { ri, pick } from './num.js';

/* Pick between two generators. Used by every level 3, which is where a rung
   stops drilling one case and starts mixing them, because telling them apart
   is its own skill. */
const coin = (r, f, g) => (ri(r, 0, 1) ? f(r) : g(r));

const twoDigit = r => ri(r, 1, 8) * 10;
const threeDigit = r => ri(r, 1, 8) * 100 + ri(r, 0, 9) * 10;

/* ==================================================================== ADD == */

/* Never plus one. It is a legal problem and a worthless one: he has nothing to
   take apart and the walkthrough reads as a joke. */
const addOnes = (r, base) => {                 // ones stay under a ten: 45 + 3
  const o = ri(r, 1, 8);
  return { a: base(r) + o, b: ri(r, 2, 10 - o) };
};
const addBridge = (r, base) => {               // the ones cross a ten: 45 + 8
  const o = ri(r, 2, 9);
  return { a: base(r) + o, b: ri(r, 11 - o, 9) };
};

export const ADD_SHAPES = [
  {
    id: 'add.s1', op: 'add', name: 'Two digits plus one', example: '45 + 5', levels: 3,
    uses: ['add.ones', 'add.bridge'],
    gen(r, level) {
      if (level <= 1) return addOnes(r, twoDigit);
      if (level === 2) return addBridge(r, twoDigit);
      return coin(r, rr => addOnes(rr, twoDigit), rr => addBridge(rr, twoDigit));
    }
  },
  {
    id: 'add.s2', op: 'add', name: 'Three digits plus one', example: '352 + 6', levels: 3,
    uses: ['add.ones', 'add.bridge'],
    gen(r, level) {
      if (level <= 1) return addOnes(r, threeDigit);
      if (level === 2) return addBridge(r, threeDigit);
      return coin(r, rr => addOnes(rr, threeDigit), rr => addBridge(rr, threeDigit));
    }
  },
  {
    id: 'add.s3', op: 'add', name: 'Adding whole tens', example: '564 + 70', levels: 3,
    uses: ['add.scale'],
    gen(r, level) {
      if (level <= 1) {                               // the tens do not carry
        const t = ri(r, 1, 5);
        return { a: ri(r, 1, 8) * 100 + t * 10 + ri(r, 1, 9), b: ri(r, 1, 9 - t) * 10 };
      }
      if (level === 2) {                              // the tens carry: 564 + 70
        const tens = ri(r, 1, 8) * 10 + ri(r, 5, 9);
        return { a: tens * 10 + ri(r, 1, 9), b: ri(r, 11 - (tens % 10), 9) * 10 };
      }
      /* Whole hundreds instead of whole tens, still on a three digit number.
         Four digit numbers are past where this ladder is aimed. The addend is
         drawn first and the big number is kept at least as large, because a
         "work in hundreds" problem where the round number is the bigger of the
         two reads backwards and the strategy declines it. */
      const k = ri(r, 1, 4);
      const h = ri(r, k, 9 - k);
      return { a: h * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9), b: k * 100 };
    }
  },
  {
    id: 'add.s4', op: 'add', name: 'Two digits plus two', example: '53 + 35', levels: 3,
    uses: ['add.split', 'add.friendly', 'add.near'],
    gen(r, level) {
      if (level <= 1) {                               // no carry anywhere
        const o1 = ri(r, 1, 4), o2 = ri(r, 1, 9 - o1);
        return { a: ri(r, 1, 4) * 10 + o1, b: ri(r, 1, 4) * 10 + o2 };
      }
      if (level === 2) {                              // the ones carry
        const o1 = ri(r, 4, 9), o2 = ri(r, 11 - o1, 9);
        return { a: ri(r, 1, 7) * 10 + o1, b: ri(r, 1, 7) * 10 + o2 };
      }
      /* No round tens: "53 + 20" belongs on the whole-tens rung, and landing
         it here would teach him the wrong thing about what this rung is. */
      return { a: ri(r, 1, 8) * 10 + ri(r, 1, 9), b: ri(r, 1, 8) * 10 + ri(r, 1, 9) };
    }
  },
  {
    id: 'add.s5', op: 'add', name: 'Three digits plus three', example: '324 + 324', levels: 3,
    uses: ['add.split', 'add.friendly'],
    gen(r, level) {
      if (level <= 1) {                               // no carry anywhere
        const o1 = ri(r, 1, 4), t1 = ri(r, 1, 4);
        return { a: ri(r, 1, 4) * 100 + t1 * 10 + o1,
                 b: ri(r, 1, 4) * 100 + ri(r, 1, 9 - t1) * 10 + ri(r, 1, 9 - o1) };
      }
      if (level === 2) {                              // the ones carry, the tens do not
        const o1 = ri(r, 4, 9), t1 = ri(r, 1, 4);
        return { a: ri(r, 1, 4) * 100 + t1 * 10 + o1,
                 b: ri(r, 1, 4) * 100 + ri(r, 1, 8 - t1) * 10 + ri(r, 11 - o1, 9) };
      }
      /* Every digit non zero. "90 + 0 = 90" is a step that asks nothing. */
      return { a: ri(r, 1, 8) * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9),
               b: ri(r, 1, 8) * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9) };
    }
  }
];

/* ==================================================================== SUB == */

const subOnes = (r, base) => {                 // the ones are big enough: 45 - 3
  const o = ri(r, 3, 9);
  return { a: base(r) + o, b: ri(r, 2, o) };
};
const subBorrow = (r, base) => {               // they are not: 45 - 8
  const o = ri(r, 1, 7);
  return { a: base(r) + o, b: ri(r, o + 1, 9) };
};

export const SUB_SHAPES = [
  {
    id: 'sub.s1', op: 'sub', name: 'Two digits take one', example: '45 − 8', levels: 3,
    uses: ['sub.ones', 'sub.back'],
    gen(r, level) {
      const base = rr => ri(rr, 2, 9) * 10;
      if (level <= 1) return subOnes(r, base);
      if (level === 2) return subBorrow(r, base);
      return coin(r, rr => subOnes(rr, base), rr => subBorrow(rr, base));
    }
  },
  {
    id: 'sub.s2', op: 'sub', name: 'Three digits take one', example: '352 − 6', levels: 3,
    uses: ['sub.ones', 'sub.back'],
    gen(r, level) {
      const base = rr => ri(rr, 1, 8) * 100 + ri(rr, 1, 9) * 10;
      if (level <= 1) return subOnes(r, base);
      if (level === 2) return subBorrow(r, base);
      return coin(r, rr => subOnes(rr, base), rr => subBorrow(rr, base));
    }
  },
  {
    id: 'sub.s3', op: 'sub', name: 'Taking whole tens', example: '634 − 70', levels: 3,
    uses: ['sub.scale'],
    gen(r, level) {
      if (level <= 1) {                               // the tens do not borrow
        const t = ri(r, 5, 9);
        return { a: ri(r, 1, 8) * 100 + t * 10 + ri(r, 1, 9), b: ri(r, 1, t - 1) * 10 };
      }
      if (level === 2) {                              // they do: 634 - 70
        const tens = ri(r, 2, 8) * 10 + ri(r, 1, 4);
        return { a: tens * 10 + ri(r, 1, 9), b: ri(r, (tens % 10) + 1, 9) * 10 };
      }
      /* Whole hundreds, still on a three digit number. */
      const h = ri(r, 3, 9);
      return { a: h * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9), b: ri(r, 1, h - 1) * 100 };
    }
  },
  {
    id: 'sub.s4', op: 'sub', name: 'Two digits take two', example: '73 − 28', levels: 3,
    uses: ['sub.split', 'sub.back', 'sub.shift', 'sub.countup'],
    gen(r, level) {
      if (level <= 1) {                               // no borrowing
        const o1 = ri(r, 4, 9);
        return { a: ri(r, 4, 9) * 10 + o1, b: ri(r, 1, 3) * 10 + ri(r, 1, o1) };
      }
      if (level === 2) {                              // borrowing
        const o1 = ri(r, 1, 7);
        return { a: ri(r, 4, 9) * 10 + o1, b: ri(r, 1, 3) * 10 + ri(r, o1 + 1, 9) };
      }
      /* Half of level three is a pair sitting close together, because spotting
         that 71 - 68 should be counted up rather than taken apart is the point
         of having learned both. */
      return coin(r,
        rr => { const b = ri(rr, 2, 7) * 10 + ri(rr, 1, 9); return { a: b + ri(rr, 3, 14), b }; },
        rr => { const o1 = ri(rr, 1, 7); return { a: ri(rr, 4, 9) * 10 + o1, b: ri(rr, 1, 3) * 10 + ri(rr, o1 + 1, 9) }; });
    }
  },
  {
    id: 'sub.s5', op: 'sub', name: 'Three digits take three', example: '524 − 318', levels: 3,
    uses: ['sub.split', 'sub.back', 'sub.shift', 'sub.countup'],
    gen(r, level) {
      if (level <= 1) {                               // no borrowing
        const o1 = ri(r, 4, 9), t1 = ri(r, 4, 9);
        return { a: ri(r, 4, 9) * 100 + t1 * 10 + o1,
                 b: ri(r, 1, 3) * 100 + ri(r, 1, t1) * 10 + ri(r, 1, o1) };
      }
      if (level === 2) {                              // the ones borrow
        const o1 = ri(r, 1, 7), t1 = ri(r, 4, 9);
        return { a: ri(r, 4, 9) * 100 + t1 * 10 + o1,
                 b: ri(r, 1, 3) * 100 + ri(r, 1, t1 - 1) * 10 + ri(r, o1 + 1, 9) };
      }
      return coin(r,
        rr => { const b = ri(rr, 2, 7) * 100 + ri(rr, 1, 9) * 10 + ri(rr, 1, 9);
                return { a: b + ri(rr, 3, 16), b }; },
        rr => { const o1 = ri(rr, 1, 7), t1 = ri(rr, 4, 9);
                return { a: ri(rr, 4, 9) * 100 + t1 * 10 + o1,
                         b: ri(rr, 1, 3) * 100 + ri(rr, 1, t1 - 1) * 10 + ri(rr, o1 + 1, 9) }; });
    }
  }
];

/* ==================================================================== MUL == */

export const MUL_SHAPES = [
  {
    id: 'mul.s1', op: 'mul', name: 'The times tables', example: '7 × 6', levels: 3,
    uses: ['mul.anchor', 'mul.near10', 'mul.doubling', 'mul.halvedouble'],
    gen(r, level) {
      if (level <= 1) return { a: ri(r, 2, 9), b: pick(r, [3, 4, 6]) };
      if (level === 2) return { a: ri(r, 2, 9), b: pick(r, [6, 7, 8, 9]) };
      return { a: ri(r, 3, 9), b: pick(r, [3, 4, 6, 7, 8, 9]) };
    }
  },
  {
    id: 'mul.s2', op: 'mul', name: 'Times whole tens', example: '6 × 30', levels: 3,
    uses: ['mul.scale'],
    gen(r, level) {
      if (level <= 1) return { a: ri(r, 2, 5), b: ri(r, 2, 9) * 10 };
      if (level === 2) return { a: ri(r, 3, 9), b: ri(r, 2, 9) * 10 };
      return { a: ri(r, 3, 9), b: ri(r, 2, 9) * 100 };
    }
  },
  {
    id: 'mul.s3', op: 'mul', name: 'Two digits times one', example: '4 × 23', levels: 3,
    uses: ['mul.distribute', 'mul.doubling', 'mul.halvedouble', 'mul.near10'],
    gen(r, level) {
      if (level <= 1) return { a: ri(r, 2, 4), b: ri(r, 1, 2) * 10 + ri(r, 1, 9) };
      if (level === 2) return { a: ri(r, 3, 9), b: ri(r, 1, 4) * 10 + ri(r, 1, 9) };
      return { a: ri(r, 3, 9), b: ri(r, 1, 9) * 10 + ri(r, 1, 9) };
    }
  },
  {
    id: 'mul.s4', op: 'mul', name: 'Three digits times one', example: '7 × 213', levels: 3,
    uses: ['mul.distribute'],
    gen(r, level) {
      if (level <= 1) return { a: ri(r, 2, 3), b: ri(r, 1, 3) * 100 + ri(r, 0, 3) * 10 + ri(r, 1, 3) };
      if (level === 2) return { a: ri(r, 3, 6), b: ri(r, 1, 4) * 100 + ri(r, 0, 9) * 10 + ri(r, 1, 9) };
      return { a: ri(r, 3, 9), b: ri(r, 1, 9) * 100 + ri(r, 0, 9) * 10 + ri(r, 1, 9) };
    }
  }
];

/* ==================================================================== DIV == */

export const DIV_SHAPES = [
  {
    id: 'div.s1', op: 'div', name: 'The division facts', example: '56 ÷ 7', levels: 3,
    uses: ['div.flip', 'div.halve'],
    gen(r, level) {
      if (level <= 1) { const d = ri(r, 2, 9); return { n: d * ri(r, 2, 5), d }; }
      if (level === 2) { const d = ri(r, 2, 9); return { n: d * ri(r, 6, 9), d }; }
      const d = ri(r, 6, 9); return { n: d * ri(r, 6, 9), d };
    }
  },
  {
    id: 'div.s2', op: 'div', name: 'Some left over', example: '38 ÷ 5', levels: 3,
    uses: ['div.leftover'],
    gen(r, level) {
      if (level <= 1) { const d = ri(r, 2, 5); return { n: d * ri(r, 3, 8) + ri(r, 1, d - 1), d }; }
      if (level === 2) { const d = ri(r, 4, 9); return { n: d * ri(r, 4, 9) + ri(r, 1, d - 1), d }; }
      const d = ri(r, 3, 9); return { n: d * ri(r, 11, 19) + ri(r, 1, d - 1), d };
    }
  },
  {
    id: 'div.s3', op: 'div', name: 'Sharing whole tens', example: '240 ÷ 6', levels: 3,
    uses: ['div.scale'],
    gen(r, level) {
      if (level <= 1) { const d = ri(r, 2, 9); return { n: d * ri(r, 2, 9) * 10, d }; }
      if (level === 2) { const d = ri(r, 3, 9); return { n: d * ri(r, 11, 19) * 10, d }; }
      const d = ri(r, 2, 9); return { n: d * ri(r, 2, 9) * 100, d };
    }
  },
  {
    id: 'div.s4', op: 'div', name: 'More than ten each', example: '72 ÷ 6', levels: 3,
    uses: ['div.chunks', 'div.halve'],
    gen(r, level) {
      if (level <= 1) { const d = ri(r, 2, 5); return { n: d * ri(r, 11, 15), d }; }
      if (level === 2) { const d = ri(r, 6, 9); return { n: d * ri(r, 11, 19), d }; }
      const d = ri(r, 3, 9); return { n: d * ri(r, 21, 29), d };
    }
  }
];

export const SHAPES = [].concat(ADD_SHAPES, SUB_SHAPES, MUL_SHAPES, DIV_SHAPES);

export const BY_SHAPE = {};
for (const s of SHAPES) BY_SHAPE[s.id] = s;

export const SHAPES_FOR = op => SHAPES.filter(s => s.op === op);
