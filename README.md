# DEVLIFE

A text-based life simulator in the shape of BitLife, about building AI.

You start with a rented GPU and an idea. Each year you face two or three
decisions. Every decision moves fourteen numbers and can latch any of forty
permanent world flags — and some of them mature into consequences that only
arrive four, five, six years later.

Somewhere ahead is a system more capable than you. The only question that
matters is whether it is still listening.

## Run it

```bash
node server.js
```

Then open http://localhost:5173. No build step, no dependencies — plain ES
modules, served statically. Deploy it by copying the folder to any static host.

```bash
npm test
```

Simulates 5,000 playthroughs and asserts no run stalls, every event stays
reachable, and runs genuinely diverge.

## How the combinatorics work

The design follows your own observation: you don't need a million authored
things to get a million outcomes. 27 events produce an effectively unbounded
run space because branching is multiplicative, not additive.

| Layer | Count | Contribution |
|---|---|---|
| Events | 52 | pool drawn from each year |
| Choices | 154 | 3 per event |
| Outcomes | 194 | some choices fork 2–3 ways |
| Activities | 28 | player-initiated, 2 per year |
| Activity outcomes | 50 | each activity forks too |
| Continuous stats | 14 | unbounded state vector |
| Latching world flags | 40 | 2^40 ≈ 1.1 trillion configurations |
| Delayed consequences | 9 | fire years after the decision |

Four mechanisms turn that into scale:

1. **Predicate gating.** Every event declares `requires` / `excludes` over
   world state, so the eligible pool at year 3 and year 30 barely overlap.
2. **State-gated outcomes.** A choice's `when` clauses mean the *same* option
   resolves differently depending on what you built. Gating a public launch
   reads one way with an interpretability lab, another way once your weights
   have leaked.
3. **State-weighted rolls.** `bias` shifts odds by your stats, so a shutdown
   drill is genuinely likelier to succeed in a lab that invested in containment.
4. **Delayed consequences.** Choices queue effects that mature years later —
   the reason a run has a memory rather than a sequence.

A ~40-year run makes roughly 100 decisions at a branching factor near 3.9.
That is a path space on the order of 10^59, before the continuous stats.

## Strategy actually matters

Measured over thousands of simulated runs, playstyles produce sharply
different outcome distributions — no strategy dominates:

| Playstyle | Result |
|---|---|
| Growth-focused | 66% catastrophe (loss of control / hard takeoff) |
| Safety-focused | 45.9% *The Quiet Transition* |
| Careless | insolvent — the lab dies |

Across 5,000 simulated runs: **100% unique run signatures**, all 52 events
reachable, zero stalls, average run 20.7 years.

Safety is survivable and expensive. Capability without alignment reliably ends
badly. That tension is the game.

## The interface

Modelled on BitLife's actual shape, mobile-first:

- **A life-event log** as the main screen — a chronological feed of what
  happened, newest at the bottom, with stat changes shown inline.
- **Stat bars** pinned above it, always visible.
- **A big Age button** as the primary action. Press it, a year passes.
- **Five bottom tabs** — Life, Do, Lab, Model, World.
- **Events arrive as bottom sheets** you must answer before continuing.
- **Activities** (the "Do" tab) are how you act rather than react: two
  actions per year, in five categories.

The layout is a fixed-height phone frame: the feed scrolls inside it, so the
Age button and navigation never leave the screen. On desktop the same frame
is centred rather than stretched.

## Structure

```
index.html            entry point
server.js             zero-dependency static server
src/engine/
  state.js            stat + flag definitions, effect application
  rng.js              seeded RNG — runs are replayable by seed
  engine.js           predicates, weighting, yearly tick, endings
  game.js             run controller + activity system
src/data/
  events-early.js     Act I  — the garage years
  events-mid.js       Act II — scaling and deployment
  events-late.js      Act III— recursive self-improvement, the endgame
  events-life.js      recurring texture (burnout, press, poaching)
  events-career.js    funding, rivals, acquisition, personal cost
  events-world.js     society, politics, other people's AI
  events-model.js     the model's own arc
  activities.js       28 player-initiated actions in 5 categories
  index.js            aggregation + the nine endings
src/ui/
  app.js              views, sheets, nav, rendering
  styles.css          the interface
test/sim.test.js      5,000-run simulation harness
```

## Adding content

An event is a plain object. The engine handles the rest:

```js
{
  id: 'unique_id',
  weight: 30,                                  // base draw likelihood
  requires: { capability: { gte: 60 },         // when it can appear
              flags: { rlhf_deployed: true } },
  excludes: { flags: { nationalized: true } }, // when it cannot
  pressure: { suspicion: 1.5 },                // surfaces more as suspicion climbs
  maxTimes: 3,                                 // omit for unlimited
  title: 'Something Happened',
  text: 'The situation, in two or three sentences.',
  choices: [{
    label: 'What you do about it',
    outcomes: [{
      when: { containment: { lte: 30 } },      // optional state gate
      weight: 10,
      bias: { alignment: 1.2 },                // odds shift with alignment
      text: 'What actually happened.',
      effects: { containment: -12, capability: 8 },
      flags: { airgap_broken: true },
      delayed: [{ inYears: 4, text: 'It comes back.', effects: { publicTrust: -10 } }],
    }],
  }],
}
```

Drop it in any file under `src/data/` and export it. `index.js` throws on
duplicate ids, and the test suite will tell you if it's unreachable.

Seeds are shareable — the same seed replays the same run.
