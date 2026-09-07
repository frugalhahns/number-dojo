/* Addition. Five ways to take a sum apart.
   Each strategy has gen(r, level) -> problem and build(problem) -> chain, and
   the two are kept separate so the self test can build a chain for a problem it
   made up itself and check the steps really land on the answer. */

import { lit, scalePlace, ri, pick, nextUp, floorTo, step, chain, numberLine, jump, blocks, area } from '../num.js';

/* ---------------------------------------------------------------- bridge --- */
/* His example's second half: 56 + 7 becomes 56 + 4 + 3.
   Give the first number just enough to reach a round ten, then hand over what
   is left. The whole idea is that a ten is a free place to stand. */
export const bridge = {
  id: 'add.bridge', op: 'add', name: 'Bridge to Ten', move: 'Bridge Bolt',
  blurb: 'Feed the first number just enough to land on a round ten, then add the rest.',
  levels: 3,
  /* Needs the ones to actually cross a ten. Without a crossing there is no
     bridge to build and step two would ask him to split a 6 into a 7 and a
     minus 1. */
  fits: p => p.b >= 1 && p.b <= 9 && (p.a % 10) + p.b > 10,
  gen(r, level) {
    const ones = ri(r, 5, 9);
    const b = ri(r, 11 - ones, 9);            // guarantees the ones cross a ten
    let a;
    if (level <= 1) a = ones;
    else if (level === 2) a = ri(r, 1, 8) * 10 + ones;
    else a = ri(r, 1, 8) * 100 + ri(r, 1, 9) * 10 + ones;
    return { a, b };
  },
  build(p) {
    const { a, b } = p;
    const top = nextUp(a, 10), need = top - a, rest = b - need, sum = a + b;
    return chain({
      title: a + ' + ' + b,
      strategy: this.id,
      answer: sum,
      recap: a + ' + ' + need + ' + ' + rest + '  =  ' + top + ' + ' + rest + '  =  ' + sum,
      steps: [
        step('How many more does ' + a + ' need to reach ' + top + '?',
             a + ' + ? = ' + top, need,
             { focus: lit('ones'), hint: 'Only the ones digit matters here. How far is it from there to the next ten?',
               why: a + ' is ' + need + ' short of ' + top + '.' }),
        step('You just spent ' + need + ' of the ' + b + '. How much of it is left?',
             b + ' − ' + need + ' = ?', rest,
             { focus: lit(null, 'all'), hint: 'You broke the ' + b + ' into two pieces and spent the first one. Count what is still in your hand.',
               why: b + ' splits into ' + need + ' and ' + rest + '.' }),
        step('Now the easy part. Add what was left to the round ten.',
             top + ' + ' + rest + ' = ?', sum,
             { focus: lit(null, 'all'), hint: 'Adding to a round ten never changes the tens digit.',
               why: top + ' + ' + rest + ' = ' + sum + ', and that is the answer.' })
      ],
      board: numberLine(floorTo(a, 10), nextUp(top, 10),
        [jump(a, top, '+' + need, 0), jump(top, sum, '+' + rest, 2)])
    });
  }
};

