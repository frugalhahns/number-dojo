/* The team.
   Forty-eight Generation V sprites are vendored in sprites/, one still PNG and
   one animated GIF each, keyed by dex number. They came from the PokeAPI/sprites
   repository by way of the Verdant Isle game, so this page works with no network
   and the animals are the same ones he already knows.

   A LINE is an evolution chain: the forms in order, cheapest first. A buddy is
   referred to by its line id everywhere in the save file, never by dex number,
   so evolving is a change of one integer (the stage) and never loses progress. */

export const LINES = [
  { id: 'chikorita', type: 'grass',    forms: [[152, 'Chikorita'], [153, 'Bayleef'], [154, 'Meganium']] },
  { id: 'wooper',    type: 'water',    forms: [[194, 'Wooper'], [195, 'Quagsire']] },
  { id: 'pikachu',   type: 'electric', forms: [[25, 'Pikachu'], [26, 'Raichu']] },
  { id: 'geodude',   type: 'rock',     forms: [[74, 'Geodude'], [75, 'Graveler'], [76, 'Golem']] },

  { id: 'bulbasaur', type: 'grass',    forms: [[1, 'Bulbasaur'], [2, 'Ivysaur'], [3, 'Venusaur']] },
  { id: 'oddish',    type: 'grass',    forms: [[43, 'Oddish'], [44, 'Gloom'], [45, 'Vileplume']] },
  { id: 'pidgey',    type: 'flying',   forms: [[16, 'Pidgey'], [17, 'Pidgeotto'], [18, 'Pidgeot']] },
  { id: 'hoothoot',  type: 'flying',   forms: [[163, 'Hoothoot'], [164, 'Noctowl']] },
  { id: 'mareep',    type: 'electric', forms: [[179, 'Mareep'], [180, 'Flaaffy'], [181, 'Ampharos']] },
  { id: 'chinchou',  type: 'electric', forms: [[170, 'Chinchou'], [171, 'Lanturn']] },
  { id: 'diglett',   type: 'ground',   forms: [[50, 'Diglett'], [51, 'Dugtrio']] },
  { id: 'machop',    type: 'fighting', forms: [[66, 'Machop'], [67, 'Machoke'], [68, 'Machamp']] },
  { id: 'psyduck',   type: 'water',    forms: [[54, 'Psyduck'], [55, 'Golduck']] },
  { id: 'krabby',    type: 'water',    forms: [[98, 'Krabby'], [99, 'Kingler']] },
  { id: 'horsea',    type: 'water',    forms: [[116, 'Horsea'], [117, 'Seadra'], [230, 'Kingdra']] },
  { id: 'staryu',    type: 'water',    forms: [[120, 'Staryu'], [121, 'Starmie']] },
  { id: 'marill',    type: 'water',    forms: [[183, 'Marill'], [184, 'Azumarill']] },
  { id: 'magikarp',  type: 'water',    forms: [[129, 'Magikarp'], [130, 'Gyarados']] },
  { id: 'corsola',   type: 'water',    forms: [[222, 'Corsola']] },
  { id: 'lapras',    type: 'water',    forms: [[131, 'Lapras']] },
  { id: 'ditto',     type: 'normal',   forms: [[132, 'Ditto']] },
  { id: 'snorlax',   type: 'normal',   forms: [[143, 'Snorlax']] }
];

export const BY_ID = {};
for (const l of LINES) BY_ID[l.id] = l;

/* The four you can start with, one per gym, so whichever gym he opens first has
   a themed buddy sitting in it. */
export const STARTERS = ['chikorita', 'wooper', 'pikachu', 'geodude'];

/* Evolving costs levels, not items. Stage 1 at level 5, stage 2 at level 12:
   slow enough that it is an event, fast enough that a single sitting can reach
   the first one. */
export const EVOLVE_AT = [0, 5, 12];

export function form(id, stage) {
  const line = BY_ID[id];
  if (!line) return null;
  const i = Math.max(0, Math.min(stage | 0, line.forms.length - 1));
  const [dex, name] = line.forms[i];
  return { id, dex, name, stage: i, type: line.type, last: i === line.forms.length - 1 };
}

/* The stage a level entitles you to, capped by how long the line actually is. */
export function stageForLevel(id, level) {
  const line = BY_ID[id];
  if (!line) return 0;
  let s = 0;
  for (let i = 1; i < EVOLVE_AT.length && i < line.forms.length; i++) {
    if (level >= EVOLVE_AT[i]) s = i;
  }
  return s;
}

export function anim(dex) { return 'sprites/anim/' + dex + '.gif'; }
export function still(dex) { return 'sprites/still/' + dex + '.png'; }

/* Every dex number that has files on disk. selftest.html checks the roster
   never names one that is missing. */
export const ALL_DEX = LINES.flatMap(l => l.forms.map(f => f[0]));
