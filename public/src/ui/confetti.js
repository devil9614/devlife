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
  const w = window.innerWidth;
  for (let i = 0; i < count; i++){
    particles.push({
      x: w * (0.2 + Math.random() * 0.6),
      y: -20 - Math.random() * 80,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      size: 5 + Math.random() * 5,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 0,
    });
  }
}

function tick(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.rot += p.vrot; p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, 1 - p.life / 120);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  particles = particles.filter(p => p.y < canvas.height + 30 && p.life < 130);
  if (particles.length) raf = requestAnimationFrame(tick);
  else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

export function celebrate(count = 90){
  ensureCanvas();
  spawn(count);
  if (!raf) raf = requestAnimationFrame(tick);
}
