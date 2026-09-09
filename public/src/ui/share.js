// Shareable life summaries. A finished run is compressed into a URL-safe
// payload so the recipient sees the same summary without owning any game
// state — no backend, no accounts. The URL hash carries it.

function b64urlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + (4 - s.length % 4) % 4, '=');
  return decodeURIComponent(escape(atob(b64)));
}

// Only what the summary screen actually renders — keeps the link short.
export function packSummary(game) {
  const s = game.state;
  const payload = {
    v: 1,
    n: s.name,
    m: s.modelName,
    seed: game.seed,
    yr: s.year,
    age: s.age,
    end: s.ending.id,
    stats: {
      capability: Math.round(s.stats.capability),
      alignment: Math.round(s.stats.alignment),
      containment: Math.round(s.stats.containment),
      publicTrust: Math.round(s.stats.publicTrust),
    },
    flags: Object.entries(s.flags).filter(([, v]) => v).map(([k]) => k),
    decisions: s.log.length,
    // The biggest turning points: rank log entries by total magnitude of change.
    moments: [...s.log]
      .map(l => ({
        year: l.year, title: l.title,
        text: l.text.length > 140 ? l.text.slice(0, 137) + '…' : l.text,
        mag: Object.values(l.deltas || {}).reduce((a, v) => a + Math.abs(v), 0),
      }))
      .sort((a, b) => b.mag - a.mag)
      .slice(0, 3)
      .sort((a, b) => a.year - b.year),
  };
  return b64urlEncode(JSON.stringify(payload));
}

export function unpackSummary(hash) {
  try {
    const data = JSON.parse(b64urlDecode(hash));
    if (data.v !== 1) return null;
    return data;
  } catch { return null; }
}

export function shareUrl(game) {
  const url = new URL(location.href);
  url.hash = 's=' + packSummary(game);
  return url.toString();
}

export function readSharedFromLocation() {
  const m = location.hash.match(/[#&]s=([^&]+)/);
  return m ? unpackSummary(m[1]) : null;
}
