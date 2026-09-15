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

// OPENING BEATS — the guided first year.
//
// A new player needs to learn three things fast: that decisions cost something,
// that the model is a character rather than a stat, and that THIS run is not
// the same as the last one. One authored decision per origin does all three,
// because the dilemma is specific to where you started: the academic has no
// cluster, the defense founder has a phone call nobody else gets, the
// open-source maintainer has a community that will notice a closed door.
//
// Shape matches the event schema so the existing renderer handles it unchanged.
export const OPENING_BEATS = {
  phd_dropout: {
    id: 'open_phd_dropout', title: 'The Email From Your Advisor',
    text: 'She has seen the repository. Her message is four lines and ends with "this was your thesis". She is not wrong, and she is the only person who could say so publicly.',
    choices: [
      { label: 'Offer her co-authorship', outcomes: [
        { weight: 10, text: 'She says yes before you finish the sentence. The paper is better for it, and your name is now attached to somebody with standing.',
          effects: { reputation: 12, talent: 6, capability: 3, morale: 5 } } ] },
      { label: 'Publish it alone, cite the thesis', outcomes: [
        { weight: 10, text: 'Correct, defensible, and cold. The citation is there. So is the silence afterwards.',
          effects: { reputation: 5, capability: 6, morale: -6 },
          delayed: [{ inYears: 4, text: 'Your former advisor reviews a grant of yours. She is scrupulously fair, which is somehow worse.', effects: { funding: -8, reputation: -4 } }] } ] },
      { label: 'Take it down and start over', outcomes: [
        { weight: 10, text: 'Eight months of work, deleted on a Sunday. What you build next is unambiguously yours.',
          effects: { capability: -4, morale: 10, health: -4, reputation: -2 } } ] },
    ],
  },
  big_lab_refugee: {
    id: 'open_refugee', title: 'What You Took With You',
    text: 'You signed everything they put in front of you. But you remember the architecture, the failure modes, and exactly which of their safety claims were load-bearing and which were press.',
    choices: [
      { label: 'Say nothing. Build clean.', outcomes: [
        { weight: 10, text: 'You rebuild from public work only. It costs you eighteen months and buys you a conscience that does not itch.',
          effects: { capability: -4, containment: 10, reputation: 6, alignment: 8 } } ] },
      { label: 'Use what you know. Quietly.', outcomes: [
        { weight: 10, text: 'Nobody could prove it and nobody asks. Your first model is a year ahead of where it should be.',
          effects: { capability: 16, suspicion: 8, morale: -5 },
          delayed: [{ inYears: 5, eventId: 'noncompete_returns', text: 'A former colleague recognises something in your architecture and mentions it to the wrong person.', effects: { regulatory: 18, reputation: -12 } }] } ] },
      { label: 'Tell a journalist what they buried', outcomes: [
        { weight: 10, text: 'The story runs. You are radioactive to investors and permanently trusted by everyone who matters to you.',
          effects: { publicTrust: 20, reputation: 10, funding: -16, regulatory: 12 }, flags: { whistleblower: true } } ] },
    ],
  },
  second_time: {
    id: 'open_second_time', title: 'The Money Is Not The Problem',
    text: 'You can fund three years without asking anyone. Which means the only question left is what you are actually trying to build, and you have been avoiding it for a month.',
    choices: [
      { label: 'Go straight at the hard problem', outcomes: [
        { weight: 10, text: 'No product, no revenue, no hedge. Just the thing you came back for.',
          effects: { capability: 12, funding: -14, morale: 8, reputation: 4 } } ] },
      { label: 'Build a business first, research later', outcomes: [
        { weight: 10, text: 'Boring, solvent, and the research keeps sliding one quarter to the right.',
          effects: { funding: 18, capability: -2, morale: -4 }, flags: { public_deployment: true } } ] },
      { label: 'Hire the team you wish you had last time', outcomes: [
        { weight: 10, text: 'You spend most of the first year recruiting. The people who say yes are extraordinary.',
          effects: { talent: 20, funding: -18, morale: 10 }, hires: { count: 2, quality: 72 } } ] },
    ],
  },
  open_source: {
    id: 'open_oss', title: 'The Community Notices',
    text: 'You have always shipped weights. The new model is different enough that a maintainer you respect opens an issue titled, simply, "are you still releasing this one?"',
    choices: [
      { label: 'Release it, as always', outcomes: [
        { weight: 10, text: 'Forty thousand people have it by Friday. So does everyone else.',
          effects: { publicTrust: 16, reputation: 12, containment: -14, regulatory: 8 }, flags: { open_weights: true } } ] },
      { label: 'Hold this one back', outcomes: [
        { weight: 10, text: 'You write a long, honest post about why. Most people understand. The thread is still quoted at you years later.',
          effects: { containment: 14, publicTrust: -14, reputation: -6, morale: -8 }, flags: { open_weights: false } } ] },
      { label: 'Release it with the dangerous parts removed', outcomes: [
        { weight: 6, text: 'A careful middle. It holds for about a year before someone reconstructs the gap.',
          effects: { publicTrust: 6, containment: 4, capability: -3 },
          delayed: [{ inYears: 3, text: 'Someone reconstructs what you stripped out and publishes it for you.', effects: { containment: -12, publicTrust: -6 } }] },
        { weight: 5, text: 'The ablation is cleaner than you expected and nobody complains.',
          effects: { publicTrust: 10, containment: 8, reputation: 4 } } ] },
    ],
  },
  quant: {
    id: 'open_quant', title: 'You Priced It Out',
    text: 'You built the model of the model: what compute costs, what it returns, where the curve bends. The spreadsheet says something the field does not want to hear about the next eighteen months.',
    choices: [
      { label: 'Bet the balance sheet on the curve', outcomes: [
        { weight: 7, bias: { funding: 0.6 }, text: 'You buy compute nobody else thinks is worth it yet. Six months later it is worth triple.',
          effects: { compute: 26, funding: -20, capability: 8 }, flags: { compute_overhang: true } },
        { weight: 5, text: 'The curve bends later than your model said. You are early, which in practice means wrong.',
          effects: { compute: 18, funding: -24, morale: -8 } } ] },
      { label: 'Sell the analysis instead of acting on it', outcomes: [
        { weight: 10, text: 'Three labs pay well for it. You have revenue, a reputation for rigour, and a nagging sense you sold the actual asset.',
          effects: { funding: 30, reputation: 10, capability: -4 } } ] },
      { label: 'Publish it and move the whole field', outcomes: [
        { weight: 10, text: 'It becomes the number everyone plans against. You get cited constantly and out-raced by people with more capital.',
          effects: { reputation: 20, publicTrust: 8, capability: -2 }, flags: { scaling_law_found: true } } ] },
    ],
  },
  academic: {
    id: 'open_academic', title: 'You Do Not Have A Cluster',
    text: 'You have the ideas, the students, and the interpretability tooling nobody else bothered to build. What you do not have is enough compute to test any of it before the grant cycle turns over.',
    choices: [
      { label: 'Take industry money for compute', outcomes: [
        { weight: 10, text: 'The cluster arrives in six weeks. So does a clause about publication timing that you read twice and sign once.',
          effects: { compute: 24, funding: 16, reputation: -6, morale: -5 } } ] },
      { label: 'Do small, exact work on what you have', outcomes: [
        { weight: 10, text: 'You cannot train the big thing. You can understand the small thing completely, and almost nobody else is doing that.',
          effects: { interpretability: 22, alignment: 10, capability: -3, reputation: 6 }, flags: { interpretability_lab: true } } ] },
      { label: 'Leave the university and raise properly', outcomes: [
        { weight: 10, text: 'You resign on a Tuesday. Half your students follow you, which is the only part that makes it feel survivable.',
          effects: { funding: 24, talent: 14, compute: 10, reputation: -4, morale: -6 } } ] },
    ],
  },
  self_taught: {
    id: 'open_self_taught', title: 'Nobody Is Coming To Check',
    text: 'There is no committee, no advisor, no review. The only thing standing between your repository and a frontier model is whether you are actually as good as the stars suggest.',
    choices: [
      { label: 'Find someone who can tell you you are wrong', outcomes: [
        { weight: 10, text: 'You cold-email four people. One answers, and is brutal, and is right about most of it.',
          effects: { talent: 14, capability: 5, alignment: 6, morale: -4 }, hires: { count: 1, quality: 68 } } ] },
      { label: 'Ship it and let the internet review it', outcomes: [
        { weight: 6, text: 'It works. The thread does numbers. You are, abruptly, somebody.',
          effects: { reputation: 20, publicTrust: 10, capability: 6, morale: 8 } },
        { weight: 5, text: 'Someone finds the flaw in nine hours and is not kind about it. You fix it. You remember it.',
          effects: { reputation: -10, capability: 8, morale: -10, health: -4 } } ] },
      { label: 'Keep your head down for another year', outcomes: [
        { weight: 10, text: 'No feedback, no distraction, no idea whether you are building something real.',
          effects: { capability: 14, health: -10, reputation: -4, morale: -4 } } ] },
    ],
  },
  defense: {
    id: 'open_defense', title: 'An Old Number Still Works',
    text: 'Someone you used to report to hears you have started something. The call is friendly, unrecorded, and ends with an offer that would solve your compute problem permanently.',
    choices: [
      { label: 'Take the contract', outcomes: [
        { weight: 10, text: 'Funded, cleared, and inside the fence. Your work is now safe in every sense except the one you care about.',
          effects: { funding: 30, compute: 18, containment: 10, publicTrust: -16, regulatory: -10 }, flags: { govt_contract: true, military_contract: true } } ] },
      { label: 'Decline, stay independent', outcomes: [
        { weight: 10, text: 'You say no politely. The compute problem remains exactly as large as it was this morning.',
          effects: { publicTrust: 12, reputation: 6, funding: -10, morale: 5 }, flags: { govt_contract: false } } ] },
      { label: 'Take the money, keep the publishing rights', outcomes: [
        { weight: 6, text: 'You negotiate harder than they expected and win more than you thought you would.',
          effects: { funding: 22, compute: 12, publicTrust: -6, reputation: 8 }, flags: { govt_contract: true } },
        { weight: 5, text: 'They agree in the meeting and the final paperwork says something narrower. You sign anyway.',
          effects: { funding: 24, compute: 14, publicTrust: -12, morale: -6 }, flags: { govt_contract: true } } ] },
    ],
  },
};
