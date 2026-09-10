// THE WORLD — a hand-authored, slightly isometric scene drawn in SVG that
// evolves with the run. Not decoration: every element is driven by state, so
// the room is a readable summary of the life you have built.
//
// Tiers: bedroom -> startup -> institute -> campus -> compound -> global.
// Within a tier the scene mutates: deterioration when broke, surveillance when
// containment is low, visitors when reputation is high, anomalies when the
// model is slipping away from you.

import { netWorth } from '../engine/life.js';
import { activePeople } from '../engine/people.js';

export const TIERS = [
  { id: 'bedroom',   name: 'Rented room',            sub: 'one GPU, borrowed time' },
  { id: 'startup',   name: 'The first lab',          sub: 'a lease and a lot of nerve' },
  { id: 'institute', name: 'Research institute',     sub: 'people who cite you' },
  { id: 'campus',    name: 'Corporate campus',       sub: 'a badge for every door' },
  { id: 'compound',  name: 'Restricted facility',    sub: 'no windows, by design' },
  { id: 'global',    name: 'Planetary infrastructure', sub: 'a footprint, not a building' },
];

export function tierFor(state) {
  const cap = state.stats.capability, nw = netWorth(state.life);
  const staff = activePeople(state).length;
  if (state.flags.nationalized || state.stats.regulatory > 72) return 4;
  if (cap >= 150 || state.flags.agi_declared) return 5;
  if (cap >= 95 || nw > 40e6) return 4;
  if (cap >= 55 || staff >= 8 || nw > 4e6) return 3;
  if (cap >= 25 || staff >= 4 || nw > 400e3) return 2;
  if (cap >= 10 || staff >= 2) return 1;
  return 0;
}

// ---- small drawing helpers -------------------------------------------------
const R = (x, y, w, h, f, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra}/>`;
const P = (d, f, extra = '') => `<path d="${d}" fill="${f}" ${extra}/>`;

/** A person rendered as a small ink figure — silhouette first, colour second. */
function figure(x, y, s, colour, pose = 'stand', seedN = 0) {
  const skin = '#c9a07a';
  const wob = (seedN % 3) - 1;
  const heads = {
    stand: `<circle cx="0" cy="-13" r="4.2" fill="${skin}"/>`,
    desk:  `<circle cx="1" cy="-11" r="4.2" fill="${skin}"/>`,
    sleep: `<circle cx="4" cy="-6" r="4.2" fill="${skin}"/>`,
    board: `<circle cx="0" cy="-14" r="4.2" fill="${skin}"/>`,
  };
  const bodies = {
    stand: `<path d="M-4,-9 L4,-9 L5,2 L-5,2 Z" fill="${colour}"/>
            <rect x="-4.5" y="2" width="3.4" height="7" fill="#20293a"/>
            <rect x="1.1" y="2" width="3.4" height="7" fill="#20293a"/>`,
    desk:  `<path d="M-4,-7 L5,-7 L6,2 L-5,2 Z" fill="${colour}"/>
            <rect x="-5" y="2" width="9" height="4" fill="#20293a"/>`,
    sleep: `<path d="M-6,-3 L8,-3 L8,2 L-6,2 Z" fill="${colour}"/>`,
    board: `<path d="M-4,-10 L4,-10 L5,1 L-5,1 Z" fill="${colour}"/>
            <rect x="-4.5" y="1" width="3.4" height="8" fill="#20293a"/>
            <rect x="1.1" y="1" width="3.4" height="8" fill="#20293a"/>
            <path d="M4,-9 L11,-13" stroke="${skin}" stroke-width="2.2" stroke-linecap="round"/>`,
  };
  return `<g transform="translate(${x},${y}) scale(${s})" class="fig fig-${pose}" style="--wob:${wob}">
    ${bodies[pose] || bodies.stand}${heads[pose] || heads.stand}
  </g>`;
}

function rack(x, y, h, lit, glitch) {
  const rows = Math.max(2, Math.round(h / 9));
  let leds = '';
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < 3; j++) {
      const on = ((i * 3 + j + lit) % 4) !== 0;
      leds += `<rect x="${x + 4 + j * 5}" y="${y + 5 + i * 9}" width="3" height="2.4"
        fill="${on ? (glitch ? '#e0524f' : '#3fd8c8') : '#1d2735'}"
        class="${on ? 'led' : ''}" style="--d:${(i * 3 + j) % 7}"/>`;
    }
  }
  return `${R(x, y, 22, h, '#1e2837')}${R(x, y, 22, 2, '#33425c')}${leds}`;
}

function whiteboard(x, y, w, h, dense) {
  let marks = '';
  const lines = dense ? 7 : 4;
  for (let i = 0; i < lines; i++) {
    const lw = 12 + ((i * 37) % (w - 22));
    marks += `<rect x="${x + 6}" y="${y + 7 + i * 6}" width="${lw}" height="1.6" fill="#8a99b0" opacity="${0.35 + (i % 3) * 0.2}"/>`;
  }
  if (dense) marks += `<circle cx="${x + w - 14}" cy="${y + h - 13}" r="6" fill="none" stroke="#b98a4b" stroke-width="1.4"/>`;
  return `${R(x, y, w, h, '#26303f')}${R(x, y, w, h, 'none', 'stroke="#41506d" stroke-width="1.2"')}${marks}`;
}

function window_(x, y, w, h, mood) {
  const sky = { night: '#0d1626', dawn: '#2a2131', day: '#1b2a3d', storm: '#131a26' }[mood] || '#121c2b';
  const glow = { night: '#1b2f4d', dawn: '#7a4a37', day: '#2f4c6b', storm: '#1a2436' }[mood] || '#1b2f4d';
  let stars = '';
  if (mood === 'night') for (let i = 0; i < 7; i++)
    stars += `<circle cx="${x + 6 + ((i * 29) % (w - 10))}" cy="${y + 5 + ((i * 17) % (h - 12))}" r="0.9" fill="#8fa6c4" opacity="${0.3 + (i % 3) * 0.2}"/>`;
  return `${R(x, y, w, h, sky)}
    <rect x="${x}" y="${y + h * 0.55}" width="${w}" height="${h * 0.45}" fill="${glow}" opacity="0.55"/>
    ${stars}
    ${R(x, y, w, h, 'none', 'stroke="#3a4a63" stroke-width="2"')}
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#3a4a63" stroke-width="1.6"/>`;
}

