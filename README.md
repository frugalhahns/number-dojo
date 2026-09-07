# Number Dojo

**Live: https://frugalhahns.github.io/number-dojo/**

A third grader does not need to be told what 564 + 70 is. He needs to be shown
that it is 56 + 7 with a 4 in his pocket.

That is the whole site. He picks the kind of problem he wants to practice, and
it gets taken apart one blank at a time, with the part being worked on lit up in
the problem above and a Pokemon standing next to the working out reacting to
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

## The ladder

He picks what the problem **looks like**, never which method to use. Eighteen
rungs across the four operations, each with three levels inside it, and each
rung gets harder as you go down the list.

| # | Adding | Subtracting | Multiplying | Dividing |
|---|---|---|---|---|
| 1 | `45 + 5` two digits plus one | `45 − 8` two digits take one | `7 × 6` the times tables | `56 ÷ 7` the division facts |
| 2 | `352 + 6` three digits plus one | `352 − 6` three digits take one | `6 × 30` times whole tens | `38 ÷ 5` some left over |
| 3 | `564 + 70` adding whole tens | `634 − 70` taking whole tens | `4 × 23` two digits times one | `240 ÷ 6` sharing whole tens |
| 4 | `53 + 35` two digits plus two | `73 − 28` two digits take two | `7 × 213` three digits times one | `72 ÷ 6` more than ten each |
| 5 | `324 + 324` three digits plus three | `524 − 318` three digits take three | | |

The three levels inside a rung are the thing he never has to think about. "Two
digits plus two" starts without carrying, then carries, then mixes. "Two digits
take two" starts without borrowing, then borrows, then throws in the occasional
close pair like `71 − 68` so that noticing *which* method to reach for becomes
its own skill.

## The twenty-three methods

A **shape** owns the numbers. A **strategy** owns the explanation. The join
between them is `strategy.fits(problem)`: the rung makes a problem, and whichever
strategies can honestly handle those exact numbers are the ones it picks from, at
random, so the same rung explains itself several different ways without ever
asking a child to choose a method off a list.

Each has three difficulty levels of its own for when it is driven directly.

**Adding** · Just the Ones (`45 + 3 → 40 + 8`) · Bridge to Ten
(`56 + 7 → 56 + 4 + 3`) · Split by Place (`46 + 37 → 70 + 13`) · Work in Tens
(`564 + 70 → 56 + 7`) · Round and Give Back (`58 + 27 → 60 + 27 − 2`) ·
Nearly a Double (`7 + 8 → 7 + 7 + 1`)

**Subtracting** · Just the Ones (`45 − 3 → 40 + 2`) · Count Up the Gap
(`73 − 68 → 2 + 3`) · Take It Away in Pieces (`73 − 28 → −20 −3 −5`) ·
Split by Place (`86 − 34 → 50 + 2`) · Slide Them Both (`73 − 28 → 75 − 30`) ·
Work in Tens (`634 − 70 → 63 − 7`)

**Multiplying** · Anchor on Five (`7 × 8 → 35 + 21`) · Ten Then Trim
(`6 × 9 → 60 − 6`) · Split the Big One (`4 × 23 → 80 + 12`) · Double, Double
(`4 × 16 → 16, 32, 64`) · Halve and Double (`5 × 14 → 10 × 7`) · Work in Tens
(`6 × 30 → 6 × 3`)

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
- **The problem shows you what it is talking about.** Every step names which
  digits it is touching, and the problem at the top of the screen lights exactly
  those and pushes the rest back. On `22 − 19`, the step that says "19 wants to
  be 20" lights the **19**; on `42 + 47`, the tens step lights both **4**s and
  the ones step lights the **2** and the **7**; on `185 + 4`, "add just the ones"
  lights the **5** and the **4** and then "drop it back on" lights the **18**.
  It is the difference between following an explanation and hunting for what it
  refers to. The same lighting runs in the **watch one first** walkthrough, one
  step per click, because seeing a method explained is no use if you cannot see
  which number it just did something to. Both screens draw it with the same
  `js/problem.js`, so they cannot drift apart.
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
- **One number sentence at a time.** A walkthrough is titled by the rung's name,
  never by the rung's canonical example: the card he tapped says `324 + 324`, but
  the problem being worked is a different one, and two unrelated sums on screen
  at once is a reading puzzle nobody asked for.
- **No step ever answers zero.** `785 − 181` used to spend a whole step on
  `80 − 80 = 0`. Every instance of this has been a generator putting the same
  digit in the same column of both numbers, and on screen it reads as a bug, so
  the self test now forbids it outright across every strategy and every rung.
- **The step he is on is marked.** In a walkthrough, pressing *then what* does
  not just add a line to a list: the newly uncovered step gets the same border
  and the same coloured number as the live blank on the solve screen, so "the
  one you are on" looks identical whether he is watching it done or doing it. It
  is marked by colour rather than by fading its neighbours, because dimming text
  he still has to read back is a poor trade.
- **As many worked examples as he wants.** Tapping a rung opens a walkthrough,
  and finishing one offers **another example** rather than pushing him into
  practice. Each new one prefers a method he did not just watch, so a rung that
  can be done four ways shows him four ways. There is also **all of it at once**
  for when he only wants to check the shape of the answer.
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

## Light and dark

