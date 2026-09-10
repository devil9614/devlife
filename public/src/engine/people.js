// PEOPLE — the lab is not a spreadsheet, it is a roster of named humans who
// arrive, get better or burn out, disagree with you, and leave. BitLife's
// relationships tab is half its soul; this is the equivalent.

// Wide, deliberately international pools. A long run hires dozens of people;
// with a small pool the birthday paradox produces duplicate names fast.
export const GIVEN_NAMES = [
  'Mira','Tomas','Ada','Jun','Priya','Nils','Fatima','Owen','Leila','Kwame','Sasha','Ines',
  'Dmitri','Nora','Hugo','Yara','Elif','Rafael','Anya','Theo','Amara','Bo','Clara','Idris','Mei','Ravi',
  'Sofia','Arjun','Lena','Kofi','Noor','Emil','Rin','Tobias','Zara','Marek','Aiko','Samir','Freya','Hassan',
  'Camila','Dario','Inga','Olu','Petra','Quan','Rosa','Sven','Tariq','Ulla','Viktor','Wen','Xiomara','Yusuf',
  'Zoya','Anders','Bianca','Chidi','Dara','Esben','Farida','Gabriel','Hana','Ivan','Jelena','Karim','Lucia',
  'Matteo','Nadia','Oskar','Pilar','Rania','Stefan','Thandi','Umberto','Vera','Wojciech','Yusra','Zeynep',
  'Akira','Beatriz','Cyrus','Dilnoza','Eero','Fanny','Goran','Hilde','Iris','Jonas','Kaia','Lars','Maja',
  'Niamh','Otto','Paloma','Rasmus','Sana','Tove','Ugo','Valentina','Wiktor','Yohan','Zainab',
];
export const FAMILY_NAMES = [
  'Reyes','Okonkwo','Lindqvist','Baptiste','Nakamura','Varga','Osei','Krishnan','Moreau',
  'Dvorak','Silva','Haddad','Novak','Ferreira','Adeyemi','Solberg','Bianchi','Ilves','Mensah','Costa',
  'Andersen','Brennan','Chowdhury','Dagher','Eriksen','Fontaine','Gallagher','Hoffmann','Ibrahim','Jansen',
  'Kaur','Larsen','Maalouf','Nguyen','Oyelaran','Petrov','Quintero','Rossi','Schneider','Tanaka',
  'Ustinov','Valdez','Wagner','Yamamoto','Zielinski','Abadi','Bergstrom','Castellanos','Dubois','Engel',
  'Farkas','Grigoryan','Hussain','Iversen','Jimenez','Kowalski','Lombardi','Mbeki','Nowak','Ortega',
  'Palmer','Rahman','Sandoval','Toure','Ulrich','Vasquez','Weber','Xu','Yilmaz','Zhang',
  'Ahmadi','Bakker','Cardoso','Delgado','Ekwueme','Fischer','Gustafsson','Hernandez','Ivanova','Joshi',
  'Kimura','Lindholm','Moreno','Nkemelu','Olsen','Pereira','Rasmussen','Suzuki','Trevino','Vinter',
];

export const ROLES = {
  research:   { label: 'Research Lead',    drives: 'capability' },
  safety:     { label: 'Safety Lead',      drives: 'alignment' },
  interp:     { label: 'Interpretability', drives: 'interpretability' },
  infra:      { label: 'Infrastructure',   drives: 'compute' },
  policy:     { label: 'Policy',           drives: 'regulatory' },
  ops:        { label: 'Operations',       drives: 'funding' },
};

// Traits shape how someone behaves — and what event text says about them.
export const TRAITS = [
  { id: 'brilliant',   label: 'Brilliant',      good: true,  note: 'Produces work nobody else could.' },
  { id: 'careful',     label: 'Careful',        good: true,  note: 'Has never shipped a thing they were unsure of.' },
  { id: 'fast',        label: 'Fast',           good: true,  note: 'Ships before anyone finishes the meeting.' },
  { id: 'principled',  label: 'Principled',     good: true,  note: 'Will resign over the right thing.' },
  { id: 'political',   label: 'Political',      good: false, note: 'Manages upward with unusual skill.' },
  { id: 'burnout',     label: 'Runs hot',       good: false, note: 'Works until something gives.' },
  { id: 'reckless',    label: 'Reckless',       good: false, note: 'Asks forgiveness, never permission.' },
  { id: 'loyal',       label: 'Loyal',          good: true,  note: 'Has turned down more money than you know.' },
  { id: 'ambitious',   label: 'Ambitious',      good: false, note: 'Wants your chair, eventually.' },
];

