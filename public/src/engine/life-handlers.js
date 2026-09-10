// Handlers for life actions. Each returns { text, deltas?, money?, people?, ... }
// so the UI can narrate a concrete result rather than a percentage change.

import { CAREER_LADDER, ASSETS, STOCKS, jobOf, fmtMoney, netWorth } from './life.js';
import { GIVEN_NAMES, FAMILY_NAMES } from './people.js';

const nm = rng => `${rng.pick(GIVEN_NAMES)} ${rng.pick(FAMILY_NAMES)}`;

function addPerson(L, rng, kind, opts = {}) {
  const p = {
    id: 'r' + rng.int(1e9).toString(36),
    name: opts.name || nm(rng),
    kind,
    closeness: opts.closeness ?? rng.range(40, 70),
    sprite: rng.int(1000),
    metYear: opts.year ?? 0,
    note: opts.note || '',
  };
  L.people.push(p);
  return p;
}

export const HANDLERS = {
  raise(state, rng) {
    const L = state.life, job = jobOf(L);
    if (rng.chance(0.55 + state.stats.reputation / 300)) {
      const bump = Math.round(job.salary * (0.12 + rng.next() * 0.18));
      L.salary = job.salary + bump;
      CAREER_LADDER[L.jobIndex] = { ...job, salary: job.salary + bump };
      return { text: `They came back with ${fmtMoney(bump)} more. You should have asked a year ago.`,
        deltas: { happiness: 6 } };
    }
    L.happiness -= 5;
    return { text: `"Let's revisit at the next cycle." You have heard that before.`, deltas: { happiness: -5 } };
  },

  jobhunt(state, rng) {
    const L = state.life;
    const next = Math.min(L.jobIndex + (rng.chance(0.4) ? 2 : 1), CAREER_LADDER.length - 2);
    const target = CAREER_LADDER[next];
    if (rng.chance(0.35 + state.stats.reputation / 200)) {
      L.jobIndex = next; L.employer = `${rng.pick(['Vela','Northgate','Ardent','Cormorant','Ninefold'])} AI`;
      const sign = rng.chance(0.5) ? rng.range(20000, 180000) : 0;
      L.cash += sign;
      return { text: `${L.employer} offered you ${target.title} at ${fmtMoney(target.salary)}`
        + (sign ? `, plus a ${fmtMoney(sign)} signing bonus.` : '. You took it.'),
        deltas: { happiness: 8 } };
    }
    return { text: `Four loops, one take-home, no offer. The rejection email is very polite.`,
      deltas: { happiness: -4 } };
  },

  found(state, rng) {
    const L = state.life;
    L.jobIndex = CAREER_LADDER.length - 1;
    L.employer = state.name;
    L.equity = 0.45;
    const co = addPerson(L, rng, 'cofounder', { year: state.year, closeness: rng.range(55, 85) });
    return { text: `You resign on a Friday and incorporate on the Monday. ${co.name} signs on as co-founder `
      + `for a third of the company and half the risk.`,
      deltas: { happiness: 10 } };
  },

  poach(state, rng) {
    const L = state.life;
    const cost = rng.range(150000, 450000);
    if (L.cash < cost) return { text: `You cannot cover the package. They stay where they are.` };
    L.cash -= cost;
    const p = addPerson(L, rng, 'rival', { year: state.year, closeness: 30 });
    return { text: `${fmtMoney(cost)} and a title bump brings them across. Their old boss, ${p.name}, `
      + `will not forget who did this.`,
      deltas: { capability: 10, morale: -4 } };
  },

  sabotage(state, rng) {
    const L = state.life;
    if (rng.chance(0.6)) {
      return { text: `The roadmap lands with a journalist. Their launch slips two quarters and nobody `
        + `traces it back to you. You know, though.`,
        deltas: { reputation: 6, publicTrust: -4, happiness: -6 } };
    }
    return { text: `It traces back. The industry is small and the story travels faster than the leak did.`,
      deltas: { reputation: -22, publicTrust: -18, happiness: -12 } };
  },

  shop(state, rng, { assetId } = {}) {
    const L = state.life;
    const def = ASSETS.find(a => a.id === assetId);
    if (!def) return null;
    if (L.cash < def.price) return { text: `You cannot afford the ${def.name} yet.` };
    L.cash -= def.price;
    L.owns.push({ assetId: def.id, boughtYear: state.year, value: def.price });
    return { text: `You bought the ${def.name.toLowerCase()} for ${fmtMoney(def.price)}.`,
      deltas: { happiness: Math.round(def.joy / 2) } };
  },

  invest(state, rng, { stockId, amount } = {}) {
    const L = state.life;
    const def = STOCKS.find(s => s.id === stockId);
    if (!def) return null;
    const amt = Math.min(amount || 0, L.cash);
    if (amt < 1000) return { text: `Too small to bother with.` };
    L.cash -= amt;
    const h = L.portfolio[def.id] || { shares: 0, basis: 100, price: 100 };
    const price = h.price ?? 100;
    h.shares += amt / price; h.price = price;
    L.portfolio[def.id] = h;
    return { text: `${fmtMoney(amt)} into ${def.name}.` };
  },

  sell(state, rng, { stockId } = {}) {
    const L = state.life;
    const h = L.portfolio[stockId];
    if (!h) return null;
    const def = STOCKS.find(s => s.id === stockId);
    const value = Math.round(h.shares * (h.price ?? h.basis));
    const cost = Math.round(h.shares * h.basis);
    L.cash += value;
    delete L.portfolio[stockId];
    const gain = value - cost;
    return { text: `Sold ${def.name} for ${fmtMoney(value)} — `
      + (gain >= 0 ? `up ${fmtMoney(gain)}.` : `down ${fmtMoney(-gain)}.`),
      deltas: { happiness: gain > 0 ? 5 : -5 } };
  },

  paydebt(state, rng) {
    const L = state.life;
    const pay = Math.min(L.cash, L.debt);
    L.cash -= pay; L.debt -= pay;
    return { text: L.debt === 0
      ? `You clear the last of it. ${fmtMoney(pay)} gone and nothing owed to anyone.`
      : `${fmtMoney(pay)} against the balance. ${fmtMoney(L.debt)} to go.`,
      deltas: { happiness: L.debt === 0 ? 10 : 3 } };
  },

  party(state, rng) {
    const L = state.life;
    L.cash -= rng.range(200, 2000);
    const roll = rng.next();
    if (roll < 0.28) {
      const p = addPerson(L, rng, 'friend', { year: state.year, closeness: rng.range(35, 60) });
      return { text: `You end up talking to ${p.name} for three hours about nothing important. `
        + `You exchange numbers and actually use them.`, deltas: { happiness: 8 } };
    }
    if (roll < 0.46 && !L.people.some(p => p.kind === 'partner')) {
      const p = addPerson(L, rng, 'fling', { year: state.year, closeness: rng.range(30, 65) });
      return { text: `You leave with ${p.name}. Neither of you pretends it is more than it is, `
        + `which is its own kind of honest.`, deltas: { happiness: 10, energy: -10 } };
    }
    if (roll < 0.58) {
      L.fame = Math.min(100, L.fame + rng.range(3, 9));
      return { text: `Someone films you holding forth about scaling laws at 2am. It does numbers.`,
        deltas: { happiness: 4, reputation: -3 } };
    }
    if (roll < 0.68) {
      return { text: `You spend the night explaining what you do to people who then explain it back to you incorrectly.`,
        deltas: { happiness: -2, energy: -8 } };
    }
    return { text: `A good night. You get home late and sleep badly and it was worth it.`,
      deltas: { happiness: 6, energy: -6 } };
  },

  friend(state, rng) {
    const L = state.life;
    const p = addPerson(L, rng, 'friend', { year: state.year, closeness: rng.range(45, 75) });
    return { text: `You and ${p.name} start getting dinner every few weeks. It sticks.`,
      deltas: { happiness: 7 } };
  },

  throwparty(state, rng) {
    const L = state.life;
    const cost = rng.range(15000, 60000);
    L.cash -= cost;
    L.fame = Math.min(100, L.fame + rng.range(5, 14));
    const made = rng.range(1, 3);
    for (let i = 0; i < made; i++) addPerson(L, rng, 'friend', { year: state.year, closeness: rng.range(30, 55) });
    return { text: `${fmtMoney(cost)} of party. ${made} people you now genuinely know, `
      + `and a photo of your kitchen in a magazine.`,
      deltas: { happiness: 12, reputation: 4 } };
  },

  gift(state, rng, { personId } = {}) {
    const L = state.life;
    const p = L.people.find(x => x.id === personId) || rng.pick(L.people.filter(x => !x.faded));
    if (!p) return null;
    const cost = rng.range(2000, 20000);
    L.cash -= cost;
    p.closeness = Math.min(100, p.closeness + rng.range(10, 25));
    return { text: `You spend ${fmtMoney(cost)} on something ${p.name} mentioned once, months ago. `
      + `They notice that you remembered.`, deltas: { happiness: 5 } };
  },

  date(state, rng) {
    const L = state.life;
    const roll = rng.next();
    if (roll < 0.4) {
      const p = addPerson(L, rng, 'partner', { year: state.year, closeness: rng.range(55, 80) });
      return { text: `${p.name} does something unrelated to any of this, which turns out to be the appeal. `
        + `Three months in it is clearly something.`, deltas: { happiness: 16 } };
    }
    if (roll < 0.62) {
      const p = addPerson(L, rng, 'fling', { year: state.year, closeness: rng.range(25, 50) });
      return { text: `You see ${p.name} for a few weeks. It is fun and it does not go anywhere.`,
        deltas: { happiness: 6 } };
    }
    return { text: `Six first dates. Four of them ask what an "eval" is. You stop checking the app.`,
      deltas: { happiness: -4 } };
  },

  flirtco(state, rng) {
    const L = state.life;
    const co = L.people.find(p => p.kind === 'cofounder');
    if (!co) return null;
    const roll = rng.next();
    if (roll < 0.35) {
      co.kind = 'partner'; co.closeness = Math.min(100, co.closeness + 20);
      return { text: `It turns out ${co.name} had been waiting for you to say something. `
        + `The company now has a dynamic nobody has told the board about.`,
        deltas: { happiness: 18, morale: -6 } };
    }
    if (roll < 0.62) {
      co.closeness = Math.max(0, co.closeness - 25);
      return { text: `${co.name} is kind about it and completely clear. Monday is awkward. `
        + `So is every Monday after that for a while.`,
        deltas: { happiness: -10, morale: -8 } };
    }
    co.closeness = Math.max(0, co.closeness - 40);
    return { text: `${co.name} raises it with the board as a governance concern, because it is one. `
      + `You are asked to sign something.`,
      deltas: { happiness: -16, morale: -14, reputation: -10 } };
  },

  serious(state, rng) {
    const L = state.life;
    const p = L.people.find(x => x.kind === 'partner');
    if (!p) return null;
    if (rng.chance(0.75 + p.closeness / 400)) {
      p.closeness = Math.min(100, p.closeness + 15);
      p.serious = true;
      return { text: `You and ${p.name} make it official. Your mother cries; so, later, do you.`,
        deltas: { happiness: 20 } };
    }
    p.closeness = Math.max(0, p.closeness - 20);
    return { text: `${p.name} says not yet, and means it kindly, and it still lands hard.`,
      deltas: { happiness: -12 } };
  },

  kid(state, rng) {
    const L = state.life;
    const p = L.people.find(x => x.kind === 'partner');
    if (!p) return null;
    const k = { name: nm(rng).split(' ')[0], age: 0, bornYear: state.year, sprite: rng.int(1000) };
    L.kids.push(k);
    return { text: `${k.name} is born at 4am on a Tuesday. You do not go to the lab for eleven days, `
      + `which is the longest break you have taken in years.`,
      deltas: { happiness: 24, energy: -18, capability: -4 } };
  },

  breakup(state, rng) {
    const L = state.life;
    const p = L.people.find(x => x.kind === 'partner');
    if (!p) return null;
    p.kind = 'ex';
    const cost = p.serious ? Math.round(netWorth(L) * 0.35) : 0;
    if (cost > 0) { L.cash = Math.max(0, L.cash - cost); }
    return { text: p.serious
      ? `The split takes fourteen months and ${fmtMoney(cost)}. ${p.name} keeps the house.`
      : `You end it with ${p.name} over a dinner you both knew was the last one.`,
      deltas: { happiness: -18 } };
  },
};