The stylesheet is entirely driven by `html[data-theme]`, so switching is one
attribute and needs no reload. The button in the top bar cycles **auto, light,
dark** and shows the setting it is on rather than the one it would move to,
because a button that tells you where you would go is a riddle. Auto follows the
device and keeps following it: a Chromebook that switches itself to night mode
at seven changes the page under him without a reload. There is a three-way
control on the **Grown-ups** page as well, the setting is per player slot, and
`index.html` resolves it before the first paint so light mode never flashes dark.

## The worked examples page

`examples.html` prints as many fully solved problems as you like, for every rung
of an operation, with each step restating the problem and lighting the digits
that step is working on. It is reachable from **Grown-ups** in the app, and it
is the thing to hand over when somebody wants to see what he is being taught, or
to sit next to him with a pencil.

```
https://frugalhahns.github.io/number-dojo/examples.html?op=sub&n=6&level=2
```

`op` is `add`, `sub`, `mul` or `div`; `n` is examples per rung; `level` is 1 to 3,
or omitted to walk the levels so a rung shows its easy case and its hard case
side by side. The print stylesheet drops the controls and switches to black on
white, because a dark page eats a cartridge.

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
| `selftest.html` | Content. ~1,700,000 checks. Builds every strategy at every level 500 times over and proves each chain lands on the right answer, that no step goes negative or fractional, that every line has exactly one blank, that no hint contains its own answer, that nested chains answer the question their parent asked, that boards render at every point without throwing and never draw off their own axis, that each level can make at least 14 different problems, that every rung of the ladder always finds a strategy willing to explain its numbers and rarely has to redraw to do it, that every rung really serves the digit counts its name promises, that every step lights up part of the problem and that the part it names actually exists in those digits, that every sprite file exists, that the `localStorage` key in `index.html` has not drifted from `js/state.js`, and that nothing anywhere uses an em dash. |
| `flowtest.html` | Playability. Fetches `index.html`, injects its real body, and then clicks the real buttons: picks a starter, plays a five problem run in all four gyms through the on-screen keypad, gets one wrong twice on purpose and checks the first miss withholds the answer and the second gives it, opens a nested chain and checks it comes back out into the step it left, checks the highlight starts off, comes on at the first click of the walkthrough, and moves across the problem as the steps go by, asks a finished walkthrough for another example and checks it is a different problem that starts over from step one, checks exactly one step is marked as the current one and that the mark moves on the next click, taps the theme button four times and checks it walks auto, light, dark and back while really changing the page, wins one in its head, opens all three sheets, and reads the save back out of `localStorage`. |
| `widthtest.html` | Layout. Loads five app screens and the worked examples page at ten viewport widths from 320px up in iframes, alternating light and dark theme so a regression in one cannot hide behind the other, and fails if anything sticks out sideways, if any button is under 34px tall, or if the lit digits have neither a background nor an underline. Iframes rather than a resized window because **headless Chrome will not make a window narrower than 500 CSS pixels**, so a `--window-size=360` screenshot is a crop of a 500 wide layout and proves nothing. |

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

`at=` takes `pick`, `home`, `gymN`, `demoNM`, `solveNMK` (gym, rung, steps already
answered), `reward` or `team`. `solve021` is the Sprout Gym, third rung, one step
in, which is the `564 + 70` breakdown with the tens lit up. Note that `shot.html` carries its own viewport
meta tag: it injects only the **body** of `index.html`, so without one it lays
out at 980px and every mobile screenshot is wrong.

## Layout

```
index.html          the shell, and the pre-paint theme resolver
examples.html       fully worked solutions, printable
css/dojo.css        one stylesheet, two themes, four gym palettes via --key
js/
  main.js           boot, physical keyboard, escape
  num.js            rng, and the shape of a step and a chain
  ops/add.js        five addition strategies
  ops/sub.js        five subtraction strategies
  ops/mul.js        five multiplication strategies
  ops/div.js        five division strategies
  shapes.js         the ladder: eighteen problem shapes and what they generate
  strategies.js     the gyms, the registry, and the shape-to-strategy join
  solve.js          the solve loop: one live blank, misses, nesting, in-my-head
  screens.js        home, the ladder, the demo sheet, rewards, team, grown-ups
  problem.js        the problem itself, with the digits in play lit up
  examples.js       the printable worked examples page
  board.js          the pictures: number line, base ten blocks, area, groups
  buddy.js          sprites and the one sentence the buddy says
  ui.js             DOM helpers, sheets, sparkles, confetti
  state.js          the save file, three slots, XP and difficulty
  audio.js          a small WebAudio synth, no files to download
  theme.js          auto, light and dark, applied live
  roster.js         22 evolution lines, 48 forms
  selftest.js       the content invariants
  flowtest.js       the button clicking
sprites/
  anim/             animated Generation V sprites, one per form
  still/            static fallbacks, used if a GIF fails to load
```

Problems are **generated**, never listed. `makeForShape(shapeId, level, seed)`
builds one reproducibly: the shape draws the numbers, `fitting()` asks every
strategy the rung offers whether it can honestly explain them, and one of the
willing ones is picked. That reproducibility is what lets the self test hammer a
million and a half of them and still name the exact problem that broke.

## Credits

Sprites are the Generation V artwork from the
[PokeAPI sprites](https://github.com/PokeAPI/sprites) project, vendored so the
page works offline. Pokemon is a trademark of Nintendo, Creatures Inc. and
GAME FREAK Inc.; this is an unaffiliated personal project made for one kid.

The code is MIT, see `LICENSE`.
