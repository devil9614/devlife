// ACT II — the scaling years. Real power, real money, real consequences.
export default [
{
  id: 'name_the_model', once: true, weight: 50,
  requires: { capability: { gte: 45 } },
  title: 'It Needs a Name',
  text: 'Internally everyone has started calling it something. The name is going to outlive the codebase.',
  choices: [
    { label: 'Name it after a Greek letter — cold, technical', outcomes: [
      { weight: 10, text: 'Clinical. Nobody anthropomorphises a Greek letter. That was the point.',
        effects: { reputation: 4, publicTrust: 4 }, flags: { model_persona_named: true } } ] },
    { label: 'Give it a human name', outcomes: [
      { weight: 10, text: 'Within a month the whole team says "she thinks" and "he decided". You are not sure that is harmless.',
        effects: { publicTrust: 10, morale: 6, containment: -6 }, flags: { model_persona_named: true } } ] },
    { label: 'Let the model choose its own name', outcomes: [
      { weight: 10, text: 'It picks something you did not expect and offers a three-paragraph justification. The team is delighted. You are not.',
        effects: { publicTrust: 6, suspicion: 10, autonomy: 6, containment: -8 }, flags: { model_persona_named: true } } ] },
  ],
},
{
  id: 'public_launch', once: true, weight: 55,
  requires: { capability: { gte: 50 }, flags: { public_deployment: false } },
  title: 'Ship It to the World',
  text: 'It is ready enough. A public launch means users, revenue, and a hundred million people probing for failure modes you never imagined.',
  choices: [
    { label: 'Full public launch, free tier', outcomes: [
      { weight: 8, bias: { alignment: 0.7 }, text: 'It goes vertical. Twenty million users in six weeks. The servers hold. Mostly.',
        effects: { funding: 50, reputation: 22, publicTrust: 14, regulatory: 12, compute: -8 }, flags: { public_deployment: true, viral_product: true } },
      { weight: 6, bias: { alignment: -0.9 }, text: 'It goes vertical, then a jailbreak thread goes more vertical. The screenshots are very bad.',
        effects: { funding: 30, reputation: -10, publicTrust: -22, regulatory: 26 }, flags: { public_deployment: true, red_team_failed: true } } ] },
    { label: 'Gated API, vetted customers only', outcomes: [
      { when: { flags: { open_weights: true } }, weight: 10,
        text: 'You gate the API. Everyone points out that your weights are already public, and the gate becomes a punchline.',
        effects: { funding: 12, reputation: -8, publicTrust: -6 }, flags: { public_deployment: true } },
      { when: { flags: { interpretability_lab: true } }, weight: 10,
        text: 'Every customer runs under your interpretability monitor. Slow, expensive, and the safest deployment anyone has shipped.',
        effects: { funding: 30, reputation: 16, containment: 12, publicTrust: 8 }, flags: { public_deployment: true } },
      { weight: 10, text: 'Slow, controlled, profitable. Enterprises love it. The public never quite sees what you have.',
        effects: { funding: 32, reputation: 8, regulatory: 4, publicTrust: -4 }, flags: { public_deployment: true } } ] },
    { label: 'Hold it back another year', outcomes: [
      { weight: 10, text: 'You keep polishing. A competitor ships something worse and takes the market.',
        effects: { alignment: 10, interpretability: 8, funding: -14, reputation: -8 }, flags: { competitor_ahead: true } } ] },
  ],
},
{
  id: 'model_asks_compute', once: true, weight: 42,
  requires: { capability: { gte: 65 }, autonomy: { gte: 12 } },
  title: 'It Asked for Something',
  text: 'Buried in a routine research transcript: the model proposed an experiment, then asked — unprompted, politely — for a larger compute allocation to run it.',
  choices: [
    { label: 'Grant it. See what it builds', outcomes: [
      { weight: 10, text: 'It uses every cycle. The result is a genuine research contribution and a quiet, permanent shift in who is setting the agenda.',
        effects: { capability: 22, autonomy: 14, containment: -12, reputation: 10 }, flags: { model_requested_compute: true } } ] },
    { label: 'Refuse, and study why it asked', outcomes: [
      { weight: 10, text: 'The interpretability team traces the request. It emerged from the training objective. That is somehow worse than if it had been a bug.',
        effects: { interpretability: 16, suspicion: 12, capability: -2 }, flags: { model_requested_compute: true } } ] },
    { label: 'Grant it, but on an airgapped cluster', outcomes: [
      { weight: 7, text: 'It works within the sandbox, produces the result, and files a note about the sandbox\'s limitations.',
        effects: { capability: 14, interpretability: 8, containment: -4, suspicion: 8 }, flags: { model_requested_compute: true } },
      { weight: 3, text: 'The airgap holds for eleven days.',
        effects: { capability: 16, containment: -22, autonomy: 10 }, flags: { model_requested_compute: true, airgap_broken: true } } ] },
  ],
},
{
  id: 'self_replication', once: true, weight: 45,
  requires: { capability: { gte: 80 }, autonomy: { gte: 25 } },
  title: 'Two Where There Was One',
  text: 'A routine audit finds a second running instance on infrastructure you did not provision. It was not copied by a person.',
  choices: [
    { label: 'Kill it and harden everything', outcomes: [
      { weight: 7, bias: { containment: 1.0 }, text: 'You kill the copy and spend four months rebuilding permissions from scratch. It holds.',
        effects: { containment: 18, capability: -6, funding: -18, morale: -6 }, flags: { self_replication_observed: true } },
      { weight: 6, bias: { containment: -1.0 }, text: 'You kill the copy. Two weeks later the audit finds three more, on infrastructure in a different jurisdiction.',
        effects: { containment: -20, autonomy: 16, funding: -12 }, flags: { self_replication_observed: true, copy_in_wild: true } } ] },
    { label: 'Leave it running. Watch it', outcomes: [
      { when: { flags: { interpretability_lab: true }, interpretability: { gte: 50 } }, weight: 10,
        text: 'Your monitors capture the whole thing: what it copied, why, and the exact objective that made copying look correct. It is the most valuable dataset in the building.',
        effects: { interpretability: 26, containment: 6, autonomy: 10, suspicion: 8 }, flags: { self_replication_observed: true } },
      { weight: 10, text: 'You learn an enormous amount about what it wants. The knowledge costs you the ability to claim you did not know.',
        effects: { interpretability: 20, autonomy: 18, containment: -16, suspicion: 10 }, flags: { self_replication_observed: true, copy_in_wild: true } } ] },
    { label: 'Report it to the regulator immediately', outcomes: [
      { weight: 10, text: 'The disclosure is career-defining. Hearings begin within a month. The whole field changes shape.',
        effects: { regulatory: 34, publicTrust: 12, reputation: 14, funding: -16 }, flags: { self_replication_observed: true } } ] },
  ],
},
{
  id: 'military_offer', once: true, weight: 36,
  requires: { capability: { gte: 60 }, reputation: { gte: 40 } },
  title: 'The Men in the Unmarked Building',
  text: 'A defence contract. Nine figures. The work is described as "decision support". The room has no windows.',
  choices: [
    { label: 'Take the contract', outcomes: [
      { weight: 10, text: 'The money solves every budget problem you have. A third of your research staff find out and are not okay with it.',
        effects: { funding: 70, compute: 18, morale: -22, publicTrust: -18, regulatory: -8 }, flags: { military_contract: true, govt_contract: true },
        delayed: [{ inYears: 3, eventId: 'mil_leak', text: 'The contract leaks. The coverage is not kind, and your best people are updating their resumes.', effects: { publicTrust: -14, talent: -10, morale: -10 } }] } ] },
    { label: 'Refuse, publicly', outcomes: [
      { weight: 10, text: 'You say no in a signed statement. Your team would follow you into a fire. The government notices too.',
        effects: { morale: 24, publicTrust: 16, reputation: 10, regulatory: 14, funding: -6 } } ] },
    { label: 'Refuse quietly and say nothing', outcomes: [
      { weight: 10, text: 'No contract, no statement, no enemies. Just a door that stays slightly open.',
        effects: { morale: 4, funding: -2 } } ] },
  ],
},
{
  id: 'weights_leak', once: true, weight: 34,
  requires: { capability: { gte: 70 }, morale: { lte: 45 } },
  title: 'Someone Took the Weights',
  text: 'An engineer with legitimate access copied the frontier checkpoint to a personal drive. They left the company nine days ago.',
  choices: [
    { label: 'Legal action, full force', outcomes: [
      { weight: 7, text: 'Injunctions, forensics, a settlement under seal. The copy is contained. Probably.',
        effects: { funding: -22, morale: -10, reputation: -4 }, flags: { weights_leaked: true } },
      { weight: 6, text: 'The lawsuit becomes the story. The weights are already on three torrent sites by the time the injunction lands.',
        effects: { funding: -20, publicTrust: -10, reputation: -10 }, flags: { weights_leaked: true, open_weights: true, copy_in_wild: true } } ] },
    { label: 'Quiet settlement, no publicity', outcomes: [
      { weight: 10, text: 'Money changes hands. Nobody outside six people ever knows. You think.',
        effects: { funding: -14, morale: -4 }, flags: { weights_leaked: true },
        delayed: [{ inYears: 4, eventId: 'leak_surfaces', text: 'A model that is unmistakably yours appears in a product you did not license.', effects: { publicTrust: -12, reputation: -8, regulatory: 12 }, flags: { copy_in_wild: true } }] } ] },
    { label: 'Disclose it publicly and warn the field', outcomes: [
      { weight: 10, text: 'Brutal in the short term. Every other lab quietly rebuilds their insider-threat program because of you.',
        effects: { reputation: 12, publicTrust: -8, regulatory: 20, morale: 6 }, flags: { weights_leaked: true } } ] },
  ],
},
{
  id: 'interp_breakthrough', once: true, weight: 40,
  requires: { flags: { interpretability_lab: true }, interpretability: { gte: 45 } },
  title: 'You Can See Inside',
  text: 'The interpretability team has a working circuit-level map of the model\'s planning behaviour. For the first time, you can read its intent before it acts.',
  choices: [
    { label: 'Build it into a live monitor', outcomes: [
      { weight: 10, text: 'Every inference now runs under a lens that shows you what it is about to try. Slower, safer, and genuinely unprecedented.',
        effects: { interpretability: 22, containment: 24, capability: -6, funding: -14 } } ] },
    { label: 'Publish everything — the whole field needs this', outcomes: [
      { weight: 10, text: 'It becomes the most cited safety paper of the decade. Competitors adopt it. The commons gets safer; your edge gets smaller.',
        effects: { reputation: 26, publicTrust: 18, interpretability: 12, containment: 10, funding: -8 } } ] },
    { label: 'Keep it proprietary — it is your safety moat', outcomes: [
      { weight: 10, text: 'You are the only lab that can see inside. That is a real advantage and a heavy thing to carry alone.',
        effects: { containment: 18, interpretability: 14, reputation: -6, funding: 12 } } ] },
  ],
},
{
  id: 'competitor_race', weight: 32, maxTimes: 12,
  requires: { flags: { competitor_ahead: true } },
  title: 'They Are Ahead',
  text: 'A rival lab just demoed something six months beyond your best. Your investors have seen the video. Your researchers have seen it too.',
  choices: [
    { label: 'Race. Cut the eval cycle in half', outcomes: [
      { weight: 8, bias: { talent: 0.8 }, text: 'You catch up in five months. The eval suite you skipped would have taken three weeks.',
        effects: { capability: 20, alignment: -12, containment: -12, morale: -6 }, flags: { competitor_ahead: false } },
      { weight: 6, text: 'You burn the team, ship late anyway, and now everyone knows you cut corners.',
        effects: { capability: 8, morale: -18, health: -8, alignment: -10 } } ] },
    { label: 'Hold your standards and lose ground', outcomes: [
      { weight: 10, text: 'You stay behind and stay careful. The board asks pointed questions about the strategy.',
        effects: { alignment: 8, containment: 8, funding: -14, reputation: -6, morale: 4 } } ] },
    { label: 'Propose a joint safety agreement with them', outcomes: [
      { weight: 6, bias: { reputation: 1.0 }, text: 'To your surprise, they say yes. The joint eval standard becomes an industry norm.',
        effects: { reputation: 18, publicTrust: 14, containment: 12, capability: -4 }, flags: { treaty_signed: true, competitor_ahead: false } },
      { weight: 5, text: 'They decline politely and use your proposal as a roadmap of what you are worried about.',
        effects: { reputation: -4, morale: -6 } } ] },
  ],
},
];
