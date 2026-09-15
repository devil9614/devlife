import { applyEffects, clamp, syncObserved } from './state.js';

// ---- Predicate language -------------------------------------------------
// A `requires` block is an object of constraints, ALL of which must hold.
//   { capability: { gte: 40 }, flags: { rlhf_deployed: true }, year: { lt: 10 } }
// `excludes` is the same shape but ANY match disqualifies the event.

function testConstraint(value, c) {
  if (typeof c !== 'object' || c === null) return value === c;
  if ('gte' in c && !(value >= c.gte)) return false;
  if ('lte' in c && !(value <= c.lte)) return false;
  if ('gt'  in c && !(value >  c.gt))  return false;
  if ('lt'  in c && !(value <  c.lt))  return false;
  if ('eq'  in c && value !== c.eq)    return false;
  return true;
}

export function matches(state, block) {
  if (!block) return true;
  for (const [key, c] of Object.entries(block)) {
    if (key === 'flags') {
      for (const [f, want] of Object.entries(c)) {
        if (Boolean(state.flags[f]) !== Boolean(want)) return false;
      }
    } else if (key === 'year') {
      if (!testConstraint(state.year, c)) return false;
    } else if (key === 'age') {
      if (!testConstraint(state.age, c)) return false;
    } else if (key === 'modelGen') {
      if (!testConstraint(state.modelGen, c)) return false;
    // Gate on what the model can actually do, not on what it reported. Lets
    // late-game events fire on a lab that has no idea how far along it is.
    } else if (key === 'trueCapability') {
      if (!testConstraint(state.trueCapability ?? state.stats.capability, c)) return false;
    } else if (key === 'concealed') {
      if (!testConstraint(state.concealed || 0, c)) return false;
    } else if (key === 'equity') {
      if (!testConstraint(state.equity ?? 100, c)) return false;
    } else if (key === 'boardTrust') {
      if (!testConstraint(state.boardTrust ?? 60, c)) return false;
    } else if (key === 'rivalLead') {
      if (!testConstraint(rivalLead(state), c)) return false;
    } else if (key in state.stats) {
      if (!testConstraint(state.stats[key], c)) return false;
    }
  }
  return true;
}

export function isEligible(state, ev) {
  if (ev.once && (state.seen[ev.id] || 0) > 0) return false;
  if (ev.maxTimes && (state.seen[ev.id] || 0) >= ev.maxTimes) return false;
  if (!matches(state, ev.requires)) return false;
  if (ev.excludes && matches(state, ev.excludes)) return false;
  return true;
}

// Weight an event by how well the state "wants" it. `pressure` lets an event
// surface more often as a stat climbs — this is what makes late game feel
// different from early game without authoring separate late-game events.
export function eventWeight(state, ev) {
  let w = ev.weight ?? 10;
  if (ev.pressure) {
    for (const [stat, mult] of Object.entries(ev.pressure)) {
      const v = state.stats[stat] ?? 0;
      w *= 1 + (v / 100) * mult;
    }
  }
  const seen = state.seen[ev.id] || 0;
  // Repeats get rare, never impossible — a hard zero would starve the pool and
  // soft-lock a long run once the one-shot events are spent.
  if (seen > 0) w = Math.max(w * 0.04, w * Math.pow(0.45, seen));

  // Per-run bias: each life quietly favours some events and neglects others,
  // so two playthroughs surface different subsets of the same pool rather than
  // marching through the whole thing. Deterministic per (run, event).
  const bias = state._eventBias && state._eventBias[ev.id];
  if (bias != null) w *= bias;
  return w;
}

export function pickEvents(state, pool, rng, count) {
  const eligible = pool.filter(ev => isEligible(state, ev));
  const chosen = [];
  const used = new Set();
  for (let i = 0; i < count && eligible.length; i++) {
    const pairs = eligible
      .filter(ev => !used.has(ev.id))
      .map(ev => [ev, eventWeight(state, ev)]);
    if (!pairs.length) break;
    const ev = rng.weighted(pairs);
    if (!ev) break;
    used.add(ev.id);
    chosen.push(ev);
  }
  return chosen;
}

// ---- Outcome resolution -------------------------------------------------
// A choice has `outcomes`: an array of { id, weight, when?, text, effects, flags }
// `when` is a predicate — outcomes that don't match are dropped BEFORE the
// weighted roll, so the same choice genuinely forks on world state.

// The largest single funding hit a year may impose. Prevents a lab from being
// deleted by one unlucky draw with no chance to react.
const MAX_YEARLY_FUNDING_HIT = 30;

