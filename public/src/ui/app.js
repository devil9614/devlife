import { Game } from '../engine/game.js';
import { STAT_DEFS } from '../engine/state.js';
import { ACTIVITY_CATEGORIES } from '../data/activities.js';
import { ENDINGS } from '../data/index.js';
import { shareUrl, readSharedFromLocation } from './share.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app');

let game = null;
let screen = 'start';        // start | play | ending | shared
let sheet = null;            // null | {kind:'event'|'outcome'|'activities'|'pane', ...}
let tab = 'life';            // bottom nav
let actCat = 'research';
let feed = [];               // life log entries rendered in the feed
let sharedData = null;       // a life summary someone else sent us

const TONE_COLOR = { triumph:'var(--tone-triumph)', catastrophe:'var(--tone-catastrophe)', bad:'var(--tone-bad)', grey:'var(--tone-grey)' };
const TONE_GLOW  = { triumph:'var(--tone-triumph-glow)', catastrophe:'var(--tone-catastrophe-glow)', bad:'var(--tone-bad-glow)', grey:'var(--tone-grey-glow)' };

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

// ---------------- life summary (ending + shared view) ----------------
const STAT_RING = [
  ['capability','Capability','c-blue', 260],
  ['alignment','Alignment','c-green', 100],
  ['containment','Containment','c-violet', 100],
  ['publicTrust','Public Trust','c-green', 100],
];

function ringBar(k,label,cls,hi,val){
  const pct=Math.max(2,Math.min(100,(val/hi)*100));
  return `<div class="ls-stat">
    <div class="lbl">${label}<b>${Math.round(val)}</b></div>
    <div class="ring ${cls}"><i style="width:${pct}%"></i></div>
  </div>`;
}

function momentsHtml(moments){
  if(!moments.length) return '';
  return moments.map(m=>`<div class="ls-moment">
    <div class="yr">YR ${m.year}</div>
    <div class="stem"></div>
    <div class="mc"><div class="mt">${esc(m.title)}</div><div class="mx">${esc(m.text)}</div></div>
  </div>`).join('');
}

function flagsHtml(flags){
  if(!flags.length) return `<p class="ls-narrative" style="margin:0">The world never quite noticed this one.</p>`;
  return `<div class="ls-flags">${flags.slice(0,14).map(f=>`<span class="ls-flag">${esc(f.replace(/_/g,' '))}</span>`).join('')}</div>`;
}

// Renders the full summary card from a plain data object so the same markup
// serves both a finished run (rich, from `game`) and a shared link (from the
// compact packed payload — fewer moments, no live game object).
function summaryHtml({ tone, title, text, name, modelName, year, decisions, stats, moments, flags, isLive, seed }){
  const c = TONE_COLOR[tone] || TONE_COLOR.grey, glow = TONE_GLOW[tone] || TONE_GLOW.grey;
  return `<div class="life-summary" style="--tone-c:${c};--tone-glow:${glow}">
    <div class="ls-hero">
      <div class="ls-eyebrow">${esc(name)} · ${esc(modelName)}</div>
      <span class="ls-badge">${esc(tone)}</span>
      <h1 class="ls-title">${esc(title)}</h1>
      <p class="ls-narrative">${esc(text)}</p>
    </div>
    <div class="ls-body">
      <div class="ls-section">
        <div class="ls-vitals">
          <div class="ls-vital"><b>${year}</b><span>Years</span></div>
          <div class="ls-vital"><b>${decisions}</b><span>Decisions</span></div>
          <div class="ls-vital"><b>${flags.length}</b><span>Conditions</span></div>
        </div>
      </div>
      <div class="ls-section">
        <div class="ls-h">Final state</div>
        <div class="ls-portrait">${STAT_RING.map(([k,l,cls,hi])=>ringBar(k,l,cls,hi,stats[k]||0)).join('')}</div>
      </div>
      ${moments.length?`<div class="ls-section">
        <div class="ls-h">Defining moments</div>
        ${momentsHtml(moments)}
      </div>`:''}
      <div class="ls-section" style="margin-bottom:8px">
        <div class="ls-h">World left behind</div>
        ${flagsHtml(flags)}
      </div>
    </div>
    ${isLive?`<div class="ls-actions">
      <div class="ls-share-row">
        <button class="btn" id="share">Share this life</button>
        <button class="btn sec" id="cp" style="flex:0 0 auto;width:52px">🔗</button>
      </div>
      <button class="btn sec" id="again">New Life</button>
      <div class="ls-seed">SEED · ${esc(seed)}</div>
    </div>`:`<div class="ls-actions">
      <button class="btn" id="tryit">Build your own life</button>
    </div>`}
  </div>
  <div class="ls-toast" id="toast"></div>`;
}

function toast(msg){
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._h); toast._h=setTimeout(()=>t.classList.remove('show'),1800);
}

function renderEnding(){
  const e=game.state.ending, s=game.state.stats;
  const flags=Object.entries(game.state.flags).filter(([,v])=>v).map(([k])=>k);
  const moments=[...game.state.log]
    .map(l=>({year:l.year,title:l.title,text:l.text,mag:Object.values(l.deltas||{}).reduce((a,v)=>a+Math.abs(v),0)}))
    .sort((a,b)=>b.mag-a.mag).slice(0,4).sort((a,b)=>a.year-b.year);

  app.innerHTML = summaryHtml({
    tone:e.tone, title:e.title, text:e.text,
    name:game.state.name, modelName:game.state.modelName,
    year:game.state.year, decisions:game.state.log.length,
    stats:s, moments, flags, isLive:true, seed:game.seed,
  });

  $('#again').onclick=()=>{screen='start';render();};
  $('#tryit').onclick=()=>{screen='start';render();};
  $('#cp').onclick=async()=>{
    try{ await navigator.clipboard.writeText(shareUrl(game)); toast('Link copied'); }
    catch{ toast('Could not copy — long-press the URL bar'); }
  };
  $('#share').onclick=async()=>{
    const url=shareUrl(game);
    const shareText=`${game.state.name} — ${e.title}. ${game.state.year} years, ${game.state.log.length} decisions.`;
    if(navigator.share){
      try{ await navigator.share({ title:'DEVLIFE', text:shareText, url }); }
      catch{ /* user cancelled */ }
    } else {
      try{ await navigator.clipboard.writeText(url); toast('Link copied'); }
      catch{ toast('Could not copy — long-press the URL bar'); }
    }
  };
}

function renderShared(data){
  const e = ENDINGS[data.end] || { title:data.end, tone:'grey', text:'' };
  app.innerHTML = summaryHtml({
    tone:e.tone, title:e.title, text:e.text,
    name:data.n, modelName:data.m,
    year:data.yr, decisions:data.decisions, stats:data.stats,
    moments:data.moments||[], flags:data.flags||[], isLive:false,
  });
  const badge=$('.ls-eyebrow');
  if(badge) badge.innerHTML += ` <span class="ls-shared-tag">· shared life</span>`;
  $('#tryit').onclick=()=>{ history.replaceState(null,'',location.pathname); screen='start'; sharedData=null; render(); };
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
  if(screen==='shared') return renderShared(sharedData);
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

// If this page was opened from a shared life-summary link, show that instead
// of the start screen — the whole point of a share is landing straight on it.
const shared = readSharedFromLocation();
if(shared){ sharedData = shared; screen = 'shared'; }
render();
