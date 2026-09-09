import { initialState } from './state.js';
import { makeRng } from './rng.js';
import { pickEvents, resolveChoice, advanceYear, checkEndings, matches, isEligible } from './engine.js';
import { ALL_EVENTS, ENDINGS } from '../data/index.js';
import { ACTIVITIES } from '../data/activities.js';

const MODEL_NAMES = ['Theta','Kestrel','Orrery','Vantage','Lantern','Praxis','Meridian','Halcyon'];

export class Game {
  constructor({ seed = String(Date.now()), name = 'Unnamed Lab', difficulty = 'standard' } = {}) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.state = initialState(name, difficulty);
    this.state.modelName = this.rng.pick(MODEL_NAMES);
    this.queue = [];
    this.yearNotes = [];
    this.state.actionsLeft = 2;      // activities you may take per year
    this.state.cooldowns = {};       // activityId -> year it becomes available
    this.state.debtLoad = 0;         // outstanding bridge loans; makes debt compound
    this.refillQueue();
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

  get current() { return this.queue[0] || null; }

  /** Apply a choice to the current event. Returns the outcome for display. */
  choose(choiceIndex) {
    const ev = this.current;
    if (!ev || this.state.dead) return null;
    const choice = ev.choices[choiceIndex];
    if (!choice) return null;
    const res = resolveChoice(this.state, ev, choice, this.rng);
    this.queue.shift();
    this.state.log.push({
      year: this.state.year, title: ev.title,
      choice: choice.label, text: res.outcome.text, deltas: res.deltas,
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
