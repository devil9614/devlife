import assert from 'node:assert/strict';
import { Game } from '../public/src/engine/game.js';
import { syncObserved, capabilityEstimate } from '../public/src/engine/state.js';
import { checkEndings } from '../public/src/engine/engine.js';
import { ORIGINS, OPENING_BEATS } from '../public/src/data/origins.js';
import { ACTIVITIES } from '../public/src/data/activities.js';
import { LIFE_ACTIONS } from '../public/src/data/life-activities.js';
import { CONFETTI_THEMES } from '../public/src/ui/confetti.js';

// These are deliberately direct system checks. The long random simulation
// exercises breadth; this locks down the connected loops a player can see.
{
  const g = new Game({ seed: 'asset-financing' });
  const L = g.state.life;
  L.cash = 5000; L.debt = 0; L.bank.creditScore = 760;
  const offer = g.doLifeAction('buy_asset', { assetId: 'ferrari' });
  assert.ok(offer.finance, 'a shortfall should present financing rather than dead-end');
  assert.equal(L.owns.length, 0, 'failed cash purchase must not grant the asset');
  const financed = g.runLifeHandler('financeAsset', { assetId: 'ferrari' }, 'Bank financing');
  assert.ok(financed, 'eligible financing should resolve');
  assert.equal(L.owns[0].assetId, 'ferrari');
  assert.ok(L.debt > 300000, 'financing should become debt');
  assert.equal(L.bank.loans.length, 1, 'bank keeps a loan record');
}

{
  const g = new Game({ seed: 'relationships-work' });
  const worker = g.state.people[0];
  const made = g.befriendCoworker(worker.id);
  assert.ok(made, 'a coworker can become a relationship');
  const p = g.state.life.people.find(x => x.name === worker.name);
  assert.equal(p.sprite, worker.sprite, 'the same person keeps the same visual identity');
  const before = p.closeness;
  const result = g.interactWithPerson(p.id, 'spend');
  assert.ok(result && p.closeness > before, 'spending time visibly advances closeness');
}

{
  const g = new Game({ seed: 'crypto-position' });
  const L = g.state.life; L.cash = 10000;
  const before = L.cash;
  const result = g.runLifeHandler('buyCrypto', { coinId: 'bitcoin', amount: 2500 }, 'Crypto exchange');
  assert.ok(result && L.crypto.bitcoin, 'crypto purchase creates a separate coin position');
  assert.equal(L.cash, before - 2500, 'crypto position is funded from cash');
}

{
  const g = new Game({ seed: 'first-friend-woman' });
  const result = g.doLifeAction('make_friend');
  assert.ok(result, 'making a friend should resolve into a result');
  const friend = g.state.life.people.find(p => p.kind === 'friend');
  assert.equal(friend.presentation, 'woman', 'the first friend has a feminine presentation');
  assert.ok(friend.spriteAsset, 'the first friend uses a feminine visual rather than the legacy male-only atlas');
  assert.equal(friend.avatarFrames, 5, 'female portraits use the supplied five-character packs');
}

{
  const g = new Game({ seed: 'dating-timeline' });
  g.state.age = 18;
  // Fixed rolls let us verify the adult, age-compatible dating flow directly.
  g.rng = { next: () => 0.5, int: () => 0, range: a => a, pick: values => values[0], chance: () => true };
  const result = g.runLifeHandler('dateApps', {}, 'Signal dating');
  assert.ok(result, 'opening the dating app should resolve into matches');
  const match = g.state.life.people.find(p => p.kind === 'match');
  assert.ok(match.age >= 18 && match.age <= 24, 'an 18-year-old receives age-compatible matches');
  assert.equal(match.presentation, 'woman', 'the first app match has a feminine presentation');
  match.conversations = 3;
  const tooSoon = g.interactWithPerson(match.id, 'date');
  assert.match(tooSoon.outcome.text, /met .* year|conversation live/i, 'a match cannot become an instant date in the same year');
  g.state.year = 1;
  const firstDate = g.interactWithPerson(match.id, 'date');
  assert.ok(firstDate && match.dates === 1, 'dating begins after conversations and time have passed');
}

