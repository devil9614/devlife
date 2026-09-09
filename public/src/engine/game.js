import { initialState, applyEffects } from './state.js';
import { makeRng } from './rng.js';
import { pickEvents, resolveChoice, advanceYear, checkEndings, matches, isEligible } from './engine.js';
import { ALL_EVENTS, ENDINGS } from '../data/index.js';
import { ACTIVITIES } from '../data/activities.js';
import { ORIGINS, COMPLICATIONS } from '../data/origins.js';
import { makeWorld, pickText } from './variation.js';

const MODEL_NAMES = ['Theta','Kestrel','Orrery','Vantage','Lantern','Praxis','Meridian','Halcyon',
  'Cinder','Wren','Aleph','Tessera','Junco','Vesper','Cardinal','Ostrom'];

export class Game {
  constructor({ seed = String(Date.now()), name = 'Unnamed Lab', difficulty = 'standard', origin = null } = {}) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.state = initialState(name, difficulty);
    this.state.modelName = this.rng.pick(MODEL_NAMES);
    this.state.age = this.rng.range(23, 38);   // you don't always start at 22

    // Per-run world detail — named people, rival labs, specific numbers. These
    // fill {tokens} in event text so two runs never read identically.
    this.world = makeWorld(this.rng);
    this.state.world = this.world;

    // Origin + complication: the run's starting position. Rolled unless the
    // player picked one explicitly.
    this.state.origin = origin
      ? ORIGINS.find(o => o.id === origin) || this.rng.pick(ORIGINS)
      : this.rng.pick(ORIGINS);
    this.state.complication = this.rng.pick(COMPLICATIONS);
    applyEffects(this.state, { ...this.state.origin.stats, flags: this.state.origin.flags || {} });
    applyEffects(this.state, this.state.complication.stats || {});

    // Each run gets a hidden taste profile: some events become much likelier,
    // others nearly vanish. This is what stops every life from marching through
    // the same spine of "mandatory" events.
    this.state._eventBias = {};
    for (const ev of ALL_EVENTS) {
      const roll = this.rng.next();
      this.state._eventBias[ev.id] =
        roll < 0.30 ? 0.04 :          // essentially absent from this life
        roll < 0.52 ? 0.35 :          // uncommon
        roll < 0.82 ? 1.0  :          // normal
                      2.4;            // a recurring theme of this life
    }

