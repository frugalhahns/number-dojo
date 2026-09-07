/* The buddy: the animal standing next to the working out.
   It does two jobs. It reacts, which is the fun, and it says the ONE sentence
   that matters at that moment, which is the teaching. The lines are short on
   purpose: a wall of encouragement is a wall of text, and he will stop reading
   it by the third problem. */

import { form, anim, still } from './roster.js';

const CHEER = [
  'Yes!', 'Got it.', 'Nice.', 'That is it.', 'Clean.', 'Sharp.', 'Good one.',
  'Exactly.', 'Boom.', 'Straight through.', 'Told you.', 'Easy for you.'
];
const HOT = [
  'Three in a row!', 'You are on fire.', 'Do not stop now.', 'Unstoppable.',
  'Super effective!', 'Critical hit!'
];
const SOFT = [
  'Not that one. Have another look.', 'Close. Try again.', 'Nearly. One more go.',
  'Hmm. Read the line again.', 'Not yet. You have got this.'
];
const OPEN = [
  'Right, break it down.', 'One piece at a time.', 'Small steps, big number.',
  'You know all the little bits of this.', 'Take it apart and it is easy.'
];
const WON = [
  'Solved it!', 'Whole thing, in pieces.', 'That is how it is done.',
  'You broke it down and beat it.'
];

function pickFrom(list, seed) { return list[Math.abs(seed | 0) % list.length]; }

export function cheer(streak, seed) {
  return streak >= 3 && streak % 3 === 0 ? pickFrom(HOT, seed) : pickFrom(CHEER, seed);
}
export function consol(seed) { return pickFrom(SOFT, seed); }
export function opener(seed) { return pickFrom(OPEN, seed); }
export function winner(seed) { return pickFrom(WON, seed); }

/* The sprite element. Animated GIF, with the still PNG as the fallback so a
   missing or slow file can never leave an empty hole where the buddy was. */
export function sprite(id, stage, cls) {
  const f = form(id, stage);
  const img = document.createElement('img');
  img.className = 'sprite ' + (cls || '');
  img.alt = f.name;
  img.decoding = 'async';
  img.src = anim(f.dex);
  img.addEventListener('error', function once() {
    img.removeEventListener('error', once);
    img.src = still(f.dex);
  });
  return img;
}

/* Reactions are CSS animations, added and then removed on animationend so the
   same one can fire twice in a row. */
export function react(img, kind) {
  if (!img) return;
  ['hop', 'wobble', 'spin', 'grow'].forEach(c => img.classList.remove(c));
  void img.offsetWidth;                       // force a reflow so it replays
  img.classList.add(kind);
  img.addEventListener('animationend', function done() {
    img.removeEventListener('animationend', done);
    img.classList.remove(kind);
  });
}