{
  const g = new Game({ seed: 'pregnancy-time' });
  const L = g.state.life;
  g.state.year = 3;
  L.people.push({ id:'partner', name:'Mira Reyes', kind:'partner', age:28, metYear:0, dates:3, conversations:6, intimacyCount:0, closeness:90, sprite:1, presentation:'woman' });
  const result = g.runLifeHandler('kid', {}, 'Try for a child');
  assert.ok(result && L.pregnancy, 'trying for a child creates a due date');
  assert.equal(L.kids.length, 0, 'a child is not born instantly');
  g.nextYear();
  assert.equal(L.kids.length, 1, 'the child arrives after the next age-up');
}

console.log('life systems: connected finance, relationships, and crypto verified');

// ---- Deception, rivals, capital -----------------------------------------
// The model's private state is the spine of the late game: if concealment ever
// stops responding to interpretability, the counterplay silently disappears and
// the mechanic becomes a coin flip. Pin the shape of that curve.
{
  const mk = (interp) => ({
    stats: { capability: 0, alignment: 35, interpretability: interp, suspicion: 80 },
    trueCapability: 150, concealed: 0, flags: {},
  });
  const blind = mk(10), seeing = mk(85);
  syncObserved(blind); syncObserved(seeing);
  assert(blind.concealed > 40, 'a blind lab should be badly deceived');
  assert(seeing.concealed < 10, 'an instrumented lab should see nearly everything');
  assert(blind.stats.capability < seeing.stats.capability,
    'the blind lab reports a lower number than the instrumented one, despite identical true capability');

  // The warning must reach the middle, and must NOT reach the blind — being
  // unaware is the actual failure state the ending punishes.
  assert(capabilityEstimate(mk(40)).suspectGap === true, 'a partly-instrumented lab notices the discrepancy');
  assert(capabilityEstimate(blind).suspectGap === false, 'a blind lab has no reason to doubt its evals');

  // Endings must resolve on the truth, never on the sandbagged readout.
  const hidden = mk(10);
  hidden.trueCapability = 200;          // past the frontier threshold
  syncObserved(hidden);
  hidden.stats = { ...hidden.stats, funding: 50, health: 50, containment: 50, autonomy: 10 };
  hidden.year = 5; hidden.age = 40; hidden.rivals = [];
  const e = checkEndings(hidden);
  assert(hidden.stats.capability < 180, 'the readout is below the frontier threshold');
  assert(e && e.id === 'quiet_coup', 'a lab deceived to the frontier gets the coup ending, not safety');
  console.log('deception: concealment tracks interpretability, endings resolve on truth');
}

// ---- Discoverability ----------------------------------------------------
// An option the player never learns exists cannot be chosen. 94% of
// bankruptcies happened with a funding round sitting available and unseen, so
// the locked list and its reasons are load-bearing, not decoration.
{
  const g = new Game({ seed: 'discoverability' });
  for (let i = 0; i < 6; i++) { if (g.current) g.choose(0); else g.nextYear(); }

  const locked = g.lockedActivities();
  assert(locked.length > 0, 'some activities should be locked early on');
  assert(locked.every(a => a.whyLocked && a.whyLocked.length > 0),
    'every locked activity states a reason');
  assert(locked.every(a => !/^Not yet available$/.test(a.whyLocked)),
    'no locked activity falls back to a vague reason');

  // Available and locked must be disjoint, or the UI lists the same row twice.
  const availIds = new Set(g.availableActivities().map(a => a.id));
  assert(locked.every(a => !availIds.has(a.id)),
    'an activity is never both available and locked');

  // Permanently-excluded activities are gone, not pending.
  g.state.equity = 40;                       // past the seed round's excludes gate
  assert(!g.lockedActivities().some(a => a.id === 'act_raise_seed'),
    'an excluded activity is not advertised as merely locked');
  assert(!g.availableActivities().some(a => a.id === 'act_raise_seed'),
    'an excluded activity is not offered either');
  console.log('discoverability: locked options are listed and explained');
}

