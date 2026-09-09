// Deterministic seeded RNG so a run can be replayed / shared by seed.
export function makeRng(seed) {
  let s = typeof seed === 'string'
    ? [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
    : (seed >>> 0) || 1;
  const next = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
  return {
    next,
    // Save/restore the exact stream position. A restored game must continue
    // producing the same numbers it would have, or reloading would silently
    // reroll the player's world.
    getState: () => s,
    setState: (v) => { s = (v >>> 0) || 1; },
    int: (n) => Math.floor(next() * n),
    range: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    // Weighted pick: items are [value, weight] pairs.
    weighted(pairs) {
      const total = pairs.reduce((a, [, w]) => a + Math.max(0, w), 0);
      if (total <= 0) return pairs[0]?.[0];
      let r = next() * total;
      for (const [v, w] of pairs) { r -= Math.max(0, w); if (r <= 0) return v; }
      return pairs[pairs.length - 1][0];
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}
