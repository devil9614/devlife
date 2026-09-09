import { Game } from '../engine/game.js';
import { STAT_DEFS } from '../engine/state.js';
import { ACTIVITY_CATEGORIES } from '../data/activities.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app');

let game = null;
let screen = 'start';        // start | play | ending
let sheet = null;            // null | {kind:'event'|'outcome'|'activities'|'pane', ...}
let tab = 'life';            // bottom nav
let actCat = 'research';
let feed = [];               // life log entries rendered in the feed

// Four headline bars, BitLife-style, plus the two that define this game.
const HEADLINE = [
  ['capability','Capability','c-blue'],
  ['alignment','Alignment','c-green'],
  ['funding','Funding','c-amber'],
  ['containment','Containment','c-violet'],
  ['publicTrust','Public Trust','c-green'],
  ['health','Health','c-rose'],
];

// ---------------- start ----------------
function renderStart(){
  app.innerHTML = `
    <div class="splash">
      <h1>DEV<span>LIFE</span></h1>
      <div class="tl">AN AI RESEARCH LIFE</div>
      <p>You have a rented GPU and an idea. Age one year at a time.
         Somewhere ahead is a system smarter than you — the only question
         is whether it is still listening.</p>
      <input id="nm" maxlength="26" value="Meridian Research" placeholder="Name your lab"/>
      <select id="df">
        <option value="sandbox">Sandbox — forgiving</option>
        <option value="standard" selected>Standard</option>
        <option value="hardline">Hardline — thin margins</option>
      </select>
      <input id="sd" placeholder="Seed (optional)"/>
      <button class="btn" id="go">Start Life</button>
    </div>`;
  $('#go').onclick = begin;
  $('#nm').onkeydown = e => { if(e.key==='Enter') begin(); };
}

function begin(){
  game = new Game({
    seed: $('#sd').value.trim() || String(Math.floor(Math.random()*1e9)),
    name: $('#nm').value.trim() || 'Unnamed Lab',
    difficulty: $('#df').value,
  });
  feed = [{ kind:'evt', lbl:'Year 0', text:`You found ${game.state.name}. The first model is called ${game.state.modelName}.` }];
  screen = 'play'; sheet = null; tab='life';
  render();
}

// ---------------- chrome ----------------
function header(){
  const s = game.state;
  return `<div class="hdr">
    <div class="who">
      <div class="nm">${esc(s.name)}</div>
      <div class="sub">${esc(s.modelName)} · gen ${s.modelGen||1} · age ${s.age}</div>
    </div>
    <div class="yr">YEAR ${s.year}</div>
  </div>`;
}

