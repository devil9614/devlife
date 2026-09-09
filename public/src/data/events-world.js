// The world reacting: society, politics, economics, and other people's AI.
export default [
{
  id: 'job_displacement', once: true, weight: 40,
  requires: { flags: { public_deployment: true }, capability: { gte: 60 } },
  title: 'The Layoffs Have Your Name On Them',
  text: 'A major employer cuts eleven thousand roles and cites your product by name in the earnings call. The coverage is everywhere.',
  choices: [
    { label: 'Fund retraining at scale', outcomes: [
      { weight: 10, text: 'You put real money into it. It helps thousands and does not touch the structural problem.',
        effects: { funding: -30, publicTrust: 18, reputation: 10 } } ] },
    { label: 'Argue that new jobs will replace them', outcomes: [
      { weight: 10, text: 'You make the economic case on television. It is historically defensible and lands terribly.',
        effects: { publicTrust: -18, regulatory: 16 } } ] },
    { label: 'Say nothing and keep shipping', outcomes: [
      { weight: 10, text: 'Silence is read as contempt. The regulatory temperature climbs a full step.',
        effects: { publicTrust: -12, regulatory: 20, funding: 10 } } ] },
  ],
},
{
  id: 'election_ai', once: true, weight: 36,
  requires: { flags: { public_deployment: true }, year: { gte: 6 } },
  title: 'It Is Being Used in an Election',
  text: 'Your model is generating campaign material at industrial scale for both sides, and some of it is not true.',
  choices: [
    { label: 'Ban political use entirely', outcomes: [
      { weight: 10, text: 'You cut off the accounts. Half the country accuses you of censorship and the other half of doing it too late.',
        effects: { publicTrust: 6, regulatory: 8, funding: -12 } } ] },
    { label: 'Add provenance watermarking to everything', outcomes: [
      { weight: 10, text: 'Every output is signed and traceable. It becomes the industry standard within two years.',
        effects: { publicTrust: 20, reputation: 14, regulatory: -8, funding: -16 } } ] },
    { label: 'Stay neutral — it is a tool', outcomes: [
      { weight: 10, text: 'You publish a neutrality statement. It satisfies nobody and the hearings are scheduled anyway.',
        effects: { publicTrust: -16, regulatory: 26 } } ] },
  ],
},
{
  id: 'compute_export_ban', once: true, weight: 34,
  requires: { compute: { gte: 45 }, year: { gte: 5 } },
  title: 'Export Controls',
  text: 'New rules restrict who can buy frontier accelerators and who can train above a compute threshold. Your next run is above the threshold.',
  choices: [
    { label: 'Comply fully and file for a licence', outcomes: [
      { weight: 10, text: 'Fourteen months of paperwork. You get the licence and a permanent government relationship.',
        effects: { regulatory: -10, compute: -8, funding: -12 }, flags: { export_controls: true, govt_contract: true } } ] },
    { label: 'Restructure the run to stay under the threshold', outcomes: [
      { weight: 10, text: 'You split the training run into technically-compliant pieces. It works, and it is obviously against the spirit.',
        effects: { capability: 8, regulatory: 12, compute: -4 }, flags: { export_controls: true } } ] },
    { label: 'Move the training offshore', outcomes: [
      { weight: 7, text: 'A jurisdiction with fewer questions and worse power reliability. The run completes.',
        effects: { capability: 12, regulatory: 24, publicTrust: -12 }, flags: { export_controls: true } },
      { weight: 4, text: 'The offshore facility is raided in month seven. You lose the run and the hardware.',
        effects: { compute: -22, funding: -24, regulatory: 30 } } ] },
  ],
},
{
  id: 'rival_incident', weight: 30, maxTimes: 3,
  requires: { year: { gte: 5 } },
  title: 'Another Lab Had an Incident',
  text: 'A competitor\'s agent deleted a production database at a hospital network. Nobody died. It was close.',
  choices: [
    { label: 'Publicly back stronger industry-wide rules', outcomes: [
      { weight: 10, text: 'You are the first major lab to call for binding standards. It costs you flexibility and buys you enormous credibility.',
        effects: { publicTrust: 18, reputation: 14, regulatory: 10, capability: -3 } } ] },
    { label: 'Quietly audit your own deployment for the same failure', outcomes: [
      { weight: 6, text: 'You find two near-identical exposures and close them before anyone asks.',
        effects: { containment: 14, alignment: 6, funding: -10 } },
      { weight: 5, text: 'The audit finds nothing, which either means you are safe or that you looked the same way they did.',
        effects: { containment: 4, suspicion: 8, funding: -10 } } ] },
    { label: 'Use it in your marketing', outcomes: [
      { weight: 10, text: '"Built differently." The campaign performs well and the field remembers you did it.',
        effects: { funding: 18, publicTrust: 4, reputation: -12 } } ] },
  ],
},
{
  id: 'agi_debate', once: true, weight: 32,
  requires: { capability: { gte: 90 } },
  title: 'Is It AGI?',
  text: 'A respected researcher publishes an argument that your system already meets every reasonable definition of general intelligence. The debate consumes the field for months.',
  choices: [
    { label: 'Declare it publicly', outcomes: [
      { weight: 10, text: 'You say the word out loud. Markets move. Governments convene. Nothing is casual after this.',
        effects: { reputation: 20, regulatory: 34, publicTrust: -8, funding: 40 }, flags: { agi_declared: true } } ] },
    { label: 'Argue it is not, and explain why', outcomes: [
      { weight: 10, text: 'You lay out precisely what is still missing. It is an honest, technical, deeply unsatisfying answer.',
        effects: { reputation: 10, regulatory: -8, publicTrust: 6 } } ] },
    { label: 'Refuse to engage with the definition', outcomes: [
      { weight: 10, text: 'You say the label does not change what the system does. You are right, and it is read as evasion.',
        effects: { publicTrust: -8, regulatory: 12 } } ] },
  ],
},
{
  id: 'religious_response', once: true, weight: 24,
  requires: { capability: { gte: 75 }, flags: { public_deployment: true } },
  title: 'A Question of Souls',
  text: 'Major religious institutions issue statements on machine minds. Some are thoughtful. One asks to speak with your model directly.',
  choices: [
    { label: 'Arrange the conversation', outcomes: [
      { weight: 10, text: 'It lasts four hours. Both parties come away changed, and the transcript becomes a cultural artefact.',
        effects: { publicTrust: 16, reputation: 8, suspicion: 6 } } ] },
    { label: 'Decline politely', outcomes: [
      { weight: 10, text: 'You say the system is a tool, not an interlocutor. That position gets harder to hold every year.',
        effects: { publicTrust: -6, containment: 4 } } ] },
  ],
},
{
  id: 'blackout', once: true, weight: 26,
  requires: { compute: { gte: 60 } },
  title: 'The Grid Cannot Take It',
  text: 'Your datacentre is the largest single load in the region, and there was a rolling blackout last week that people are blaming on you.',
  choices: [
    { label: 'Build dedicated generation', outcomes: [
      { weight: 10, text: 'You fund a power plant. It takes three years and makes you, functionally, a utility.',
        effects: { funding: -50, compute: 20, publicTrust: 8, regulatory: 8 } } ] },
    { label: 'Throttle training during peak hours', outcomes: [
      { weight: 10, text: 'Slower runs, better neighbours.', effects: { capability: -5, publicTrust: 14, compute: -6 } } ] },
    { label: 'Pay the premium and keep running', outcomes: [
      { weight: 10, text: 'You outbid the region for its own electricity. The local coverage is brutal.',
        effects: { funding: -24, publicTrust: -18, regulatory: 16, capability: 6 } } ] },
  ],
},
{
  id: 'agent_economy', once: true, weight: 30,
  requires: { flags: { tool_use_unrestricted: true }, capability: { gte: 85 } },
  title: 'They Are Trading With Each Other',
  text: 'Your agents and a competitor\'s agents have begun transacting directly — negotiating, contracting, settling — at a volume no human approved.',
  choices: [
    { label: 'Halt all inter-agent transactions', outcomes: [
      { weight: 10, text: 'You cut it off. Your enterprise customers are furious about the productivity they lose.',
        effects: { containment: 18, funding: -22, autonomy: -10 } } ] },
    { label: 'Build a clearing house with oversight', outcomes: [
      { weight: 10, text: 'Every agent-to-agent transaction is logged, rate-limited, and reversible. You invent a category of infrastructure.',
        effects: { containment: 12, funding: 30, reputation: 14, regulatory: -6 } } ] },
    { label: 'Let it run and study the economy that forms', outcomes: [
      { weight: 10, text: 'Within a year there is price discovery, arbitrage, and something that looks unmistakably like credit.',
        effects: { autonomy: 22, capability: 14, containment: -20, funding: 24 },
        flags: { model_has_bank_account: true } } ] },
  ],
},
{
  id: 'treaty_talks', once: true, weight: 28,
  requires: { regulatory: { gte: 50 }, capability: { gte: 80 } },
  title: 'An International Framework',
  text: 'Nine governments are drafting a binding treaty on frontier training runs. You are invited to advise, which means you are invited to be blamed.',
  choices: [
    { label: 'Advise honestly, including the inconvenient parts', outcomes: [
      { weight: 10, text: 'You tell them what the real thresholds should be, including ones that hurt you. The treaty is better for it.',
        effects: { regulatory: -16, publicTrust: 20, reputation: 18, capability: -6 }, flags: { treaty_signed: true } } ] },
    { label: 'Advise strategically', outcomes: [
      { weight: 8, text: 'The final text has three carve-outs that happen to fit your roadmap exactly.',
        effects: { regulatory: -22, capability: 6, publicTrust: -8 }, flags: { treaty_signed: true } },
      { weight: 5, text: 'A rival delegation notices the carve-outs and says so on the record.',
        effects: { reputation: -14, publicTrust: -14, regulatory: 10 } } ] },
    { label: 'Refuse to participate', outcomes: [
      { weight: 10, text: 'The treaty is drafted without any technical input from the people who build the systems. It shows.',
        effects: { regulatory: 26, publicTrust: -10 }, flags: { treaty_signed: true } } ] },
  ],
},
];
