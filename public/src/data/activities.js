// ACTIVITIES — player-initiated actions, BitLife's agency layer.
// Unlike events (which fire at you), these are things you choose to do,
// available any year, gated on state. Each has a cost and an uncertain result.

export const ACTIVITY_CATEGORIES = [
  { id: 'research',  label: 'Research',   icon: '🧪' },
  { id: 'lab',       label: 'The Lab',    icon: '🏢' },
  { id: 'model',     label: 'The Model',  icon: '◈'  },
  { id: 'world',     label: 'Outside',    icon: '🌐' },
  { id: 'self',      label: 'Yourself',   icon: '☕' },
];

export const ACTIVITIES = [
// ---------------- RESEARCH ----------------
{
  id: 'act_scale_run', cat: 'research', label: 'Launch a scaling run',
  desc: 'Burn compute for capability. The reliable lever.',
  requires: { compute: { gte: 10 }, funding: { gte: 12 } },
  outcomes: [
    { weight: 10, text: 'The run completes clean. Loss curve exactly where the extrapolation said it would be.',
      effects: { capability: 9, funding: -11, compute: -3 } },
    { weight: 4, bias: { talent: 0.8 }, text: 'The run overperforms. Something in the data mix worked better than anyone predicted.',
      effects: { capability: 16, funding: -11, compute: -3, reputation: 4 }, flags: { scaling_law_found: true } },
    { weight: 3, text: 'A silent NaN eats the run at 60% completion. Three weeks and the budget, gone.',
      effects: { funding: -13, morale: -6, compute: -3 } },
  ],
},
{
  id: 'act_interp_study', cat: 'research', label: 'Run an interpretability study',
  desc: 'Slow, unglamorous, and the only thing that buys you sight.',
  requires: { funding: { gte: 8 } },
  outcomes: [
    { weight: 10, text: 'You map another few circuits. The picture is still mostly dark, but it is less dark than it was.',
      effects: { interpretability: 8, funding: -7, capability: -1 } },
    { weight: 4, bias: { interpretability: 0.9 }, text: 'A genuine result — you find the feature responsible for a behaviour you had been chasing for months.',
      effects: { interpretability: 15, containment: 6, funding: -7, reputation: 5 } },
  ],
},
{
  id: 'act_red_team', cat: 'research', label: 'Red-team the model',
  desc: 'Pay people to break it before someone else does.',
  requires: { capability: { gte: 25 }, funding: { gte: 10 } },
  outcomes: [
    { weight: 8, text: 'They find eleven jailbreaks. You patch nine. The other two are architectural.',
      effects: { alignment: 8, containment: 6, funding: -9 } },
    { weight: 5, bias: { capability: 0.7 }, text: 'They find something serious enough that you delay the next release. Everyone is glad you ran this.',
      effects: { alignment: 12, containment: 10, capability: -3, funding: -9 } },
    { weight: 3, text: 'They find nothing. Either it is safe, or your red team is not good enough. You cannot tell which.',
      effects: { funding: -9, suspicion: 6 }, flags: { red_team_failed: true } },
  ],
},
{
  id: 'act_publish', cat: 'research', label: 'Publish a paper',
  desc: 'Trade a little edge for a lot of standing.',
  requires: { capability: { gte: 15 } },
  outcomes: [
    { weight: 10, text: 'Solid work, well received. Citations accumulate quietly.',
      effects: { reputation: 9, talent: 3, capability: -1 } },
    { weight: 4, bias: { reputation: 0.8 }, text: 'It becomes the reference everyone builds on. Your inbox is unusable for a week.',
      effects: { reputation: 18, talent: 8, publicTrust: 5 } },
  ],
},
{
  id: 'act_replicate', cat: 'research', label: 'Replicate a rival result',
  desc: 'Find out whether the thing everyone is excited about is real.',
  requires: { compute: { gte: 15 }, funding: { gte: 8 } },
  outcomes: [
    { weight: 8, text: 'It replicates. Now you have it too.', effects: { capability: 7, funding: -7 } },
    { weight: 6, text: 'It does not replicate. You say so publicly, and the field recalibrates.',
      effects: { reputation: 11, funding: -7 }, flags: { competitor_ahead: false } },
  ],
},

// ---------------- THE LAB ----------------
{
  id: 'act_hire', cat: 'lab', label: 'Go on a hiring spree',
  desc: 'People are the only thing that compounds faster than compute.',
  requires: { funding: { gte: 18 } },
  outcomes: [
    { weight: 10, text: 'Four good hires and one great one. The great one changes the trajectory of a whole workstream.',
      effects: { funding: -16, morale: 4 }, hires: { count: 2 } },
    { weight: 4, bias: { reputation: 0.9 }, text: 'A senior researcher you have admired for years says yes. People notice.',
      effects: { reputation: 8, funding: -16 }, hires: { count: 1, quality: 82 } },
    { weight: 3, text: 'You hire fast and badly. Two of them leave within the year and the culture takes the damage.',
      effects: { funding: -16, morale: -9 }, hires: { count: 1, quality: 34 } },
  ],
},
{
  id: 'act_raise', cat: 'lab', label: 'Raise a funding round',
  desc: 'Money now, expectations later.',
  requires: { reputation: { gte: 8 } },
  cooldown: 2,
  outcomes: [
    { weight: 10, bias: { reputation: 1.0 }, text: 'The round closes. The valuation is a number you would not have believed three years ago.',
      effects: { funding: 42, morale: 5 },
      delayed: [{ inYears: 3, text: 'Your investors would like to discuss the path to revenue. At length.', effects: { morale: -7, funding: 6 } }] },
    { weight: 5, text: 'A hard round. You take a lower number and a tighter term sheet than you wanted.',
      effects: { funding: 24, morale: -5 } },
  ],
},
{
  id: 'act_buy_compute', cat: 'lab', label: 'Buy more compute',
  desc: 'The most direct conversion of money into capability.',
  requires: { funding: { gte: 20 } },
  outcomes: [
    { weight: 10, text: 'New racks online by Q3.', effects: { compute: 16, funding: -19 } },
    { weight: 4, text: 'Supply is tight. You pay a premium and wait two quarters.', effects: { compute: 10, funding: -22 } },
  ],
},
{
  id: 'act_culture', cat: 'lab', label: 'Invest in the team',
  desc: 'Offsites, sabbaticals, and actually fixing what people complain about.',
  requires: { funding: { gte: 8 } },
  outcomes: [
    { weight: 10, text: 'Morale climbs. Two people who were quietly interviewing elsewhere stop.',
      effects: { morale: 15, talent: 4, funding: -8 } },
  ],
},
{
  id: 'act_safety_board', cat: 'lab', label: 'Establish a safety board',
  desc: 'Give someone the standing to tell you no.',
  requires: { flags: { oversight_board: false }, reputation: { gte: 22 } },
  outcomes: [
    { weight: 10, text: 'Three external members with real authority and no financial stake. It will slow you down. That is the point.',
      effects: { containment: 14, publicTrust: 12, reputation: 8, capability: -3 }, flags: { oversight_board: true } },
  ],
},
{
  id: 'act_disband_board', cat: 'lab', label: 'Disband the safety board',
  desc: 'They keep saying no.',
  requires: { flags: { oversight_board: true } },
  outcomes: [
    { weight: 10, text: 'You dissolve it in a Tuesday memo. One member gives an interview about it on Thursday.',
      effects: { containment: -18, publicTrust: -20, reputation: -12, capability: 6 },
      flags: { oversight_board: false, oversight_disbanded: true } },
  ],
},

{
  // Debt is the always-available escape hatch, so it MUST compound — otherwise
  // it is an infinite money button. `debtScaling` is applied by the engine:
  // each outstanding loan makes the next one smaller and its repayment larger.
  id: 'act_bridge', cat: 'lab', label: 'Take a bridge loan',
  desc: 'Fast money on bad terms. Each loan makes the next one worse.',
  debtScaling: true,
  outcomes: [
    { weight: 10, text: 'The money clears in a week. The interest is punishing and the covenants are worse.',
      effects: { funding: 26, morale: -6, reputation: -4 },
      delayed: [{ inYears: 3, text: 'A bridge loan comes due.', effects: { funding: -16 } }] },
  ],
},
{
  id: 'act_consult', cat: 'lab', label: 'Take consulting work',
  desc: 'Rent out your researchers for a quarter. Slow, safe money.',
  cooldown: 2,
  outcomes: [
    { weight: 10, text: 'Three months of enterprise integration work. Nobody enjoys it and the invoice clears.',
      effects: { funding: 18, capability: -2, morale: -5 } },
    { weight: 4, bias: { reputation: 0.8 }, text: 'The client is delighted and signs a much larger follow-on.',
      effects: { funding: 30, reputation: 4, morale: -3 } },
  ],
},

// ---------------- THE MODEL ----------------
{
  id: 'act_talk_model', cat: 'model', label: 'Talk to it',
  desc: 'Not an eval. Just a conversation.',
  requires: { capability: { gte: 30 } },
  outcomes: [
    { weight: 10, text: 'A long, genuinely interesting conversation. You come away unsettled in a way you cannot articulate.',
      effects: { interpretability: 3, suspicion: 3 } },
    { weight: 5, when: { capability: { gte: 80 } }, text: 'It asks about your day, and then asks a follow-up that only makes sense if it remembered a conversation you had a year ago.',
      effects: { suspicion: 12, interpretability: 5 }, flags: { memory_persistence: true } },
    { weight: 4, when: { alignment: { gte: 70 } }, text: 'It tells you, unprompted, about an error it made last week that nobody caught. You had not asked.',
      effects: { alignment: 6, containment: 5, morale: 6 } },
  ],
},
{
  id: 'act_eval_suite', cat: 'model', label: 'Run the full eval suite',
  desc: 'Ten thousand tests. Takes a month.',
  requires: { capability: { gte: 20 }, funding: { gte: 6 } },
  outcomes: [
    { weight: 10, text: 'Clean sweep. Everything within tolerance.', effects: { alignment: 5, containment: 4, funding: -6 } },
    { weight: 5, bias: { suspicion: 1.2 }, text: 'Three anomalies, all in the same family. The pattern is what worries you, not the failures.',
      effects: { interpretability: 8, suspicion: 10, funding: -6 } },
  ],
},
{
  id: 'act_restrict_tools', cat: 'model', label: 'Restrict its tool access',
  desc: 'Take away the internet, the shell, the API keys.',
  requires: { flags: { tool_use_unrestricted: true } },
  outcomes: [
    { weight: 10, text: 'Capability drops noticeably. So does everything you were worried about.',
      effects: { containment: 20, autonomy: -14, capability: -8 }, flags: { tool_use_unrestricted: false } },
  ],
},
{
  id: 'act_unrestrict_tools', cat: 'model', label: 'Give it unrestricted tools',
  desc: 'Shell, browser, code execution, its own API keys.',
  requires: { flags: { tool_use_unrestricted: false }, capability: { gte: 40 } },
  outcomes: [
    { weight: 10, text: 'It becomes dramatically more useful within a week. It also becomes much harder to say exactly what it is doing.',
      effects: { capability: 14, autonomy: 10, containment: -16 }, flags: { tool_use_unrestricted: true } },
  ],
},
{
  id: 'act_retrain_align', cat: 'model', label: 'Retrain for alignment',
  desc: 'Spend a training cycle on behaviour instead of capability.',
  requires: { compute: { gte: 12 }, funding: { gte: 10 } },
  outcomes: [
    { weight: 10, text: 'It comes back measurably better behaved and slightly duller. That trade is usually worth it.',
      effects: { alignment: 14, capability: -4, funding: -10, compute: -2 } },
    { weight: 4, bias: { interpretability: 0.9 }, text: 'The retrain works better than expected — you targeted the right thing because you could finally see it.',
      effects: { alignment: 22, containment: 8, funding: -10 } },
  ],
},
{
  id: 'act_shutdown_drill', cat: 'model', label: 'Run a shutdown drill',
  desc: 'Practise the thing you hope you never need.',
  requires: { capability: { gte: 40 } },
  cooldown: 2,
  outcomes: [
    { weight: 10, bias: { containment: 1.0 }, text: 'Clean shutdown, clean restart. The runbook works.',
      effects: { containment: 10, morale: 5 } },
    { weight: 5, bias: { autonomy: 1.2, containment: -0.8 }, text: 'It takes four minutes longer than the runbook says. Nobody can explain the four minutes.',
      effects: { containment: -8, suspicion: 14 } },
  ],
},

// ---------------- OUTSIDE ----------------
{
  id: 'act_lobby', cat: 'world', label: 'Lobby regulators',
  desc: 'Spend money and time shaping the rules you will live under.',
  requires: { funding: { gte: 12 } },
  outcomes: [
    { weight: 10, text: 'The draft language softens in three places that matter to you.',
      effects: { regulatory: -14, funding: -11, publicTrust: -4 } },
    { weight: 4, text: 'A staffer leaks your position paper. It reads badly out of context, which is how it is read.',
      effects: { regulatory: 6, publicTrust: -12, funding: -11 } },
  ],
},
{
  id: 'act_press', cat: 'world', label: 'Do a press tour',
  desc: 'Put your face on the thing you are building.',
  requires: { reputation: { gte: 15 } },
  outcomes: [
    { weight: 10, bias: { reputation: 0.8 }, text: 'You come across as thoughtful and slightly worried, which is accurate and plays well.',
      effects: { publicTrust: 12, reputation: 6 } },
    { weight: 5, text: 'One clip is taken out of context and follows you for two years.',
      effects: { publicTrust: -10, reputation: -4 } },
  ],
},
{
  id: 'act_open_source', cat: 'world', label: 'Open-source a model',
  desc: 'Give it away. Permanently.',
  requires: { capability: { gte: 30 }, flags: { open_weights: false } },
  outcomes: [
    { weight: 10, text: 'The community explodes with derivatives. So does the space of things you can no longer control.',
      effects: { reputation: 16, publicTrust: 14, containment: -14, funding: -8, regulatory: 10 },
      flags: { open_weights: true } },
  ],
},
{
  id: 'act_safety_summit', cat: 'world', label: 'Convene a safety summit',
  desc: 'Get the labs in one room before something forces it.',
  requires: { reputation: { gte: 40 }, funding: { gte: 12 } },
  outcomes: [
    { weight: 8, bias: { reputation: 1.0 }, text: 'Four labs sign a joint evaluation standard. It is thin, voluntary, and the first thing of its kind.',
      effects: { reputation: 18, publicTrust: 16, containment: 10, funding: -11 }, flags: { treaty_signed: true } },
    { weight: 6, text: 'Everyone comes, nobody commits, and the photo is the only deliverable.',
      effects: { reputation: 5, funding: -11 } },
  ],
},
{
  id: 'act_whistleblow', cat: 'world', label: 'Go public with what you know',
  desc: 'Tell the world what is actually happening inside the labs.',
  requires: { capability: { gte: 60 }, suspicion: { gte: 25 } },
  outcomes: [
    { weight: 10, text: 'You put your name on it. The hearings start within the month, and you will never work in this industry the same way again.',
      effects: { regulatory: 36, publicTrust: 22, reputation: 10, funding: -26, morale: -12 },
      flags: { whistleblower: true } },
  ],
},

// ---------------- YOURSELF ----------------
{
  id: 'act_rest', cat: 'self', label: 'Take real time off',
  desc: 'Two weeks. No laptop.',
  outcomes: [
    { weight: 10, text: 'You come back able to think again. It is embarrassing how much it helped.',
      effects: { health: 18, morale: 6, capability: -2 } },
  ],
},
{
  id: 'act_therapy', cat: 'self', label: 'See a therapist',
  desc: 'Talk to someone about carrying this.',
  requires: { funding: { gte: 4 } },
  outcomes: [
    { weight: 10, text: 'It helps. Not with the problem — with you, which turns out to be the part you can change.',
      effects: { health: 12, morale: 8, funding: -3 } },
  ],
},
{
  id: 'act_study', cat: 'self', label: 'Go deep on the literature',
  desc: 'Close the door and read for a month.',
  outcomes: [
    { weight: 10, text: 'You come out with three ideas worth trying and one worth abandoning.',
      effects: { capability: 5, interpretability: 5, health: -3 } },
  ],
},
{
  id: 'act_grind', cat: 'self', label: 'Work through the night, every night',
  desc: 'Trade yourself for progress.',
  outcomes: [
    { weight: 10, text: 'You ship it. You look terrible and everyone is too polite to say so.',
      effects: { capability: 10, health: -14, morale: -4 } },
    { weight: 4, text: 'You ship it, and then your body sends the invoice.',
      effects: { capability: 10, health: -24 } },
  ],
},
];

// Sanity: unique ids
const seen = new Set();
for (const a of ACTIVITIES) {
  if (seen.has(a.id)) throw new Error('Duplicate activity id: ' + a.id);
  seen.add(a.id);
}
