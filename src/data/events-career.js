// Career, rivalry, and the personal cost of the work.
export default [
{
  id: 'cofounder_split', once: true, weight: 42,
  requires: { year: { gte: 3 }, morale: { lte: 60 } },
  title: 'Your Co-Founder Wants Out',
  text: 'They built half of this with you. They say the lab has become something they did not sign up for, and they are not entirely wrong.',
  choices: [
    { label: 'Buy out their stake', outcomes: [
      { weight: 10, text: 'Expensive and clean. You keep control and lose the only person who ever told you no.',
        effects: { funding: -30, morale: -8, containment: -6 } } ] },
    { label: 'Talk them into staying', outcomes: [
      { weight: 6, bias: { morale: 1.0 }, text: 'You talk for nine hours. They stay, and the lab is better for the argument.',
        effects: { morale: 14, talent: 6, containment: 6 } },
      { weight: 5, text: 'They stay another eighteen months and resent every one of them.',
        effects: { morale: -14, talent: -6 } } ] },
    { label: 'Let them go and say why, publicly', outcomes: [
      { weight: 10, text: 'You write an honest post about the disagreement. The field reads it closely.',
        effects: { reputation: 8, publicTrust: 10, talent: -10, morale: -4 } } ] },
  ],
},
{
  id: 'acquisition_offer', once: true, weight: 40,
  requires: { capability: { gte: 55 }, reputation: { gte: 35 } },
  title: 'They Want to Buy You',
  text: 'A trillion-dollar company offers to acquire the lab. The number would set you up forever. The org chart would put you four levels from the decision-making.',
  choices: [
    { label: 'Sell', outcomes: [
      { weight: 10, text: 'The deal closes. You have more compute than you ever dreamed of and less say than you have had since the garage.',
        effects: { funding: 90, compute: 40, containment: -10, morale: -14, reputation: -6 }, flags: { merged_labs: true } } ] },
    { label: 'Refuse and stay independent', outcomes: [
      { weight: 10, text: 'You say no. Your team finds out what you turned down and stands a little taller.',
        effects: { morale: 20, reputation: 10, funding: -6 } } ] },
    { label: 'Counter: take investment, keep control', outcomes: [
      { weight: 6, bias: { reputation: 1.0 }, text: 'They take a minority stake and a board observer seat. You keep the wheel.',
        effects: { funding: 55, compute: 20, morale: 4 } },
      { weight: 5, text: 'They walk, and their next move is to fund your closest competitor.',
        effects: { funding: -4 }, flags: { competitor_ahead: true } } ] },
  ],
},
{
  id: 'ipo', once: true, weight: 34,
  requires: { funding: { gte: 60 }, flags: { public_deployment: true, went_public: false } },
  title: 'Take It Public',
  text: 'Bankers say the window is open. Going public means capital without limit and a quarterly obligation to strangers.',
  choices: [
    { label: 'Ring the bell', outcomes: [
      { weight: 10, text: 'The stock pops forty percent on day one. You are now accountable to a market that has never read a safety paper.',
        effects: { funding: 100, reputation: 12, containment: -12, morale: -6 }, flags: { went_public: true },
        delayed: [{ inYears: 2, text: 'The first bad quarter arrives. The pressure to ship something, anything, is immense.', effects: { alignment: -10, capability: 8, morale: -8 } }] } ] },
    { label: 'Stay private', outcomes: [
      { weight: 10, text: 'You stay private and slower. The people who care about the mission are relieved.',
        effects: { morale: 12, funding: -8, containment: 6 } } ] },
  ],
},
{
  id: 'rival_collapse', once: true, weight: 30,
  requires: { flags: { competitor_ahead: true }, year: { gte: 6 } },
  title: 'Your Rival Just Imploded',
  text: 'The lab that was ahead of you had a catastrophic safety incident and lost their funding overnight. Their researchers are all available on Monday.',
  choices: [
    { label: 'Hire their whole safety team', outcomes: [
      { weight: 10, text: 'You take the people everyone else overlooked. Best decision you make this decade.',
        effects: { talent: 16, interpretability: 14, containment: 10, funding: -18 },
        flags: { competitor_collapsed: true, competitor_ahead: false } } ] },
    { label: 'Hire their capabilities team', outcomes: [
      { weight: 10, text: 'You get the people who built the thing that was beating you. You also get their habits.',
        effects: { talent: 18, capability: 16, funding: -18, alignment: -8, containment: -6 },
        flags: { competitor_collapsed: true, competitor_ahead: false } } ] },
    { label: 'Buy their compute at the fire sale', outcomes: [
      { weight: 10, text: 'Forty thousand accelerators at thirty cents on the dollar.',
        effects: { compute: 34, funding: -22 }, flags: { competitor_collapsed: true, competitor_ahead: false } } ] },
  ],
},
{
  id: 'insider_threat', weight: 28, maxTimes: 3,
  requires: { year: { gte: 5 }, capability: { gte: 45 } },
  title: 'Someone Is Talking',
  text: 'Details from internal meetings are appearing in a journalist\'s reporting with uncomfortable accuracy.',
  choices: [
    { label: 'Launch a leak investigation', outcomes: [
      { weight: 7, text: 'You find them. The investigation itself does more damage to trust than the leaks did.',
        effects: { morale: -16, containment: 6, talent: -6 } },
      { weight: 6, text: 'You find nothing and everyone knows they were investigated.',
        effects: { morale: -20, talent: -8 } } ] },
    { label: 'Address it openly at an all-hands', outcomes: [
      { weight: 10, text: 'You say you would rather fix the reason someone felt they had to leak. The leaking mostly stops.',
        effects: { morale: 14, publicTrust: 6, containment: -4 } } ] },
    { label: 'Ignore it', outcomes: [
      { weight: 10, text: 'The reporting continues. Some of it is more accurate than your own internal understanding.',
        effects: { publicTrust: 4, regulatory: 10, morale: -4 } } ] },
  ],
},
{
  id: 'award', weight: 22, maxTimes: 4,
  requires: { reputation: { gte: 55 } },
  title: 'They Are Giving You a Prize',
  text: 'A major award for contributions to the field. There is a speech, and everyone will be listening.',
  choices: [
    { label: 'Accept graciously and celebrate the team', outcomes: [
      { weight: 10, text: 'You name eleven people from the stage. The clip that circulates is the one where you get emotional.',
        effects: { reputation: 10, morale: 16, publicTrust: 8 } } ] },
    { label: 'Use the speech to warn about the risks', outcomes: [
      { weight: 10, text: 'You accept an award for capability and spend the speech on what it might cost. The room is very quiet.',
        effects: { reputation: 6, publicTrust: 14, regulatory: 14, containment: 4 } } ] },
    { label: 'Decline the award', outcomes: [
      { weight: 10, text: 'You say the work is not finished and prizes are premature. It reads as either integrity or arrogance.',
        effects: { reputation: 4, publicTrust: 6, morale: -4 } } ] },
  ],
},
{
  id: 'health_scare', once: true, weight: 30,
  requires: { health: { lte: 45 }, year: { gte: 6 } },
  title: 'The Doctor Wants to Talk',
  text: 'The test results came back. Nothing is immediately dangerous, but the phrase "if you continue like this" is used twice.',
  choices: [
    { label: 'Step back to a research-only role', outcomes: [
      { weight: 10, text: 'You hand over operations. The lab runs fine without you at the centre, which stings and then helps.',
        effects: { health: 28, morale: 6, capability: 4, funding: -6 } } ] },
    { label: 'Change nothing', outcomes: [
      { weight: 8, text: 'You go back to work the same afternoon.', effects: { health: -14, capability: 6 } },
      { weight: 4, text: 'You go back to work, and eight months later you lose a year to it.',
        effects: { health: -28, capability: -10, morale: -10 } } ] },
    { label: 'Hire a real COO', outcomes: [
      { weight: 10, text: 'A grown-up runs the company. You do the science. It should have happened years ago.',
        effects: { health: 18, talent: 8, funding: -14, morale: 8 } } ] },
  ],
},
{
  id: 'student_letter', weight: 20, maxTimes: 4,
  requires: { reputation: { gte: 30 } },
  title: 'A Letter From a Student',
  text: 'A nineteen-year-old writes to say your work is why they went into the field, and asks whether they should be worried about what they are building.',
  choices: [
    { label: 'Tell them the truth as you understand it', outcomes: [
      { weight: 10, text: 'You write two thousand honest words. They post it. It is read four million times.',
        effects: { publicTrust: 12, reputation: 8, morale: 6 } } ] },
    { label: 'Reassure them', outcomes: [
      { weight: 10, text: 'You tell them it will be fine. You are not certain you believe it.',
        effects: { publicTrust: 4, morale: -6 } } ] },
    { label: 'Offer them an internship', outcomes: [
      { weight: 10, text: 'They turn out to be extraordinary. Four years later they run your interpretability team.',
        effects: { talent: 10, interpretability: 6, morale: 6 } } ] },
  ],
},
];
