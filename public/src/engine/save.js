// Autosave. A life is long — losing one to a closed tab is the worst possible
// failure for this genre. State is written to localStorage after every action
// and restored on load.
//
// Two things need care:
//  1. The RNG stream position, or a restored run silently rerolls its world.
//  2. The event queue holds references into ALL_EVENTS; those are stored as
//     ids and rehydrated, since functions/identity don't survive JSON.

import { ALL_EVENTS } from '../data/index.js';
import { makeRng } from './rng.js';

const KEY = 'devlife.save.v1';
const VERSION = 1;

export function saveGame(game, ui = {}) {
  if (!game) return false;
  try {
    const payload = {
      v: VERSION,
      savedAt: Date.now(),
      seed: game.seed,
      rng: game.rng.getState(),
      state: game.state,
      queue: game.queue.map(e => e.id),
      yearNotes: game.yearNotes || [],
      ui,                       // feed, current tab — so the screen looks the same
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;   // private mode, quota, disabled storage — never crash the game
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.v !== VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function hasSave() { return loadSave() != null; }

/** Rebuild a live Game from a save without re-running the constructor. */
export function restoreGame(GameClass, data) {
  if (!data) return null;
  const g = Object.create(GameClass.prototype);
  g.seed = data.seed;
  g.rng = makeRestoredRng(data.seed, data.rng);
  g.state = data.state;
  g.world = data.state.world;
  g.queue = (data.queue || []).map(id => ALL_EVENTS.find(e => e.id === id)).filter(Boolean);
  g.yearNotes = data.yearNotes || [];
  g._rosterNotes = [];
  g._shownFor = null;
  g._shown = null;
  return g;
}

function makeRestoredRng(seed, position) {
  // Rebuild from the seed, then jump straight to the saved stream position.
  const r = makeRng(seed);
  if (typeof position === 'number') r.setState(position);
  return r;
}
