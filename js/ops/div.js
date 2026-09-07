/* Division. The hardest of the four to make friendly, so every strategy here
   refuses to be "long division". They are all the same move: keep taking
   friendly chunks out until nothing useful is left, then count the chunks. */

import { lit, divPlace, ri, pick, step, chain, area, groups, numberLine, jump } from '../num.js';

/* ------------------------------------------------------------------ flip --- */
/* Division IS a missing-factor question, and saying so out loud is the single
   most useful thing you can tell a third grader about it. */
export const flip = {
  id: 'div.flip', op: 'div', name: 'Flip It to Times', move: 'Reverse Card',
  blurb: 'A divide question is a times question with a hole in it. Fill the hole.',
  levels: 3,
  fits: p => p.n % p.d === 0 && p.n / p.d >= 2 && p.n / p.d <= 9 && p.d >= 2,
  gen(r, level) {
    if (level <= 1) { const d = ri(r, 2, 9), q = ri(r, 2, 5); return { n: d * q, d }; }
    if (level === 2) { const d = ri(r, 3, 9), q = ri(r, 6, 9); return { n: d * q, d }; }
    const d = ri(r, 11, 15), q = ri(r, 3, 8); return { n: d * q, d };
  },
  build(p) {
    const { n, d } = p, q = n / d;
    if (q <= 5) {
      return chain({
        title: n + ' ÷ ' + d, strategy: this.id, answer: q,
        recap: d + ' × ' + q + ' = ' + n + ', so ' + n + ' ÷ ' + d + ' = ' + q,
        steps: [
          step('Do not divide. Ask a times question instead: how many ' + d + 's make ' + n + '?',
            d + ' × ? = ' + n, q,
            { focus: lit('all', 'all'), hint: 'Count up in steps of that size and keep track on your fingers.',
              why: d + ' × ' + q + ' = ' + n + '.' }),
          step('That is it. The missing factor IS the answer.',
            n + ' ÷ ' + d + ' = ?', q,
            { focus: lit('all', 'all'), why: 'Dividing by ' + d + ' asks how many ' + d + 's fit. ' + q + ' of them fit.' })
        ],
        board: groups(n, d, 0)
      });
    }
    const easy = d * 5, left = n - easy, more = q - 5;
    return chain({
      title: n + ' ÷ ' + d, strategy: this.id, answer: q,
      recap: '5 ' + d + 's is ' + easy + ', then ' + more + ' more → ' + q,
      steps: [
        step('Turn it into a times question: how many ' + d + 's make ' + n + '? Start with five of them.',
          d + ' × 5 = ?', easy,
          { focus: lit(null, 'all'), hint: 'Half of ' + d + ' × 10, which is ' + (d * 10) + '.', why: 'Five ' + d + 's make ' + easy + '.' }),
        step('You are not at ' + n + ' yet. How much short are you?',
          n + ' − ' + easy + ' = ?', left,
          { focus: lit('all'), hint: 'A small gap.', why: n + ' − ' + easy + ' = ' + left + ' still to cover.' }),
        step('How many more ' + d + 's is that ' + left + '?',
          left + ' ÷ ' + d + ' = ?', more,
          { focus: lit(null, 'all'), hint: 'A small one. How many whole groups of that size fit into what is left?', why: left + ' is ' + more + ' more ' + d + '' + (more > 1 ? 's' : '') + '.' }),
        step('Five, plus the extras.', '5 + ' + more + ' = ?', q,
          { focus: lit('all', 'all'), why: 'Altogether ' + q + ' ' + d + 's make ' + n + ', so ' + n + ' ÷ ' + d + ' = ' + q + '.' })
      ],
      board: area(d, [{ w: 5, label: d + '×5 = ' + easy, after: 0 }, { w: more, label: d + '×' + more + ' = ' + left, after: 2 }], String(d))
    });
  }
};

/* ---------------------------------------------------------------- chunks --- */
/* Partial quotients. A chunk of ten is always free, so take it first and the
   answer is over ten before you have done any thinking. */
