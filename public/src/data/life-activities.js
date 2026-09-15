// LIFE ACTIVITIES — concrete actions with concrete outcomes. Money in dollars,
// people by name, things you own. This is the half of the game that is a life.

export const LIFE_CATEGORIES = [
  { id: 'career',   label: 'Career',   icon: '💼' },
  { id: 'money',    label: 'Assets',   icon: '🏎️' },
  { id: 'bank',     label: 'Bank',     icon: '🏦' },
  { id: 'markets',  label: 'Markets',  icon: '📈' },
  { id: 'social',   label: 'Social',   icon: '🍸' },
  { id: 'love',     label: 'Love',     icon: '❤️' },
  { id: 'chaos',    label: 'Chaos',    icon: '⚠️' },
];

export const LIFE_ACTIONS = [
// ---------------- CAREER ----------------
{
  id: 'put_in_work', icon: '⌨️', cat: 'career', label: 'Put in the work',
  desc: 'No dice roll, just hours. Builds the standing a raise or promotion needs.',
  requires: { hasJob: true },
  handler: 'grind',
},
{
  id: 'ask_raise', icon: '📊', cat: 'career', label: 'Ask for a raise',
  desc: 'Walk in with numbers and a track record, not just nerve.',
  requires: { hasJob: true }, cooldown: 2,
  handler: 'raise',
},
{
  id: 'job_hunt', icon: '🔎', cat: 'career', label: 'Interview elsewhere',
  desc: 'See what the market thinks you are worth.',
  cooldown: 2,
  handler: 'jobhunt',
},
{
  id: 'quit_found', icon: '🚪', cat: 'career', label: 'Quit and found your own lab',
  desc: 'Trade a salary for equity and the right to decide things.',
  requires: { minJob: 3, notFounder: true },
  handler: 'found',
},
{
  id: 'poach_rival', icon: '🎣', cat: 'career', label: 'Poach a rival\'s star',
  desc: 'Expensive, effective, and they will remember it.',
  requires: { minCash: 150000, isFounder: true }, cooldown: 2,
  handler: 'poach',
},
{
  id: 'sabotage', icon: '🗞️', cat: 'career', label: 'Leak a rival\'s roadmap',
  desc: 'You have the document. Using it is a choice about who you are.',
  requires: { isFounder: true }, cooldown: 4,
  handler: 'sabotage',
},

// ---------------- MONEY ----------------
{
  id: 'buy_asset', icon: '🛍️', cat: 'money', label: 'Buy something',
  desc: 'Property, vehicles, and things that exist to be looked at.',
  handler: 'shop',
},
{
  id: 'invest', icon: '📞', cat: 'markets', label: 'Call your broker',
  desc: 'Put money into the market and find out what happens.',
  requires: { minCash: 5000 },
  handler: 'invest',
},
{
  id: 'sell_stock', icon: '💸', cat: 'markets', label: 'Sell a position',
  desc: 'Take the gain, or cut the loss.',
  requires: { hasPortfolio: true },
  handler: 'sell',
},
{
  id: 'pay_debt', icon: '🧾', cat: 'bank', label: 'Pay down debt',
  desc: 'Unglamorous. Compounds in your favour.',
  requires: { hasDebt: true, minCash: 5000 },
  handler: 'paydebt',
},
{
  id: 'bank_loan', icon: '🏦', cat: 'bank', label: 'Apply for a bank loan',
  desc: 'Borrow against your future, at a price.',
  handler: 'bankLoan', cooldown: 1,
},
{
  id: 'buy_crypto', icon: '🪙', cat: 'markets', label: 'Buy crypto',
  desc: 'A volatile position and a very loud group chat.',
  requires: { minCash: 250 }, handler: 'buyCrypto',
},
{
  id: 'sell_crypto', icon: '💱', cat: 'markets', label: 'Cash out crypto',
  desc: 'Turn conviction back into dollars.',
  handler: 'sellCrypto',
},

// ---------------- SOCIAL ----------------
{
  id: 'go_party', icon: '🍸', cat: 'social', label: 'Go out',
  desc: 'Bars, launch parties, someone\'s roof. Things happen at these.',
  handler: 'party',
},
{
  id: 'make_friend', icon: '🫱', cat: 'social', label: 'Make a friend',
  desc: 'Actually keep in touch with someone this time.',
  handler: 'friend',
},
{
  id: 'throw_party', icon: '🎉', cat: 'social', label: 'Throw a party',
  desc: 'Your place, your money, everyone you know.',
  requires: { minCash: 20000 },
  handler: 'throwparty',
},
{
  id: 'buy_gift', icon: '🎁', cat: 'social', label: 'Buy someone a gift',
  desc: 'Effective, and slightly transparent.',
  requires: { hasPeople: true, minCash: 2000 },
  handler: 'gift',
},

// ---------------- LOVE ----------------
{
  id: 'date_apps', icon: '◌', cat: 'love', label: 'Open Signal dating',
  desc: 'Browse age-compatible matches. Conversation comes before a date.',
  requires: { single: true },
  handler: 'dateApps',
},
{
  id: 'flirt_cofounder', icon: '💘', cat: 'love', label: 'Flirt with your co-founder',
  desc: 'You share a company. This is a genuinely bad idea.',
  requires: { hasCofounder: true }, cooldown: 3,
  handler: 'flirtco',
},
{
  id: 'get_serious', icon: '💍', cat: 'love', label: 'Get married',
  desc: 'Make a promise, tell the family, and merge the calendars.',
  requires: { hasPartner: true }, cooldown: 3,
  handler: 'serious',
},
{
  id: 'have_kid', icon: '🍼', cat: 'love', label: 'Try for a child',
  desc: 'Start a family. A baby arrives only after time passes.',
  requires: { hasPartner: true, notPregnant: true }, cooldown: 1,
  handler: 'kid',
},
{
  id: 'break_up', icon: '💔', cat: 'love', label: 'End it',
  desc: 'Better now than in three years.',
  requires: { hasPartner: true },
  handler: 'breakup',
},

// ---------------- CHAOS ----------------
{
  id: 'run_scam', icon: '🎭', cat: 'chaos', label: 'Run a shady growth scheme',
  desc: 'Money can arrive before the consequences do.',
  handler: 'scam', cooldown: 2,
},
{
  id: 'commit_crime', icon: '🕶️', cat: 'chaos', label: 'Take a criminal shortcut',
  desc: 'Fictional, risky, and never a clean win.',
  handler: 'crime', cooldown: 3,
},
];
