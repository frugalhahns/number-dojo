/* Boot. Load the save, wire the keyboard, draw home. */

import { load, S, save } from './state.js';
import { setSound } from './audio.js';
import * as Theme from './theme.js';
import { qs } from './ui.js';
import { home, topbar } from './screens.js';

load();
setSound(S.sound !== false);
/* index.html already resolved the theme before the first paint, but it did so
   from the raw localStorage blob. Re-apply from the loaded save so a slot
   switch or a fresh save lands on the right one, and keep following the machine
   while the setting is auto. */
Theme.apply(S.theme || 'auto');
Theme.watch(() => S.theme || 'auto');

/* A physical keyboard is faster than the pad and he uses one at the desk, so
   digits, backspace and enter all reach the live blank wherever the focus is. */
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const inp = qs('#blank');
  if (!inp) return;
  if (document.activeElement === inp) return;         // it is already handling this
  if (/^[0-9]$/.test(e.key)) {
    inp.value = (inp.value + e.key).slice(0, 7);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    e.preventDefault();
  } else if (e.key === 'Backspace') {
    inp.value = inp.value.slice(0, -1);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    e.preventDefault();
  } else if (e.key === 'Enter') {
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    e.preventDefault();
  }
});

/* Escape closes the sheet, which is the only thing that can be modal. */
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') qs('#sheet').classList.add('hidden');
});

window.addEventListener('pagehide', save);

topbar();
home();

/* Announce readiness the same way the Verdant Isle test pages do, so a headless
   browser can wait for the first paint instead of guessing. */
document.documentElement.dataset.ready = '1';
