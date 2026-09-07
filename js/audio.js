/* Sound. A small WebAudio synth, so there is nothing to download and nothing
   to wait for. Every effect is short and none of them are punishing: getting it
   wrong makes a soft low blip, not a buzzer, because a buzzer is the sound of
   being told off and he will turn the sound off to avoid it. */

let ctx = null, bus = null, on = true;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { ctx = new C(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function out() {
  const c = ac(); if (!c) return null;
  if (!bus) { bus = c.createGain(); bus.gain.value = 0.5; bus.connect(c.destination); }
  return bus;
}

export function setSound(v) { on = !!v; }
export function soundOn() { return on; }

function tone(freq, at, len, type, peak) {
  const c = ac(), o = out(); if (!c || !o) return;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, c.currentTime + at);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(peak || 0.3, c.currentTime + at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + len);
  osc.connect(g); g.connect(o);
  osc.start(c.currentTime + at);
  osc.stop(c.currentTime + at + len + 0.02);
}

function slide(f1, f2, at, len, type, peak) {
  const c = ac(), o = out(); if (!c || !o) return;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = type || 'triangle';
  osc.frequency.setValueAtTime(f1, c.currentTime + at);
  osc.frequency.exponentialRampToValueAtTime(f2, c.currentTime + at + len);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(peak || 0.25, c.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + len);
  osc.connect(g); g.connect(o);
  osc.start(c.currentTime + at); osc.stop(c.currentTime + at + len + 0.02);
}

const NOTES = { C: 523.25, D: 587.33, E: 659.25, G: 783.99, A: 880, C2: 1046.5, E2: 1318.5, G2: 1568 };

export const sfx = {
  /* A step landed. Rises with the streak, so a run of them sounds like a run. */
  step(streak) {
    if (!on) return;
    const ladder = [NOTES.C, NOTES.D, NOTES.E, NOTES.G, NOTES.A, NOTES.C2, NOTES.E2, NOTES.G2];
    tone(ladder[Math.min(ladder.length - 1, Math.max(0, streak))], 0, 0.14, 'triangle', 0.28);
  },
  /* Not yet. Low, soft, over quickly. */
  miss() { if (!on) return; tone(196, 0, 0.11, 'sine', 0.16); tone(174.6, 0.06, 0.13, 'sine', 0.13); },
  /* Whole problem solved. */
  solved() {
    if (!on) return;
    [NOTES.C, NOTES.E, NOTES.G, NOTES.C2].forEach((f, i) => tone(f, i * 0.075, 0.22, 'triangle', 0.3));
  },
  /* Solved with no misses at all. Adds a shimmer on top. */
  perfect() {
    if (!on) return;
    [NOTES.C, NOTES.E, NOTES.G, NOTES.C2, NOTES.E2].forEach((f, i) => tone(f, i * 0.065, 0.26, 'triangle', 0.3));
    tone(NOTES.G2, 0.34, 0.5, 'sine', 0.14);
  },
  /* A new animal joins the team. */
  caught() {
    if (!on) return;
    slide(300, 900, 0, 0.28, 'triangle', 0.24);
    [NOTES.E, NOTES.G, NOTES.C2].forEach((f, i) => tone(f, 0.3 + i * 0.09, 0.3, 'triangle', 0.3));
  },
  /* Buddy levels up. */
  levelup() {
    if (!on) return;
    [NOTES.G, NOTES.C2, NOTES.E2, NOTES.G2].forEach((f, i) => tone(f, i * 0.08, 0.3, 'square', 0.14));
  },
  /* Evolution. The only long sound in the game. */
  evolve() {
    if (!on) return;
    slide(200, 1200, 0, 0.9, 'sawtooth', 0.1);
    [NOTES.C, NOTES.E, NOTES.G, NOTES.C2, NOTES.G2].forEach((f, i) => tone(f, 0.95 + i * 0.11, 0.45, 'triangle', 0.3));
  },
  /* Badge. */
  badge() {
    if (!on) return;
    [NOTES.C2, NOTES.G, NOTES.C2, NOTES.E2].forEach((f, i) => tone(f, i * 0.11, 0.32, 'square', 0.15));
  },
  tap() { if (!on) return; tone(660, 0, 0.05, 'sine', 0.12); },
  page() { if (!on) return; slide(420, 620, 0, 0.1, 'sine', 0.14); }
};