function bars(){
  const s = game.state.stats;
  return `<div class="bars">${HEADLINE.map(([k,label,cls])=>{
    const hi = (k==='capability') ? 260 : 100;
    const pct = Math.max(0,Math.min(100,(s[k]/hi)*100));
    return `<div class="bar-row">
      <div class="t"><b>${label}</b><i>${Math.round(s[k])}</i></div>
      <div class="track ${cls}"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join('')}</div>`;
}

function feedHtml(){
  if(!feed.length) return `<div class="feed"><div class="empty">Press Age to begin.</div></div>`;
  let out='', lastYear=null;
  for(const f of feed){
    if(f.year!=null && f.year!==lastYear){
      out += `<div class="yr-sep"><span>YEAR ${f.year}</span></div>`;
      lastYear=f.year;
    }
    const chips = f.deltas ? `<div class="chips">${Object.entries(f.deltas).map(([k,v])=>
      `<span class="chip ${v>0?'up':'down'}">${STAT_DEFS[k]?.label||k} ${v>0?'+':''}${v}</span>`).join('')}</div>` : '';
    out += `<div class="ent ${f.kind||''}">
      ${f.lbl?`<div class="lbl">${esc(f.lbl)}</div>`:''}
      <p>${esc(f.text)}</p>${chips}</div>`;
  }
  return `<div class="feed" id="feed">${out}</div>`;
}

function actionBar(){
  const pend = game.current ? 'Continue' : 'Age';
  const sub = game.current ? 'decision waiting' : '+1 year';
  return `<div class="act-bar">
    <div class="acts-left"><b>${game.state.actionsLeft}</b>actions</div>
    <button class="age-btn" id="age">${pend}<small>${sub}</small></button>
  </div>`;
}

function nav(){
  const items = [
    ['life','Life','📜'],['activities','Do','⚡'],['lab','Lab','🏢'],
    ['model','Model','◈'],['world','World','🌐'],
  ];
  return `<div class="nav">${items.map(([id,l,ic])=>
    `<button data-nav="${id}" class="${tab===id?'on':''}"><span class="ic">${ic}</span>${l}</button>`).join('')}</div>`;
}

// ---------------- sheets ----------------
function sheetHtml(){
  if(!sheet) return '';
  let inner='';
  if(sheet.kind==='event'){
    const ev=sheet.ev;
    inner=`<div class="sh-hd"><div class="k">Year ${game.state.year} · Age ${game.state.age}</div><h2>${esc(ev.title)}</h2></div>
      <div class="sh-bd"><p>${esc(ev.text)}</p>
      ${ev.choices.map((c,i)=>`<button class="opt" data-ch="${i}"><span class="n">${i+1}</span><span>${esc(c.label)}</span></button>`).join('')}
      </div>`;
  }
  if(sheet.kind==='outcome'){
    const chips=Object.entries(sheet.deltas||{}).map(([k,v])=>
      `<span class="chip ${v>0?'up':'down'}">${STAT_DEFS[k]?.label||k} ${v>0?'+':''}${v}</span>`).join('');
    inner=`<div class="sh-hd"><div class="k">${esc(sheet.title||'Consequence')}</div></div>
      <div class="sh-bd"><p style="color:var(--ink)">${esc(sheet.text)}</p>
      ${chips?`<div class="chips" style="margin-bottom:16px">${chips}</div>`:''}
      <button class="btn" id="ok">Continue</button></div>`;
  }
  if(sheet.kind==='activities'){
    const all=game.availableActivities();
    const list=all.filter(a=>a.cat===actCat);
    const none=game.state.actionsLeft<=0;
    inner=`<div class="sh-hd"><div class="k">${game.state.actionsLeft} action${game.state.actionsLeft===1?'':'s'} left this year</div><h2>Activities</h2></div>
      <div class="cat-tabs">${ACTIVITY_CATEGORIES.map(c=>
        `<button data-cat="${c.id}" class="${actCat===c.id?'on':''}">${c.icon} ${c.label}</button>`).join('')}</div>
      <div class="sh-bd">
      ${list.length? list.map(a=>
        `<button class="opt ${none?'locked':''}" data-act="${a.id}">
          <span><span class="ttl">${esc(a.label)}</span><span class="d">${esc(a.desc)}</span></span>
        </button>`).join('')
       : `<div class="empty">Nothing available here yet.</div>`}
      ${none?`<div class="empty">No actions left — age up to refresh.</div>`:''}
      </div>`;
  }
  if(sheet.kind==='pane') inner=paneHtml(sheet.pane);
  return `<div class="scrim" id="scrim"><div class="sheet"><div class="grab"></div>${inner}</div></div>`;
}

function paneHtml(which){
  const s=game.state, st=s.stats;
  const row=(k,v)=>`<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  if(which==='lab'){
    return `<div class="sh-hd"><div class="k">Organisation</div><h2>The Lab</h2></div><div class="sh-bd"><div class="pane">
      ${row('Funding',Math.round(st.funding))}${row('Compute',Math.round(st.compute))}
      ${row('Talent',Math.round(st.talent))}${row('Team morale',Math.round(st.morale))}
      ${row('Reputation',Math.round(st.reputation))}${row('Your health',Math.round(st.health))}
      ${row('Decisions made',s.log.length)}</div></div>`;
  }
  if(which==='model'){
    return `<div class="sh-hd"><div class="k">${esc(s.modelName)}</div><h2>The Model</h2></div><div class="sh-bd"><div class="pane">
      ${row('Capability',Math.round(st.capability))}${row('Alignment',Math.round(st.alignment))}
      ${row('Interpretability',Math.round(st.interpretability))}${row('Autonomy',Math.round(st.autonomy))}
      ${row('Containment',Math.round(st.containment))}${row('Its suspicion',Math.round(st.suspicion))}
      </div></div>`;
  }
  if(which==='world'){
    const on=Object.entries(s.flags).filter(([,v])=>v).map(([k])=>k);
    return `<div class="sh-hd"><div class="k">${on.length} conditions active</div><h2>The World</h2></div><div class="sh-bd"><div class="pane">
      ${row('Public trust',Math.round(st.publicTrust))}${row('Regulatory heat',Math.round(st.regulatory))}
      </div>${on.length?`<div class="tags">${on.map(f=>`<span class="tag">${esc(f.replace(/_/g,' '))}</span>`).join('')}</div>`
        :`<div class="empty">The world has not noticed you yet.</div>`}</div>`;
  }
  return '';
}

