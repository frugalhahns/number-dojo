# Number Dojo

**Live: https://frugalhahns.github.io/number-dojo/**

A third grader does not need to be told what 564 + 70 is. He needs to be shown
that it is 56 + 7 with a 4 in his pocket.

That is the whole site. Twenty ways to take an arithmetic problem apart, met one
blank at a time, with a Pokemon standing next to the working out reacting to
every step. Vanilla JavaScript, no build step, no network, no accounts.

```
564 + 70
  the 4 is not going anywhere            → pocket it
  count in tens: 56 + 7                  → 63
    56 needs 4 to reach 60               → 4
    that leaves 3 of the 7               → 3
    60 + 3                               → 63
  63 tens is 630, put the 4 back         → 634
```

Every line above is a blank he fills in himself. The indented three are a nested
chain: any step he cannot do is just a smaller problem, opened in place by
tapping **break this step down**, and it hands the answer back to the step it
came from when it finishes. That recursion is the actual idea being taught.

---

## The four gyms

| Gym | Operation | Starter | The idea it sells |
|---|---|---|---|
| Sprout | Adding | Chikorita | Adding is moving forward. Move in whatever chunks you like. |
| Tide | Subtracting | Wooper | Subtracting is the **gap** between two numbers, not a takeaway. |
| Spark | Multiplying | Pikachu | A times fact is a **rectangle**. Cut it up and add the pieces. |
| Stone | Dividing | Geodude | Dividing is asking how many groups fit. Take big chunks first. |

## The twenty moves

Five per gym, each with three difficulty levels.

**Adding** · Bridge to Ten (`56 + 7 → 56 + 4 + 3`) · Split by Place
(`46 + 37 → 70 + 13`) · Work in Tens (`564 + 70 → 56 + 7`) · Round and Give Back
(`58 + 27 → 60 + 27 − 2`) · Nearly a Double (`7 + 8 → 7 + 7 + 1`)

**Subtracting** · Count Up the Gap (`73 − 68 → 2 + 3`) · Take It Away in Pieces
(`73 − 28 → −20 −3 −5`) · Split by Place (`86 − 34 → 50 + 2`) · Slide Them Both
(`73 − 28 → 75 − 30`) · Work in Tens (`634 − 70 → 63 − 7`)

**Multiplying** · Anchor on Five (`7 × 8 → 35 + 21`) · Ten Then Trim
(`6 × 9 → 60 − 6`) · Split the Big One (`4 × 23 → 80 + 12`) · Double, Double
(`4 × 16 → 16, 32, 64`) · Halve and Double (`5 × 14 → 10 × 7`)

**Dividing** · Flip It to Times (`56 ÷ 7 → 7 × ? = 56`) · Chunk Out a Ten
(`114 ÷ 6 → 10 groups, then 9`) · Halve and Halve (`48 ÷ 4 → 24 → 12`) ·
Work in Tens (`240 ÷ 6 → 24 ÷ 6`) · Share and What Is Left (`38 ÷ 5 → 7 r 3`)

Two of them, **Slide Them Both** and **Halve and Double**, are the same idea in
different clothes: you may change both numbers as long as you keep the thing
that matters fixed. They are the ones worth watching him get.

## How the teaching is arranged

- **One blank is live.** Everything above it is his own finished working;
  everything below it is not on screen at all. A step he cannot see is a step he
  cannot panic about.
- **A miss costs nothing.** First miss gets a hint that does not contain the
  answer, which `selftest.js` checks by regex on every hint of every generated
  problem. Second miss gives the answer and the reason, and he still has to type
  it, because typing it is what puts it in his hands.
- **The picture fills in as he works.** Every board part carries the index of
  the step that reveals it, so the number line or the rectangle is a record of
  his own thinking rather than a diagram he was handed.
- **Difficulty only ever goes up.** Three problems in a row with no misses moves
  a move up a level, and nothing moves it back down. A bad five minutes cannot
  undo a good week.
- **He can always skip the steps.** *I can do this in my head* collapses the
  whole chain to one blank worth double. Getting good at this means needing
  fewer steps, so the app has to let him prove it and pay him for it. Getting it
  wrong just opens the steps back up with nothing taken away.

## The reward loop

Correct steps earn XP, the buddy levels, and it evolves at level 5 and level 12.
A run is five problems; finish one with three or more clean problems and a wild
animal of the gym's own type joins the team. Six runs in a gym earns its badge.
Twenty-two lines, forty-eight forms, all of them collectable.

Three player slots, so a brother can have his own team.

---

