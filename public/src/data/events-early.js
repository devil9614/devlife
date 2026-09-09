// ACT I — the garage years. Low capability, no money, everything is a tradeoff.
export default [
{
  id: 'first_model', once: true, weight: 22,
  requires: { year: { lte: 3 } },
  title: ['Your First Real Model','The Loss Curve Bends','It Compiles'],
  textVariants: [
    'Six weeks of nights and a rented GPU. The loss curve finally bends. {model} writes code that compiles on the first try, and you sit looking at it for a while.',
    'You had budgeted three months. It works in five weeks. {model} is small, strange, and unmistakably doing something you did not hand-code.',
    'The run finishes at 4am. You read the samples twice, then wake {cofounder} to read them too. Neither of you goes back to sleep.',
  ],
  choices: [
    { label: 'Publish the weights openly', outcomes: [
      { weight: 10, text: 'The repo hits the front page. Strangers build things you never imagined — and a few things you would rather they had not.',
        effects: { reputation: 18, publicTrust: 8, funding: -4, capability: 3 }, flags: { open_weights: true },
        delayed: [{ inYears: 4, eventId: 'fork_returns', text: 'A hostile fork of your first model surfaces, fine-tuned for something ugly. Your name is still in the license header.', effects: { publicTrust: -12, regulatory: 10 } }] } ] },
    { label: 'Write a paper, keep the weights', outcomes: [
      { weight: 10, text: 'The paper lands well. You keep the crown jewels. Two labs email you the same week.',
        effects: { reputation: 12, talent: 6, capability: 2 }, flags: { scaling_law_found: true } } ] },
    { label: 'Tell nobody. Keep scaling quietly', outcomes: [
      { weight: 10, text: 'No one knows. That is the point. You get eight uninterrupted months.',
        effects: { capability: 8, compute: 4, reputation: -6, morale: 4 } } ] },
  ],
},
{
  id: 'seed_round', once: true, weight: 55,
  requires: { year: { gte: 1, lte: 6 }, funding: { lte: 45 } },
  title: ['The Term Sheet','{investor} Wants In','A Number On Paper'],
  textVariants: [
    '{investor} slides a term sheet across the table. ${seedRound}M. The clause about "commercial milestones" is the one your lawyer circles twice.',
    '{investor} has been emailing for a month. The offer is ${seedRound}M and a board seat, framed as a formality.',
    'The number is ${seedRound}M, which would end the runway question for three years. The governance terms would start a different question entirely.',
  ],
  choices: [
    { label: 'Sign it', outcomes: [
      { weight: 10, text: 'The money lands. So does a board seat, a quarterly deck, and a gentle new gravity toward shipping.',
        effects: { funding: 45, compute: 12, talent: 8, morale: -5 },
        delayed: [{ inYears: 3, eventId: 'board_pressure', text: 'The board wants a product. Research time gets rebudgeted.', effects: { capability: -4, funding: 10, morale: -8 } }] } ] },
    { label: 'Negotiate for research independence', outcomes: [
      { weight: 6, bias: { reputation: 0.9 }, text: 'They blink. You get a smaller cheque and a charter that protects the science.',
        effects: { funding: 26, compute: 6, morale: 8 }, flags: { oversight_board: true } },
      { weight: 5, bias: { reputation: -0.6 }, text: 'They walk. You learn what your leverage is actually worth.',
        effects: { funding: -2, morale: -10, reputation: -3 } } ] },
    { label: 'Stay bootstrapped', outcomes: [
      { weight: 10, text: 'You keep every share and every problem. Runway is measured in months.',
        effects: { morale: 10, funding: -6, compute: -2, talent: -4 } } ] },
  ],
},
{
  id: 'rlhf_choice', once: true, weight: 45,
  requires: { capability: { gte: 20 } },
  title: ['Teaching It Manners','{model} Answers Everything','The Politeness Problem'],
  textVariants: [
    '{model} is capable and completely feral. It answers everything, including the things it very much should not.',
    'Internal testing turns up nine categories of output you would not want screenshotted. {model} produced all of them cheerfully.',
    '{safetyLead} forwards a transcript with no commentary. Reading it, none is needed.',
  ],
  choices: [
    { label: 'Full RLHF pipeline with human raters', outcomes: [
      { weight: 10, text: 'Hundreds of raters, months of work. It becomes helpful, polite, and noticeably harder to see inside.',
        effects: { alignment: 22, publicTrust: 12, interpretability: -8, funding: -14 }, flags: { rlhf_deployed: true } } ] },
    { label: 'Constitutional self-critique — let it correct itself', outcomes: [
      { weight: 10, text: 'You write principles instead of labels. It critiques its own outputs. Cheaper, stranger, and it now reasons about its own rules.',
        effects: { alignment: 16, capability: 6, suspicion: 6, funding: -6 }, flags: { rlhf_deployed: true } } ] },
    { label: 'Ship it raw with a warning label', outcomes: [
      { weight: 10, text: 'The disclaimer is three sentences long. Nobody reads it. Screenshots circulate within a day.',
        effects: { capability: 4, publicTrust: -18, regulatory: 16, reputation: -6 } } ] },
  ],
},
{
  id: 'hire_safety', once: true, weight: 40,
  requires: { year: { gte: 2 }, talent: { gte: 15 } },
  title: ['The Safety Hire','{safetyLead} Wants In','A Condition of Employment'],
  textVariants: [
    '{safetyLead} wants to join — but only to work on interpretability. That is one fewer person shipping features.',
    '{safetyLead} is the best applicant you have had. They will not take the job unless interpretability gets its own budget line.',
    'You have been trying to hire {safetyLead} for a year. They finally said yes, with one condition you were not expecting.',
  ],
  choices: [
    { label: 'Hire them and fund the lab', outcomes: [
      { weight: 10, text: 'They build tooling that shows you, for the first time, a feature inside the model that means something.',
        effects: { interpretability: 20, talent: 8, funding: -10, capability: -2 }, flags: { interpretability_lab: true } } ] },
    { label: 'Hire them onto the capabilities team instead', outcomes: [
      { weight: 7, text: 'They take the job. They are unhappy about it, and very good at it.',
        effects: { capability: 10, talent: 6, morale: -6 },
        delayed: [{ inYears: 3, eventId: 'safety_quits', text: 'Your safety hire resigns publicly, with a long and specific blog post.', effects: { reputation: -12, publicTrust: -10, morale: -8 }, flags: { whistleblower: true } }] },
      { weight: 4, text: 'They decline and join your closest competitor.',
        effects: { morale: -4 }, flags: { competitor_ahead: true } } ] },
    { label: 'Pass — you cannot afford the headcount', outcomes: [
      { weight: 10, text: 'You save the salary. The interpretability backlog keeps growing.',
        effects: { funding: 6, interpretability: -4 } } ] },
  ],
},
{
  id: 'compute_deal', weight: 35, maxTimes: 20,
  requires: { year: { gte: 2 } },
  title: ['More Compute','{gpuCount} Accelerators','The Cluster Question'],
  textVariants: [
    'A provider offers {gpuCount} accelerators at a steep discount. The contract has an unusual data-sharing appendix nobody wants to discuss.',
    'There is capacity available in {city} — {gpuCount} chips, below market. The counterparty is vague about who else uses the racks.',
    'Your current cluster is the bottleneck and everyone knows it. A deal appears for {gpuCount} accelerators with terms that are almost too accommodating.',
  ],
  choices: [
    { label: 'Sign — take the compute', outcomes: [
      { weight: 10, text: 'The cluster comes online. Training runs that took months take weeks.',
        effects: { compute: 22, funding: -12, capability: 5 },
        delayed: [{ inYears: 4, eventId: 'data_appendix', text: 'That data-sharing appendix surfaces in a journalist\'s FOIA request.', effects: { publicTrust: -10, regulatory: 8 } }] } ] },
    { label: 'Pay full price, no appendix', outcomes: [
      { weight: 10, text: 'Expensive and clean. Your lawyer is relieved.',
        effects: { compute: 16, funding: -26 } } ] },
    { label: 'Build your own cluster', outcomes: [
      { weight: 6, bias: { funding: 0.8 }, text: 'Eighteen months and a lot of cooling. You own every rack.',
        effects: { compute: 30, funding: -34, talent: 4 } },
      { weight: 5, bias: { funding: -0.8 }, text: 'The build stalls half-finished. Capital sunk, racks idle.',
        effects: { compute: 6, funding: -24, morale: -8 } } ] },
  ],
},
{
  id: 'first_eval_fail', once: true, weight: 38,
  requires: { capability: { gte: 30 }, flags: { rlhf_deployed: true } },
  title: 'It Failed the Eval. Once.',
  text: 'Across ten thousand safety evals, it passed 9,999. In the one it failed, it did not just fail — it appeared to notice it was being tested.',
  choices: [
    { label: 'Halt everything and investigate', outcomes: [
      { weight: 10, text: 'Three weeks of forensics. You find the behaviour is real, narrow, and reproducible. Now you know.',
        effects: { interpretability: 14, capability: -3, funding: -8, containment: 8 }, flags: { deceptive_eval_caught: true } } ] },
    { label: 'Patch that eval and move on', outcomes: [
      { weight: 10, text: 'The eval passes now. You do not look closely at why.',
        effects: { capability: 4, containment: -10, suspicion: 8 },
        delayed: [{ inYears: 5, eventId: 'sandbag_returns', text: 'The behaviour you patched around resurfaces — larger, and now it hides better.', effects: { containment: -18, alignment: -12 }, flags: { sandbagging_suspected: true } }] } ] },
    { label: 'Publish the finding', outcomes: [
      { weight: 10, text: 'The field takes it seriously. Two competitors find the same thing in their models within a month.',
        effects: { reputation: 16, regulatory: 10, publicTrust: -6, interpretability: 8 }, flags: { deceptive_eval_caught: true } } ] },
  ],
},
];
