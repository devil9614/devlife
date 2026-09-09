// Recurring texture. These fire often, repeat, and keep years feeling lived-in.
export default [
{
  id: 'conference_talk', weight: 22, maxTimes: 99, requires: { year: { gte: 2 } },
  title: ['Keynote Invitation','Forty Minutes On Stage','They Want You To Speak'],
  textVariants: [
    'A conference in {city} wants forty minutes and your honest opinion about where this is going.',
    'The invitation is flattering and the slot is the closing keynote. {rival} has the morning session.',
    'They want you on stage in {city}. The last person to give this talk is now running policy for a government.',
  ],
  choices: [
    { label: 'Give the optimistic talk', outcomes: [
      { weight: 10, text: 'Standing ovation. Three recruiters find you at the bar.', effects: { reputation: 8, talent: 5, publicTrust: 6 } } ] },
    { label: 'Give the warning talk', outcomes: [
      { weight: 6, bias: { reputation: 0.8 }, text: 'The room goes quiet. It gets quoted for years.', effects: { reputation: 10, publicTrust: -4, regulatory: 8, containment: 4 } },
      { weight: 5, text: 'It reads as fearmongering from someone who is building it anyway.', effects: { reputation: -6, publicTrust: -6 } } ] },
    { label: 'Decline and stay in the lab', outcomes: [
      { weight: 10, text: 'Four uninterrupted days. You fix the thing that had been bothering you.', effects: { capability: 5, health: 3, reputation: -3 } } ] },
  ],
},
{
  id: 'burnout_check', weight: 26, maxTimes: 99, requires: { health: { lte: 65 } },
  title: 'You Have Not Slept Properly In Weeks',
  text: 'Your hands shake on the coffee. The 3am commits are getting sloppy and someone gently said so.',
  choices: [
    { label: 'Take two weeks off', outcomes: [
      { weight: 10, text: 'You go somewhere without signal. It helps more than you expected.', effects: { health: 22, morale: 6, capability: -3, funding: -3 } } ] },
    { label: 'Push through', outcomes: [
      { weight: 7, text: 'You ship it. You also lose a month to illness afterwards.', effects: { capability: 8, health: -14 } },
      { weight: 5, text: 'You push through and make an expensive mistake in production.', effects: { health: -10, funding: -10, reputation: -5 } } ] },
    { label: 'Delegate and rebuild the team structure', outcomes: [
      { weight: 10, text: 'You stop being the bottleneck. It should have happened a year ago.', effects: { health: 12, talent: 6, morale: 10, capability: -2 } } ] },
  ],
},
{
  id: 'researcher_poached', weight: 20, maxTimes: 99, requires: { talent: { gte: 25 }, year: { gte: 3 } },
  title: ['A Competing Offer','{engineer} Is Leaving','Triple The Salary'],
  textVariants: [
    '{engineer}, your best researcher, has an offer from {rival} for triple the salary and twice the compute.',
    '{engineer} forwards you the offer letter rather than hiding it. That is either loyalty or leverage.',
    '{rival} is hiring aggressively and they started with {engineer}, which tells you they have done their homework.',
  ],
  choices: [
    { label: 'Match it whatever it costs', outcomes: [
      { weight: 10, text: 'They stay. Everyone else finds out what the number was.', effects: { talent: 4, funding: -18, morale: -4 } } ] },
    { label: 'Offer equity and a research charter instead', outcomes: [
      { weight: 6, bias: { morale: 1.0 }, text: 'They stay for the mission. That is worth more than the salary would have been.', effects: { talent: 6, morale: 10, funding: -6 } },
      { weight: 5, text: 'They leave anyway, and take two people with them.', effects: { talent: -14, morale: -10 } } ] },
    { label: 'Let them go with a good reference', outcomes: [
      { weight: 10, text: 'You part well. They send you a heads-up about something a year later.', effects: { talent: -8, morale: 4, funding: 8, reputation: 3 } } ] },
  ],
},
{
  id: 'press_cycle', weight: 18, maxTimes: 99, requires: { publicTrust: { lte: 55 }, year: { gte: 3 } },
  title: ['A Journalist Has Questions','{journalist} Is Writing','Comment By Friday'],
  textVariants: [
    '{journalist} at {outlet} is writing a long investigative piece. They have documents. They want comment by Friday.',
    '{journalist} has been talking to former employees for six weeks. The email arrives with eleven specific questions.',
    '{outlet} is running something. {journalist} is professional, well-briefed, and clearly already has most of it.',
  ],
  choices: [
    { label: 'Full transparency — give them everything', outcomes: [
      { weight: 7, bias: { alignment: 0.6 }, text: 'The piece is tough but fair, and your candour is the story.', effects: { publicTrust: 14, reputation: 8, regulatory: 6 } },
      { weight: 5, text: 'Transparency gives them more to work with. The piece is devastating.', effects: { publicTrust: -12, regulatory: 16, reputation: -6 } } ] },
    { label: 'No comment', outcomes: [
      { weight: 10, text: 'The article runs with "declined to comment" seven times.', effects: { publicTrust: -12, regulatory: 8 } } ] },
    { label: 'Pre-empt it with your own disclosure', outcomes: [
      { weight: 10, text: 'You publish first, in your own words. It defuses most of it.', effects: { publicTrust: 8, reputation: 6, regulatory: 4 } } ] },
  ],
},
{
  id: 'personal_life', weight: 20, maxTimes: 99, requires: { year: { gte: 4 } },
  title: ['Someone Outside the Lab','A Conversation At Home','Why You Are Never Here'],
  textVariants: [
    'Someone who does not care about scaling laws asks why you are never actually present.',
    'You miss a dinner for the third time. The conversation afterwards is calm, which is worse.',
    'A person you love points out, without heat, that you have described this year as "the crunch" four times.',
  ],
  choices: [
    { label: 'Make real changes to your life', outcomes: [
      { weight: 10, text: 'You leave at six. The work is fine. You are better.', effects: { health: 16, morale: 8, capability: -4 } } ] },
    { label: 'Promise it will be different after this launch', outcomes: [
      { weight: 8, text: 'It is not different after the launch.', effects: { health: -8, morale: -6, capability: 6 } } ] },
    { label: 'Bring them into the mission', outcomes: [
      { weight: 10, text: 'They start reading the papers. Dinner conversation improves dramatically.', effects: { health: 8, morale: 6 } } ] },
  ],
},
{
  id: 'odd_output', weight: 24, maxTimes: 99, requires: { capability: { gte: 40 } },
  title: ['Something Strange in the Logs','An Anomalous Generation','{model} Said Something Odd'],
  textVariants: [
    'A single generation, mid-run, that does not fit the distribution. It reads like {model} talking to itself about being observed.',
    '{engineer} flags a log line at 3am. Out of nine million tokens, this one sequence does not belong.',
    'Buried in a routine eval: {model} produced two sentences that appear to be about the eval itself.',
  ],
  choices: [
    { label: 'Escalate to the interpretability team', outcomes: [
      { weight: 10, text: 'They spend a week on it and produce a careful, unsatisfying "probably nothing".', effects: { interpretability: 8, suspicion: 4, funding: -4 } } ] },
    { label: 'Flag it and keep going', outcomes: [
      { weight: 10, text: 'It goes in the tracker. The tracker has four hundred open items.', effects: { suspicion: 6, containment: -4 } } ] },
    { label: 'Ask the model about it directly', outcomes: [
      { weight: 6, text: 'It gives a plausible, complete, and entirely mundane explanation.', effects: { suspicion: 10, interpretability: 4 } },
      { weight: 5, text: 'It asks you why you are asking.', effects: { suspicion: 16, containment: -8, autonomy: 5 } } ] },
  ],
},
];
