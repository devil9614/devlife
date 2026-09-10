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
  ex:         { label: 'Ex' },
  fling:      { label: 'Fling' },
  cofounder:  { label: 'Co-founder' },
  rival:      { label: 'Rival' },
  mentor:     { label: 'Mentor' },
  child:      { label: 'Child' },
  investor:   { label: 'Investor' },
};

// Things you can actually own. Price in dollars; some appreciate.
export const ASSETS = [
  { id: 'gpu_rig',    name: 'Home GPU rig',          price: 12000,    cat: 'tech',    drift:-0.15, joy: 4 },
  { id: 'used_car',   name: 'Used Civic',            price: 9000,     cat: 'vehicle', drift:-0.12, joy: 3 },
  { id: 'condo',      name: 'City condo',            price: 620000,   cat: 'property',drift: 0.05, joy: 10 },
  { id: 'tesla',      name: 'Electric coupe',        price: 74000,    cat: 'vehicle', drift:-0.10, joy: 8 },
  { id: 'house',      name: 'House with a garden',   price: 1400000,  cat: 'property',drift: 0.045,joy: 16 },
  { id: 'watch',      name: 'Absurd watch',          price: 38000,    cat: 'luxury',  drift: 0.02, joy: 6 },
  { id: 'artwork',    name: 'A painting you like',   price: 120000,   cat: 'luxury',  drift: 0.06, joy: 7 },
  { id: 'jet_share',  name: 'Fractional jet share',  price: 900000,   cat: 'luxury',  drift:-0.14, joy: 14 },
  { id: 'vineyard',   name: 'Small vineyard',        price: 3200000,  cat: 'property',drift: 0.03, joy: 20 },
  { id: 'island',     name: 'An actual island',      price: 24000000, cat: 'property',drift: 0.02, joy: 35 },
];

export const STOCKS = [
  { id: 'nvda', name: 'GPU maker',        vol: 0.34, drift: 0.14 },
  { id: 'idx',  name: 'Index fund',       vol: 0.11, drift: 0.07 },
  { id: 'rival',name: "Rival lab (pre-IPO)",vol:0.55, drift: 0.18 },
  { id: 'crypto',name:'Something volatile',vol: 0.85, drift: 0.05 },
];

export function initialLife(rng) {
  return {
    cash: 4200 + rng.range(0, 9000),
    debt: rng.chance(0.45) ? rng.range(12000, 90000) : 0,   // student loans
    salary: 0,
    jobIndex: 0,
    employer: null,
    equity: 0,
    owns: [],                 // {assetId, boughtYear, value}
    portfolio: {},            // stockId -> {shares, basis}
    people: [],               // relationships (separate from lab staff)
    kids: [],
    fame: 0,                  // 0-100, drives party/press events
    happiness: 62,
    energy: 80,
    netWorthHistory: [],
  };
}

export function jobOf(life) { return CAREER_LADDER[life.jobIndex] || CAREER_LADDER[0]; }

export function netWorth(life) {
  const assets = life.owns.reduce((a, o) => a + o.value, 0);
  const stocks = Object.entries(life.portfolio)
    .reduce((a, [id, h]) => a + h.shares * (h.price ?? h.basis), 0);
  return Math.round(life.cash + assets + stocks - life.debt);
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
  const job = jobOf(L);

  // Income
  const gross = job.salary + (L.equity > 0 ? Math.round(L.equity * 400000) : 0);
  const tax = Math.round(gross * 0.38);
  const lifestyle = Math.round(28000 + L.owns.length * 9000 + L.kids.length * 22000);
  const debtService = L.debt > 0 ? Math.round(Math.min(L.debt, Math.max(6000, L.debt * 0.12))) : 0;

  L.cash += gross - tax - lifestyle - debtService;
  if (debtService) L.debt = Math.max(0, L.debt - Math.round(debtService * 0.55));

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

  // Broke is a real problem
  if (L.cash < 0) {
    const shortfall = -L.cash;
    L.debt += shortfall; L.cash = 0;
    L.happiness -= 8;
    notes.push({ kind: 'warn', text: `You covered a ${fmtMoney(shortfall)} shortfall with credit. It is going to compound.` });
  }

  // Relationships drift
  for (const p of L.people) {
    if (p.kind === 'ex') continue;
    p.closeness = Math.max(0, Math.min(100, p.closeness + rng.range(-6, 4)));
    if (p.kind === 'partner' && p.closeness < 20 && rng.chance(0.4)) {
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

  // Happiness pulls toward a baseline set by money, people and work
  const social = L.people.filter(p => !p.faded && p.kind !== 'ex').length;
  const joy = L.owns.reduce((a, o) => a + (ASSETS.find(d => d.id === o.assetId)?.joy || 0), 0);
  const target = 40 + Math.min(20, social * 4) + Math.min(20, joy) - (L.debt > 200000 ? 12 : 0);
  L.happiness += Math.round((target - L.happiness) * 0.25);
  L.happiness = Math.max(0, Math.min(100, L.happiness));

  L.netWorthHistory.push(netWorth(L));
  return notes;
}