/* ----------------------------------------------------------------- split --- */
/* Expanded form. Tens with tens, ones with ones, then put the piles together. */
export const split = {
  id: 'add.split', op: 'add', name: 'Split by Place', move: 'Place Split',
  blurb: 'Add the tens to the tens and the ones to the ones, then join the piles.',
  levels: 3,
  /* Both numbers have to have the same shape, or the "add the hundreds" step
     is 300 + 0 and teaches nothing. */
  fits: p => p.a >= 10 && p.b >= 10 && p.a < 1000 && p.b < 1000 && (p.a >= 100) === (p.b >= 100),
  gen(r, level) {
    if (level <= 1) {                          // ones stay under ten: no carry
      const o1 = ri(r, 1, 4), o2 = ri(r, 1, 9 - o1);
      return { a: ri(r, 1, 8) * 10 + o1, b: ri(r, 1, 8) * 10 + o2 };
    }
    if (level === 2) {
      const o1 = ri(r, 4, 9), o2 = ri(r, 11 - o1, 9);
      return { a: ri(r, 1, 7) * 10 + o1, b: ri(r, 1, 7) * 10 + o2 };
    }
    const o1 = ri(r, 3, 9), o2 = ri(r, 1, 9);
    return { a: ri(r, 1, 6) * 100 + ri(r, 1, 8) * 10 + o1, b: ri(r, 1, 3) * 100 + ri(r, 1, 8) * 10 + o2 };
  },
  build(p) {
    const { a, b } = p, sum = a + b;
    const ao = a % 10, bo = b % 10, ones = ao + bo;
    const steps = [];
    let running;
    if (a >= 100 || b >= 100) {
      const ah = floorTo(a, 100), bh = floorTo(b, 100), hun = ah + bh;
      const at = a % 100 - ao, bt = b % 100 - bo, tens = at + bt;
      steps.push(step('Hundreds first, and only the hundreds.',
        ah + ' + ' + bh + ' = ?', hun, { focus: lit('hundreds', 'hundreds'), hint: 'Think ' + (ah / 100) + ' + ' + (bh / 100) + ', then say it in hundreds.' }));
      steps.push(step('Now just the tens.', at + ' + ' + bt + ' = ?', tens,
        { focus: lit('tens', 'tens'), hint: 'Think ' + (at / 10) + ' + ' + (bt / 10) + ' tens.' }));
      steps.push(step('Now just the ones.', ao + ' + ' + bo + ' = ?', ones, { focus: lit('ones', 'ones'),}));
      steps.push(step('Three piles. Stack them up.', hun + ' + ' + tens + ' + ' + ones + ' = ?', sum,
        { focus: lit('all', 'all'), why: 'All the pieces put back together make ' + sum + '.' }));
      running = { hun, tens, ones };
    } else {
      const at = a - ao, bt = b - bo, tens = at + bt;
      steps.push(step('Add the tens, and ignore the ones for now.',
        at + ' + ' + bt + ' = ?', tens,
        { focus: lit('tens', 'tens'), hint: 'That is really just ' + (at / 10) + ' + ' + (bt / 10) + ', in tens.',
          why: at + ' + ' + bt + ' = ' + tens + '.' }));
      steps.push(step('Now the ones, on their own.',
        ao + ' + ' + bo + ' = ?', ones,
        { focus: lit('ones', 'ones'), hint: ones > 10 ? 'This one spills past ten, and that is fine.' : 'A small one.',
          why: ao + ' + ' + bo + ' = ' + ones + '.' }));
      steps.push(step('Put the two piles together.', tens + ' + ' + ones + ' = ?', sum,
        { focus: lit('all', 'all'), hint: ones >= 10 ? 'The ones pile is more than ten, so it lifts the tens digit.' : 'Just drop the ones on the end.',
          why: tens + ' + ' + ones + ' = ' + sum + '.' }));
      running = { tens, ones };
    }
    return chain({
      title: a + ' + ' + b, strategy: this.id, answer: sum,
      recap: (running.hun ? running.hun + ' + ' : '') + running.tens + ' + ' + running.ones + '  =  ' + sum,
      steps,
      board: blocks([{ n: a, label: String(a), after: -1 }, { n: b, label: String(b), after: -1 }])
    });
  }
};

/* ----------------------------------------------------------------- scale --- */
/* The first half of his example. 564 + 70 has nothing happening in the ones, so
   the ones step aside and the sum becomes 56 + 7, which is a fact he can do.
   Step two carries its own nested bridge chain, so "break it down more" works. */
