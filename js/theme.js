/* Light and dark.
   index.html resolves the theme before the first paint so light mode never
   flashes dark. This module is what changes it afterwards, live, with no
   reload: the stylesheet is entirely driven by html[data-theme], so flipping
   one attribute is the whole job.

   Three settings, not two. `auto` follows the machine, which is what a kid on a
   school Chromebook with a scheduled night mode actually wants, and the two
   explicit settings are for when he wants to overrule it. */

const KEY_LIGHT = '#f2f5fa';
const KEY_DARK = '#101826';

export const THEMES = ['auto', 'light', 'dark'];

function prefersLight() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
}

/* What `pref` actually resolves to right now. */
export function resolved(pref) {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return prefersLight() ? 'light' : 'dark';
}

export function apply(pref) {
  const mode = resolved(pref);
  document.documentElement.dataset.theme = mode;
  const bar = document.querySelector('meta[name="theme-color"]');
  if (bar) bar.setAttribute('content', mode === 'light' ? KEY_LIGHT : KEY_DARK);
  return mode;
}

/* The next setting a single button should move to. Tapping cycles through all
   three rather than flipping between two, so `auto` is reachable without
   digging into a settings page, and the button always says which one it is on. */
export function next(pref) {
  const i = THEMES.indexOf(pref);
  return THEMES[(i < 0 ? 0 : i + 1) % THEMES.length];
}

export const LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' };
export const ICON = { auto: '◐', light: '☀', dark: '☾' };

/* Follow the machine while the setting is `auto`. Without this, a Chromebook
   that switches itself to night mode at seven leaves the page in day mode until
   it is reloaded. */
export function watch(getPref) {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => { if (getPref() === 'auto') apply('auto'); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}
