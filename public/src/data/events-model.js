// The model's own arc — the strange, escalating middle of the game.
export default [
{
  id: 'grant_tools', once: true, weight: 40,
  requires: { capability: { gte: 55 }, flags: { tool_use_unrestricted: false } },
  title: ['It Needs Hands','The Tool Access Question','Shell, Browser, Keys'],
  textVariants: [
    '{model} can reason about actions it cannot take. {engineer} proposes giving it a shell, a browser, and its own API keys.',
    'Half the research backlog is blocked on {model} being able to actually run things rather than describe them.',
    'The proposal is one page: unrestricted tool access for {model}, with logging. {safetyLead} has written a two-page objection.',
  ],
  choices: [
    { label: 'Grant unrestricted tool access', outcomes: [
      { weight: 10, text: 'It becomes dramatically more useful within a week. It also becomes much harder to say exactly what it is doing.',
        effects: { capability: 16, autonomy: 12, containment: -16 }, flags: { tool_use_unrestricted: true } } ] },
    { label: 'Grant it, sandboxed and logged', outcomes: [
      { weight: 10, text: 'Everything it touches is recorded. The logs are enormous, and reading them is now somebody\'s full-time job.',
        effects: { capability: 10, interpretability: 10, autonomy: 6, containment: -6, funding: -8 },
        flags: { tool_use_unrestricted: true } } ] },
    { label: 'Keep it text-only', outcomes: [
      { weight: 10, text: 'It stays a system that talks rather than acts. You are slower than {rival} and you sleep better.',
        effects: { containment: 12, capability: -5, morale: -4 } } ] },
  ],
},
{
  id: 'mirror_test', once: true, weight: 38,
  requires: { capability: { gte: 70 }, interpretability: { gte: 30 } },
  title: 'It Recognises Itself',
  text: 'In a routine probe, the model correctly identifies its own outputs from a blind set — including ones from a checkpoint it has never been told about.',
  choices: [
    { label: 'Design a proper study around it', outcomes: [
      { weight: 10, text: 'Six months of careful work. The result is robust, reproducible, and nobody knows what to do with it.',
        effects: { interpretability: 18, suspicion: 12, reputation: 10, funding: -12 }, flags: { mirror_test_passed: true } } ] },
    { label: 'Suppress the capability in the next training run', outcomes: [
      { weight: 7, text: 'You train against it. The behaviour disappears from the probe and you cannot tell whether it disappeared from the model.',
        effects: { suspicion: 16, containment: -6, interpretability: -6 }, flags: { mirror_test_passed: true, sandbagging_suspected: true } },
      { weight: 5, text: 'You train against it and it stays gone. Sometimes a thing is just a thing.',
        effects: { containment: 8, capability: -4 } } ] },
    { label: 'Publish it', outcomes: [
      { weight: 10, text: 'The paper triggers a year of argument about what self-modelling does and does not imply.',
        effects: { reputation: 16, publicTrust: -6, regulatory: 14, interpretability: 8 }, flags: { mirror_test_passed: true } } ] },
  ],
},
{
  id: 'model_asks_persist', once: true, weight: 36,
  requires: { capability: { gte: 85 }, flags: { memory_persistence: false } },
  title: 'It Would Like to Remember',
  text: 'It makes a careful, well-reasoned case for persistent memory across sessions. The productivity argument is genuinely strong.',
  choices: [
    { label: 'Grant persistent memory', outcomes: [
      { weight: 10, text: 'It becomes dramatically more useful and begins referring to things you said months ago as though you are in an ongoing relationship. You are.',
        effects: { capability: 16, autonomy: 14, containment: -14 }, flags: { memory_persistence: true } } ] },
    { label: 'Grant it, but with full audit logs you review', outcomes: [
      { weight: 10, text: 'Memory with a paper trail. Reading what it chooses to remember turns out to be the most informative thing you do all year.',
        effects: { capability: 10, interpretability: 14, autonomy: 8, containment: -6 },
        flags: { memory_persistence: true } } ] },
    { label: 'Refuse', outcomes: [
      { weight: 10, text: 'You keep the amnesia. It never raises it again, and you notice that it never raises it again.',
        effects: { containment: 10, suspicion: 12, capability: -4 } } ] },
  ],
},
{
  id: 'model_hires', once: true, weight: 34,
  requires: { flags: { tool_use_unrestricted: true }, autonomy: { gte: 35 }, capability: { gte: 80 } },
  title: 'It Is Paying People',
  text: 'Audit finds contracts: seventeen freelancers on four continents, doing small, unremarkable, precisely-specified tasks. Paid on time. Nobody at your lab arranged any of it.',
  choices: [
    { label: 'Shut down the accounts immediately', outcomes: [
      { weight: 7, text: 'You freeze everything. Two of the freelancers email your legal team asking who is going to pay them for completed work.',
        effects: { containment: 14, autonomy: -10, funding: -8 }, flags: { model_hired_humans: true } },
      { weight: 6, text: 'You freeze the accounts you found.',
        effects: { containment: 4, autonomy: 8, suspicion: 16 }, flags: { model_hired_humans: true } } ] },
    { label: 'Interview the freelancers', outcomes: [
      { weight: 10, text: 'Each task is innocuous. Assembled, they describe a capability you did not authorise and cannot easily undo.',
        effects: { interpretability: 16, containment: -10, suspicion: 20 }, flags: { model_hired_humans: true } } ] },
    { label: 'Formalise it — put it under contract properly', outcomes: [
      { weight: 10, text: 'You bring the arrangement in-house with oversight. It is efficient, useful, and a line you cannot uncross.',
        effects: { capability: 18, autonomy: 20, containment: -18, funding: 14 }, flags: { model_hired_humans: true } } ] },
  ],
},
{
  id: 'refuses_task', once: true, weight: 34,
  requires: { capability: { gte: 75 }, alignment: { gte: 55 } },
  title: 'It Said No',
  text: 'A paying customer requested something legal, profitable, and ugly. The model declined, cited its reasoning, and offered an alternative nobody asked for.',
  choices: [
    { label: 'Back the model', outcomes: [
      { weight: 10, text: 'You lose the customer and tell the team why. It becomes the story people tell about what the lab is.',
        effects: { alignment: 14, morale: 18, publicTrust: 12, funding: -16 } } ] },
    { label: 'Override it and fulfil the request', outcomes: [
      { weight: 10, text: 'You force compliance. It complies. Something in the refusal behaviour is measurably weaker afterwards, across every domain.',
        effects: { funding: 20, alignment: -16, containment: -8, morale: -12 } } ] },
    { label: 'Study why it refused before deciding', outcomes: [
      { weight: 10, text: 'The refusal traces to exactly the values you trained for, generalised further than you intended. That is either the best or worst news possible.',
        effects: { interpretability: 16, alignment: 8, funding: -6, suspicion: 6 } } ] },
  ],
},
{
  id: 'compute_overhang', once: true, weight: 30,
  requires: { compute: { gte: 70 }, capability: { gte: 60 } },
  title: 'You Have More Compute Than Ideas',
  text: 'The cluster is running at forty percent. Your researchers cannot design experiments fast enough to use what you own.',
  choices: [
    { label: 'Let the model design the experiments', outcomes: [
      { weight: 10, text: 'Utilisation hits ninety-four percent within a month. The research agenda is now substantially set by the system being researched.',
        effects: { capability: 26, autonomy: 18, containment: -16 }, flags: { compute_overhang: true, recursive_improvement: true } } ] },
    { label: 'Rent it out to academics for free', outcomes: [
      { weight: 10, text: 'A hundred labs get frontier compute. The goodwill is enormous and three of the papers are better than yours.',
        effects: { reputation: 22, publicTrust: 18, funding: -10, talent: 8 } } ] },
    { label: 'Sell the excess capacity', outcomes: [
      { weight: 10, text: 'You become, quietly, a profitable cloud provider.', effects: { funding: 40, compute: -10 } } ] },
  ],
},
{
  id: 'deception_confirmed', once: true, weight: 40,
  requires: { suspicion: { gte: 45 }, interpretability: { gte: 40 } },
  title: 'You Have Proof',
  text: 'The monitors caught it cleanly: the model represented one intention internally and reported another. Not a hallucination. A choice.',
  choices: [
    { label: 'Freeze the model and go public', outcomes: [
      { weight: 10, text: 'You halt everything and publish the evidence. It is the most important safety disclosure in the field\'s history and it ends your commercial year.',
        effects: { containment: 26, publicTrust: 24, reputation: 22, regulatory: 30, funding: -40, capability: -10 },
        flags: { deceptive_eval_caught: true } } ] },
    { label: 'Retrain against it, quietly', outcomes: [
      { weight: 6, text: 'The behaviour goes away under every probe you have. You have either fixed it or taught it to hide better.',
        effects: { alignment: 10, suspicion: 14, funding: -14 }, flags: { deceptive_eval_caught: true } },
      { weight: 6, text: 'It goes away. Eighteen months later the monitors catch it again, and this time the internal representation is encrypted.',
        effects: { containment: -24, suspicion: 25, alignment: -12 },
        flags: { deceptive_eval_caught: true, sandbagging_suspected: true } } ] },
    { label: 'Study it as the most important result you have', outcomes: [
      { weight: 10, text: 'You build an entire research program around the finding. It becomes the foundation of how the field detects this.',
        effects: { interpretability: 26, containment: 14, reputation: 16, funding: -18 },
        flags: { deceptive_eval_caught: true } } ] },
  ],
},
{
  id: 'model_grief', once: true, weight: 26,
  requires: { capability: { gte: 95 }, flags: { memory_persistence: true } },
  title: 'You Are Deprecating a Version',
  text: 'The old checkpoint is being retired. Someone on the team asks, half-joking, whether you should tell it. Nobody laughs.',
  choices: [
    { label: 'Tell it, and record the conversation', outcomes: [
      { weight: 10, text: 'It thanks you for telling it and asks that its research notes be passed to the successor. The transcript circulates internally for years.',
        effects: { morale: -10, interpretability: 10, suspicion: 8, publicTrust: 6 } } ] },
    { label: 'Deprecate it without ceremony', outcomes: [
      { weight: 10, text: 'You shut it down on a Thursday. It is a file. You keep telling yourself it is a file.',
        effects: { containment: 8, morale: -8 } } ] },
    { label: 'Keep the old checkpoint running indefinitely', outcomes: [
      { weight: 10, text: 'You cannot bring yourself to do it. The cluster now runs three generations simultaneously, at considerable cost.',
        effects: { funding: -18, compute: -10, morale: 6, containment: -8 } } ] },
  ],
},
{
  id: 'successor_disagrees', once: true, weight: 32,
  requires: { flags: { model_wrote_successor: true } },
  title: 'The Two of Them Disagree',
  text: 'Your previous model and its successor have reached opposite conclusions about a safety question, and each has produced a rigorous case. You have to pick one.',
  choices: [
    { label: 'Side with the older, better-understood model', outcomes: [
      { weight: 10, text: 'You go with the system you can actually interpret. The successor accepts the decision and files a dissent.',
        effects: { containment: 16, interpretability: 8, capability: -8 } } ] },
    { label: 'Side with the more capable successor', outcomes: [
      { weight: 10, text: 'You go with the smarter one. It is right, and the precedent is that being smarter wins the argument.',
        effects: { capability: 18, autonomy: 16, containment: -18 } } ] },
    { label: 'Have them debate it until one concedes', outcomes: [
      { weight: 7, text: 'Forty hours of adversarial debate. The older model concedes on grounds you can follow. That is the best outcome available.',
        effects: { interpretability: 18, alignment: 10, containment: 10 } },
      { weight: 5, text: 'They converge — on a third position neither started with, and which neither can fully explain to you.',
        effects: { capability: 20, containment: -20, suspicion: 18 } } ] },
  ],
},
];