export const chunks = {
  id: 'div.chunks', op: 'div', name: 'Chunk Out a Ten', move: 'Chunk Blast',
  blurb: 'Ten of anything is easy to work out. Take ten groups out first, then share whatever is left.',
  levels: 3,
  fits: p => p.n % p.d === 0 && p.n / p.d >= 11 && p.n / p.d <= 29 && p.d >= 2,
  gen(r, level) {
    if (level <= 1) { const d = ri(r, 2, 5), q = ri(r, 11, 15); return { n: d * q, d }; }
    if (level === 2) { const d = ri(r, 6, 9), q = ri(r, 11, 19); return { n: d * q, d }; }
    const d = ri(r, 3, 9), q = ri(r, 21, 29); return { n: d * q, d };
  },
  build(p) {
    const { n, d } = p, q = n / d;
    const bigChunk = q >= 20 ? 20 : 10;
    const taken = d * bigChunk, left = n - taken, more = q - bigChunk;
    const steps = [step('How much is ten groups of ' + d + '?',
      d + ' × 10 = ?', d * 10,
      { focus: lit(null, 'all'), hint: 'Times ten just adds a zero.', why: 'Ten ' + d + 's is ' + (d * 10) + '.' })];
    if (bigChunk === 20) {
      steps.push(step('Ten was not enough to reach ' + n + '. Double it: twenty groups.',
        (d * 10) + ' + ' + (d * 10) + ' = ?', taken,
        { focus: lit(null, 'all'), hint: 'Just double ' + (d * 10) + '.', why: 'Twenty ' + d + 's is ' + taken + '.' }));
    }
    steps.push(step('Take that chunk out of ' + n + '. What is left to share?',
      n + ' − ' + taken + ' = ?', left,
      { focus: lit('all'), hint: 'Only this bit is left over.', why: n + ' − ' + taken + ' = ' + left + '.' }));
    steps.push(step('Share the leftover ' + left + '.', left + ' ÷ ' + d + ' = ?', more,
      { focus: lit(null, 'all'), hint: 'Flip it round: how many whole groups of that size fit in?', why: left + ' ÷ ' + d + ' = ' + more + '.' }));
    steps.push(step('Add your chunks: ' + bigChunk + ' groups and then ' + more + ' more.',
      bigChunk + ' + ' + more + ' = ?', q,
      { focus: lit('all', 'all'), why: bigChunk + ' + ' + more + ' = ' + q + ', so ' + n + ' ÷ ' + d + ' = ' + q + '.' }));
    return chain({
      title: n + ' ÷ ' + d, strategy: this.id, answer: q,
      recap: bigChunk + ' + ' + more + ' = ' + q + ' groups of ' + d, steps,
      board: area(d, [{ w: bigChunk, label: d + '×' + bigChunk + ' = ' + taken, after: bigChunk === 20 ? 1 : 0 },
                      { w: more, label: d + '×' + more + ' = ' + left, after: bigChunk === 20 ? 3 : 2 }], String(d))
    });
  }
};

/* ----------------------------------------------------------------- halve --- */
/* Dividing by four is halving twice, and halving is the one division his hands
   already know how to do. */
export const halve = {
  id: 'div.halve', op: 'div', name: 'Halve and Halve', move: 'Split Split',
  blurb: 'Dividing by 4 is halving twice. Dividing by 8 is halving three times.',
  levels: 3,
  fits: p => [4, 8].indexOf(p.d) >= 0 && p.n % p.d === 0 && p.n / p.d >= 2,
  gen(r, level) {
    if (level <= 1) return { n: ri(r, 4, 24) * 4, d: 4 };
    if (level === 2) return { n: ri(r, 3, 20) * 8, d: 8 };
    return { n: ri(r, 26, 60) * 4, d: 4 };
  },
  build(p) {
    const { n, d } = p, q = n / d;
    const times = d === 4 ? 2 : 3;
    const steps = [];
    let v = n;
    for (let i = 0; i < times; i++) {
      const nv = v / 2;
      steps.push(step(i === 0 ? 'Dividing by ' + d + ' means halving ' + times + ' times. Half of ' + v + '?'
                              : 'Halve it again.',
        'half of ' + v + ' = ?', nv,
        { focus: lit('all'), hint: 'Half the tens, half the ones: half of ' + (Math.floor(v / 10) * 10) + ' and half of ' + (v % 10) + '.',
          why: 'Half of ' + v + ' is ' + nv + '.' }));
      v = nv;
    }
    return chain({
      title: n + ' ÷ ' + d, strategy: this.id, answer: q,
      recap: n + ' halved ' + times + ' times is ' + q, steps,
      board: numberLine(0, n, (function () {
        const js = []; let at = n;
        for (let i = 0; i < times; i++) { js.push(jump(0, at / 2, 'half of ' + at, i)); at /= 2; }
        return [jump(0, n, String(n), -1)].concat(js);
      })())
    });
  }
};

