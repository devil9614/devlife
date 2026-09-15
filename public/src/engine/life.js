// LIFE — the part that makes this a life sim rather than a dashboard.
// Real dollars, a job title, people you know by name, things you own.
// Percentages measure abstractions; a life is measured in concrete nouns.

export const CAREER_LADDER = [
  { id: 'student',     title: 'CS Student',              salary: 0,       equity: 0 },
  { id: 'intern',      title: 'ML Intern',               salary: 48000,   equity: 0 },
  { id: 'junior',      title: 'Junior ML Engineer',      salary: 135000,  equity: 0 },
  { id: 'engineer',    title: 'ML Engineer',             salary: 210000,  equity: 0 },
  { id: 'senior',      title: 'Senior Research Engineer',salary: 340000,  equity: 0 },
  { id: 'staff',       title: 'Staff Research Scientist',salary: 520000,  equity: 0.001 },
  { id: 'lead',        title: 'Research Lead',           salary: 750000,  equity: 0.004 },
  { id: 'director',    title: 'Director of Research',    salary: 1100000, equity: 0.01 },
  { id: 'cto',         title: 'CTO',                     salary: 1800000, equity: 0.03 },
  { id: 'founder',     title: 'Founder & CEO',           salary: 250000,  equity: 0.45 },
];

export const RELATIONSHIP_KINDS = {
  friend:     { label: 'Friend' },
  partner:    { label: 'Partner' },
  spouse:     { label: 'Spouse' },
  ex:         { label: 'Ex' },
  fling:      { label: 'Fling' },
  cofounder:  { label: 'Co-founder' },
  rival:      { label: 'Rival' },
  mentor:     { label: 'Mentor' },
  child:      { label: 'Child' },
  investor:   { label: 'Investor' },
};

export const ASSET_CATEGORIES = [
  { id: 'property', label: 'Homes', icon: '🏡', note: 'A place to live, or a place to flex.' },
  { id: 'vehicle', label: 'Garage', icon: '🏎️', note: 'The useful and the ridiculous.' },
  { id: 'tech', label: 'Tech', icon: '🖥️', note: 'Hardware with a story.' },
  { id: 'luxury', label: 'Collectibles', icon: '⌚', note: 'Things people notice.' },
];

// Things you can actually own. Specific names make a purchase feel like a
// moment in a life, instead of a row in a spreadsheet.
export const ASSETS = [
  { id: 'gpu_rig',    name: 'NVIDIA DGX Spark rig',   price: 12000,    cat: 'tech',     drift:-0.15, joy: 4,  icon:'🖥️', visual:'gpu', desc:'A hot, loud little cluster for side projects.' },
  { id: 'used_car',   name: '2008 Honda Civic LX',    price: 9000,     cat: 'vehicle',  drift:-0.12, joy: 3,  icon:'🚗', visual:'civic', desc:'Reliable, humble, and already has a parking dent.' },
  { id: 'tesla',      name: 'Porsche Taycan Turbo S', price: 174000,   cat: 'vehicle',  drift:-0.10, joy: 9,  icon:'⚡', visual:'taycan', desc:'The launch-party arrival vehicle.' },
  { id: 'ferrari',    name: 'Ferrari 296 GTB',        price: 369000,   cat: 'vehicle',  drift:-0.13, joy: 14, icon:'🏎️', visual:'ferrari', desc:'A V6 hybrid with absolutely no subtlety.' },
  { id: 'condo',      name: 'SoMa loft, San Francisco', price: 620000, cat: 'property', drift: 0.05, joy: 10, icon:'🏙️', visual:'loft', desc:'Concrete, sunlight, and a view of somebody else shipping.' },
  { id: 'house',      name: 'Marin house with a garden',price: 1400000,cat: 'property', drift: 0.045,joy: 16, icon:'🏡', visual:'house', desc:'Enough rooms for a family and an accidental offsite.' },
  { id: 'watch',      name: 'Patek Philippe Nautilus',price: 38000,    cat: 'luxury',   drift: 0.02, joy: 6,  icon:'⌚', visual:'watch', desc:'A tiny, excellent way to signal that a round closed.' },
  { id: 'artwork',    name: 'Original generative artwork',price:120000,cat:'luxury',    drift: 0.06, joy: 7,  icon:'🖼️', visual:'art', desc:'A beautiful thing the group chat has opinions about.' },
  { id: 'jet_share',  name: 'Fractional Gulfstream share',price:900000,cat:'luxury',    drift:-0.14, joy:14, icon:'✈️', visual:'jet', desc:'For meetings nobody needed to take in person.' },
  { id: 'vineyard',   name: 'Napa micro-vineyard',    price: 3200000,  cat: 'property', drift: 0.03, joy: 20, icon:'🍇', visual:'vineyard', desc:'A long-term bet on dirt, weather, and dinner parties.' },
  { id: 'island',     name: 'Private island in Fiji', price: 24000000, cat: 'property', drift: 0.02, joy: 35, icon:'🏝️', visual:'island', desc:'Technically a terrible liquidity decision.' },
];

