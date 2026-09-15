// Handlers for life actions. Each returns { text, deltas?, money?, people?, ... }
// so the UI can narrate a concrete result rather than a percentage change.

import { CAREER_LADDER, ASSETS, STOCKS, CRYPTO, jobOf, fmtMoney, netWorth } from './life.js';
import { GIVEN_NAMES, FEMININE_GIVEN_NAMES, MASCULINE_GIVEN_NAMES, FEMME_AVATARS, FAMILY_NAMES } from './people.js';

const nm = (rng, presentation = null) => {
  const names = presentation === 'woman' ? FEMININE_GIVEN_NAMES
    : presentation === 'man' ? MASCULINE_GIVEN_NAMES : GIVEN_NAMES;
  return `${rng.pick(names)} ${rng.pick(FAMILY_NAMES)}`;
};

// The first new connection of each social type deliberately has a feminine
// presentation. This guarantees that friends and flings are visually varied
// in a fresh life, then keeps the pool balanced as it grows.
function socialPresentation(L, rng, kind) {
  const sameKind = L.people.filter(p => p.kind === kind && !p.faded);
  if (!sameKind.some(p => p.presentation === 'woman')) return 'woman';
  const women = sameKind.filter(p => p.presentation === 'woman').length;
  const men = sameKind.filter(p => p.presentation === 'man').length;
  return women <= men ? 'woman' : (rng.chance(0.5) ? 'woman' : 'man');
}

function compatibleAge(state, rng) {
  // The dating pool stays plausibly close in age: especially important for
  // early-adult lives, where an 18-year-old meeting a 45-year-old should never
  // be presented as a normal option.
  const spread = state.age < 25 ? 6 : state.age < 35 ? 9 : 12;
  return rng.range(Math.max(18, state.age - spread), state.age + spread);
}

function pronoun(p, capital = false) {
  const word = p.presentation === 'woman' ? 'she' : 'he';
  return capital ? word[0].toUpperCase() + word.slice(1) : word;
}

function addPerson(L, rng, kind, opts = {}) {
  const presentation = opts.presentation || (rng.chance(0.5) ? 'woman' : 'man');
  // Do not replace a co-worker's existing atlas portrait when they become a
  // friend. New women use the dedicated feminine avatar pack.
  const visual = presentation === 'woman' && opts.sprite == null && !opts.spriteAsset
    ? rng.pick(FEMME_AVATARS) : {};
  const p = {
    id: 'r' + rng.int(1e9).toString(36),
    name: opts.name || nm(rng, presentation),
    kind,
    closeness: opts.closeness ?? rng.range(40, 70),
    sprite: opts.sprite ?? rng.int(1000),
    presentation,
    ...visual,
    age: Math.max(18, Math.round(opts.age ?? rng.range(22, 44))),
    metYear: opts.year ?? 0,
    conversations: opts.conversations ?? 0,
    dates: opts.dates ?? 0,
    intimacyCount: opts.intimacyCount ?? 0,
    lastDateYear: opts.lastDateYear ?? null,
    note: opts.note || '',
  };
  L.people.push(p);
  return p;
}

function partnerOf(L) { return L.people.find(p => p.kind === 'partner' || p.kind === 'spouse'); }
function startPregnancy(L, state, p) {
  if (L.pregnancy) return false;
  L.pregnancy = { withId:p.id, startedYear:state.year, dueYear:state.year + 1 };
  return true;
}
function ensureBank(L) {
  L.bank ||= { name: 'Perimeter Bank', creditScore: 680, loans: [] };
  L.bank.loans ||= [];
  return L.bank;
}
function loanLimit(L) {
  const bank = ensureBank(L);
  return Math.max(10000, Math.round((bank.creditScore - 470) * 2600 + Math.max(0, jobOf(L).salary || L.salary) * .7 - L.debt * .25));
}
function addLoan(state, amount, purpose) {
  const L = state.life, bank = ensureBank(L);
  const rate = Math.max(.055, .19 - (bank.creditScore - 600) / 3000);
  L.debt += amount;
  bank.loans.push({ id:`loan_${state.year}_${bank.loans.length + 1}`, principal:amount, rate, openedYear:state.year, purpose });
  bank.creditScore = Math.max(300, bank.creditScore - Math.max(2, Math.round(amount / 90000)));
  return rate;
}
function ownAsset(L, state, def) { L.owns.push({ assetId:def.id, boughtYear:state.year, value:def.price }); }

