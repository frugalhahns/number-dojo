/* Subtraction. Five ways, and they are deliberately not all "take away".
   Two of them treat a subtraction as a GAP between two numbers instead, which
   is the idea that makes 803 − 798 stop being scary. */

import { ri, pick, nextUp, floorTo, step, chain, numberLine, jump, blocks } from '../num.js';

/* --------------------------------------------------------------- countup --- */
/* The gap, walked from the bottom up. For numbers that are close together this
   beats borrowing every time, and it is how change is counted in a shop. */
export const countup = {
  id: 'sub.countup', op: 'sub', name: 'Count Up the Gap', move: 'Gap Leap',
  blurb: 'When the two numbers are close, walk up from the small one and count how far you went.',
  levels: 3,
  gen(r, level) {
    const bo = ri(r, 6, 9);                          // b sits high in its ten
    const gap = ri(r, 11 - bo, 9) + (10 - bo);       // lands b past the next ten
    let b;
    if (level <= 1) b = ri(r, 1, 8) * 10 + bo;
    else if (level === 2) b = ri(r, 1, 8) * 100 + ri(r, 0, 9) * 10 + bo;
    else b = ri(r, 1, 8) * 1000 + ri(r, 0, 9) * 100 + ri(r, 0, 9) * 10 + bo;
    return { a: b + gap, b };
  },
  build(p) {
    const { a, b } = p, diff = a - b;
    const mid = nextUp(b, 10), j1 = mid - b, j2 = a - mid;
    return chain({
      title: a + ' − ' + b, strategy: this.id, answer: diff,
      recap: j1 + ' + ' + j2 + ' = ' + diff + ' steps from ' + b + ' up to ' + a,
      steps: [
        step('Do not take anything away. Stand on ' + b + ' and hop up to the next round ten.',
          b + ' + ? = ' + mid, j1,
          { hint: 'The next ten above ' + b + ' is ' + mid + '.', why: b + ' is ' + j1 + ' below ' + mid + '.' }),
        step('Now hop the rest of the way up to ' + a + '.',
          mid + ' + ? = ' + a, j2,
          { hint: 'Both numbers have the same tens digit now, so only the ones matter.',
            why: 'From ' + mid + ' to ' + a + ' is ' + j2 + '.' }),
        step('Add up how far you hopped. That distance IS the answer.',
          j1 + ' + ' + j2 + ' = ?', diff,
          { hint: 'Subtracting is just measuring the gap between two numbers.',
            why: 'You travelled ' + diff + ', so ' + a + ' − ' + b + ' = ' + diff + '.' })
      ],
      board: numberLine(floorTo(b, 10), nextUp(a, 10),
        [jump(b, mid, '+' + j1, 0), jump(mid, a, '+' + j2, 1)])
    });
  }
};

/* ------------------------------------------------------------------ back --- */
/* Take away in pieces, and make one of the pieces land you on a round ten so
   the hard part happens from a standing start. */
export const back = {
  id: 'sub.back', op: 'sub', name: 'Take It Away in Pieces', move: 'Chip Away',
  blurb: 'Subtract the tens first, then break the ones so you land on a round ten on the way down.',
  levels: 3,
  gen(r, level) {
    const ao = ri(r, 1, 7), bo = ri(r, ao + 1, 8);   // forces the ones to regroup
    if (level <= 1) return { a: ri(r, 3, 9) * 10 + ao, b: bo };
    if (level === 2) return { a: ri(r, 4, 9) * 10 + ao, b: ri(r, 1, 3) * 10 + bo };
    return { a: ri(r, 2, 8) * 100 + ri(r, 1, 9) * 10 + ao, b: ri(r, 1, 8) * 10 + bo };
  },
  build(p) {
    const { a, b } = p, diff = a - b;
    const t = floorTo(b, 10), r0 = b % 10;
    const steps = [];
    let mid = a;
    if (t > 0) {
      mid = a - t;
      steps.push(step('Take the whole tens away first. Nothing tricky about that.',
        a + ' − ' + t + ' = ?', mid,
        { hint: 'Only the tens digit moves. Think ' + Math.floor(a / 10) + ' − ' + (t / 10) + ' tens.',
          why: a + ' − ' + t + ' = ' + mid + '.' }));
    }
    const down = mid % 10, left = r0 - down;
    steps.push(step('Now the ' + r0 + '. Do not do it all at once. Use just enough to land on ' + (mid - down) + '.',
      mid + ' − ? = ' + (mid - down), down,
      { hint: 'The ones digit of ' + mid + ' is exactly how far it is to the round ten below.',
        why: 'Spend ' + down + ' and you are standing on ' + (mid - down) + '.' }));
    steps.push(step('You spent ' + down + ' of the ' + r0 + '. How much is still to come off?',
      r0 + ' − ' + down + ' = ?', left,
      { hint: 'You broke the ' + r0 + ' into two pieces and the first one is already gone.', why: r0 + ' splits into ' + down + ' and ' + left + '.' }));
    steps.push(step('Take that last bit off a round ten. Easy from here.',
      (mid - down) + ' − ' + left + ' = ?', diff,
      { hint: 'Coming down off a round ten, the tens digit drops by one.',
        why: (mid - down) + ' − ' + left + ' = ' + diff + '.' }));
    return chain({
      title: a + ' − ' + b, strategy: this.id, answer: diff,
      recap: a + (t ? ' − ' + t : '') + ' − ' + down + ' − ' + left + '  =  ' + diff,
      steps,
      board: numberLine(floorTo(diff, 10), nextUp(a, 10),
        (t ? [jump(a, mid, '−' + t, 0)] : []).concat([
          jump(mid, mid - down, '−' + down, t ? 1 : 0),
          jump(mid - down, diff, '−' + left, t ? 3 : 2)]))
    });
  }
};