export const STOCKS = [
  { id: 'nvda', name: 'GPU maker',          ticker:'NVDA', vol: 0.34, drift: 0.14 },
  { id: 'idx',  name: 'Index fund',         ticker:'VTI',  vol: 0.11, drift: 0.07 },
  { id: 'rival',name: 'Rival lab (pre-IPO)',ticker:'RLAB', vol: 0.55, drift: 0.18 },
];

export const CRYPTO = [
  { id: 'bitcoin', name: 'Bitcoin', ticker:'BTC', icon:'₿', vol: 0.72, drift: 0.16 },
  { id: 'ethereum', name: 'Ethereum', ticker:'ETH', icon:'Ξ', vol: 0.88, drift: 0.18 },
  { id: 'ai_token', name: 'Frontier Compute', ticker:'FCT', icon:'◈', vol: 1.18, drift: 0.08 },
];

export function initialLife(rng) {
  return {
    cash: 4200 + rng.range(0, 9000),
    debt: rng.chance(0.45) ? rng.range(12000, 90000) : 0,   // student loans
    salary: 0,
    salaryOverride: null,     // custom salary from a raise, so the shared ladder stays untouched
    jobIndex: 0,
    employer: null,
    equity: 0,
    tenureStartYear: 0,       // year the current job began; raises/promotions need real time in the seat
    performance: 55,          // 0-100 standing at the current job; drives raise/promotion odds
    lastRaiseYear: null,
    lastReviewYear: null,
    owns: [],                 // {assetId, boughtYear, value}
    portfolio: {},            // stockId -> {shares, basis}
    crypto: {},               // coinId -> {units, basis, price}
    bank: {
      name: rng.pick(['Perimeter Bank', 'First Meridian', 'Sable & Co.']),
      creditScore: rng.range(610, 760),
      loans: [],               // {id, principal, rate, openedYear, purpose}
      lastSavedAt: null,
    },
    heat: 0,                  // consequences from scams and crimes
    people: [],               // relationships (separate from lab staff)
    kids: [],
    pregnancy: null,          // {withId, startedYear, dueYear}; births happen when time passes
    datingPool: [],           // relationship ids currently visible on the dating app
    fame: 0,                  // 0-100, drives party/press events
    happiness: 62,
    energy: 80,
    netWorthHistory: [],
  };
}

export function jobOf(life) {
  const rung = CAREER_LADDER[life.jobIndex] || CAREER_LADDER[0];
  return life.salaryOverride ? { ...rung, salary: life.salaryOverride } : rung;
}

export function netWorth(life) {
  const assets = life.owns.reduce((a, o) => a + o.value, 0);
  const stocks = Object.entries(life.portfolio)
    .reduce((a, [id, h]) => a + h.shares * (h.price ?? h.basis), 0);
  const crypto = Object.entries(life.crypto || {})
    .reduce((a, [id, h]) => a + h.units * (h.price ?? h.basis), 0);
  return Math.round(life.cash + assets + stocks + crypto - life.debt);
}

