// Text variation. The same event should not read identically twice.
//
// Two mechanisms:
//  1. `variants` — an event/outcome may supply an array of phrasings; one is
//     picked per firing, seeded by the run so replays stay deterministic.
//  2. `{tokens}` — inline slots filled from generated world detail (people,
//     companies, numbers) that persist for the run, so "Dr. Reyes" is the same
//     person every time she is mentioned within one life.

const FIRST = ['Reyes','Okonkwo','Lindqvist','Baptiste','Nakamura','Varga','Osei','Krishnan','Moreau','Dvorak','Silva','Haddad','Novak','Ferreira','Adeyemi','Solberg'];
const GIVEN = ['Mira','Tomas','Ada','Jun','Priya','Nils','Fatima','Owen','Leila','Kwame','Sasha','Ines','Dmitri','Nora','Hugo','Yara'];
const LABS  = ['Ardent','Northgate','Vela','Cormorant','Basilisk','Tessellate','Ninefold','Hollow Point','Cassini Works','Bright Harbor','Ophir','Longitude'];
const PAPERS = ['a scaling analysis','a mechanistic write-up','a safety case','an eval methodology','a training-dynamics note'];
const OUTLETS = ['a national broadsheet','a technology desk','an investigative outlet','a trade publication','a widely-read newsletter'];
const CITIES = ['Zurich','Singapore','Austin','Tallinn','Bangalore','Reykjavik','Montreal','Lagos'];

/** Deterministic per-run world detail. Built once, reused for the whole life. */
export function makeWorld(rng) {
  const person = () => `${rng.pick(GIVEN)} ${rng.pick(FIRST)}`;
  return {
    rival: rng.pick(LABS),
    rival2: rng.pick(LABS.filter(l => true)),
    safetyLead: person(),
    cofounder: person(),
    engineer: person(),
    journalist: person(),
    regulator: person(),
    investor: person(),
    paper: rng.pick(PAPERS),
    outlet: rng.pick(OUTLETS),
    city: rng.pick(CITIES),
    // Numbers that make a sentence feel specific rather than generic.
    seedRound: rng.range(4, 40),
    headcount: rng.range(6, 40),
    gpuCount: [rng.range(2, 9) + 'k', rng.range(12, 90) + 'k'][rng.int(2)],
    users: [rng.range(2, 40) + ' million', rng.range(80, 900) + ' thousand'][rng.int(2)],
  };
}

/** Fill {token} slots from world detail + live state. */
export function fill(text, world, state) {
  if (!text) return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => {
    if (world && key in world) return world[key];
    if (key === 'model') return state?.modelName ?? 'the model';
    if (key === 'lab') return state?.name ?? 'the lab';
    if (key === 'year') return String(state?.year ?? 0);
    return m;
  });
}

/**
 * Resolve a piece of content that may be a plain string or a {variants:[...]}
 * bundle. Picks deterministically from the run's rng.
 */
export function pickText(content, rng, world, state) {
  if (content == null) return '';
  const raw = Array.isArray(content) ? rng.pick(content) : content;
  return fill(raw, world, state);
}
