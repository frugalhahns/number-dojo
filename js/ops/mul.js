/* Multiplication. Every strategy here is really the same one sentence said five
   ways: a times fact is a rectangle, and you are allowed to cut the rectangle
   up and add the pieces. The area board in js/board.js draws that cut, which is
   the whole reason the pictures are worth having. */

import { ri, pick, step, chain, area, numberLine, jump } from '../num.js';

/* ---------------------------------------------------------------- anchor --- */
/* Lean on the fives, which he already knows because they are half of the tens. */
export const anchor = {
  id: 'mul.anchor', op: 'mul', name: 'Anchor on Five', move: 'Five Star',
  blurb: 'You already know your fives. Start there and add the few that are missing.',
  levels: 3,
  gen(r, level) {
    if (level <= 1) return { a: ri(r, 2, 7), b: pick(r, [6, 7, 8]) };
    if (level === 2) return { a: ri(r, 3, 9), b: pick(r, [3, 4, 6, 7, 8, 9]) };
    return { a: ri(r, 12, 19), b: pick(r, [6, 7, 8, 9]) };
  },
  build(p) {
    const { a, b } = p, prod = a * b;
    const base = b > 5 ? 5 : 2, rest = b - base;
    const easy = a * base, extra = a * rest;
    const steps = [step('Start with the ' + (base === 5 ? 'five' : 'two') + ' you already know.',
      a + ' × ' + base + ' = ?', easy,
      { hint: base === 5 ? 'Times five is half of times ten. Work out ' + a + ' tens, then halve it.' : 'Just double ' + a + '.',
        why: a + ' × ' + base + ' = ' + easy + '. That is ' + base + ' of the ' + b + ' groups done.' })];
    if (rest === 1) {
      steps.push(step('That was ' + base + ' groups of ' + a + '. You need ' + b + '. Add one more ' + a + '.',
        easy + ' + ' + a + ' = ?', prod,
        { hint: 'Only one group short.', why: easy + ' + ' + a + ' = ' + prod + '.' }));
    } else {
      steps.push(step('You have done ' + base + ' groups. ' + rest + ' groups of ' + a + ' are still missing.',
        a + ' × ' + rest + ' = ?', extra,
        { hint: 'A small fact on its own.', why: a + ' × ' + rest + ' = ' + extra + '.' }));
      steps.push(step('Stick the two pieces of the rectangle back together.',
        easy + ' + ' + extra + ' = ?', prod,
        { why: easy + ' + ' + extra + ' = ' + prod + ', so ' + a + ' × ' + b + ' = ' + prod + '.' }));
    }
    return chain({
      title: a + ' × ' + b, strategy: this.id, answer: prod,
      recap: '(' + a + '×' + base + ') + (' + a + '×' + rest + ')  =  ' + easy + ' + ' + extra + '  =  ' + prod,
      steps,
      board: area(a, [{ w: base, label: a + '×' + base + ' = ' + easy, after: 0 },
                      { w: rest, label: a + '×' + rest + ' = ' + extra, after: rest === 1 ? 1 : 1 }], String(a))
    });
  }
};

