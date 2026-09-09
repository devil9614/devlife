// People events. These reference the actual roster — the person in the text is
// someone on your team with a name, a tenure, and a history.
export default [
{
  id: 'star_researcher', weight: 30, maxTimes: 99,
  requires: { talent: { gte: 35 }, year: { gte: 2 } },
  title: ['Someone Is Doing Extraordinary Work','A Standout Year','{engineer} Is On Something'],
  textVariants: [
    'One person on the team has produced more this year than the rest combined. They know it, and they have started asking for things.',
    '{engineer} solved a problem the field has been stuck on. Quietly, over a weekend, without telling anyone until it worked.',
    'The best work in the building this year came from one desk. That is a strength and a single point of failure.',
  ],
  choices: [
    { label: 'Give them their own team and budget', outcomes: [
      { weight: 10, text: 'They build something remarkable and hire three people who are nearly as good.',
        effects: { capability: 12, morale: 6, funding: -14 }, hires: { count: 2, quality: 68 } } ] },
    { label: 'Promote them into management', outcomes: [
      { weight: 6, text: 'They turn out to be good at it, which nobody expected including them.',
        effects: { talent: 6, morale: 10, capability: 3 } },
      { weight: 6, text: 'You convert your best researcher into a mediocre manager. It takes a year to admit.',
        effects: { capability: -8, morale: -8 } } ] },
    { label: 'Keep things as they are', outcomes: [
      { weight: 7, text: 'Nothing changes. They notice that nothing changed.',
        effects: { morale: -8 } },
      { weight: 5, text: 'Nothing changes, and six months later they leave for a lab that offered them something.',
        effects: { morale: -10 }, loses: 1 } ] },
  ],
},
{
  id: 'team_disagreement', weight: 28, maxTimes: 99,
  requires: { year: { gte: 3 }, capability: { gte: 35 } },
  title: ['The Room Is Split','A Disagreement That Will Not Resolve','Two Camps'],
  textVariants: [
    'Half the research team wants to ship the next model. The other half wants six more months of evals. Both have written documents.',
    'A technical disagreement has become a cultural one. People are choosing sides in a debate that started about batch sizes.',
    '{safetyLead} and your research lead have stopped speaking directly and started routing everything through you.',
  ],
  choices: [
    { label: 'Side with shipping', outcomes: [
      { weight: 10, text: 'You ship. The cautious half updates their resumes without saying so.',
        effects: { capability: 12, alignment: -8, morale: -10, containment: -6 } } ] },
    { label: 'Side with caution', outcomes: [
      { weight: 10, text: 'Six more months of evals. Two of the fastest people leave for somewhere that moves.',
        effects: { alignment: 12, containment: 8, capability: -5, morale: -4 }, loses: 1 } ] },
    { label: 'Make them resolve it themselves', outcomes: [
      { weight: 6, text: 'They lock themselves in a room for two days and come out with a plan better than either original.',
        effects: { morale: 14, alignment: 6, capability: 5, interpretability: 4 } },
      { weight: 6, text: 'They do not resolve it. The disagreement calcifies and the whole team works around it for a year.',
        effects: { morale: -12, capability: -4 } } ] },
  ],
},
{
  id: 'poached_hard', weight: 26, maxTimes: 99,
  requires: { talent: { gte: 45 }, year: { gte: 4 } },
  title: ['{rival} Is Hiring Your People','A Raid','Three Offers In One Week'],
  textVariants: [
    '{rival} has made offers to three of your researchers in a single week. This is not coincidence; it is a strategy.',
    'A recruiter working for {rival} has been methodically contacting everyone on your team who has published.',
    '{rival} raised a large round and is spending it on exactly the people you spent four years training.',
  ],
  choices: [
    { label: 'Counter every offer, whatever it costs', outcomes: [
      { weight: 10, text: 'You keep almost everyone. The salary band is now permanently reset and everybody knows what everybody earns.',
        effects: { funding: -30, morale: 6, talent: 4 } } ] },
    { label: 'Let them go and hire the next generation', outcomes: [
      { weight: 10, text: 'You lose experience and gain hunger. It is not obviously the wrong trade.',
        effects: { funding: -10, capability: -6 }, loses: 2, hires: { count: 3, quality: 48 } } ] },
    { label: 'Compete on mission, not money', outcomes: [
      { weight: 6, bias: { morale: 1.0 }, text: 'Most of them stay. One of them tells you it was the charter, not the equity.',
        effects: { morale: 16, talent: 3 } },
      { weight: 6, text: 'Mission does not pay a mortgage. You lose the two you could least afford to lose.',
        effects: { morale: -8 }, loses: 2 } ] },
  ],
},
{
  id: 'mentor_moment', weight: 22, maxTimes: 99,
  requires: { year: { gte: 5 }, talent: { gte: 40 } },
  title: ['A Junior Researcher Asks For Help','Someone Wants Your Time','An Hour A Week'],
  textVariants: [
    'A junior researcher asks whether you would look at their work once a week. You do not have the hour.',
    'The newest hire has an idea that is either naive or excellent, and figuring out which would take you an afternoon.',
    'Someone two years into their career asks you the question you were asked at their age, and you remember who answered it.',
  ],
  choices: [
    { label: 'Make the time', outcomes: [
      { weight: 10, text: 'You lose four hours a month and gain a researcher who will be better than you within a decade.',
        effects: { talent: 8, morale: 10, capability: -2, health: -3 } } ] },
    { label: 'Hand them to someone senior', outcomes: [
      { weight: 10, text: 'A reasonable delegation. It works out fine, and they never quite ask you anything again.',
        effects: { talent: 4, morale: 2 } } ] },
    { label: 'You genuinely do not have time', outcomes: [
      { weight: 10, text: 'You do not have time. That is true, and it is also the thing you promised you would never become.',
        effects: { morale: -6, capability: 3 } } ] },
  ],
},
];