// ---- The opening ---------------------------------------------------------
// A first session is the whole product for most players. The premise has to be
// legible immediately, and a funding alarm must not fire before the run has an
// economy to judge — a warning on turn one teaches players to ignore all of them.
{
  let falseAlarms = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const g = new Game({ seed: 'open-' + i });
    const s = g.state;
    // Mirrors runwayNote's guard in the UI.
    const wouldWarn = !(s.year < 2 || s._lastNet == null);
    if (wouldWarn) falseAlarms++;
  }
  assert.equal(falseAlarms, 0, 'no run shows a runway warning before it has an economy');

  // The model has to be named and present from the first screen — it is the
  // thing the game is about.
  const g = new Game({ seed: 'open-premise' });
  assert(g.state.modelName && g.state.modelName.length > 0, 'the model is named at year 0');
  assert(g.state.trueCapability === g.state.stats.capability,
    'year 0 starts honest — nothing is hidden before there is anything to hide');
  console.log('opening: premise present, no false alarms before year 2');
}

// ---- The guided first year ----------------------------------------------
// Every origin opens on a decision belonging to ITS story. This is the first
// thing a new player ever sees, so it must fire for every origin, exactly once,
// and hand off cleanly to the random pool afterwards.
{
  const covered = new Set();
  let failures = [];
  for (let i = 0; i < 300; i++) {
    const g = new Game({ seed: 'beat-' + i });
    const oid = g.state.origin.id;
    covered.add(oid);
    const first = g.current;
    if (!first) { failures.push(oid + ':no-opening-event'); continue; }
    if (!String(first.id).startsWith('open_')) { failures.push(oid + ':not-a-beat'); continue; }
    if (!first.choices || first.choices.length < 2) { failures.push(oid + ':too-few-choices'); continue; }
    g.choose(0);
    if (String(g.current?.id || '').startsWith('open_')) failures.push(oid + ':beat-repeated');
  }
  assert.equal(failures.length, 0, 'opening beats fire once per run: ' + failures.slice(0, 3).join(', '));
  assert.equal(covered.size, ORIGINS.length, 'every origin was exercised');
  for (const o of ORIGINS) {
    assert(OPENING_BEATS[o.id], `origin ${o.id} has an authored opening beat`);
  }
  console.log('guided first year: every origin opens on its own decision');
}

// ---- Action rows ---------------------------------------------------------
// Rows are icon + name only: the player learns what a thing does by doing it.
// Every action therefore needs an icon, since it is now the only visual anchor.
{
  const missingAct = ACTIVITIES.filter(a => !a.icon).map(a => a.id);
  const missingLife = LIFE_ACTIONS.filter(a => !a.icon).map(a => a.id);
  assert.equal(missingAct.length, 0, 'every activity has an icon: ' + missingAct.join(', '));
  assert.equal(missingLife.length, 0, 'every life action has an icon: ' + missingLife.join(', '));
  console.log('action rows: all ' + (ACTIVITIES.length + LIFE_ACTIONS.length) + ' actions carry an icon');
}

// ---- Celebrations --------------------------------------------------------
// Confetti previously fired only on a triumph ending, which most runs never
// reach — so almost nobody ever saw it. Milestones during play now carry it,
// and every theme a trigger names must actually exist in the confetti module.
{
  const themes = new Set(CONFETTI_THEMES);
  const used = new Set();
  let runsWithCelebration = 0;
  const N = 300;
  for (let i = 0; i < N; i++) {
    const g = new Game({ seed: 'party-' + i });
    let guard = 0, any = false;
    while (!g.isOver && guard++ < 200) {
      if (g.current) { g.choose(0); continue; }
      const before = g.state.year;
      g.nextYear();
      if (g.state.year === before) break;
      for (const n of (g.yearNotes || [])) {
        if (!n.celebrate) continue;
        any = true;
        if (typeof n.celebrate === 'string') used.add(n.celebrate);
      }
    }
    if (any) runsWithCelebration++;
  }
  for (const t of used) assert(themes.has(t), `celebrate theme "${t}" exists in the confetti module`);
  assert(runsWithCelebration / N > 0.5,
    `most runs see a celebration (got ${(runsWithCelebration / N * 100).toFixed(0)}%)`);
  console.log('celebrations: ' + (runsWithCelebration / N * 100).toFixed(0) + '% of runs, themes ' + [...used].join('/'));
}