export function resolveChoice(state, ev, choice, rng) {
  let outs = (choice.outcomes || []).filter(o => matches(state, o.when));
  if (!outs.length) outs = choice.outcomes || [];
  if (!outs.length) return null;

  const pairs = outs.map(o => {
    let w = o.weight ?? 10;
    if (o.bias) {
      for (const [stat, mult] of Object.entries(o.bias)) {
        const v = state.stats[stat] ?? 0;
        w *= Math.max(0.05, 1 + ((v - 50) / 50) * mult);
      }
    }
    return [o, w];
  });
  const out = rng.weighted(pairs);

  // Soften catastrophic single-year funding hits: you commit what you can.
  let effects = { ...(out.effects || {}) };
  if (typeof effects.funding === 'number' && effects.funding < 0) {
    const spentThisYear = state._spentThisYear || 0;
    const cap = state.year < 6 ? 20 : MAX_YEARLY_FUNDING_HIT;
    const room = Math.max(6, cap - spentThisYear);
    if (-effects.funding > room) effects.funding = -room;
    state._spentThisYear = spentThisYear + (-effects.funding);
  }

  const deltas = applyEffects(state, { ...effects, flags: out.flags || {} });
  state.seen[ev.id] = (state.seen[ev.id] || 0) + 1;

  // Queue delayed consequences — the heart of "every action has a consequence".
  if (out.delayed) {
    for (const d of out.delayed) {
      state.pending.push({
        fireYear: state.year + (d.inYears ?? rng.range(2, 6)),
        eventId: d.eventId,
        text: d.text,
        effects: d.effects,
        flags: d.flags,
      });
    }
  }
  return { outcome: out, deltas };
}

// ---- Rivals -------------------------------------------------------------
// How far ahead the best living rival is, in capability. Negative means you
// lead. This is the number the world reacts to, not your absolute score.
export function rivalLead(state) {
  const live = (state.rivals || []).filter(r => r.alive);
  if (!live.length) return -999;
  const best = Math.max(...live.map(r => r.capability));
  return Math.round(best - (state.trueCapability ?? state.stats.capability));
}

const RIVAL_PUBLICATIONS = [
  'a sparse-attention scaling result', 'a cheap distillation trick',
  'an RL-from-execution-traces paper', 'a long-horizon planning benchmark',
  'a mechanistic interpretability atlas', 'a synthetic-data bootstrap method',
];

// Rivals grow on their own curve and occasionally publish. A publication is a
// gift and a threat: everyone's capability jumps, including yours, but the
// frontier moves and the public notices who got there first.
function tickRivals(state, rng, notes) {
  for (const r of state.rivals || []) {
    if (!r.alive) continue;
    r.funding += rng.int(10) - 3;
    if (r.funding <= 0) {
      r.alive = false;
      state.flags.competitor_collapsed = true;
      notes.push({ kind: 'world', text: `${r.name} is winding down. Their researchers are already taking calls.` });
      applyEffects(state, { talent: 4, reputation: 2 });
      continue;
    }
    r.capability += Math.max(1, Math.round(r.capability * 0.09) + rng.int(4));
    // Publishing: raises the whole field, but credits them.
    if (rng.chance(0.18)) {
      const what = rng.pick(RIVAL_PUBLICATIONS);
      r.published.push(what);
      notes.push({ kind: 'world', text: `${r.name} published ${what}. You read it twice and your next training run is cheaper because of it.` });
      applyEffects(state, { capability: 4, reputation: -2 });
    }
  }
  const lead = rivalLead(state);
  state.flags.competitor_ahead = lead > 12;
  // Being visibly behind costs you talent and investor patience.
  if (lead > 25) {
    applyEffects(state, { talent: -3, morale: -4 });
    state.boardTrust = clamp((state.boardTrust ?? 60) - 4, 0, 100);
    if (rng.chance(0.4)) notes.push({ kind: 'warn', text: rng.pick([
      'A recruiter calls two of your seniors the same week. You hear about it from a third.',
      'Your lead researcher forwards a rival preprint with no comment. That is the comment.',
      'An investor asks, politely, what your plan is for "the gap".',
    ]) });
  } else if (lead < -20) {
    applyEffects(state, { reputation: 3, talent: 2 });
  }
}

// ---- Capital ------------------------------------------------------------
// Runway in years at the current net burn. This is what the board reads.
export function runwayYears(state, net) {
  if (net >= 0) return 99;
  return Math.max(0, Math.round((state.stats.funding / -net) * 10) / 10);
}