export const scale = {
  id: 'add.scale', op: 'add', name: 'Work in Tens', move: 'Zoom Out',
  blurb: 'When nothing is being added to the ones, set them aside and add the tens like small numbers.',
  levels: 3,
  fits: p => scalePlace(p.b) > 0 && p.a % scalePlace(p.b) !== 0 && p.a > p.b,
  gen(r, level) {
    if (level <= 1) {                            // ones set aside, no bridge
      const t = ri(r, 1, 5), u = ri(r, 1, 4);
      return { a: ri(r, 1, 8) * 100 + t * 10 + ri(r, 1, 9), b: u * 10, place: 10 };
    }
    if (level === 2) {                           // the tens sum needs a bridge
      const tens = ri(r, 1, 8) * 10 + ri(r, 5, 9);
      const u = ri(r, 11 - (tens % 10), 9);
      return { a: tens * 10 + ri(r, 1, 9), b: u * 10, place: 10 };
    }
    const huns = ri(r, 1, 8) * 10 + ri(r, 5, 9);  // same trick one place up
    const u = ri(r, 11 - (huns % 10), 9);
    return { a: huns * 100 + ri(r, 1, 9) * 10 + ri(r, 1, 9), b: u * 100, place: 100 };
  },
  build(p) {
    const { a, b } = p, place = p.place || scalePlace(b), sum = a + b;
    const kept = a % place, big = (a - kept) / place, add = b / place, core = big + add;
    const unit = place === 10 ? 'tens' : 'hundreds';
    const keptName = place === 10 ? 'ones digit' : 'last two digits';
    return chain({
      title: a + ' + ' + b, strategy: this.id, answer: sum,
      recap: big + ' + ' + add + ' = ' + core + ', so ' + a + ' + ' + b + ' = ' + sum,
      steps: [
        step('Nothing is being added down in the ones. What part of ' + a + ' just sits there? (its ' + keptName + ')',
          a + ' + ' + b + ' → keep ?', kept,
          { focus: lit(place === 10 ? 'tail' : 'tail2'), hint: b + ' has zeros where those digits are, so they cannot change.',
            why: 'The ' + kept + ' is untouched. Put it in your pocket.' }),
        step('Now count in ' + unit + '. ' + a + ' holds ' + big + ' ' + unit + ', and you are adding ' + add + ' more.',
          big + ' + ' + add + ' = ?', core,
          { focus: lit(place === 10 ? 'head' : 'head2', place === 10 ? 'head' : 'head2'), hint: 'Same little sum you already know. Tap "break it down" if you want help.',
            why: big + ' + ' + add + ' = ' + core + ', so you have ' + core + ' ' + unit + '.',
            unit: unit,
            /* Only offer to break this down when breaking it down would use a
               real bridge. At level 1 the tens sum deliberately does not cross
               a ten, and a bridge chain built on numbers that do not bridge
               asks him to split a 1 into a 6 and a minus 5. */
            more: (big % 10) + add > 10 && add <= 9 ? bridge.build({ a: big, b: add }) : null }),
        step(core + ' ' + unit + ' is ' + (core * place) + '. Now take the ' + kept + ' back out of your pocket.',
          (core * place) + ' + ' + kept + ' = ?', sum,
          { focus: lit(place === 10 ? 'tail' : 'tail2'), hint: 'It goes right back where it came from.',
            why: (core * place) + ' + ' + kept + ' = ' + sum + '.' })
      ],
      board: numberLine(a - (a % place), a - (a % place) + (add + 1) * place,
        [jump(a - kept, a - kept + b, '+' + b, 1)])
    });
  }
};

/* -------------------------------------------------------------- friendly --- */
/* Compensation. Round up, add the easy way, then give the loan back. The give
   back is the part kids drop, so it gets its own step and its own words. */
export const friendly = {
  id: 'add.friendly', op: 'add', name: 'Round and Give Back', move: 'Borrow Bounce',
  blurb: 'Round one number up to something easy, add, then hand back what you borrowed.',
  levels: 3,
  /* Only worth rounding up when the number is close to the ten above it. */
  fits: p => p.a % 10 >= 6 && p.b >= 10,
  gen(r, level) {
    const ones = ri(r, 6, 9);
    if (level <= 1) return { a: ri(r, 1, 8) * 10 + ones, b: ri(r, 2, 9) * 10 + ri(r, 0, 4) };
    if (level === 2) return { a: ri(r, 1, 8) * 10 + ones, b: ri(r, 2, 8) * 10 + ri(r, 1, 9) };
    return { a: ri(r, 1, 8) * 100 + ri(r, 1, 8) * 10 + ones, b: ri(r, 1, 4) * 100 + ri(r, 1, 8) * 10 + ri(r, 1, 9) };
  },
  build(p) {
    const { a, b } = p, sum = a + b;
    const up = nextUp(a, 10), lent = up - a, big = up + b;
    return chain({
      title: a + ' + ' + b, strategy: this.id, answer: sum,
      recap: up + ' + ' + b + ' = ' + big + ', then give back ' + lent + ' → ' + sum,
      steps: [
        step(a + ' is nearly ' + up + '. How much does it have to borrow to get there?',
          a + ' + ? = ' + up, lent,
          { focus: lit('ones'), hint: 'Just the ones digit again.', why: a + ' borrows ' + lent + ' to become ' + up + '.' }),
        step('Round tens are easy to add. Do the friendly version.',
          up + ' + ' + b + ' = ?', big,
          { focus: lit(null, 'all'), hint: 'The tens digit of ' + up + ' plus the tens of ' + b + ', then the ones of ' + b + '.',
            why: up + ' + ' + b + ' = ' + big + '. But this is too big by the ' + lent + ' you borrowed.' }),
        step('You borrowed ' + lent + ', so the answer is ' + lent + ' too big. Give it back.',
          big + ' − ' + lent + ' = ?', sum,
          { focus: lit('ones'), hint: 'Take away exactly what you borrowed. Not more, not less.',
            why: big + ' − ' + lent + ' = ' + sum + '. Always give the loan back.' })
      ],
      board: numberLine(floorTo(a, 10), nextUp(big, 10),
        [jump(a, up, '+' + lent, 0), jump(up, big, '+' + b, 1), jump(big, sum, '−' + lent, 2)])
    });
  }
};