export const HANDLERS = {
  grind(state, rng) {
    const L = state.life, job = jobOf(L);
    L.performance = Math.min(100, (L.performance ?? 55) + rng.range(6, 14));
    const beats = [
      `You ship the unglamorous thing nobody wanted to own. Someone notices.`,
      `You stay late fixing a mess that was not yours to fix. Your manager clocks it.`,
      `You mentor the newest hire through their first real incident. It goes well.`,
    ];
    return { text: rng.pick(beats), deltas: { happiness: -3, energy: -8 } };
  },

  raise(state, rng) {
    const L = state.life, job = jobOf(L);
    const tenure = state.year - (L.tenureStartYear ?? state.year);
    if (tenure < 1) return { text: `You started this role this year. Ask again once you have a track record to point to.` };
    const perf = L.performance ?? 55;
    if (perf < 40) return { text: `${L.employer || 'Your manager'} is polite but clear: the last review was not strong enough to build a case on.` };
    if (rng.chance(0.4 + perf / 200 + state.stats.reputation / 400)) {
      const bump = Math.round(job.salary * (0.10 + rng.next() * 0.16 + perf / 800));
      L.salaryOverride = job.salary + bump;
      L.lastRaiseYear = state.year;
      L.performance = Math.max(0, perf - 12);
      return { text: `They came back with ${fmtMoney(bump)} more. ${tenure} year${tenure===1?'':'s'} in the seat finally paid off.`,
        deltas: { happiness: 6 }, celebrate: 'money' };
    }
    L.performance = Math.max(0, perf - 8);
    return { text: `"Let's revisit at the next cycle." You have heard that before.`, deltas: { happiness: -5 } };
  },

  jobhunt(state, rng) {
    const L = state.life;
    const tenure = state.year - (L.tenureStartYear ?? state.year);
    const perf = L.performance ?? 55;
    const next = Math.min(L.jobIndex + (rng.chance(0.4) ? 2 : 1), CAREER_LADDER.length - 2);
    const target = CAREER_LADDER[next];
    if (rng.chance(0.28 + perf / 250 + state.stats.reputation / 300)) {
      L.jobIndex = next; L.employer = `${rng.pick(['Vela','Northgate','Ardent','Cormorant','Ninefold'])} AI`;
      L.salaryOverride = null;
      L.tenureStartYear = state.year;
      L.performance = 55;
      const sign = rng.chance(0.5) ? rng.range(20000, 180000) : 0;
      L.cash += sign;
      return { text: `${L.employer} offered you ${target.title} at ${fmtMoney(target.salary)}`
        + (sign ? `, plus a ${fmtMoney(sign)} signing bonus.` : '. You took it.')
        + (tenure < 1 ? ` Leaving this early raises an eyebrow, but nobody asks twice.` : ''),
        deltas: { happiness: 8 }, celebrate: 'milestone' };
    }
    return { text: `Four loops, one take-home, no offer. The rejection email is very polite.`,
      deltas: { happiness: -4 } };
  },

  found(state, rng) {
    const L = state.life;
    L.jobIndex = CAREER_LADDER.length - 1;
    L.employer = state.name;
    L.equity = 0.45;
    L.salaryOverride = null;
    L.tenureStartYear = state.year;
    L.performance = 55;
    const co = addPerson(L, rng, 'cofounder', { year: state.year, age:compatibleAge(state,rng), closeness: rng.range(55, 85) });
    return { text: `You resign on a Friday and incorporate on the Monday. ${co.name} signs on as co-founder `
      + `for a third of the company and half the risk.`,
      deltas: { happiness: 10 }, celebrate: 'milestone' };
  },

  poach(state, rng) {
    const L = state.life;
    const cost = rng.range(150000, 450000);
    if (L.cash < cost) return { text: `You cannot cover the package. They stay where they are.` };
    L.cash -= cost;
    const p = addPerson(L, rng, 'rival', { year: state.year, age:compatibleAge(state,rng), closeness: 30 });
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
    if (L.owns.some(o => o.assetId === def.id)) return { text: `The ${def.name} is already in your life.` };
    if (L.cash < def.price) return {
      text: `The ${def.name} costs ${fmtMoney(def.price)}. You are ${fmtMoney(def.price - L.cash)} short.`,
      finance: { assetId:def.id, shortfall:def.price - L.cash, limit:loanLimit(L) },
    };
    L.cash -= def.price;
    ownAsset(L, state, def);
    return { text: `You bought the ${def.name.toLowerCase()} for ${fmtMoney(def.price)}.`,
      deltas: { happiness: Math.round(def.joy / 2) } };
  },

  financeAsset(state, rng, { assetId } = {}) {
    const L = state.life, def = ASSETS.find(a => a.id === assetId);
    if (!def || L.owns.some(o => o.assetId === def.id)) return null;
    const shortfall = Math.max(0, def.price - L.cash), limit = loanLimit(L);
    if (shortfall > limit) return { text: `${ensureBank(L).name} will only approve ${fmtMoney(limit)} today. You need more cash or a cheaper asset.` };
    const down = L.cash, rate = addLoan(state, shortfall, def.name);
    L.cash = 0; ownAsset(L, state, def);
    return { text: `${ensureBank(L).name} finances the ${def.name} with ${fmtMoney(down)} down and ${fmtMoney(shortfall)} at ${(rate * 100).toFixed(1)}% APR. It is yours — and so is the payment.`, deltas:{ happiness:Math.round(def.joy / 2), energy:-2 } };
  },

  bankLoan(state, rng, { amount } = {}) {
    const L = state.life, bank = ensureBank(L), ask = Math.max(5000, Math.round(amount || Math.max(10000, loanLimit(L) * .25))), limit = loanLimit(L);
    if (ask > limit) return { text: `${bank.name} declines the ${fmtMoney(ask)} request. Your current limit is ${fmtMoney(limit)}.`, deltas:{ happiness:-3 } };
    const rate = addLoan(state, ask, 'personal credit'); L.cash += ask;
    return { text: `${bank.name} wires ${fmtMoney(ask)} to your account at ${(rate * 100).toFixed(1)}% APR. The number in your app climbs; so does the obligation.`, deltas:{ happiness:2 } };
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

  buyCrypto(state, rng, { coinId, amount } = {}) {
    const L = state.life, def = CRYPTO.find(c => c.id === coinId);
    if (!def) return null;
    const amt = Math.min(Math.max(0, amount || 0), L.cash);
    if (amt < 250) return { text: `The exchange minimum is ${fmtMoney(250)}.` };
    L.cash -= amt; L.crypto ||= {};
    const h = L.crypto[def.id] || { units:0, basis:100, price:100 }, price = h.price ?? 100;
    h.units += amt / price; h.price = price; L.crypto[def.id] = h;
    return { text: `${fmtMoney(amt)} into ${def.name}. The chart immediately becomes your personality.`, deltas:{ happiness:2 } };
  },

  sellCrypto(state, rng, { coinId } = {}) {
    const L = state.life, h = L.crypto?.[coinId], def = CRYPTO.find(c => c.id === coinId);
    if (!h || !def) return null;
    const value = Math.round(h.units * (h.price ?? h.basis)), cost = Math.round(h.units * h.basis), gain = value - cost;
    L.cash += value; delete L.crypto[coinId];
    return { text: `You cash out ${def.ticker} for ${fmtMoney(value)} — ${gain >= 0 ? `up ${fmtMoney(gain)}` : `down ${fmtMoney(-gain)}`}.`, deltas:{ happiness:gain >= 0 ? 4 : -4 } };
  },

  paydebt(state, rng) {
    const L = state.life;
    const pay = Math.min(L.cash, L.debt);
    L.cash -= pay; L.debt -= pay;
    const bank = ensureBank(L); let remaining = pay;
    for (const loan of bank.loans) { const chunk=Math.min(loan.principal,remaining); loan.principal-=chunk; remaining-=chunk; }
    bank.loans = bank.loans.filter(loan=>loan.principal>1);
    bank.creditScore = Math.min(850, bank.creditScore + Math.max(2, Math.round(pay / 25000)));
    return { text: L.debt === 0
      ? `You clear the last of it. ${fmtMoney(pay)} gone and nothing owed to anyone.`
      : `${fmtMoney(pay)} against the balance. ${fmtMoney(L.debt)} to go.`,
      deltas: { happiness: L.debt === 0 ? 10 : 3 } };
  },

  party(state, rng) {
    const L = state.life;
    const committed = partnerOf(L);
    L.cash -= Math.min(L.cash, rng.range(200, 2000));
    const roll = rng.next();
    if (roll < 0.28) {
      const p = addPerson(L, rng, 'friend', { year: state.year, age:compatibleAge(state,rng), closeness: rng.range(35, 60), presentation:socialPresentation(L, rng, 'friend') });
      return { text: `You end up talking to ${p.name} for three hours about nothing important. `
        + `You exchange numbers and actually use them.`, deltas: { happiness: 8 } };
    }
    if (roll < 0.46) {
      const p = addPerson(L, rng, 'fling', { year: state.year, age:compatibleAge(state,rng), closeness: rng.range(30, 65), presentation:socialPresentation(L, rng, 'fling') });
      p.affair = Boolean(committed);
      return { text: committed
        ? `You leave with ${p.name} even though ${committed.name} is waiting at home. It is a line crossed, not a harmless story.`
        : `You leave with ${p.name}. Neither of you pretends it is more than it is, which is its own kind of honest.`,
        deltas: { happiness: committed ? 3 : 10, energy: -10, reputation: committed ? -2 : 0 } };
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
    const p = addPerson(L, rng, 'friend', { year: state.year, age:compatibleAge(state,rng), closeness: rng.range(45, 75), presentation:socialPresentation(L, rng, 'friend') });
    return { text: `You and ${p.name} start getting dinner every few weeks. It sticks.`,
      deltas: { happiness: 7 } };
  },

  throwparty(state, rng) {
    const L = state.life;
    const cost = Math.min(L.cash, rng.range(15000, 60000));
    L.cash -= cost;
    L.fame = Math.min(100, L.fame + rng.range(5, 14));
    const made = rng.range(1, 3);
    for (let i = 0; i < made; i++) addPerson(L, rng, 'friend', { year: state.year, age:compatibleAge(state,rng), closeness: rng.range(30, 55), presentation:socialPresentation(L, rng, 'friend') });
    return { text: `${fmtMoney(cost)} of party. ${made} people you now genuinely know, `
      + `and a photo of your kitchen in a magazine.`,
      deltas: { happiness: 12, reputation: 4 } };
  },

  gift(state, rng, { personId } = {}) {
    const L = state.life;
    const p = L.people.find(x => x.id === personId) || rng.pick(L.people.filter(x => !x.faded));
    if (!p) return null;
    const cost = Math.min(L.cash, rng.range(2000, 20000));
    L.cash -= cost;
    p.closeness = Math.min(100, p.closeness + rng.range(10, 25));
    return { text: `You spend ${fmtMoney(cost)} on something ${p.name} mentioned once, months ago. `
      + `They notice that you remembered.`, deltas: { happiness: 5 } };
  },

  dateApps(state, rng) {
    const L = state.life;
    L.datingPool ||= [];
    const live = L.people.filter(p => p.kind === 'match' && !p.faded);
    if (live.length) return { text: `Your current matches are still waiting for a reply. A profile is not a relationship yet.`, dating:true };
    const matches = [];
    for (let i = 0; i < 3; i++) {
      const presentation = rng.chance(0.52) ? 'woman' : 'man';
      const p = addPerson(L, rng, 'match', {
        year:state.year, age:compatibleAge(state,rng), presentation,
        closeness:rng.range(10, 22), note:'Matched on Signal', conversations:0, dates:0,
      });
      matches.push(p);
    }
    L.datingPool = matches.map(p => p.id);
    return { text: `Signal gives you three actual profiles — people around your age with enough in common to start a conversation, not skip one.`, dating:true };
  },

  flirtco(state, rng) {
    const L = state.life;
    const co = L.people.find(p => p.kind === 'cofounder');
    if (!co) return null;
    co.conversations ??= 0;
    if (co.conversations < 2) {
      co.conversations += 1;
      co.closeness = Math.min(100, co.closeness + rng.range(3, 8));
      return { text: `You let the conversation with ${co.name} run a little too long after work. ${pronoun(co,true)} notices — but neither of you rushes it.`, deltas:{ happiness:4 } };
    }
    if (state.year <= (co.metYear ?? state.year)) return { text:`There is chemistry, but you built a company together this year. Let the friendship have some time before you make it complicated.` };
    const roll = rng.next();
    if (roll < 0.35) {
      co.cofounder = true; co.kind = 'partner'; co.dates = Math.max(3, co.dates || 0); co.closeness = Math.min(100, co.closeness + 20);
      return { text: `It turns out ${co.name} had been waiting for you to say something. `
        + `The company now has a dynamic nobody has told the board about.`,
        deltas: { happiness: 18, morale: -6 }, celebrate: 'love' };
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
    if ((p.dates || 0) < 3 || state.year - (p.metYear ?? state.year) < 2) {
      return { text: `You care about ${p.name}, but you have not had enough ordinary life together to make that promise yet.` };
    }
    if (rng.chance(0.75 + p.closeness / 400)) {
      p.closeness = Math.min(100, p.closeness + 15); p.kind = 'spouse'; p.marriedYear = state.year;
      return { text: `You and ${p.name} get married. Your mother cries; so, later, do you.`,
        deltas: { happiness: 20 }, celebrate: 'love' };
    }
    p.closeness = Math.max(0, p.closeness - 20);
    return { text: `${p.name} says not yet, and means it kindly, and it still lands hard.`,
      deltas: { happiness: -12 } };
  },

  kid(state, rng) {
    const L = state.life;
    const p = partnerOf(L);
    if (!p) return null;
    if (L.pregnancy) return { text: `There is already a baby due next year. For once, the calendar is not yours to control.` };
    if ((p.dates || 0) < 3 || state.year - (p.metYear ?? state.year) < 2) {
      return { text: `You and ${p.name} talk about a family, then agree to give the relationship more time first.` };
    }
    startPregnancy(L, state, p);
    return { text: `You and ${p.name} decide to try for a child. A positive test turns next year into a due date — not an instant ending card.`,
      deltas: { happiness: 16, energy: -5 } };
  },

  breakup(state, rng) {
    const L = state.life;
    const p = partnerOf(L);
    if (!p) return null;
    const wasSpouse = p.kind === 'spouse';
    p.kind = 'ex';
    const cost = wasSpouse ? Math.round(Math.max(0, netWorth(L)) * 0.35) : 0;
    if (cost > 0) { L.cash = Math.max(0, L.cash - cost); }
    return { text: cost
      ? `The split takes fourteen months and ${fmtMoney(cost)}. ${p.name} keeps the house.`
      : `You end it with ${p.name} over a dinner you both knew was the last one.`,
      deltas: { happiness: -18 } };
  },

  relationship(state, rng, { personId, action } = {}) {
    const L = state.life, p = L.people.find(x => x.id === personId);
    if (!p || p.faded) return null;
    p.conversations ??= 0; p.dates ??= 0; p.intimacyCount ??= 0; p.metYear ??= state.year;
    const committed = partnerOf(L);
    const affair = committed && committed.id !== p.id;
    if (action === 'talk') {
      p.conversations += 1;
      p.closeness = Math.min(100, p.closeness + rng.range(4, 9));
      const beats = [
        `You and ${p.name} trade messages that keep turning into voice notes. ${pronoun(p,true)} asks a question that proves ${pronoun(p)} was listening.`,
        `Coffee becomes a walk, then a conversation neither of you is eager to end.`,
        `You learn the unglamorous details of ${p.name}'s life. It feels more real than a good profile ever could.`,
      ];
      return { text: beats[Math.min(beats.length - 1, p.conversations - 1)], deltas:{ happiness:4 } };
    }
    if (action === 'spend') {
      p.closeness = Math.min(100, p.closeness + rng.range(7, 16));
      p.conversations += 1;
      return { text: `You make time for ${p.name}. No pitch, no agenda — just a good evening.`, deltas:{ happiness:5 } };
    }
    if (action === 'gift') {
      if (L.cash < 100) return { text: `You want to do something thoughtful, but you need more than ${fmtMoney(L.cash)} in your account.` };
      const cost = Math.min(L.cash, rng.range(100, 3000)); L.cash -= cost;
      p.closeness = Math.min(100, p.closeness + rng.range(9, 18));
      return { text: `You send ${p.name} a ${fmtMoney(cost)} gift that proves you were listening.`, deltas:{ happiness:4 } };
    }
    if (action === 'date' && ['match','friend','fling','cofounder'].includes(p.kind)) {
      if (p.conversations < 3) return { text: `${p.name} is not a date button. Have a few real conversations first — you still have ${3 - p.conversations} to go.` };
      if (state.year <= p.metYear) return { text: `You have some momentum, but you met ${p.name} this year. Let the conversation live outside your screen before asking for a date.` };
      if (p.lastDateYear === state.year) return { text: `You already had a date with ${p.name} this year. Let it breathe before turning it into a relationship milestone.` };
      const cost = Math.min(L.cash, rng.range(60, 450)), odds = .30 + p.closeness / 150 + (p.kind === 'fling' ? .12 : 0);
      L.cash -= cost;
      p.lastDateYear = state.year;
      if (rng.chance(odds)) {
        p.dates += 1; p.closeness = Math.min(100, p.closeness + 12);
        if (p.dates >= 3) {
          p.cofounder ||= p.kind === 'cofounder'; p.kind = 'partner';
          return { text: `After ${p.dates} dates across real years, you and ${p.name} stop calling it casual. You are together.`, deltas:{ happiness:16, morale:p.cofounder ? -3 : 0 }, celebrate: 'love' };
        }
        return { text: `${p.name} says yes. Date ${p.dates} is easy in a way you did not expect — no label yet, just momentum.`, deltas:{ happiness:10 } };
      }
      p.closeness = Math.max(0, p.closeness - rng.range(4, 12));
      return { text: `${p.name} is kind but clear: not like that. You both decide how weird to make the next week.`, deltas:{ happiness:-5 } };
    }
    if (action === 'propose' && p.kind === 'partner') {
      if ((p.dates || 0) < 3 || state.year - p.metYear < 2) return { text: `You need more shared time with ${p.name} before asking for forever.` };
      if (p.closeness < 55) return { text: `${p.name} is not ready for that question yet. More life first.` };
      if (rng.chance(.36 + p.closeness / 120)) {
        p.kind = 'spouse'; p.marriedYear = state.year; p.closeness = Math.min(100, p.closeness + 14);
        return { text: `${p.name} says yes. You call people you love until the battery gives up.`, deltas:{ happiness:22 }, celebrate: 'love' };
      }
      p.closeness = Math.max(0, p.closeness - 18);
      return { text: `${p.name} says not yet. There is no villain, but there is a very long walk home.`, deltas:{ happiness:-12 } };
    }
    if ((action === 'intimacy_protected' || action === 'intimacy_unprotected') && ['partner','spouse','fling'].includes(p.kind)) {
      if (state.age < 18 || p.age < 18) return { text: `This relationship is not at an adult stage.` };
      p.intimacyCount += 1;
      p.closeness = Math.min(100, p.closeness + rng.range(4, 10));
      if (affair) {
        committed.closeness = Math.max(0, committed.closeness - rng.range(10, 20));
        p.affair = true;
      }
      if (action === 'intimacy_unprotected' && !L.pregnancy && rng.chance(p.kind === 'fling' ? .18 : .12)) {
        startPregnancy(L, state, p);
        return { text: affair
          ? `A consensual night with ${p.name} becomes much more complicated a few weeks later: there is a baby due next year.`
          : `A consensual night with ${p.name} becomes a positive test a few weeks later. There is a baby due next year.`,
          deltas:{ happiness:affair ? -4 : 12, energy:-5 } };
      }
      return { text: affair
        ? `You spend the night with ${p.name}. It is consensual, adult, and still a betrayal that changes what you bring home.`
        : action === 'intimacy_protected'
          ? `You and ${p.name} have a protected, consensual night together. It brings you closer without turning into a due date.`
          : `You and ${p.name} choose not to use protection. Nothing changes immediately, but it is a choice with a future.`,
        deltas:{ happiness:affair ? 1 : 7, energy:-4 } };
    }
    if (action === 'try_child' && (p.kind === 'partner' || p.kind === 'spouse')) {
      if (L.pregnancy) return { text:`There is already a baby due next year.` };
      if ((p.dates || 0) < 3 || state.year - p.metYear < 2) return { text:`You and ${p.name} want to build a family, but you decide to let the relationship grow first.` };
      startPregnancy(L, state, p);
      return { text:`You and ${p.name} decide to try for a child. A positive test means a baby is due next year.`, deltas:{ happiness:16, energy:-5 } };
    }
    if (action === 'breakup' && (p.kind === 'partner' || p.kind === 'spouse')) {
      const wasSpouse = p.kind === 'spouse', cost = wasSpouse ? Math.round(Math.max(0, netWorth(L)) * .30) : 0;
      p.kind = 'ex'; L.cash = Math.max(0, L.cash - cost);
      if (L.pregnancy?.withId === p.id) L.pregnancy = null;
      return { text:wasSpouse ? `The divorce takes a year and ${fmtMoney(cost)}. Your shared calendar becomes a stranger.` : `You end things with ${p.name}. It hurts because it mattered.`, deltas:{ happiness:-18 } };
    }
    return { text: `You check in with ${p.name}. It is a small thing, which is how relationships survive.`, deltas:{ happiness:2 } };
  },

  befriendCoworker(state, rng, { worker } = {}) {
    const L = state.life;
    if (!worker) return null;
    const existing = L.people.find(p => p.name === worker.name);
    if (existing) return { text: `${worker.name} is already in your life. Tap their card to decide what happens next.` };
    const p = addPerson(L, rng, 'friend', { name:worker.name, age:compatibleAge(state,rng), closeness:rng.range(35, 58), year:state.year, note:worker.role, sprite:worker.sprite, presentation:worker.presentation || 'man' });
    return { text: `You ask ${p.name} to get coffee after work. It turns into a real friendship, not networking.`, deltas:{ happiness:7 } };
  },

  scam(state, rng) {
    const L = state.life; L.heat ||= 0; const roll = rng.next();
    if (roll < .42) { const cash=rng.range(1500,26000); L.cash+=cash; L.heat+=rng.range(18,34); return { text:`A shady growth scheme pays ${fmtMoney(cash)}. It also leaves screenshots, complaints, and a knot in your stomach.`, deltas:{ reputation:-6, happiness:-3 } }; }
    if (roll < .78) { const loss=Math.min(L.cash,rng.range(900,14000)); L.cash-=loss; L.heat+=rng.range(8,22); return { text:`The scheme turns out to be a scam aimed at you. You lose ${fmtMoney(loss)} and learn a boring lesson fast.`, deltas:{ happiness:-6 } }; }
    L.heat+=rng.range(28,52); return { text:'The campaign is stopped before launch. A platform asks for records, and now you have questions to answer.', deltas:{ reputation:-10, happiness:-8 } };
  },

  crime(state, rng) {
    const L = state.life; L.heat ||= 0; const roll=rng.next();
    if (roll < .30) { const cash=rng.range(4000,40000); L.cash+=cash; L.heat+=rng.range(32,58); return { text:`A fictional back-channel deal clears ${fmtMoney(cash)}. The reward is real; the risk is now following you.`, deltas:{ reputation:-12, happiness:-5 } }; }
    const fine=Math.min(L.cash,rng.range(2000,22000)); L.cash-=fine; L.heat+=rng.range(20,45);
    return { text:`The shortcut falls apart. You pay ${fmtMoney(fine)} in legal costs and spend the night wondering why you tried it.`, deltas:{ reputation:-9, happiness:-8 } };
  },
};