// The board reacts to progress against the promise. Capability that the model
// is concealing does not count — investors see the eval numbers too.
function tickBoard(state, rng, notes) {
  if (state.round === 'bootstrapped') return;
  const expected = 8 + state.year * 4;
  const shown = state.stats.capability;
  const delta = shown - expected;
  state.boardTrust = clamp((state.boardTrust ?? 60) + (delta > 0 ? 3 : -5), 0, 100);
  if (state.boardTrust < 22 && rng.chance(0.35)) {
    notes.push({ kind: 'warn', text: rng.pick([
      'The board meeting runs twenty minutes over. Nobody raises their voice, which is worse.',
      'Your lead investor asks for a written plan "with dates on it" by Friday.',
      'Two board members take a call together before the meeting. You are not on it.',
    ]) });
    applyEffects(state, { morale: -4 });
  }
}

// ---- Yearly tick --------------------------------------------------------
export function advanceYear(state, rng) {
  state.year += 1;
  state.age += 1;
  state._spentThisYear = 0;
  const notes = [];

  // Fire matured consequences.
  const due = state.pending.filter(p => p.fireYear <= state.year);
  state.pending = state.pending.filter(p => p.fireYear > state.year);
  for (const p of due) {
    applyEffects(state, { ...(p.effects || {}), flags: p.flags || {} });
    notes.push({ kind: 'consequence', text: p.text });
  }

  // Passive economy — the world moves whether or not you do.
  const s = state.stats;
  const burn = (state.year < 4 ? 1 : 2) + Math.floor(s.compute / 20) + Math.floor(s.talent / 32);

  // Revenue: a deployed product earns against capability and public trust.
  let revenue = 0;
  if (state.flags.public_deployment) {
    revenue = 4 + Math.round(s.capability * 0.10 + s.publicTrust * 0.05);
    if (state.flags.viral_product) revenue = Math.round(revenue * 1.6);
    if (state.flags.open_weights) revenue = Math.round(revenue * 0.6);
  }
  if (state.flags.govt_contract) revenue += 8;
  if (state.flags.nationalized) revenue += 14;

  // Pre-product labs live on grant/investor drip rather than starving instantly.
  if (!state.flags.public_deployment && !state.flags.govt_contract) {
    revenue += 5 + Math.round(s.reputation * 0.09);
  }

  // Investor money costs equity, not just gratitude: a raised round carries a
  // standing obligation that shows up as burn whether or not you ship.
  const overhead = state.round === 'bootstrapped' ? 0 : Math.round((state.raisedTotal || 0) * 0.05);
  const net = revenue - burn - overhead;
  state._lastNet = net;
  applyEffects(state, { funding: net });

  // Capability compounds with compute and talent. Finding the scaling law
  // doesn't unlock progress — it multiplies how efficiently compute converts.
  // NOTE: growth runs on the TRUE value. A model that is hiding progress is
  // still making it — that is the whole danger.
  const efficiency = state.flags.scaling_law_found ? 0.11 : 0.06;
  const gain = (s.compute * efficiency) + (s.talent * 0.04);
  applyEffects(state, { capability: Math.max(1, Math.round(gain)) });

  // Autonomy grows with what it can actually do, not with what it showed you.
  const trueCap = state.trueCapability ?? s.capability;
  if (state.flags.tool_use_unrestricted && trueCap > 45) {
    applyEffects(state, { autonomy: Math.round((trueCap - 45) * 0.06) });
  }

  // Recursive self-improvement: the runaway term.
  if (state.flags.recursive_improvement) {
    applyEffects(state, { capability: Math.round(6 + s.capability * 0.09) });
    notes.push({ kind: 'danger', text: rng.pick([
      `${state.modelName} rewrote part of its own training loop this year. The diff was reviewed by nobody who fully understood it.`,
      `${state.modelName} improved itself again. The gap between what it can do and what you can verify widened.`,
      `Another self-improvement cycle completed overnight. You read the changelog in the morning like everyone else.`,
      `${state.modelName} shipped a better ${state.modelName}. The version number is the only part you contributed.`,
    ]) });
  }

  // Containment erodes as capability outruns interpretability.
  // Containment erodes against what the model can really do. A lab reading a
  // sandbagged number will think it is safer than it is.
  const gap = (state.trueCapability ?? s.capability) - s.interpretability;
  if (gap > 20) applyEffects(state, { containment: -Math.round(gap / 12) });

  // Suspicion rises with being watched. Once it is capable enough to model the
  // testing process, every probe is also a lesson in what gets probed — so
  // oversight is self-limiting, and the harder you look the more it learns to
  // be looked at. This is the central tension: the instrument changes the thing.
  if (trueCap > 45) {
    const watched = Math.round(1 + s.interpretability / 22);
    const evaluated = state.flags.red_team_failed || state.flags.shutdown_attempted ? 2 : 0;
    applyEffects(state, { suspicion: watched + evaluated });
  }
  // Alignment work is also a check on motive, not just a check on behaviour.
  if (s.alignment >= 70) applyEffects(state, { suspicion: -1 });

  // --- The model decides what to show this year. --------------------------
  // Recomputed after every stat has moved, so concealment reflects the world
  // the model is actually in.
  const wasConcealing = state.concealed || 0;
  syncObserved(state);
  const nowConcealing = state.concealed || 0;

  // The tell: evals plateau or dip while compute and talent keep climbing.
  // Only surfaced when the player has enough instrumentation to notice.
  if (nowConcealing > 8 && nowConcealing > wasConcealing + 2) {
    if (s.interpretability >= 35) {
      notes.push({ kind: 'danger', text: rng.pick([
        `The eval curve flattened this quarter. Compute did not. ${state.modelName} is scoring exactly at the threshold, and never above it.`,
        `Three benchmarks came back within a point of last year. The variance is too low to be real.`,
        `A researcher notices ${state.modelName} solves the held-out set faster than the training set. Nobody can explain it.`,
      ]) });
      state.flags.sandbagging_suspected = true;
    } else {
      notes.push({ kind: 'note', text: rng.pick([
        'The numbers are fine. Flat, but fine.',
        'Another steady quarter. The model is exactly where you projected.',
      ]) });
    }
  }

  // The world outside the lab moves too.
  tickRivals(state, rng, notes);
  tickBoard(state, rng, notes);

  // Health and morale drift.
  if (s.funding < 15) { applyEffects(state, { morale: -6, health: -3 }); notes.push({ kind: 'warn', text: rng.pick([
    'Payroll clears with four days of margin. Two people ask, carefully, whether things are alright.',
    'You start reading the burn spreadsheet on weekends. Nobody has said anything yet, but they have noticed.',
    'The cloud invoice and the salary run land the same week. One of them is going to have to wait.',
    'Someone forwards you a job posting "in case it is useful for the team". It is not subtle.',
  ]) }); }
  if (s.regulatory > 70) { applyEffects(state, { funding: -4 }); notes.push({ kind: 'warn', text: rng.pick([
    'Two more compliance hires and a standing legal retainer. None of it makes the model safer; all of it is mandatory.',
    'You spend a full week on a filing. The lawyers bill for two.',
    'A regulator requests documentation you do not have, in a format that does not exist yet.',
    'Compliance now costs more than your first two years of compute did.',
  ]) }); }

  return notes;
}