// ---- the scene -------------------------------------------------------------
export function renderWorld(state, fit = 'meet') {
  const t = tierFor(state);
  const st = state.stats, L = state.life;
  const staff = activePeople(state);
  const broke = L.cash < 20000 || L.debt > 300000;
  const watched = st.containment < 40;
  const anomaly = st.containment < 25 || st.autonomy > 55;
  const famous = st.reputation > 60 || L.fame > 40;
  const breakthrough = state._breakthrough;
  const mood = broke ? 'storm' : (t >= 4 ? 'night' : (st.morale > 60 ? 'day' : 'night'));

  const W = 400, H = 250;
  let bg = '', mid = '', fg = '', sky = '';

  // Ground plane + back wall, slightly isometric
  const wall = broke ? '#1d2330' : '#232c3d';
  const floor = broke ? '#171c26' : '#1b2331';
  bg += R(0, 0, W, H, wall);
  bg += P(`M0,${H * 0.58} L${W},${H * 0.52} L${W},${H} L0,${H} Z`, floor);
  bg += P(`M0,${H * 0.58} L${W},${H * 0.52} L${W},${H * 0.545} L0,${H * 0.605} Z`, '#141a25');

  // Skyline through windows for larger tiers
  if (t >= 2) {
    sky += window_(232, 26, 148, 62, mood);
    let towers = '';
    const n = 4 + t * 2;
    for (let i = 0; i < n; i++) {
      const bw = 9 + ((i * 13) % 14), bx = 236 + i * (140 / n), bh = 12 + ((i * 23) % (14 + t * 6));
      towers += R(bx, 88 - bh, bw, bh, '#16202f');
      if (i % 2 === 0) towers += R(bx + 2, 88 - bh + 3, 2, 2, '#c98b3f');
    }
    sky += towers;
  } else {
    sky += window_(268, 30, 96, 54, mood);
    if (mood === 'storm') sky += `<g class="rain">${Array.from({length:9},(_,i)=>
      `<line x1="${272+i*10}" y1="34" x2="${268+i*10}" y2="80" stroke="#4a5d78" stroke-width="1" opacity="0.5" style="--d:${i%5}"/>`).join('')}</g>`;
  }

  // Desks / racks scale with tier
  const deskCount = [1, 2, 3, 4, 4, 5][t];
  for (let i = 0; i < deskCount; i++) {
    const dx = 18 + i * 62, dy = 158 + (i % 2) * 8;
    mid += P(`M${dx},${dy} L${dx + 52},${dy - 4} L${dx + 52},${dy + 5} L${dx},${dy + 9} Z`, '#2f3b51');
    mid += R(dx + 6, dy - 18, 20, 14, '#141c29');
    mid += R(dx + 8, dy - 16, 16, 10, watched && i % 2 ? '#4a2530' : '#1e4a67');
    if (anomaly && i === 1) mid += `<rect x="${dx+8}" y="${dy-16}" width="16" height="10" fill="#e0524f" class="glitchscreen"/>`;
    mid += R(dx + 4, dy + 9, 4, 12, '#242e40');
    mid += R(dx + 44, dy + 7, 4, 12, '#242e40');
  }

  // Compute racks — count grows with compute stat
  const racks = Math.min(6, Math.floor(st.compute / 18));
  for (let i = 0; i < racks; i++) {
    mid += rack(300 + (i % 3) * 26, 122 + Math.floor(i / 3) * 6, 54 - (i % 2) * 6, i, anomaly);
  }

  // Whiteboards
  if (t >= 1) mid += whiteboard(16, 34, 86, 52, st.interpretability > 45);
  if (t >= 3) mid += whiteboard(112, 40, 70, 44, st.capability > 90);

  // Bedroom specifics
  if (t === 0) {
    mid += P(`M20,180 L96,174 L96,198 L20,205 Z`, '#242c3c');   // bed
    mid += P(`M20,180 L96,174 L96,180 L20,187 Z`, '#33405a');
    mid += R(120, 150, 30, 26, '#1e2837');                        // single tower
    mid += R(124, 154, 4, 3, '#3fd8c8', 'class="led" style="--d:1"');
  }

  // Security / surveillance when control is low
  if (watched) {
    fg += `<g opacity="0.9">${P('M196,18 L212,18 L212,28 L204,34 L196,28 Z', '#2a3346')}
      <circle cx="204" cy="24" r="2.6" fill="#e0524f" class="led" style="--d:2"/></g>`;
    fg += R(178, 118, 5, 62, '#232d3f');   // door frame / lock
    fg += `<circle cx="180.5" cy="150" r="2.4" fill="#c98b3f"/>`;
  }

  // Visitors when famous
  if (famous) {
    fg += figure(226, 186, 1.05, '#b98a4b', 'stand', 3);
    fg += `<rect x="234" y="174" width="9" height="6" fill="#2a3346"/>`; // camera
  }

  // The team, physically present
  const poses = ['desk', 'board', 'stand', 'desk', 'sleep', 'stand', 'desk'];
  const shown = staff.slice(0, 6);
  shown.forEach((p, i) => {
    const pose = (p.morale < 30 && i % 2 === 0) ? 'sleep' : poses[i % poses.length];
    const px = 38 + i * 58, py = 182 + (i % 2) * 6;
    const palette = ['#b98a4b', '#3fd8c8', '#c9695f', '#7d8fb3', '#8fae6b', '#a2739c'];
    fg += figure(px, py, 1, palette[p.sprite % palette.length], pose, p.sprite);
  });

  // You — always present, near the front
  fg += figure(W - 52, 212, 1.15, '#d8c9a8', staff.length ? 'stand' : 'desk', 1);

  // Breakthrough flash
  if (breakthrough) fg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#7fe3a1" class="flash"/>`;

  // Deterioration
  if (broke) {
    fg += `<g opacity="0.5">
      ${P('M0,0 L14,0 L0,18 Z', '#0b0f17')}
      ${P(`M${W},0 L${W - 18},0 L${W},22 Z`, '#0b0f17')}
      <line x1="60" y1="0" x2="76" y2="46" stroke="#0b0f17" stroke-width="2"/>
    </g>`;
  }

  // Light + grain
  const lightX = t >= 2 ? 300 : 310;
  fg += `<ellipse cx="${lightX}" cy="60" rx="120" ry="80" fill="url(#wlight)" opacity="${broke ? 0.16 : 0.34}"/>`;
  if (anomaly) fg += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#wglitch)" opacity="0.5" class="anomaly"/>`;

  return `<svg viewBox="0 0 ${W} ${H}" class="world-svg" preserveAspectRatio="${fit==='slice'?'xMidYMid slice':'xMidYMid meet'}" aria-hidden="true">
    <defs>
      <radialGradient id="wlight" cx="0.5" cy="0.3">
        <stop offset="0%" stop-color="#ffd9a0" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#ffd9a0" stop-opacity="0"/>
      </radialGradient>
      <pattern id="wglitch" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="1" fill="#e0524f" opacity="0.25"/>
      </pattern>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
        <feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    ${bg}${sky}${mid}${fg}
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05" style="mix-blend-mode:overlay"/>
  </svg>`;
}

export function worldCaption(state) {
  const t = TIERS[tierFor(state)];
  const st = state.stats;
  let note = t.sub;
  if (state.life.cash < 20000) note = 'the lease is a problem';
  else if (st.containment < 25) note = 'something is wrong with the logs';
  else if (st.reputation > 70) note = 'people cite you now';
  return { name: t.name, note };
}