export function makePerson(rng, { role = null, quality = null, taken = null } = {}) {
  const roleId = role || rng.pick(Object.keys(ROLES));
  const skill = quality != null ? quality : rng.range(35, 80);
  // Colleagues must have distinct names — a duplicate on the roster reads as a
  // bug. Retry a bounded number of times, then fall back to a middle initial.
  let name = `${rng.pick(GIVEN_NAMES)} ${rng.pick(FAMILY_NAMES)}`;
  if (taken) {
    let tries = 0;
    while (taken.has(name) && tries++ < 24) {
      name = `${rng.pick(GIVEN_NAMES)} ${rng.pick(FAMILY_NAMES)}`;
    }
    if (taken.has(name)) {
      const initial = String.fromCharCode(65 + rng.int(26));
      const [g, f] = name.split(' ');
      name = `${g} ${initial}. ${f}`;
    }
  }
  return {
    id: 'p' + rng.int(1e9).toString(36) + rng.int(1e6).toString(36),
    name,
    role: roleId,
    skill,                       // 0-100, grows with tenure
    loyalty: rng.range(40, 85),  // resists poaching
    morale: rng.range(45, 85),
    trait: rng.pick(TRAITS).id,
    sprite: rng.int(1000),       // index into the 1000-frame portrait atlas
    joinedYear: 0,
    status: 'active',            // active | left | fired
    history: [],                 // notable moments, shown on their card
  };
}

// Portrait atlas: 1000 front-facing 32x64 frames in a 40-column grid.
export const SPRITE = { cols: 40, w: 32, h: 64, count: 1000, src: '/assets/people.png' };
export function spriteStyle(p, scale = 1) {
  const i = (p.sprite ?? 0) % SPRITE.count;
  const x = (i % SPRITE.cols) * SPRITE.w, y = Math.floor(i / SPRITE.cols) * SPRITE.h;
  return `background-image:url(${SPRITE.src});`
    + `background-position:-${x * scale}px -${y * scale}px;`
    + `background-size:${SPRITE.cols * SPRITE.w * scale}px auto;`
    + `width:${SPRITE.w * scale}px;height:${SPRITE.h * scale}px;`;
}

export function traitOf(p) { return TRAITS.find(t => t.id === p.trait) || TRAITS[0]; }
export function roleOf(p) { return ROLES[p.role] || ROLES.research; }

/** Founding team: a couple of people so the lab is never empty. */
export function foundingTeam(rng, year = 0) {
  const n = rng.range(1, 3);
  const roles = rng.shuffle(['research', 'infra', 'safety']).slice(0, n);
  const taken = new Set();
  return roles.map(r => {
    const p = makePerson(rng, { role: r, quality: rng.range(40, 70), taken });
    taken.add(p.name);
    p.joinedYear = year;
    p.history.push({ year, text: 'Founding team.' });
    return p;
  });
}

/** Yearly drift: people improve, tire, and occasionally walk. */
export function tickPeople(state, rng) {
  const notes = [];
  const active = state.people.filter(p => p.status === 'active');

  for (const p of active) {
    const tenure = state.year - p.joinedYear;
    // Skill grows with tenure, faster if morale is high.
    if (rng.chance(0.55)) p.skill = Math.min(100, p.skill + (p.morale > 60 ? 3 : 1));
    // Morale tracks the lab's.
    const pull = (state.stats.morale - p.morale) * 0.25;
    p.morale = Math.max(0, Math.min(100, p.morale + pull + rng.range(-4, 4)));

    if (p.trait === 'burnout' && rng.chance(0.18)) {
      p.morale -= 12;
      if (p.morale < 25 && rng.chance(0.5)) {
        p.status = 'left';
        p.history.push({ year: state.year, text: 'Burned out and stepped away.' });
        notes.push({ kind: 'warn', text: `${p.name} is taking indefinite leave. They were running on empty for a year.` });
        continue;
      }
    }

    // Low morale + low loyalty = attrition.
    if (p.morale < 30 && rng.chance((30 - p.morale) / 120)) {
      p.status = 'left';
      p.history.push({ year: state.year, text: 'Resigned.' });
      notes.push({ kind: 'warn', text: `${p.name} (${roleOf(p).label}) resigned. The exit conversation was short.` });
    }
  }

  // Talent stat reflects the roster rather than floating free.
  const roster = state.people.filter(p => p.status === 'active');
  if (roster.length) {
    const avg = roster.reduce((a, p) => a + p.skill, 0) / roster.length;
    state.stats.talent = Math.round(Math.max(0, Math.min(100, avg * 0.7 + roster.length * 2.2)));
  } else {
    state.stats.talent = Math.max(0, state.stats.talent - 8);
  }
  return notes;
}

export function activePeople(state) { return state.people.filter(p => p.status === 'active'); }
export function alumni(state) { return state.people.filter(p => p.status !== 'active'); }
