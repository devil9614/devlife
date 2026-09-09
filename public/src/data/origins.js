// ORIGINS — where this life starts. Rolled at character creation, the way
// BitLife rolls your country, family and stats. Two runs should not open the
// same way, and the opening should already imply a different playstyle.

export const ORIGINS = [
  {
    id: 'phd_dropout',
    label: 'PhD dropout',
    blurb: 'You left the program eight months before submitting. Your advisor still emails.',
    stats: { capability: 6, talent: 10, reputation: -6, funding: -6, morale: 8 },
    flags: {},
    opener: 'You left the program eight months before submitting. The thesis is still on your drive, unfinished, next to the thing you left to build.',
  },
  {
    id: 'big_lab_refugee',
    label: 'Frontier lab refugee',
    blurb: 'You were senior somewhere enormous. You resigned over something you will not discuss.',
    stats: { capability: 14, reputation: 18, talent: 12, funding: 10, morale: -8, suspicion: 6 },
    flags: { scaling_law_found: true },
    opener: 'You were senior at a lab everyone has heard of. You resigned in a meeting that is still being talked about, and took nothing with you but what you already knew.',
  },
  {
    id: 'second_time',
    label: 'Second-time founder',
    blurb: 'Your last company sold for enough. This one is supposed to matter more.',
    stats: { funding: 34, reputation: 10, talent: 6, capability: -2, health: -6 },
    flags: {},
    opener: 'Your last company sold for a number that ended the money question permanently. That turned out to be the easy part.',
  },
  {
    id: 'open_source',
    label: 'Open-source maintainer',
    blurb: 'Forty thousand stars and no salary. People trust you.',
    stats: { reputation: 20, publicTrust: 18, talent: 8, funding: -12, compute: -4 },
    flags: { open_weights: true },
    opener: 'Forty thousand stars, nine years of unpaid weekends, and a community that trusts you more than it trusts anyone with a budget.',
  },
  {
    id: 'quant',
    label: 'Ex-quant',
    blurb: 'You know exactly what compute costs and exactly what it is worth.',
    stats: { funding: 26, compute: 12, capability: 4, publicTrust: -8, morale: -4 },
    flags: {},
    opener: 'Eleven years pricing risk taught you two things: what compute actually costs, and how badly people estimate tail events.',
  },
  {
    id: 'academic',
    label: 'Tenured academic',
    blurb: 'You have a lab, a waitlist of graduate students, and glacial funding.',
    stats: { interpretability: 18, talent: 14, reputation: 14, funding: -10, compute: -6 },
    flags: { interpretability_lab: true },
    opener: 'You have tenure, a waitlist of graduate students, and a grant cycle that moves like geology. What you do not have is a cluster.',
  },
  {
    id: 'self_taught',
    label: 'Self-taught',
    blurb: 'No credentials. A GitHub that speaks for itself.',
    stats: { capability: 10, talent: -4, reputation: -10, funding: -4, morale: 12, health: 6 },
    flags: {},
    opener: 'No degree, no network, no permission. Just a repository that a few of the right people have quietly starred.',
  },
  {
    id: 'defense',
    label: 'Out of defense',
    blurb: 'You have clearances, contacts, and a very particular set of instincts.',
    stats: { funding: 20, compute: 14, containment: 14, publicTrust: -14, regulatory: -8 },
    flags: { govt_contract: true },
    opener: 'You spent your twenties somewhere with no windows. You left with clearances, contacts, and instincts about failure modes that nobody in this industry shares.',
  },
];

// A few starting complications, rolled independently — the "family situation"
// slot. They make two runs with the same origin still diverge.
export const COMPLICATIONS = [
  { id: 'none', label: 'Clean slate', blurb: 'Nothing in the way.', stats: {}, opener: '' },
  { id: 'debt', label: 'In debt', blurb: 'You financed the first year yourself.', stats: { funding: -12, morale: -4 },
    opener: 'You financed the first eighteen months on personal credit, which you have told nobody.' },
  { id: 'sick_parent', label: 'Caring for someone', blurb: 'Someone at home needs you.', stats: { health: -10, morale: -6 },
    opener: 'Someone at home needs you three evenings a week. That is not negotiable and it is not going to change.' },
  { id: 'noncompete', label: 'Under a non-compete', blurb: 'Your old employer is watching.', stats: { regulatory: 12, reputation: -6 },
    opener: 'Your former employer\'s lawyers sent a letter reminding you of clauses you had genuinely forgotten.' },
  { id: 'famous', label: 'Briefly famous', blurb: 'A thread of yours went viral last year.', stats: { reputation: 12, publicTrust: 8, morale: -4 },
    opener: 'A thread you wrote last year reached several million people, which means strangers have opinions about you now.' },
  { id: 'cofounder', label: 'A committed co-founder', blurb: 'Someone believed you early.', stats: { talent: 10, morale: 10, funding: -4 },
    opener: 'Someone good said yes when saying yes was irrational. You think about that more than you admit.' },
];