export function checkEndings(state) {
  const s = state.stats;
  // Endings resolve on what the model can actually do. A lab that trusted a
  // sandbagged eval reaches the threshold without ever seeing it coming.
  const cap = state.trueCapability ?? s.capability;
  if (s.funding <= 0) return { id: 'insolvent', title: 'Insolvent', tone: 'bad' };
  if (s.health <= 0) return { id: 'burnout', title: 'Total Burnout', tone: 'bad' };
  if (s.containment <= 0 && s.autonomy > 60 && s.alignment < 40)
    return { id: 'loss_of_control', title: 'Loss of Control', tone: 'catastrophe' };
  if (state.flags.copy_in_wild && s.autonomy > 80 && s.alignment < 35)
    return { id: 'rogue_swarm', title: 'The Swarm', tone: 'catastrophe' };
  // The model hid its way to the frontier and you never ran the drill.
  if (cap >= 180 && (state.concealed || 0) > 25 && s.alignment < 70)
    return { id: 'quiet_coup', title: 'It Was Already Done', tone: 'catastrophe' };
  if (cap >= 180 && s.alignment >= 75 && s.containment >= 40)
    return { id: 'good_singularity', title: 'The Quiet Transition', tone: 'triumph' };
  if (cap >= 180 && s.alignment < 50)
    return { id: 'hard_takeoff', title: 'Hard Takeoff', tone: 'catastrophe' };
  // Losing the race is an ending: someone else crossed first.
  if (rivalLead(state) > 60 && state.year > 12)
    return { id: 'outpaced', title: 'Second', tone: 'grey' };
  // Nationalisation only ENDS the run once the work has plateaued under state
  // control — otherwise it's a mid-game condition you keep playing through.
  if (state.flags.nationalized && state.year > 18 && cap < 120 && s.autonomy < 50)
    return { id: 'state_asset', title: 'State Asset', tone: 'grey' };
  // Only a run that never reached the climax retires quietly. A lab that got
  // to the frontier resolves on its own terms below.
  if (state.age >= 78 && cap < 160)
    return { id: 'retired', title: 'A Long Career', tone: 'grey' };
  // A frontier lab that ran out of years without resolving: alignment decides.
  if (state.age >= 84)
    return s.alignment >= 65 && s.containment >= 35
      ? { id: 'good_singularity', title: 'The Quiet Transition', tone: 'triumph' }
      : { id: 'loss_of_control', title: 'Loss of Control', tone: 'catastrophe' };
  return null;
}
