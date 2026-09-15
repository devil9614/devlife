import assert from 'node:assert/strict';
import { Game } from '../public/src/engine/game.js';
import { syncObserved, capabilityEstimate } from '../public/src/engine/state.js';
import { checkEndings } from '../public/src/engine/engine.js';

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
