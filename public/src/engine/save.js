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
import { FEMININE_GIVEN_NAMES, FEMME_AVATARS } from './people.js';

const KEY = 'devlife.save.v1';
const VERSION = 5;

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
    return migrateSave(data);
  } catch {
    return null;
  }
}

// Version one saves are real player lives. Evolve them in place rather than
// discarding them when a new simulation field is introduced.
function migrateSave(data) {
  if (!data || !data.state || ![1, 2, 3, 4, VERSION].includes(data.v)) return null;
  const L = data.state.life;
  if (!L) return null;
  L.owns ||= [];
  L.portfolio ||= {};
  L.people ||= [];
  L.kids ||= [];
  L.pregnancy ??= null;
  L.datingPool ||= [];
  L.crypto ||= {};
  L.heat ||= 0;
  L.bank ||= { name:'Perimeter Bank', creditScore:680, loans:[] };
  L.bank.name ||= 'Perimeter Bank';
  L.bank.creditScore ??= 680;
  L.bank.loans ||= [];
  L.salaryOverride ??= (L.salary > 0 ? L.salary : null);
  L.tenureStartYear ??= 0;
  L.performance ??= 55;
  L.lastRaiseYear ??= null;
  L.lastReviewYear ??= null;
  // Earlier saves had a male-only portrait atlas. Infer presentation from the
  // names already on a player's save and assign a stable frame, so an existing
  // Clara does not keep a masculine visual until the player meets someone new.
  migratePortraits(L.people);
  migratePortraits(data.state.people);
  migrateRelationships(L.people, data.state.age, data.state.year);
  data.ui ||= {};
  data.v = VERSION;
  return data;
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value || 'devlife')) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
  return hash;
}

function migrateRelationships(people = [], playerAge = 25, currentYear = 0) {
  for (const person of people) {
    if (!person) continue;
    const hash = stableHash(person.id || person.name);
    person.age = Math.max(18, Math.round(person.age ?? (playerAge + (hash % 13) - 6)));
    person.metYear ??= currentYear;
    person.conversations ??= ['partner','spouse','fling'].includes(person.kind) ? 5 : 2;
    person.dates ??= ['partner','spouse'].includes(person.kind) ? 3 : person.kind === 'fling' ? 1 : 0;
    person.intimacyCount ??= 0;
    person.lastDateYear ??= null;
  }
}

function migratePortraits(people = []) {
  for (const person of people) {
    if (!person) continue;
    const firstName = String(person.name || '').split(/\s+/)[0];
    const woman = person.presentation === 'woman'
      || (!person.presentation && FEMININE_GIVEN_NAMES.includes(firstName));
    person.presentation ||= woman ? 'woman' : 'man';
    if (!woman) continue;
    const avatar = FEMME_AVATARS[stableHash(person.id || person.name) % FEMME_AVATARS.length];
    person.spriteAsset = avatar.spriteAsset;
    person.avatarFrame = avatar.avatarFrame;
    person.avatarFrames = avatar.avatarFrames;
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