/* ----------------------------------------------------------------- near10 -- */
/* Overshoot to a ten and trim. Nines are the reason this exists. */
export const near10 = {
  id: 'mul.near10', op: 'mul', name: 'Ten Then Trim', move: 'Overshoot',
  blurb: 'Round the awkward factor up to a ten, multiply, then take off the groups you added by mistake.',
  levels: 3,
  gen(r, level) {
    /* Never a ten. "10 x 9, so pretend the 9 is a 10" is a joke of a problem:
       the whole method is about rounding the awkward factor, and there is
       nothing awkward left once the other one is already round. */
    if (level <= 1) return { a: pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]), b: pick(r, [9, 9, 8]) };
    if (level === 2) return { a: ri(r, 3, 9), b: pick(r, [8, 9]) };
    return { a: ri(r, 3, 9), b: pick(r, [19, 29, 18]) };
  },
  build(p) {
    const { a, b } = p, prod = a * b;
    const round = Math.round(b / 10) * 10 === b ? b : Math.ceil(b / 10) * 10;
    const over = round - b, big = a * round, trim = a * over;
    const steps = [step('Pretend the ' + b + ' is ' + round + '. Round tens are free.',
      a + ' × ' + round + ' = ?', big,
      { hint: 'Multiplying by ' + round + ' is ' + a + ' × ' + (round / 10) + ', then a zero on the end.',
        why: a + ' × ' + round + ' = ' + big + '. But that is ' + over + ' group' + (over > 1 ? 's' : '') + ' too many.' })];
    if (over === 1) {
      steps.push(step('You counted one extra group of ' + a + '. Take it back off.',
        big + ' − ' + a + ' = ?', prod,
        { hint: 'Exactly one ' + a + ' too many, so remove exactly one.',
          why: big + ' − ' + a + ' = ' + prod + '.' }));
    } else {
      steps.push(step('You counted ' + over + ' extra groups of ' + a + '. How much is that?',
        a + ' × ' + over + ' = ?', trim, { hint: 'Just ' + over + ' groups.' }));
      steps.push(step('Trim it off.', big + ' − ' + trim + ' = ?', prod,
        { why: big + ' − ' + trim + ' = ' + prod + '.' }));
    }
    return chain({
      title: a + ' × ' + b, strategy: this.id, answer: prod,
      recap: '(' + a + '×' + round + ') − (' + a + '×' + over + ')  =  ' + big + ' − ' + trim + '  =  ' + prod,
      steps,
      board: numberLine(0, big + Math.max(10, a),
        [jump(0, big, a + '×' + round, 0), jump(big, prod, '−' + trim, over === 1 ? 1 : 2)])
    });
  }
};

/* ------------------------------------------------------------ distribute --- */
/* The one that becomes long multiplication later, met as a picture first. */
export const distribute = {
  id: 'mul.distribute', op: 'mul', name: 'Split the Big One', move: 'Place Split',
  blurb: 'Cut the big number into its tens and ones, multiply each piece, and add.',
  levels: 3,
  gen(r, level) {
    if (level <= 1) return { a: ri(r, 2, 4), b: ri(r, 1, 2) * 10 + ri(r, 1, 4) };
    if (level === 2) return { a: ri(r, 3, 9), b: ri(r, 1, 4) * 10 + ri(r, 1, 9) };
    return { a: ri(r, 3, 8), b: ri(r, 1, 4) * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9) };
  },
  build(p) {
    const { a, b } = p, prod = a * b;
    const o = b % 10;
    const steps = [];
    let parts;
    if (b >= 100) {
      const h = Math.floor(b / 100) * 100, t = b % 100 - o;
      steps.push(step('Cut ' + b + ' into ' + h + ', ' + t + ' and ' + o + '. Hundreds first.',
        a + ' × ' + h + ' = ?', a * h,
        { hint: a + ' × ' + (h / 100) + ', then two zeros.', why: a + ' × ' + h + ' = ' + (a * h) + '.' }));
      steps.push(step('Now the tens piece.', a + ' × ' + t + ' = ?', a * t,
        { hint: a + ' × ' + (t / 10) + ', then one zero.' }));
      steps.push(step('Now the ones piece.', a + ' × ' + o + ' = ?', a * o, {}));
      steps.push(step('Add all three pieces of the rectangle.',
        (a * h) + ' + ' + (a * t) + ' + ' + (a * o) + ' = ?', prod, {}));
      parts = (a * h) + ' + ' + (a * t) + ' + ' + (a * o);
    } else {
      const t = b - o;
      steps.push(step('Cut ' + b + ' into ' + t + ' and ' + o + '. Do the tens piece.',
        a + ' × ' + t + ' = ?', a * t,
        { hint: 'That is really ' + a + ' × ' + (t / 10) + ' with a zero stuck on.',
          why: a + ' × ' + t + ' = ' + (a * t) + '.' }));
      steps.push(step('Now the ones piece.', a + ' × ' + o + ' = ?', a * o,
        { hint: 'One of your times tables.', why: a + ' × ' + o + ' = ' + (a * o) + '.' }));
      steps.push(step('Add the two pieces.', (a * t) + ' + ' + (a * o) + ' = ?', prod,
        { why: (a * t) + ' + ' + (a * o) + ' = ' + prod + '.' }));
      parts = (a * t) + ' + ' + (a * o);
    }
    return chain({
      title: a + ' × ' + b, strategy: this.id, answer: prod,
      recap: parts + '  =  ' + prod, steps,
      board: b < 100
        ? area(a, [{ w: b - o, label: a + '×' + (b - o) + ' = ' + (a * (b - o)), after: 0 },
                   { w: o, label: a + '×' + o + ' = ' + (a * o), after: 1 }], String(a))
        : null
    });
  }
};