/* ------------------------------------------------------------------ doub --- */
/* Near doubles. 7 + 8 is a double he already owns plus one. */
export const near = {
  id: 'add.near', op: 'add', name: 'Nearly a Double', move: 'Twin Strike',
  blurb: 'If the two numbers are close, use the double you already know and nudge it.',
  levels: 2,
  fits: p => p.a >= 3 && p.b - p.a >= 1 && p.b - p.a <= 2,
  gen(r, level) {
    const a = level <= 1 ? ri(r, 3, 9) : ri(r, 11, 49);
    const off = pick(r, [1, 1, 2]);
    return { a, b: a + off };
  },
  build(p) {
    const { a, b } = p, sum = a + b, dbl = a + a, off = b - a;
    return chain({
      title: a + ' + ' + b, strategy: this.id, answer: sum,
      recap: a + ' + ' + a + ' = ' + dbl + ', and one number was ' + off + ' bigger → ' + sum,
      steps: [
        step('You know your doubles. Double the smaller one.',
          a + ' + ' + a + ' = ?', dbl,
          { focus: lit('all'), hint: 'Doubles are the facts to keep in your pocket.', why: 'Double ' + a + ' is ' + dbl + '.' }),
        step(b + ' is not ' + a + '. How much bigger is it?',
          b + ' − ' + a + ' = ?', off, { focus: lit(null, 'all'), hint: 'Only a little.' }),
        step('So the real answer is the double, plus that bit.',
          dbl + ' + ' + off + ' = ?', sum, { focus: lit('all', 'all'), why: dbl + ' + ' + off + ' = ' + sum + '.' })
      ],
      board: numberLine(0, nextUp(sum, 10), [jump(0, dbl, 'double ' + a, 0), jump(dbl, sum, '+' + off, 2)])
    });
  }
};

/* ------------------------------------------------------------------ ones --- */
/* The bottom rung. 45 + 3 needs no cleverness at all, and pretending it does
   would be its own kind of confusing. What it does need saying is WHY the tens
   digit is allowed to sit still, and that 45 + 5 is the same move even though
   the answer looks like a bigger jump. */
export const ones = {
  id: 'add.ones', op: 'add', name: 'Just the Ones', move: 'Ones Only',
  blurb: 'Nothing reaches the tens. Add the ones, put them back on the end.',
  levels: 2,
  fits: p => p.b >= 1 && p.b <= 9 && p.a >= 10 && (p.a % 10) + p.b <= 10,
  gen(r, level) {
    const o = ri(r, 1, 8);
    const b = ri(r, 1, 10 - o);
    const a = level <= 1 ? ri(r, 1, 8) * 10 + o : ri(r, 1, 9) * 100 + ri(r, 0, 9) * 10 + o;
    return { a, b };
  },
  build(p) {
    const { a, b } = p, sum = a + b;
    const o = a % 10, tot = o + b, base = a - o;
    const full = tot === 10;
    return chain({
      title: a + ' + ' + b, strategy: this.id, answer: sum,
      recap: base + ' + ' + tot + '  =  ' + sum,
      steps: [
        step('Start where it is easy. Add just the ones.',
          o + ' + ' + b + ' = ?', tot,
          { focus: lit('ones', 'all'),
            hint: 'Look only at the last digit of ' + a + '.',
            why: o + ' + ' + b + ' = ' + tot + '.' }),
        step(full ? 'That made a whole ten, so it does move the tens digit. Add it on.'
                  : 'Now drop that back on the end. The tens never moved.',
          base + ' + ' + tot + ' = ?', sum,
          { focus: lit('head'),
            hint: full ? 'Ten ones is one ten.' : 'The tens digit of ' + a + ' is the tens digit of the answer.',
            why: base + ' + ' + tot + ' = ' + sum + '.' })
      ],
      board: blocks([{ n: a, label: String(a), after: -1 }, { n: b, label: String(b), after: -1 }])
    });
  }
};

export const ADD = [ones, bridge, split, scale, friendly, near];