## Running it

There is no build step. Any static server:

```sh
python3 -m http.server 8791
open http://localhost:8791/
```

GitHub Pages serves the repository root, hence the `.nojekyll`.

## The test pages

There is no node test runner. All three suites are browser pages, which is what
lets them test the real thing rather than a mock of it. Each sets
`document.documentElement.dataset.done = '1'` when it has genuinely finished, so
a headless run can wait for the answer instead of guessing.

| Page | What it holds down |
|---|---|
| `selftest.html` | Content. ~950,000 checks. Builds every strategy at every level 500 times over and proves each chain lands on the right answer, that no step goes negative or fractional, that every line has exactly one blank, that no hint contains its own answer, that nested chains answer the question their parent asked, that boards render at every point without throwing and never draw off their own axis, that each level can make at least 14 different problems, that every sprite file exists, that the `localStorage` key in `index.html` has not drifted from `js/state.js`, and that nothing anywhere uses an em dash. |
| `flowtest.html` | Playability. Fetches `index.html`, injects its real body, and then clicks the real buttons: picks a starter, plays a five problem run in all four gyms through the on-screen keypad, gets one wrong twice on purpose and checks the first miss withholds the answer and the second gives it, opens a nested chain and checks it comes back out into the step it left, wins one in its head, opens all three sheets, and reads the save back out of `localStorage`. |
| `widthtest.html` | Layout. Loads five screens at ten viewport widths from 320px up in iframes, and fails if anything sticks out sideways or if any button is under 34px tall. Iframes rather than a resized window because **headless Chrome will not make a window narrower than 500 CSS pixels**, so a `--window-size=360` screenshot is a crop of a 500 wide layout and proves nothing. |

Run them headless from the repository root:

```sh
python3 -m http.server 8791 &
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for page in selftest flowtest widthtest; do
  echo "== $page"
  "$CH" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=600000 \
    --dump-dom "http://localhost:8791/$page.html" 2>/dev/null | grep -oE '(PASS|FAIL)[^<]*' | head -3
done
```

`--virtual-time-budget` is what fast-forwards the timers the flow test waits on.
Without it the page is dumped before anything has happened.

### Seeing a screen

`shot.html` seeds player slot 3 and drives the app to a given screen, so a
screenshot can show a mid-game state that would otherwise take five minutes of
clicking to reach. It writes to the test slot only and never touches a real save.

```sh
"$CH" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=120000 \
  --window-size=1100,1400 --screenshot=/tmp/shot.png \
  "http://localhost:8791/shot.html?at=solve002&seed=1"
```

`at=` takes `pick`, `home`, `gymN`, `demoNM`, `solveNMK` (gym, move, steps already
answered), `reward` or `team`. Note that `shot.html` carries its own viewport
meta tag: it injects only the **body** of `index.html`, so without one it lays
out at 980px and every mobile screenshot is wrong.

## Layout

```
index.html          the shell, and the pre-paint theme resolver
css/dojo.css        one stylesheet, two themes, four gym palettes via --key
js/
  main.js           boot, physical keyboard, escape
  num.js            rng, and the shape of a step and a chain
  ops/add.js        five addition strategies
  ops/sub.js        five subtraction strategies
  ops/mul.js        five multiplication strategies
  ops/div.js        five division strategies
  strategies.js     the gyms, the registry, and make(id, level, seed)
  solve.js          the solve loop: one live blank, misses, nesting, in-my-head
  screens.js        home, gym, the demo sheet, rewards, team, help, grown-ups
  board.js          the pictures: number line, base ten blocks, area, groups
  buddy.js          sprites and the one sentence the buddy says
  ui.js             DOM helpers, sheets, sparkles, confetti
  state.js          the save file, three slots, XP and difficulty
  audio.js          a small WebAudio synth, no files to download
  roster.js         22 evolution lines, 48 forms
  selftest.js       the content invariants
  flowtest.js       the button clicking
sprites/
  anim/             animated Generation V sprites, one per form
  still/            static fallbacks, used if a GIF fails to load
```

Problems are **generated**, never listed. `make(strategyId, level, seed)` builds
one reproducibly, which is what lets the self test hammer half a million of them
and still name the exact problem that broke.

## Credits

Sprites are the Generation V artwork from the
[PokeAPI sprites](https://github.com/PokeAPI/sprites) project, vendored so the
page works offline. Pokemon is a trademark of Nintendo, Creatures Inc. and
GAME FREAK Inc.; this is an unaffiliated personal project made for one kid.

The code is MIT, see `LICENSE`.