/* --------------------------------------------------------------- doubling -- */
/* Fours and eights are doubling machines. Two or three easy moves beat one hard
   fact, and doubling is a thing his hands can already do. */
export const doubling = {
  id: 'mul.doubling', op: 'mul', name: 'Double, Double', move: 'Double Dash',
  blurb: 'Times 4 is double twice. Times 8 is double three times. No hard facts needed.',
  levels: 3,
  gen(r, level) {
    if (level <= 1) return { a: 4, b: ri(r, 6, 19) };
    if (level === 2) return { a: 8, b: ri(r, 3, 18) };
    return { a: 16, b: ri(r, 3, 20) };
  },
  build(p) {
    const { a, b } = p, prod = a * b;
    const times = a === 4 ? 2 : a === 8 ? 3 : 4;
    const steps = [];
    let v = b;
    for (let i = 0; i < times; i++) {
      const nv = v * 2, groups = Math.pow(2, i + 1);
      steps.push(step(i === 0 ? 'Double ' + b + '. That is two groups of ' + b + '.'
                              : 'Double it again. Now you have ' + groups + ' groups of ' + b + '.',
        v + ' + ' + v + ' = ?', nv,
        { hint: i === 0 ? 'Doubles are the easiest facts there are.' : 'Double the tens, double the ones, then add the two.',
          why: 'Double ' + v + ' is ' + nv + ', which is ' + groups + ' × ' + b + '.' }));
      v = nv;
    }
    return chain({
      title: a + ' × ' + b, strategy: this.id, answer: prod,
      recap: b + ' doubled ' + times + ' times is ' + prod,
      steps,
      board: (function () {
        /* Each double is one jump along the line, twice as long as the last, so
           the picture shows the run-away growth that makes this method quick. */
        const js = []; let at = b;
        for (let i = 0; i < times; i++) { js.push(jump(at, at * 2, '+' + at, i)); at *= 2; }
        return numberLine(0, prod, [jump(0, b, String(b), -1)].concat(js));
      })()
    });
  }
};

/* ----------------------------------------------------------- halvedouble -- */
/* Halve one side, double the other, and the rectangle keeps the same area. The
   same invariance idea as sliding a subtraction, one operation up. */
export const halvedouble = {
  id: 'mul.halvedouble', op: 'mul', name: 'Halve and Double', move: 'Shape Shift',
  blurb: 'Halve one factor and double the other. The answer does not change, but the numbers get friendly.',
  levels: 3,
  gen(r, level) {
    if (level <= 1) return { a: 5, b: ri(r, 3, 16) * 2 };
    if (level === 2) return { a: pick(r, [15, 25]), b: ri(r, 2, 11) * 2 };
    return { a: pick(r, [25, 50]), b: ri(r, 6, 16) * 2 };
  },
  build(p) {
    const { a, b } = p, prod = a * b;
    const half = b / 2, dbl = a * 2;
    return chain({
      title: a + ' × ' + b, strategy: this.id, answer: prod,
      recap: a + '×' + b + '  is the same rectangle as  ' + dbl + '×' + half + '  =  ' + prod,
      steps: [
        step(b + ' is even, so cut it in half.', b + ' ÷ 2 = ?', half,
          { hint: 'Half the tens and half the ones: half of ' + (Math.floor(b / 10) * 10) + ' plus half of ' + (b % 10) + '.',
            why: 'Half of ' + b + ' is ' + half + '.' }),
        step('To keep it fair, double the other one. Half as many groups, twice as big.',
          a + ' × 2 = ?', dbl,
          { hint: 'Double ' + a + '.', why: a + ' doubled is ' + dbl + ', and ' + dbl + ' is a lovely number to multiply by.' }),
        step('Same answer, much friendlier.', dbl + ' × ' + half + ' = ?', prod,
          { hint: dbl % 10 === 0 ? 'Multiply by ' + (dbl / 10) + ' and add a zero.' : 'One you can do.',
            why: dbl + ' × ' + half + ' = ' + prod + ', so ' + a + ' × ' + b + ' = ' + prod + '.' })
      ],
      board: area(a, [{ w: b, label: a + ' × ' + b, after: -1 }], String(a))
    });
  }
};

export const MUL = [anchor, near10, distribute, doubling, halvedouble];