/* ----------------------------------------------------------------- scale --- */
/* The mirror of his own example, in division. 240 ÷ 6 is 24 ÷ 6 wearing a zero. */
export const scale = {
  id: 'div.scale', op: 'div', name: 'Work in Tens', move: 'Zoom Out',
  blurb: 'Ignore the zero, do the small fact, then put the zero back.',
  levels: 3,
  fits: p => divPlace(p.n, p.d) > 0,
  gen(r, level) {
    if (level <= 1) { const d = ri(r, 2, 9), q = ri(r, 2, 9); return { n: d * q * 10, d, place: 10 }; }
    if (level === 2) { const d = ri(r, 3, 9), q = ri(r, 11, 19); return { n: d * q * 10, d, place: 10 }; }
    const d = ri(r, 2, 9), q = ri(r, 2, 9); return { n: d * q * 100, d, place: 100 };
  },
  build(p) {
    const { n, d } = p, place = p.place || divPlace(n, d), q = n / d;
    const unit = place === 10 ? 'tens' : 'hundreds';
    const small = n / place, sq = small / d;
    return chain({
      title: n + ' ÷ ' + d, strategy: this.id, answer: q,
      recap: small + ' ÷ ' + d + ' = ' + sq + ', so ' + n + ' ÷ ' + d + ' = ' + q,
      steps: [
        step(n + ' is ' + small + ' ' + unit + '. Share the ' + unit + ' instead. Much smaller numbers.',
          small + ' ÷ ' + d + ' = ?', sq,
          { focus: lit(place === 10 ? 'head' : 'head2'), hint: 'Flip it round: how many whole groups of that size fit in?', why: small + ' ÷ ' + d + ' = ' + sq + '.',
            more: sq > 10 ? chunks.build({ n: small, d }) : null }),
        step('Each share is ' + sq + ' ' + unit + '. Say that as an ordinary number.',
          sq + ' ' + unit + ' = ?', q,
          { focus: lit(place === 10 ? 'tail' : 'tail2'), hint: place === 10 ? 'Stick the zero back on the end.' : 'Stick both zeros back on.',
            why: sq + ' ' + unit + ' is ' + q + ', so ' + n + ' ÷ ' + d + ' = ' + q + '.' })
      ],
      board: area(d, [{ w: 10, label: n + ' shared ' + d + ' ways', after: -1 }], String(d))
    });
  }
};

/* ------------------------------------------------------------- leftover ---- */
/* Remainders, met as "the bit that will not fit in a group" rather than as an
   r written after the answer. The final answer he types is the group count. */
export const leftover = {
  id: 'div.leftover', op: 'div', name: 'Share and What Is Left', move: 'Crumb Catch',
  blurb: 'Sometimes it does not share out evenly. Fill as many whole groups as you can and see what is left over.',
  levels: 3,
  fits: p => p.n % p.d !== 0 && p.d >= 2 && Math.floor(p.n / p.d) >= 2,
  gen(r, level) {
    if (level <= 1) { const d = ri(r, 2, 5), q = ri(r, 3, 8); return { n: d * q + ri(r, 1, d - 1), d }; }
    if (level === 2) { const d = ri(r, 4, 9), q = ri(r, 4, 9); return { n: d * q + ri(r, 1, d - 1), d }; }
    const d = ri(r, 3, 9), q = ri(r, 11, 19); return { n: d * q + ri(r, 1, d - 1), d };
  },
  build(p) {
    const { n, d } = p, q = Math.floor(n / d), rem = n % d, fits = d * q;
    return chain({
      title: n + ' ÷ ' + d, strategy: this.id, answer: q,
      answerText: n + ' ÷ ' + d + ' = ' + q + ' groups, ' + rem + ' left over',
      recap: q + ' whole groups of ' + d + ' (' + fits + '), with ' + rem + ' left over',
      steps: [
        step('Count up in ' + d + 's and stop just before you pass ' + n + '. Where do you land?',
          'the biggest ' + d + '-step under ' + n + ' = ?', fits,
          { focus: lit(null, 'all'), hint: 'Start at five groups and count up or down from there.',
            why: fits + ' is a whole number of ' + d + 's and the next one would overshoot ' + n + '.' }),
        step('How many ' + d + 's is ' + fits + '?', fits + ' ÷ ' + d + ' = ?', q,
          { focus: lit(null, 'all'), hint: 'How many times did you count as you went up?', why: fits + ' is ' + q + ' groups of ' + d + '.' }),
        step('And the bit that will not fit in a group?', n + ' − ' + fits + ' = ?', rem,
          { focus: lit('all'), hint: 'It has to be smaller than ' + d + ', or another whole group would fit.',
            why: rem + ' is left over. It is always smaller than ' + d + '.' }),
        step('So how many full groups did you fill?', n + ' ÷ ' + d + ' = ? groups', q,
          { focus: lit('all', 'all'), why: q + ' full groups, and ' + rem + ' left over.' })
      ],
      board: groups(n, d, 0)
    });
  }
};

export const DIV = [flip, chunks, halve, scale, leftover];