export function fmtMoney(n) {
  const neg = n < 0; const v = Math.abs(n);
  let s;
  if (v >= 1e9) s = '$' + (v / 1e9).toFixed(v >= 1e10 ? 0 : 1) + 'B';
  else if (v >= 1e6) s = '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M';
  else if (v >= 1e4) s = '$' + Math.round(v / 1e3) + 'k';
  else s = '$' + Math.round(v).toLocaleString('en-US');
  return (neg ? '-' : '') + s;
}

/** Yearly money: income, expenses, market moves, asset drift. */
export function tickLife(state, rng) {
  const L = state.life, notes = [];
  L.crypto ||= {};
  L.bank ||= { name:'Perimeter Bank', creditScore:680, loans:[] };
  L.bank.loans ||= [];
  L.heat ||= 0;
  L.datingPool ||= [];
  L.pregnancy ??= null;
  L.tenureStartYear ??= state.year;
  L.performance ??= 55;
  const job = jobOf(L);

  // Standing at the current job drifts toward a baseline each year: idle
  // tenure erodes it slowly, so a raise or promotion needs upkeep, not just
  // one lucky roll at the start.
  L.performance = Math.max(0, Math.min(100, L.performance + rng.range(-6, 3)));
  if (L.performance < 25 && rng.chance(0.18)) {
    notes.push({ kind:'warn', text:`Your manager flags slipping output at the review. ${job.title} is not guaranteed forever.` });
  }

  // Income
  const gross = job.salary + (L.equity > 0 ? Math.round(L.equity * 400000) : 0);
  const tax = Math.round(gross * 0.38);
  const lifestyle = Math.round(28000 + L.owns.length * 9000 + L.kids.length * 22000);
  const debtService = L.debt > 0 ? Math.round(Math.min(L.debt, Math.max(6000, L.debt * 0.12))) : 0;

  L.cash += gross - tax - lifestyle - debtService;
  if (debtService) {
    const principalPaid = Math.round(debtService * 0.55);
    L.debt = Math.max(0, L.debt - principalPaid);
    let remaining = principalPaid;
    for (const loan of L.bank.loans) {
      const paid = Math.min(loan.principal, remaining);
      loan.principal -= paid; remaining -= paid;
    }
    L.bank.loans = L.bank.loans.filter(loan => loan.principal > 1);
  }

  // Assets drift
  for (const o of L.owns) {
    const def = ASSETS.find(a => a.id === o.assetId);
    if (def) o.value = Math.max(0, Math.round(o.value * (1 + def.drift + rng.range(-3, 3) / 100)));
  }

  // Markets
  for (const [id, h] of Object.entries(L.portfolio)) {
    const def = STOCKS.find(s => s.id === id);
    if (!def) continue;
    const move = def.drift + (rng.next() - 0.5) * def.vol * 2;
    h.price = Math.max(0.01, (h.price ?? h.basis) * (1 + move));
    if (Math.abs(move) > 0.4) {
      notes.push({ kind: move > 0 ? 'good' : 'warn',
        text: `${def.name} ${move > 0 ? 'ripped' : 'cratered'} ${Math.round(Math.abs(move) * 100)}% this year.` });
    }
  }

  for (const [id, h] of Object.entries(L.crypto)) {
    const def = CRYPTO.find(c => c.id === id);
    if (!def) continue;
    const move = def.drift + (rng.next() - 0.5) * def.vol * 2;
    h.price = Math.max(0.01, (h.price ?? h.basis) * (1 + move));
    if (Math.abs(move) > 0.48) notes.push({ kind: move > 0 ? 'good' : 'warn',
      text: `${def.ticker} ${move > 0 ? 'pumped' : 'dumped'} ${Math.round(Math.abs(move) * 100)}% this year.` });
  }

  // Trouble is a pressure system, never free money. It creates fines, a hit to
  // reputation, and eventually a forced exit from a shady path.
  if (L.heat > 0 && rng.chance(Math.min(.72, L.heat / 180))) {
    const fine = Math.min(L.cash + 45000, Math.max(2500, Math.round(L.heat * 700 + rng.range(0, 12000))));
    L.cash -= fine;
    L.heat = Math.max(0, L.heat - rng.range(22, 48));
    L.bank.creditScore = Math.max(300, L.bank.creditScore - rng.range(18, 42));
    state.stats.reputation = Math.max(0, state.stats.reputation - rng.range(4, 12));
    notes.push({ kind:'warn', text:`A regulator turns up with questions and a ${fmtMoney(fine)} penalty. Your credit score takes the headline too.` });
  } else L.heat = Math.max(0, L.heat - rng.range(2, 7));

  // Broke is a real problem
  if (L.cash < 0) {
    const shortfall = -L.cash;
    L.debt += shortfall; L.cash = 0;
    L.happiness -= 8;
    notes.push({ kind: 'warn', text: `You covered a ${fmtMoney(shortfall)} shortfall with credit. It is going to compound.` });
  }

  // Relationships drift
  for (const p of L.people) {
    p.age = Math.max(18, Math.round(p.age ?? state.age));
    p.age += 1;
    p.metYear ??= state.year;
    p.conversations ??= 0;
    p.dates ??= 0;
    p.intimacyCount ??= 0;
    if (p.kind === 'match' && p.metYear < state.year && p.dates === 0 && p.conversations < 2) {
      p.faded = true;
      L.datingPool = L.datingPool.filter(id => id !== p.id);
      notes.push({ kind:'quiet', text:`${p.name}'s dating profile disappears before either of you makes a plan.` });
      continue;
    }
    if (p.kind === 'ex') continue;
    p.closeness = Math.max(0, Math.min(100, p.closeness + rng.range(-6, 4)));
    if ((p.kind === 'partner' || p.kind === 'spouse') && p.closeness < 20 && rng.chance(0.4)) {
      p.kind = 'ex';
      L.happiness -= 14;
      notes.push({ kind: 'warn', text: `${p.name} ended it. You had both seen it coming for a while.` });
    }
    if (p.kind === 'friend' && p.closeness < 8 && rng.chance(0.25)) {
      p.faded = true;
    }
  }

  // Kids age
  for (const k of L.kids) k.age += 1;

  // A child cannot arrive in the same click that starts a family. Pregnancy is
  // a visible, year-long commitment that resolves only after the next age-up.
  if (L.pregnancy && L.pregnancy.dueYear <= state.year) {
    const parent = L.people.find(p => p.id === L.pregnancy.withId);
    const names = ['Ari','Maya','Noah','Iris','Leo','Sana','Milo','Nia','Kai','Zoe'];
    const child = {
      name: rng.pick(names), age: 0, bornYear: state.year,
      sprite: rng.int(1000), parentId: parent?.id || null,
    };
    L.kids.push(child);
    notes.push({ kind:'good', text:`${child.name} is born. ${parent?.name || 'Your partner'} and you bring them home, and every plan becomes a little smaller and much more real.`, celebrate: 'baby' });
    L.pregnancy = null;
  }

  // Happiness pulls toward a baseline set by money, people and work
  const social = L.people.filter(p => !p.faded && p.kind !== 'ex' && p.kind !== 'match').length;
  const joy = L.owns.reduce((a, o) => a + (ASSETS.find(d => d.id === o.assetId)?.joy || 0), 0);
  const target = 40 + Math.min(20, social * 4) + Math.min(20, joy) - (L.debt > 200000 ? 12 : 0);
  L.happiness += Math.round((target - L.happiness) * 0.25);
  L.happiness = Math.max(0, Math.min(100, L.happiness));
  if (L.debt === 0) L.bank.creditScore = Math.min(850, L.bank.creditScore + rng.range(1, 5));

  L.netWorthHistory.push(netWorth(L));
  return notes;
}