/* ----------------------------------------------------------------- split --- */
/* Expanded form, only offered when no regrouping is needed, so it never teaches
   the "little from big" mistake. */
export const split = {
  id: 'sub.split', op: 'sub', name: 'Split by Place', move: 'Place Split',
  blurb: 'Tens minus tens, ones minus ones. Only safe when the top ones are big enough.',
  levels: 3,
  gen(r, level) {
    const ao = ri(r, 4, 9), bo = ri(r, 1, ao);       // no regroup, by construction
    if (level <= 1) return { a: ri(r, 3, 9) * 10 + ao, b: ri(r, 1, 2) * 10 + bo };
    if (level === 2) return { a: ri(r, 5, 9) * 10 + ao, b: ri(r, 1, 4) * 10 + bo };
    const at = ri(r, 3, 9), bt = ri(r, 1, at);
    return { a: ri(r, 4, 9) * 100 + at * 10 + ao, b: ri(r, 1, 3) * 100 + bt * 10 + bo };
  },
  build(p) {
    const { a, b } = p, diff = a - b;
    const ao = a % 10, bo = b % 10, ones = ao - bo;
    const steps = [];
    let parts;
    if (a >= 100) {
      const ah = floorTo(a, 100), bh = floorTo(b, 100), hun = ah - bh;
      const at = a % 100 - ao, bt = b % 100 - bo, tens = at - bt;
      steps.push(step('Hundreds take hundreds.', ah + ' − ' + bh + ' = ?', hun, {}));
      steps.push(step('Tens take tens.', at + ' − ' + bt + ' = ?', tens, {}));
      steps.push(step('Ones take ones.', ao + ' − ' + bo + ' = ?', ones, {}));
      steps.push(step('Add the three leftovers back together.', hun + ' + ' + tens + ' + ' + ones + ' = ?', diff, {}));
      parts = hun + ' + ' + tens + ' + ' + ones;
    } else {
      const at = a - ao, bt = b - bo, tens = at - bt;
      steps.push(step('Take the tens off the tens.', at + ' − ' + bt + ' = ?', tens,
        { hint: 'Think ' + (at / 10) + ' − ' + (bt / 10) + ' tens.' }));
      steps.push(step('Take the ones off the ones. Check first: is ' + ao + ' big enough to lose ' + bo + '?',
        ao + ' − ' + bo + ' = ?', ones,
        { hint: 'Yes. That is the only reason this method is allowed here.', why: ao + ' − ' + bo + ' = ' + ones + '.' }));
      steps.push(step('Put the two leftovers together.', tens + ' + ' + ones + ' = ?', diff, {}));
      parts = tens + ' + ' + ones;
    }
    return chain({
      title: a + ' − ' + b, strategy: this.id, answer: diff,
      recap: parts + '  =  ' + diff, steps,
      board: blocks([{ n: a, label: String(a) + ', take away ' + b, after: -1 }])
    });
  }
};

/* ----------------------------------------------------------------- shift --- */
/* Constant difference. Slide BOTH numbers and the gap does not move, so you can
   always slide the awkward one until it is round. This is the big idea. */