// ---------------- ending ----------------
function renderEnding(){
  const e=game.state.ending, s=game.state.stats;
  app.innerHTML=`<div class="splash">
    <span class="end-tone t-${e.tone}">${esc(e.tone)}</span>
    <h1 style="font-size:34px">${esc(e.title)}</h1>
    <p>${esc(e.text)}</p>
    <div class="sc-grid">
      <div class="sc"><b>${game.state.year}</b><span>Years</span></div>
      <div class="sc"><b>${Math.round(s.capability)}</b><span>Capability</span></div>
      <div class="sc"><b>${Math.round(s.alignment)}</b><span>Alignment</span></div>
      <div class="sc"><b>${game.state.log.length}</b><span>Decisions</span></div>
    </div>
    <button class="btn" id="again">New Life</button>
    <button class="btn sec" id="cp" style="margin-top:8px">Copy seed</button>
    <div class="tl" style="margin:16px 0 0">SEED · ${esc(game.seed)}</div>
  </div>`;
  $('#again').onclick=()=>{screen='start';render();};
  $('#cp').onclick=ev=>{navigator.clipboard?.writeText(game.seed);ev.target.textContent='Copied';};
}

// ---------------- actions ----------------
function openEvent(){
  if(game.current) sheet={kind:'event',ev:game.current};
  render();
}

function pushFeed(entry){ feed.push({...entry, year:game.state.year}); }

function onChoice(i){
  const ev=game.current;
  const res=game.choose(i);
  if(!res) return;
  pushFeed({kind:'evt',lbl:ev.title,text:res.outcome.text,deltas:res.deltas});
  sheet={kind:'outcome',title:ev.title,text:res.outcome.text,deltas:res.deltas};
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onActivity(id){
  const res=game.doActivity(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:'act',lbl:last.title,text:res.outcome.text,deltas:res.deltas});
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
  const f=$('#feed'); if(f) f.scrollTop=f.scrollHeight;
}

function onAge(){
  if(game.current){ openEvent(); return; }
  const notes=game.nextYear();
  for(const n of notes) pushFeed({kind:n.kind==='danger'?'danger':n.kind==='warn'?'warn':'',lbl:'',text:n.text});
  if(game.isOver){ screen='ending'; render(); return; }
  if(game.current){ render(); openEvent(); return; }
  render();
  const f=$('#feed'); if(f) f.scrollTop=f.scrollHeight;
}

// ---------------- root ----------------
function render(){
  if(screen==='start') return renderStart();
  if(screen==='ending') return renderEnding();

  app.innerHTML = header()+bars()+feedHtml()+actionBar()+nav()+sheetHtml();

  $('#age').onclick=onAge;
  app.querySelectorAll('[data-nav]').forEach(b=>{
    b.onclick=()=>{
      const id=b.dataset.nav;
      if(id==='life'){ tab='life'; sheet=null; }
      else if(id==='activities'){ tab='activities'; sheet={kind:'activities'}; }
      else { tab=id; sheet={kind:'pane',pane:id}; }
      render();
    };
  });
  app.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>onChoice(+b.dataset.ch));
  app.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>onActivity(b.dataset.act));
  app.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{actCat=b.dataset.cat;render();});
  const ok=$('#ok'); if(ok) ok.onclick=()=>{
    sheet=null;
    if(game.current){ render(); openEvent(); } else render();
  };
  const scrim=$('#scrim');
  if(scrim) scrim.onclick=e=>{
    if(e.target!==scrim) return;
    if(sheet && sheet.kind==='event') return;   // must decide
    sheet=null; tab='life'; render();
  };

  const f=$('#feed'); if(f) f.scrollTop=f.scrollHeight;
}

document.addEventListener('keydown',e=>{
  if(screen!=='play') return;
  if(sheet?.kind==='event' && /^[1-9]$/.test(e.key)){
    const i=+e.key-1; if(sheet.ev.choices[i]) onChoice(i);
  } else if(e.key==='Enter'){ const b=$('#ok')||$('#age'); b?.click(); }
});

render();
