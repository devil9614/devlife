import { applyEffects, clamp } from './state.js';

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

  applyEffects(state, { funding: revenue - burn });

  // Capability compounds with compute and talent. Finding the scaling law
  // doesn't unlock progress — it multiplies how efficiently compute converts.
  const efficiency = state.flags.scaling_law_found ? 0.11 : 0.06;
  const gain = (s.compute * efficiency) + (s.talent * 0.04);
  applyEffects(state, { capability: Math.max(1, Math.round(gain)) });

  // Autonomy grows with capability once tool use is unrestricted.
  if (state.flags.tool_use_unrestricted && s.capability > 45) {
    applyEffects(state, { autonomy: Math.round((s.capability - 45) * 0.06) });
  }

  // Recursive self-improvement: the runaway term.
  if (state.flags.recursive_improvement) {
    applyEffects(state, { capability: Math.round(6 + s.capability * 0.09) });
    notes.push({ kind: 'danger', text: `${state.modelName || 'The model'} improved itself again this year.` });
  }

  // Containment erodes as capability outruns interpretability.
  const gap = s.capability - s.interpretability;
  if (gap > 20) applyEffects(state, { containment: -Math.round(gap / 12) });

  // Suspicion rises if the model is watched hard while being capable.
  if (s.capability > 50 && s.interpretability > 55) applyEffects(state, { suspicion: 2 });

  // Health and morale drift.
  if (s.funding < 15) { applyEffects(state, { morale: -6, health: -3 }); notes.push({ kind: 'warn', text: 'Payroll is tight. People are noticing.' }); }
  if (s.regulatory > 70) { applyEffects(state, { funding: -4 }); notes.push({ kind: 'warn', text: 'Compliance costs are eating the budget.' }); }

  return notes;
}

export function checkEndings(state) {
  const s = state.stats;
  if (s.funding <= 0) return { id: 'insolvent', title: 'Insolvent', tone: 'bad' };
  if (s.health <= 0) return { id: 'burnout', title: 'Total Burnout', tone: 'bad' };
  if (s.containment <= 0 && s.autonomy > 60 && s.alignment < 40)
    return { id: 'loss_of_control', title: 'Loss of Control', tone: 'catastrophe' };
  if (state.flags.copy_in_wild && s.autonomy > 80 && s.alignment < 35)
    return { id: 'rogue_swarm', title: 'The Swarm', tone: 'catastrophe' };
  if (s.capability >= 180 && s.alignment >= 75 && s.containment >= 40)
    return { id: 'good_singularity', title: 'The Quiet Transition', tone: 'triumph' };
  if (s.capability >= 180 && s.alignment < 50)
    return { id: 'hard_takeoff', title: 'Hard Takeoff', tone: 'catastrophe' };
  // Nationalisation only ENDS the run once the work has plateaued under state
  // control — otherwise it's a mid-game condition you keep playing through.
  if (state.flags.nationalized && state.year > 18 && s.capability < 120 && s.autonomy < 50)
    return { id: 'state_asset', title: 'State Asset', tone: 'grey' };
  // Only a run that never reached the climax retires quietly. A lab that got
  // to the frontier resolves on its own terms below.
  if (state.age >= 78 && s.capability < 160)
    return { id: 'retired', title: 'A Long Career', tone: 'grey' };
  // A frontier lab that ran out of years without resolving: alignment decides.
  if (state.age >= 84)
    return s.alignment >= 65 && s.containment >= 35
      ? { id: 'good_singularity', title: 'The Quiet Transition', tone: 'triumph' }
      : { id: 'loss_of_control', title: 'Loss of Control', tone: 'catastrophe' };
  return null;
}
