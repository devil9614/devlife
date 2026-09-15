// Lightweight canvas confetti burst for milestone moments. No deps, no persistent state.
const COLORS = ['#41c96e', '#8264db', '#e9568a', '#f3a339', '#46a5e5'];

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

function spawn(count){
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
    particles.push({
      x: originX,
      y: h * 0.78,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 9 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
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
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  particles = particles.filter(p => p.y < canvas.height + 30 && p.life < 280);
  if (particles.length) raf = requestAnimationFrame(tick);
  else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

export function celebrate(count = 140){
  ensureCanvas();
  spawn(count);
  if (!raf) raf = requestAnimationFrame(tick);
}
