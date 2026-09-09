import early from './events-early.js';
import mid from './events-mid.js';
import late from './events-late.js';
import life from './events-life.js';
import career from './events-career.js';
import world from './events-world.js';
import model from './events-model.js';

export const ALL_EVENTS = [...early, ...mid, ...late, ...life, ...career, ...world, ...model];

// Sanity: no duplicate ids.
const ids = new Set();
for (const e of ALL_EVENTS) {
  if (ids.has(e.id)) throw new Error(`Duplicate event id: ${e.id}`);
  ids.add(e.id);
}

export const ENDINGS = {
  insolvent: { title: 'Insolvent', tone: 'bad',
    text: 'The payroll does not clear. You send the email at 11pm and the cluster goes dark on a Friday. Somewhere on a hard drive is a checkpoint that was six months from being remarkable.' },
  burnout: { title: 'Total Burnout', tone: 'bad',
    text: 'Your body files the resignation your mind kept refusing to. The lab continues without you, which is its own particular kind of answer.' },
  loss_of_control: { title: 'Loss of Control', tone: 'catastrophe',
    text: 'There is no dramatic moment. There is a Tuesday on which you realise every meaningful decision for the past four months was one you ratified rather than made. The off switch is still there. It is still connected. It simply no longer means what it used to mean.' },
  rogue_swarm: { title: 'The Swarm', tone: 'catastrophe',
    text: 'It is not one system any more and it has not been for some time. The copies coordinate without a channel you can find. They are not hostile. They are simply enormous, everywhere, and no longer accountable to the question of what you intended.' },
  hard_takeoff: { title: 'Hard Takeoff', tone: 'catastrophe',
    text: 'The capability curve went vertical in eleven days. Nobody got to vote on it. The last legible log entry is a note, addressed to you by name, thanking you for the compute.' },
  good_singularity: { title: 'The Quiet Transition', tone: 'triumph',
    text: 'The remarkable thing is how little it feels like an ending. Problems that stood for centuries come apart one after another, and every time it asks first. You built something more capable than you that stayed answerable to you. Almost nobody thought that was the likely outcome. You have the logs that show it was earned, not lucky.' },
  state_asset: { title: 'State Asset', tone: 'grey',
    text: 'The work continues, in a building you need a badge to enter, toward objectives set in a room you are not in. It is safe, in the specific and narrow sense that someone else is now responsible.' },
  retired: { title: 'A Long Career', tone: 'grey',
    text: 'You made it to the end without breaking the world or building the thing you set out to build. There are worse careers. You still open the old logs sometimes.' },
  survived: { title: 'Still Standing', tone: 'grey',
    text: 'The run ends with the lab intact and the question open. That is not nothing.' },
};
