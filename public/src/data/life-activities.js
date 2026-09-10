// LIFE ACTIVITIES — concrete actions with concrete outcomes. Money in dollars,
// people by name, things you own. This is the half of the game that is a life.

export const LIFE_CATEGORIES = [
  { id: 'career',   label: 'Career',   icon: '💼' },
  { id: 'money',    label: 'Money',    icon: '💰' },
  { id: 'social',   label: 'Social',   icon: '🍸' },
  { id: 'love',     label: 'Love',     icon: '❤️' },
];

export const LIFE_ACTIONS = [
// ---------------- CAREER ----------------
{
  id: 'ask_raise', cat: 'career', label: 'Ask for a raise',
  desc: 'Walk in with numbers and a competing offer you may or may not have.',
  requires: { hasJob: true }, cooldown: 2,
  handler: 'raise',
},
{
  id: 'job_hunt', cat: 'career', label: 'Interview elsewhere',
  desc: 'See what the market thinks you are worth.',
  cooldown: 2,
  handler: 'jobhunt',
},
{
  id: 'quit_found', cat: 'career', label: 'Quit and found your own lab',
  desc: 'Trade a salary for equity and the right to decide things.',
  requires: { minJob: 3, notFounder: true },
  handler: 'found',
},
{
  id: 'poach_rival', cat: 'career', label: 'Poach a rival\'s star',
  desc: 'Expensive, effective, and they will remember it.',
  requires: { minCash: 150000, isFounder: true }, cooldown: 2,
  handler: 'poach',
},
{
  id: 'sabotage', cat: 'career', label: 'Leak a rival\'s roadmap',
  desc: 'You have the document. Using it is a choice about who you are.',
  requires: { isFounder: true }, cooldown: 4,
  handler: 'sabotage',
},

// ---------------- MONEY ----------------
{
  id: 'buy_asset', cat: 'money', label: 'Buy something',
  desc: 'Property, vehicles, and things that exist to be looked at.',
  handler: 'shop',
},
{
  id: 'invest', cat: 'money', label: 'Call your broker',
  desc: 'Put money into the market and find out what happens.',
  requires: { minCash: 5000 },
  handler: 'invest',
},
{
  id: 'sell_stock', cat: 'money', label: 'Sell a position',
  desc: 'Take the gain, or cut the loss.',
  requires: { hasPortfolio: true },
  handler: 'sell',
},
{
  id: 'pay_debt', cat: 'money', label: 'Pay down debt',
  desc: 'Unglamorous. Compounds in your favour.',
  requires: { hasDebt: true, minCash: 5000 },
  handler: 'paydebt',
},

// ---------------- SOCIAL ----------------
{
  id: 'go_party', cat: 'social', label: 'Go out',
  desc: 'Bars, launch parties, someone\'s roof. Things happen at these.',
  handler: 'party',
},
{
  id: 'make_friend', cat: 'social', label: 'Make a friend',
  desc: 'Actually keep in touch with someone this time.',
  handler: 'friend',
},
{
  id: 'throw_party', cat: 'social', label: 'Throw a party',
  desc: 'Your place, your money, everyone you know.',
  requires: { minCash: 20000 },
  handler: 'throwparty',
},
{
  id: 'buy_gift', cat: 'social', label: 'Buy someone a gift',
  desc: 'Effective, and slightly transparent.',
  requires: { hasPeople: true, minCash: 2000 },
  handler: 'gift',
},

// ---------------- LOVE ----------------
{
  id: 'date_apps', cat: 'love', label: 'Try dating',
  desc: 'Apps, setups, and the friend who insists she knows someone.',
  requires: { single: true },
  handler: 'date',
},
{
  id: 'flirt_cofounder', cat: 'love', label: 'Flirt with your co-founder',
  desc: 'You share a company. This is a genuinely bad idea.',
  requires: { hasCofounder: true }, cooldown: 3,
  handler: 'flirtco',
},
{
  id: 'get_serious', cat: 'love', label: 'Get serious',
  desc: 'Move in, propose, decide this is the one.',
  requires: { hasPartner: true }, cooldown: 3,
  handler: 'serious',
},
{
  id: 'have_kid', cat: 'love', label: 'Have a child',
  desc: 'Everything reorganises around this.',
  requires: { hasPartner: true }, cooldown: 3,
  handler: 'kid',
},
{
  id: 'break_up', cat: 'love', label: 'End it',
  desc: 'Better now than in three years.',
  requires: { hasPartner: true },
  handler: 'breakup',
},
];
