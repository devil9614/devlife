import { Game } from '../src/engine/game.js';

const N = 5000;
const endings = {}; let totalYears = 0, stalls = 0, maxYear = 0;
const sigs = new Set(); const eventsSeen = new Set();

for (let i = 0; i < N; i++) {
  const g = new Game({ seed: 'run-' + i });
  let guard = 0;
  while (!g.isOver && guard++ < 400) {
    // Players take activities too — exercise that path, since some events are
    // gated behind flags only activities can set.
    if (g.state.actionsLeft > 0 && Math.random() < 0.55) {
      const av = g.availableActivities();
      if (av.length) { const a = av[Math.floor(Math.random() * av.length)]; g.doActivity(a.id); continue; }
    }
    if (g.current) {
      const ev = g.current; eventsSeen.add(ev.id);
      g.choose(Math.floor(Math.random() * ev.choices.length));
    } else {
      const before = g.state.year;
      g.nextYear();
      if (g.state.year === before) { stalls++; break; }
    }
  }
  if (guard >= 400) stalls++;
  const e = g.state.ending?.id || 'survived';
  endings[e] = (endings[e] || 0) + 1;
  totalYears += g.state.year; maxYear = Math.max(maxYear, g.state.year);
  sigs.add(g.state.log.map(l => l.title + '|' + l.choice).join('>'));
}

console.log('runs:', N);
console.log('avg years/run:', (totalYears / N).toFixed(1), '| longest run:', maxYear);
console.log('stalls/infinite loops:', stalls);
console.log('distinct run signatures:', sigs.size, `(${(sigs.size/N*100).toFixed(1)}% unique)`);
console.log('distinct events reachable:', eventsSeen.size);
console.log('\nending distribution:');
for (const [k, v] of Object.entries(endings).sort((a,b)=>b[1]-a[1]))
  console.log('  ', k.padEnd(20), v, (v/N*100).toFixed(1)+'%');

let fail = false;
if (stalls > 0) { console.log('\nFAIL: stalls detected'); fail = true; }
// Random play is self-sabotaging by nature; the meaningful checks are that no
// run stalls, every event is reachable, and runs genuinely diverge.
if (sigs.size < N * 0.75) { console.log('\nFAIL: runs not diverse enough'); fail = true; }
if (eventsSeen.size < 52) { console.log('\nFAIL: unreachable events'); fail = true; }
process.exit(fail ? 1 : 0);