    this.queue = [];
    this.yearNotes = [];
    this.state.actionsLeft = 2;      // activities you may take per year
    this.state.cooldowns = {};       // activityId -> year it becomes available
    this.state.debtLoad = 0;         // outstanding bridge loans; makes debt compound
    this.refillQueue();
  }

  /** Event with its text resolved for this run (variants picked, tokens filled). */
  resolveEventText(ev) {
    if (!ev) return ev;
    return {
      ...ev,
      title: pickText(ev.title, this.rng, this.world, this.state),
      text: pickText(ev.textVariants || ev.text, this.rng, this.world, this.state),
      choices: ev.choices.map(c => ({ ...c, label: pickText(c.label, this.rng, this.world, this.state) })),
    };
  }

  refillQueue() {
    // Early years are fragile — fewer decisions per year until the lab has
    // revenue. Pacing ramps up as the run matures.
    const y = this.state.year;
    const n = y < 3 ? 1 : y < 7 ? this.rng.range(1, 2) : this.rng.range(2, 3);
    this.queue = pickEvents(this.state, ALL_EVENTS, this.rng, n);
    // Safety net: an empty pool must never strand the player, but it also must
    // not silently burn years of economy. Relax the repeat filter instead and
    // only advance time as a last resort, capped tightly.
    if (this.queue.length === 0 && !this.state.dead) {
      // Retry ignoring repeat-suppression entirely.
      const eligible = ALL_EVENTS.filter(e => isEligible(this.state, e));
      if (eligible.length) {
        this.queue = [this.rng.pick(eligible)];
      } else {
        let tries = 0;
        while (this.queue.length === 0 && !this.state.dead && tries++ < 3) {
          this.yearNotes = advanceYear(this.state, this.rng);
          this.checkEnd();
          if (this.state.dead) return;
          this.queue = pickEvents(this.state, ALL_EVENTS, this.rng, n);
        }
      }
    }
  }

  /**
   * The event on screen, with its text resolved for this run. Resolution is
   * cached per queued event so re-rendering never reshuffles the wording
   * underneath the player mid-decision.
   */
  get current() {
    const raw = this.queue[0];
    if (!raw) return null;
    if (this._shownFor !== raw) {
      this._shownFor = raw;
      this._shown = this.resolveEventText(raw);
    }
    return this._shown;
  }

  /** Apply a choice to the current event. Returns the outcome for display. */
  choose(choiceIndex) {
    const raw = this.queue[0];
    const shown = this.current;                  // resolved copy, for logging
    if (!raw || this.state.dead) return null;
    const choice = raw.choices[choiceIndex];
    if (!choice) return null;
    const res = resolveChoice(this.state, raw, choice, this.rng);
    // Outcome prose gets the same variant/token treatment as event text.
    res.outcome = { ...res.outcome,
      text: pickText(res.outcome.textVariants || res.outcome.text, this.rng, this.world, this.state) };
    this.queue.shift();
    this._shownFor = null;
    this.state.log.push({
      year: this.state.year, title: shown.title,
      choice: shown.choices[choiceIndex].label, text: res.outcome.text, deltas: res.deltas,
    });
    this.checkEnd();
    return res;
  }

  /** Move to the next year once the queue is empty. */
  nextYear() {
    if (this.state.dead) return [];
    this.yearNotes = advanceYear(this.state, this.rng);
    this.state.actionsLeft = 2;
    this.checkEnd();
    if (!this.state.dead) this.refillQueue();
    return this.yearNotes;
  }

  checkEnd() {
    if (this.state.dead) return;
    const e = checkEndings(this.state);
    if (e) {
      this.state.dead = true;
      this.state.ending = { ...e, ...ENDINGS[e.id] };
    }
  }

  /** A run is over when an ending fires. */
  get isOver() { return this.state.dead; }

  /** Activities the player can take right now. */
  availableActivities() {
    return ACTIVITIES.filter(a => {
      const cd = this.state.cooldowns[a.id];
      if (cd != null && this.state.year < cd) return false;
      return matches(this.state, a.requires);
    });
  }

  activityLocked(a) {
    const cd = this.state.cooldowns[a.id];
    if (cd != null && this.state.year < cd) return `available in ${cd - this.state.year}y`;
    if (!matches(this.state, a.requires)) return 'requirements not met';
    return null;
  }

  /** Perform an activity. Costs one action for the year. */
  doActivity(id) {
    if (this.state.dead || this.state.actionsLeft <= 0) return null;
    const a = ACTIVITIES.find(x => x.id === id);
    if (!a || this.activityLocked(a)) return null;

    // Compounding debt: every outstanding loan shrinks the principal you can
    // raise and grows what comes due. Six loans deep, borrowing is a net loss.
    let scaled = a;
    if (a.debtScaling) {
      const debt = this.state.debtLoad || 0;
      const shrink = Math.pow(0.72, debt);          // principal decays fast
      const growth = 1 + debt * 0.55;               // repayment grows
      scaled = { ...a, outcomes: a.outcomes.map(o => ({
        ...o,
        effects: { ...o.effects, funding: Math.round((o.effects.funding || 0) * shrink) },
        delayed: (o.delayed || []).map(d => ({
          ...d,
          effects: { ...d.effects, funding: Math.round((d.effects.funding || 0) * growth) },
        })),
      })) };
    }

    const res = resolveChoice(this.state, { id: a.id }, scaled, this.rng);
    if (!res) return null;
    res.outcome = { ...res.outcome,
      text: pickText(res.outcome.textVariants || res.outcome.text, this.rng, this.world, this.state) };
    this.state.actionsLeft -= 1;
    if (a.debtScaling) this.state.debtLoad = (this.state.debtLoad || 0) + 1;
    if (a.cooldown) this.state.cooldowns[a.id] = this.state.year + a.cooldown;
    this.state.log.push({
      year: this.state.year, title: a.label, choice: 'activity',
      text: res.outcome.text, deltas: res.deltas, kind: 'activity',
    });
    this.checkEnd();
    return res;
  }

  serialize() { return JSON.stringify({ seed: this.seed, state: this.state }); }
}
