// Lightweight canvas confetti for milestone moments. No deps, no persistent state.
//
// Bursts are THEMED: a wedding should not look like a funding round. Each theme
// mixes its own palette with a few emoji glyphs, so the moment is recognisable
// from the shape of the celebration alone — and screenshots of two different
// milestones do not look identical.

const THEMES = {
  // The default: a general win.
  confetti: {
    colors: ['#41c96e', '#8264db', '#e9568a', '#f3a339', '#46a5e5'],
    glyphs: ['🎉', '✨'],
    glyphRatio: 0.18,
  },
  love: {
    colors: ['#e9568a', '#f78fb3', '#ff5c8a', '#ffd1e0', '#c2407a'],
    glyphs: ['❤️', '💖', '💕', '✨'],
    glyphRatio: 0.42,
  },
  baby: {
    colors: ['#ffd1e0', '#cfe8ff', '#fff3c4', '#d8f5e0', '#f0e2ff'],
    glyphs: ['🍼', '👶', '🧸', '⭐'],
    glyphRatio: 0.4,
  },
  money: {
    colors: ['#41c96e', '#1d9d4c', '#d4af37', '#a8e6b8', '#2f9e6b'],
    glyphs: ['💸', '💰', '📈', '🤑'],
    glyphRatio: 0.38,
  },
  milestone: {
    colors: ['#8264db', '#46a5e5', '#b49bff', '#6ec8f5', '#e9e2ff'],
    glyphs: ['🏆', '🚀', '⭐', '✨'],
    glyphRatio: 0.36,
  },
  model: {
    colors: ['#46a5e5', '#8264db', '#6ee7f5', '#c9b6ff', '#ffffff'],
    glyphs: ['◈', '✦', '⬢', '✨'],
    glyphRatio: 0.34,
  },
  triumph: {
    colors: ['#41c96e', '#d4af37', '#8264db', '#e9568a', '#46a5e5', '#f3a339'],
    glyphs: ['🏆', '🎉', '✨', '⭐', '🌟'],
    glyphRatio: 0.3,
  },
};

let canvas, ctx, particles = [], raf = null;

function ensureCanvas(){
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize(){
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawn(count, theme){
  const t = THEMES[theme] || THEMES.confetti;
  const w = window.innerWidth, h = window.innerHeight;
  // Two bursts from the lower corners, like party poppers, so confetti is
  // on-screen and moving outward from frame one instead of drifting in from
  // above the viewport. Slow initial speed + light gravity + drag so pieces
  // hang in the air and flutter down instead of rocketing past in a blink.
  for (let i = 0; i < count; i++){
    const fromLeft = i % 2 === 0;
    const originX = fromLeft ? w * 0.08 : w * 0.92;
    const angle = (fromLeft ? -0.9 : -0.9 + Math.PI) + (Math.random() - 0.5) * 1.3;
    const speed = 4 + Math.random() * 5;
    const isGlyph = Math.random() < t.glyphRatio;
    particles.push({
      x: originX,
      y: h * 0.78,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: isGlyph ? 15 + Math.random() * 12 : 9 + Math.random() * 8,
      color: t.colors[i % t.colors.length],
      glyph: isGlyph ? t.glyphs[Math.floor(Math.random() * t.glyphs.length)] : null,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.25,
      sway: Math.random() * Math.PI * 2,
      life: 0,
    });
  }
}

function tick(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.vy += 0.09; p.vx *= 0.985;
    p.sway += 0.12;
    p.x += p.vx + Math.sin(p.sway) * 0.8;
    p.y += p.vy;
    p.rot += p.vrot; p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.life > 220 ? Math.max(0, 1 - (p.life - 220) / 60) : 1;
    if (p.glyph){
      ctx.font = `${p.size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph, 0, 0);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  });
  particles = particles.filter(p => p.y < canvas.height + 30 && p.life < 280);
  if (particles.length) raf = requestAnimationFrame(tick);
  else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

/**
 * celebrate(count, theme) — theme is one of the keys in THEMES.
 * Accepts celebrate('love') too, since most call sites care about the flavour
 * rather than the particle count.
 */
export function celebrate(count = 140, theme = 'confetti'){
  if (typeof count === 'string'){ theme = count; count = 140; }
  ensureCanvas();
  spawn(count, theme);
  if (!raf) raf = requestAnimationFrame(tick);
}

export const CONFETTI_THEMES = Object.keys(THEMES);