export const shift = {
  id: 'sub.shift', op: 'sub', name: 'Slide Them Both', move: 'Mirror Shift',
  blurb: 'Push both numbers up by the same amount. The gap between them never changes, so make the bottom one round.',
  levels: 3,
  gen(r, level) {
    const bo = ri(r, 6, 9);
    if (level <= 1) return { a: ri(r, 5, 9) * 10 + ri(r, 0, 9), b: ri(r, 1, 3) * 10 + bo };
    if (level === 2) return { a: ri(r, 6, 9) * 10 + ri(r, 0, 9), b: ri(r, 2, 5) * 10 + bo };
    return { a: ri(r, 3, 8) * 100 + ri(r, 0, 9) * 10 + ri(r, 0, 9), b: ri(r, 1, 2) * 100 + ri(r, 0, 8) * 10 + bo };
  },
  build(p) {
    const { a, b } = p, diff = a - b;
    const bUp = nextUp(b, 10), slide = bUp - b, aUp = a + slide;
    return chain({
      title: a + ' − ' + b, strategy: this.id, answer: diff,
      recap: a + ' − ' + b + '  is the same gap as  ' + aUp + ' − ' + bUp + '  =  ' + diff,
      steps: [
        step(b + ' would be much nicer as ' + bUp + '. How much does it need?',
          b + ' + ? = ' + bUp, slide,
          { hint: 'Only the ones digit stops it being round.', why: b + ' + ' + slide + ' = ' + bUp + '.' }),
        step('Here is the trick: slide the OTHER number up by the same ' + slide + '. The gap between them cannot change if they both move together.',
          a + ' + ' + slide + ' = ?', aUp,
          { hint: 'Two runners both take ' + slide + ' steps forward. Are they any further apart?',
            why: a + ' + ' + slide + ' = ' + aUp + ', and it is still the same gap.' }),
        step('Same gap, much friendlier numbers.',
          aUp + ' − ' + bUp + ' = ?', diff,
          { hint: 'Taking away a round number only touches the tens digit.',
            why: aUp + ' − ' + bUp + ' = ' + diff + ', so ' + a + ' − ' + b + ' = ' + diff + ' too.' })
      ],
      board: numberLine(floorTo(b, 10), nextUp(a + slide, 10),
        [jump(b, bUp, '+' + slide, 0), jump(a, aUp, '+' + slide, 1)])
    });
  }
};

/* ----------------------------------------------------------------- scale --- */
/* His example, running backwards: 634 − 70 is 63 − 7 with a 4 in your pocket. */
export const scale = {
  id: 'sub.scale', op: 'sub', name: 'Work in Tens', move: 'Zoom Out',
  blurb: 'Nothing is coming off the ones, so pocket them and subtract the tens like small numbers.',
  levels: 3,
  gen(r, level) {
    if (level <= 1) {
      const t = ri(r, 5, 9), u = ri(r, 1, t - 1);
      return { a: ri(r, 1, 8) * 100 + t * 10 + ri(r, 1, 9), b: u * 10, place: 10 };
    }
    if (level === 2) {
      const tens = ri(r, 2, 8) * 10 + ri(r, 1, 4);   // ones of the tens-count force a regroup
      const u = ri(r, (tens % 10) + 1, 9);
      return { a: tens * 10 + ri(r, 1, 9), b: u * 10, place: 10 };
    }
    const huns = ri(r, 2, 8) * 10 + ri(r, 1, 4);
    const u = ri(r, (huns % 10) + 1, 9);
    return { a: huns * 100 + ri(r, 0, 9) * 10 + ri(r, 1, 9), b: u * 100, place: 100 };
  },
  build(p) {
    const { a, b, place } = p, diff = a - b;
    const kept = a % place, big = (a - kept) / place, take = b / place, core = big - take;
    const unit = place === 10 ? 'tens' : 'hundreds';
    const keptName = place === 10 ? 'ones digit' : 'last two digits';
    return chain({
      title: a + ' − ' + b, strategy: this.id, answer: diff,
      recap: big + ' − ' + take + ' = ' + core + ', so ' + a + ' − ' + b + ' = ' + diff,
      steps: [
        step('Nothing is coming off the ones. What part of ' + a + ' is safe to pocket? (its ' + keptName + ')',
          a + ' − ' + b + ' → keep ?', kept,
          { hint: b + ' has a zero there, so nothing can happen to it.', why: 'Pocket the ' + kept + '.' }),
        step('Count in ' + unit + '. ' + a + ' holds ' + big + ' ' + unit + ' and ' + take + ' of them are leaving.',
          big + ' − ' + take + ' = ?', core,
          { hint: 'A small subtraction you can already do. Tap "break it down" for help.',
            why: big + ' − ' + take + ' = ' + core + ' ' + unit + '.',
            unit: unit,
            /* Same guard as add.scale: only nest when the small subtraction
               actually needs regrouping. `back` is the right sub-strategy here
               because its whole job is the regroup, and its precondition is
               exactly the one being tested. */
            more: take <= 9 && (big % 10) < take ? back.build({ a: big, b: take }) : null }),
        step(core + ' ' + unit + ' is ' + (core * place) + '. Bring the ' + kept + ' back.',
          (core * place) + ' + ' + kept + ' = ?', diff,
          { why: (core * place) + ' + ' + kept + ' = ' + diff + '.' })
      ],
      board: numberLine(floorTo(diff, place) - place, nextUp(a, place),
        [jump(a - kept, a - kept - b, '−' + b, 1)])
    });
  }
};

export const SUB = [countup, back, split, shift, scale];
