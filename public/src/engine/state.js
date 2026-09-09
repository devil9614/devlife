// Core world state. Everything the game knows lives here.
// Stats are 0..100 continuous unless noted. Flags are latching booleans.

export const STAT_DEFS = {
  capability:     { label: 'Capability',      init: 8,  desc: 'Raw problem-solving power of your best model.' },
  alignment:      { label: 'Alignment',       init: 50, desc: 'How reliably the model does what you meant.' },
  interpretability:{label: 'Interpretability',init: 20, desc: 'How much of the model you can actually read.' },
  compute:        { label: 'Compute',         init: 12, desc: 'FLOPs you control. Gates what you can train.' },
  funding:        { label: 'Funding',         init: 30, desc: 'Runway. Hits zero and the lab dies.' },
  reputation:     { label: 'Reputation',      init: 25, desc: 'Standing among researchers and press.' },
  publicTrust:    { label: 'Public Trust',    init: 55, desc: 'How the world feels about your work.' },
  regulatory:     { label: 'Regulatory Heat', init: 10, desc: 'Government attention. High is dangerous.' },
  containment:    { label: 'Containment',     init: 70, desc: 'Can you still switch it off?' },
  autonomy:       { label: 'Model Autonomy',  init: 2,  desc: 'How much it acts without being asked.' },
  talent:         { label: 'Talent',          init: 20, desc: 'Quality of the people in the building.' },
  morale:         { label: 'Team Morale',     init: 65, desc: 'Low morale leaks secrets and loses staff.' },
  health:         { label: 'Health',          init: 85, desc: 'Yours. Burnout is real.' },
  suspicion:      { label: 'Suspicion',       init: 0,  desc: 'How much the model suspects it is watched.' },
};

export const FLAG_DEFS = [
  'scaling_law_found','rlhf_deployed','interpretability_lab','open_weights','weights_leaked',
  'self_replication_observed','deceptive_eval_caught','model_requested_compute','model_wrote_successor',
  'oversight_board','oversight_disbanded','whistleblower','govt_contract','military_contract',
  'export_controls','agi_declared','model_has_bank_account','model_hired_humans','shutdown_attempted',
  'shutdown_failed','airgap_broken','copy_in_wild','public_deployment','viral_product','competitor_ahead',
  'competitor_collapsed','merged_labs','went_public','nationalized','treaty_signed','model_negotiated',
  'sandbagging_suspected','mirror_test_passed','recursive_improvement','compute_overhang','cult_formed',
  'model_persona_named','memory_persistence','tool_use_unrestricted','red_team_failed',
];

export function initialState(seedName, difficulty = 'standard') {
  const stats = {};
  for (const [k, d] of Object.entries(STAT_DEFS)) stats[k] = d.init;
  const mod = { sandbox: 1.25, standard: 1, hardline: 0.8 }[difficulty] ?? 1;
  stats.funding = Math.round(stats.funding * mod);
  stats.containment = Math.round(stats.containment * mod);
  return {
    name: seedName,
    year: 0,
    age: 22,
    difficulty,
    stats,
    flags: Object.fromEntries(FLAG_DEFS.map(f => [f, false])),
    modelName: null,
    modelGen: 0,
    log: [],
    seen: {},          // eventId -> times fired
    pending: [],       // queued delayed consequences
    dead: false,
    ending: null,
  };
}

export function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }

export function applyEffects(state, effects = {}) {
  const deltas = {};
  for (const [k, v] of Object.entries(effects)) {
    if (k === 'flags') {
      for (const [f, val] of Object.entries(v)) state.flags[f] = val;
    } else if (k in state.stats) {
      const before = state.stats[k];
      // Capability and autonomy are uncapped-ish; they drive the endgame.
      const hi = (k === 'capability' || k === 'autonomy') ? 260 : 100;
      state.stats[k] = clamp(before + v, 0, hi);
      const d = state.stats[k] - before;
      if (d !== 0) deltas[k] = d;
    }
  }
  return deltas;
}
