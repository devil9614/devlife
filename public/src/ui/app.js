import { Game } from '../engine/game.js';
import { STAT_DEFS } from '../engine/state.js';
import { ACTIVITY_CATEGORIES } from '../data/activities.js';
import { ENDINGS } from '../data/index.js';
import { activePeople, alumni, traitOf, roleOf, spriteStyle } from '../engine/people.js';
import { jobOf, netWorth, fmtMoney, ASSETS, STOCKS } from '../engine/life.js';
import { LIFE_CATEGORIES, LIFE_ACTIONS } from '../data/life-activities.js';
import { shareUrl, readSharedFromLocation } from './share.js';
import { saveGame, loadSave, clearSave, restoreGame } from '../engine/save.js';

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

const RK = { friend:'Friend', partner:'Partner', ex:'Ex', fling:'Fling', cofounder:'Co-founder', rival:'Rival', mentor:'Mentor', investor:'Investor' };
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
// The start screen rolls a character and shows it, BitLife-style, rather than
// presenting an empty form. You reroll until you like who you are.
let draft = null;

function rollDraft(){
  const seed = String(Math.floor(Math.random()*1e9));
  const g = new Game({ seed, name: LAB_NAMES[Math.floor(Math.random()*LAB_NAMES.length)], difficulty: 'standard' });
  draft = { seed, game: g };
  return draft;
}

const LAB_NAMES = ['Meridian Research','Cavendish Labs','Thousand Rivers','Quiet Systems','Northwind AI',
  'Ferrous Institute','Blue Mesa Research','Halden Labs','Orbital Cognition','Third Axiom',
  'Longwater','Pale Blue Compute','Ridgeline Intelligence','Verity Systems'];

function renderStart(){
  const d = draft || rollDraft();
  const s = d.game.state;
  const o = s.origin, c = s.complication;
  const bump = (k) => { const v = s.stats[k]; return v; };

  app.innerHTML = `
    <div class="splash start-v2">
      <div class="brandline">
        <h1>DEV<span>LIFE</span></h1>
        <div class="tl">AN AI RESEARCH LIFE</div>
      </div>

      <div class="char-card">
        <div class="cc-top">
          <div class="pf cc-face"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},2)}"></i></div>
          <div style="min-width:0">
            <div class="cc-lab" id="labname" contenteditable="true" spellcheck="false">${esc(s.name)}</div>
            <div class="cc-meta">founded at ${s.age} · first model <b>${esc(s.modelName)}</b></div>
          </div>
          <button class="cc-reroll" id="reroll" title="Roll a different life">⟳</button>
        </div>

        <div class="cc-origin">
          <div class="cc-tagrow">
            <span class="cc-tag">${esc(o.label)}</span>
            ${c.id!=='none'?`<span class="cc-tag alt">${esc(c.label)}</span>`:''}
          </div>
          <p class="cc-opener">${esc(o.opener)}${c.opener?' '+esc(c.opener):''}</p>
        </div>

        <div class="cc-team">
          <span class="cc-team-lbl">Founding team</span>
          <div class="cc-faces">
            ${s.people.map(p=>`<div class="pf mini" title="${esc(p.name)}"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>`).join('')}
          </div>
        </div>

        <div class="cc-stats">
          ${[['capability','Capability'],['funding','Funding'],['reputation','Reputation'],['talent','Talent']]
            .map(([k,l])=>`<div class="cc-stat"><span>${l}</span><b>${Math.round(bump(k))}</b></div>`).join('')}
        </div>
      </div>

      <div class="start-actions">
        <button class="btn" id="go">Begin this life</button>
        <details class="adv">
          <summary>Advanced</summary>
          <select id="df">
            <option value="sandbox">Sandbox — forgiving</option>
            <option value="standard" selected>Standard</option>
            <option value="hardline">Hardline — thin margins</option>
          </select>
          <input id="sd" placeholder="Seed (optional)"/>
        </details>
      </div>
    </div>`;

  $('#reroll').onclick = () => { rollDraft(); render(); };
  $('#go').onclick = begin;
}

function begin(){
  const typedSeed = $('#sd')?.value.trim();
  const typedName = $('#labname')?.textContent.trim();
  const diff = $('#df')?.value || 'standard';

  // Reuse the rolled character unless the player overrode seed/difficulty.
  if (draft && !typedSeed && diff === 'standard') {
    game = draft.game;
    if (typedName && typedName !== game.state.name) game.state.name = typedName;
  } else {
    game = new Game({
      seed: typedSeed || String(Math.floor(Math.random()*1e9)),
      name: typedName || 'Unnamed Lab',
      difficulty: diff,
    });
  }
  draft = null;
  const o = game.state.origin, c = game.state.complication;
  feed = [
    { kind:'evt', lbl:`${o.label}${c.id!=='none'?' · '+c.label:''}`,
      text:`${o.opener}${c.opener?' '+c.opener:''}` },
    { kind:'evt', lbl:'Year 0', text:`You found ${game.state.name}. The first model is called ${game.state.modelName}.` },
  ];
  screen = 'play'; sheet = null; tab='life';
  snapshotRoster();
  render();
}

// ---------------- chrome ----------------
function header(){
  const s = game.state, L = s.life, job = jobOf(L);
  const nw = netWorth(L);
  return `<div class="hdr">
    <div class="pf hdr-face"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},1)}"></i></div>
    <div class="who">
      <div class="nm">${esc(job.title)}</div>
      <div class="sub">${esc(L.employer || s.name)} · age ${s.age}</div>
    </div>
    <div class="hdr-money">
      <b class="${nw<0?'neg':''}">${fmtMoney(nw)}</b>
      <span>net worth</span>
    </div>
    <button class="hdr-menu" id="hmenu" title="Menu">⋯</button>
  </div>`;
}

function bars(){
  const s = game.state, st = s.stats, L = s.life;
  const partner = L.people.find(p=>p.kind==='partner');
  const meters = [
    ['Happiness', L.happiness, 'c-green'],
    ['Health', st.health, 'c-rose'],
    ['Capability', Math.min(100,(st.capability/260)*100), 'c-blue', Math.round(st.capability)],
    ['Control', st.containment, 'c-violet'],
  ];
  return `<div class="lifebar">
    <div class="lb-row">
      <div class="lb-cell"><span>YEAR</span><b>${s.year}</b></div>
      <div class="lb-cell"><span>CASH</span><b>${fmtMoney(L.cash)}</b></div>
      <div class="lb-cell"><span>${L.debt>0?'DEBT':'EQUITY'}</span>
        <b class="${L.debt>0?'neg':''}">${L.debt>0?fmtMoney(L.debt):(L.equity>0?(L.equity*100).toFixed(0)+'%':'—')}</b></div>
      <div class="lb-cell"><span>PARTNER</span><b>${partner?esc(partner.name.split(' ')[0]):'—'}</b></div>
    </div>
    <div class="meters">${meters.map(([label,val,cls,raw])=>{
      const pct=Math.max(0,Math.min(100,val));
      return `<div class="meter">
        <div class="mt"><b>${label}</b><i>${raw!=null?raw:Math.round(val)}</i></div>
        <div class="track ${cls}"><i style="width:${pct}%"></i></div>
      </div>`;
    }).join('')}</div>
  </div>`;
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
    // Visual weight follows real significance: big swings read as major beats,
    // ambient system notes recede. Stops the feed being a flat uniform stack.
    const mag = f.deltas ? Object.values(f.deltas).reduce((a,v)=>a+Math.abs(v),0) : 0;
    // Calibrated against real delta magnitudes (median ~22, max ~36).
    const weightCls = mag >= 30 ? ' major' : (!f.deltas && !f.lbl) ? ' quiet' : '';
    const faces = (f.faces && f.faces.length)
      ? `<div class="ent-faces">${f.faces.map(p=>
          `<div class="pf mini" title="${esc(p.name)}"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>`
          + `<span class="ent-face-name">${esc(p.name)}</span>`).join('')}</div>`
      : '';
    out += `<div class="ent ${f.kind||''}${weightCls}">
      ${f.lbl?`<div class="lbl">${esc(f.lbl)}</div>`:''}
      <p>${esc(f.text)}</p>${faces}${chips}</div>`;
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
    ['life','Life','📜'],['activities','Do','⚡'],['me','Me','🧑'],
    ['team','Team','👥'],['model','Lab','◈'],
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
    const none=game.state.actionsLeft<=0;
    const isLife=LIFE_CATEGORIES.some(c=>c.id===actCat);
    const list = isLife
      ? game.availableLifeActions().filter(a=>a.cat===actCat)
      : game.availableActivities().filter(a=>a.cat===actCat);
    const cats=[...LIFE_CATEGORIES,...ACTIVITY_CATEGORIES];
    inner=`<div class="sh-hd"><div class="k">${game.state.actionsLeft} action${game.state.actionsLeft===1?'':'s'} left this year</div><h2>What do you do?</h2></div>
      <div class="cat-tabs">${cats.map(c=>
        `<button data-cat="${c.id}" class="${actCat===c.id?'on':''}">${c.icon} ${c.label}</button>`).join('')}</div>
      <div class="sh-bd">
      ${list.length? list.map(a=>
        `<button class="opt ${none?'locked':''}" data-${isLife?'life':'act'}="${a.id}">
          <span><span class="ttl">${esc(a.label)}</span><span class="d">${esc(a.desc)}</span></span>
        </button>`).join('')
       : `<div class="empty">Nothing available here yet.</div>`}
      ${none?`<div class="empty">No actions left — age up to refresh.</div>`:''}
      </div>`;
  }
  if(sheet.kind==='shop'){
    const L=game.state.life;
    inner=`<div class="sh-hd"><div class="k">${fmtMoney(L.cash)} available</div><h2>Buy something</h2></div>
      <div class="sh-bd">${ASSETS.map(a=>{
        const owned=L.owns.some(o=>o.assetId===a.id);
        const afford=L.cash>=a.price;
        return `<button class="opt ${(!afford||owned)?'locked':''}" data-buy="${a.id}">
          <span><span class="ttl">${esc(a.name)}</span><span class="d">${owned?'You own this':fmtMoney(a.price)}</span></span>
        </button>`;}).join('')}</div>`;
  }
  if(sheet.kind==='invest'){
    const L=game.state.life;
    const amt=Math.max(1000,Math.round(L.cash*0.25));
    inner=`<div class="sh-hd"><div class="k">Investing ${fmtMoney(amt)}</div><h2>Call your broker</h2></div>
      <div class="sh-bd">${STOCKS.map(st=>
        `<button class="opt" data-invest="${st.id}">
          <span><span class="ttl">${esc(st.name)}</span>
          <span class="d">${st.vol>0.5?'Extremely volatile':st.vol>0.25?'Volatile':'Steady'}</span></span>
        </button>`).join('')}</div>`;
  }
  if(sheet.kind==='sell'){
    const L=game.state.life;
    const held=Object.entries(L.portfolio);
    inner=`<div class="sh-hd"><div class="k">Your positions</div><h2>Sell</h2></div>
      <div class="sh-bd">${held.length?held.map(([id,h])=>{
        const st=STOCKS.find(x=>x.id===id);
        const val=Math.round(h.shares*(h.price??h.basis));
        const cost=Math.round(h.shares*h.basis);
        const gain=val-cost;
        return `<button class="opt" data-sell="${id}">
          <span><span class="ttl">${esc(st?.name||id)}</span>
          <span class="d">${fmtMoney(val)} · ${gain>=0?'+':''}${fmtMoney(gain)}</span></span>
        </button>`;}).join(''):`<div class="empty">You hold nothing.</div>`}</div>`;
  }
  if(sheet.kind==='pane') inner=paneHtml(sheet.pane);
  if(sheet.kind==='menu'){
    inner=`<div class="sh-hd"><div class="k">Year ${game.state.year} · autosaved</div><h2>Menu</h2></div>
      <div class="sh-bd">
        <p style="color:var(--ink-3);font-size:13px;margin:0 0 14px">
          This life saves automatically. You can close the tab and come back to it.
        </p>
        <button class="opt" id="m-close"><span><span class="ttl">Keep playing</span></span></button>
        <button class="opt danger-opt" id="m-restart"><span>
          <span class="ttl">Abandon this life</span>
          <span class="d">Year ${game.state.year}, ${game.state.log.length} decisions. This cannot be undone.</span>
        </span></button>
      </div>`;
  }
  if(sheet.kind==='confirm-restart'){
    inner=`<div class="sh-hd"><div class="k">Are you sure</div><h2>Abandon this life?</h2></div>
      <div class="sh-bd">
        <p style="color:var(--ink-2);font-size:14px;margin:0 0 16px">
          ${esc(game.state.name)} — year ${game.state.year}, ${game.state.log.length} decisions,
          ${activePeople(game.state).length} people on staff. There is no ending screen for a life you abandon.
        </p>
        <button class="btn sec" id="c-no">Keep playing</button>
        <button class="btn danger-btn" id="c-yes" style="margin-top:8px">Abandon it</button>
      </div>`;
  }
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
  if(which==='me'){
    const L=s.life, job=jobOf(L);
    const alive=L.people.filter(p=>!p.faded);
    const partner=alive.find(p=>p.kind==='partner');
    const money=`<div class="pane">
      ${row('Job',job.title)}${row('Employer',L.employer||s.name)}
      ${row('Salary',fmtMoney(job.salary))}
      ${row('Cash',fmtMoney(L.cash))}
      ${L.debt>0?row('Debt','<span class="neg">'+fmtMoney(L.debt)+'</span>'):''}
      ${L.equity>0?row('Equity',(L.equity*100).toFixed(1)+'%'):''}
      ${row('Net worth',fmtMoney(netWorth(L)))}
    </div>`;
    const pcard=p=>`<div class="person">
      <div class="pf"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
      <div class="pb"><div class="pn">${esc(p.name)}</div>
      <div class="pr">${esc(RK[p.kind]||p.kind)}${p.serious?' · serious':''}</div>
      <div class="ptags"><span class="ptag ${p.closeness>60?'good':p.closeness<30?'bad':''}">closeness ${Math.round(p.closeness)}</span></div>
      </div></div>`;
    return `<div class="sh-hd"><div class="k">${fmtMoney(netWorth(L))} net worth</div><h2>You</h2></div>
      <div class="sh-bd">
        ${money}
        ${L.kids.length?`<div class="ls-h" style="margin:18px 0 10px">Children</div>
          ${L.kids.map(k=>`<div class="person"><div class="pf"><i class="sprite" style="${spriteStyle(k,1)}"></i></div>
            <div class="pb"><div class="pn">${esc(k.name)}</div><div class="pr">age ${k.age}</div></div></div>`).join('')}`:''}
        <div class="ls-h" style="margin:18px 0 10px">People</div>
        ${alive.length?alive.map(pcard).join(''):`<div class="empty">You know a lot of colleagues and no friends.</div>`}
        ${L.owns.length?`<div class="ls-h" style="margin:18px 0 10px">What you own</div>
          <div class="pane">${L.owns.map(o=>{
            const d=ASSETS.find(a=>a.id===o.assetId);
            return row(d?d.name:o.assetId, fmtMoney(o.value));
          }).join('')}</div>`:''}
        ${Object.keys(L.portfolio).length?`<div class="ls-h" style="margin:18px 0 10px">Portfolio</div>
          <div class="pane">${Object.entries(L.portfolio).map(([id,h])=>{
            const st=STOCKS.find(x=>x.id===id);
            return row(st?st.name:id, fmtMoney(Math.round(h.shares*(h.price??h.basis))));
          }).join('')}</div>`:''}
      </div>`;
  }
  if(which==='team'){
    const roster=activePeople(s), gone=alumni(s);
    const card=p=>{
      const t=traitOf(p), r=roleOf(p), tenure=s.year-p.joinedYear;
      const mood=p.morale>=65?'good':p.morale>=35?'mid':'bad';
      return `<div class="person">
        <div class="pf"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
        <div class="pb">
          <div class="pn">${esc(p.name)}</div>
          <div class="pr">${esc(r.label)} · ${tenure===0?'joined this year':tenure+'y'}</div>
          <div class="ptags">
            <span class="ptag ${t.good?'good':'bad'}">${esc(t.label)}</span>
            <span class="ptag skill">skill ${p.skill}</span>
            <span class="ptag mood-${mood}">morale ${Math.round(p.morale)}</span>
          </div>
        </div>
      </div>`;
    };
    return `<div class="sh-hd"><div class="k">${roster.length} on staff${gone.length?` · ${gone.length} departed`:''}</div><h2>The Team</h2></div>
      <div class="sh-bd">
      ${roster.length?roster.map(card).join(''):`<div class="empty">Nobody works here yet.</div>`}
      ${gone.length?`<div class="ls-h" style="margin:18px 0 10px">Departed</div>
        ${gone.map(p=>`<div class="person gone">
          <div class="pf"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
          <div class="pb"><div class="pn">${esc(p.name)}</div>
          <div class="pr">${esc(roleOf(p).label)} · left year ${p.history[p.history.length-1]?.year ?? '?'}</div></div>
        </div>`).join('')}`:''}
      </div>`;
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
function summaryHtml({ tone, title, text, name, modelName, year, decisions, stats, moments, flags, isLive, seed, people }){
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
      ${people && people.length?`<div class="ls-section">
        <div class="ls-h">Who was there at the end</div>
        <div class="ls-people">${people.map(p=>
          `<div class="ls-person"><div class="pf mini"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
           <span>${esc(p.name)}</span></div>`).join('')}</div>
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
    people: activePeople(game.state).slice(0,8).map(p=>({sprite:p.sprite,name:p.name})),
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

// People who joined as a result of the action just taken, so the feed can
// show their faces rather than only saying "talent +12".
// Compares roster identity before/after rather than parsing note strings.
let _rosterSnapshot = new Set();
function snapshotRoster(){
  _rosterSnapshot = new Set(game.state.people.map(p=>p.id));
}
function newcomerFaces(){
  game.takeRosterNotes?.();                    // drain, we use ids instead
  const added = game.state.people.filter(p=>!_rosterSnapshot.has(p.id));
  snapshotRoster();
  if(!added.length) return null;
  return added.map(p=>({sprite:p.sprite,name:p.name}));
}

function onChoice(i){
  const ev=game.current;
  snapshotRoster();
  const res=game.choose(i);
  if(!res) return;
  pushFeed({kind:'evt',lbl:ev.title,text:res.outcome.text,deltas:res.deltas,
    faces:newcomerFaces()});
  sheet={kind:'outcome',title:ev.title,text:res.outcome.text,deltas:res.deltas};
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onLifeAction(id){
  // A few actions open a picker instead of resolving immediately.
  if(id==='buy_asset'){ sheet={kind:'shop'}; render(); return; }
  if(id==='invest'){ sheet={kind:'invest'}; render(); return; }
  if(id==='sell_stock'){ sheet={kind:'sell'}; render(); return; }
  snapshotRoster();
  const res=game.doLifeAction(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:'life',lbl:last.title,text:res.outcome.text,deltas:res.deltas});
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
  const f=$('#feed'); if(f) f.scrollTop=f.scrollHeight;
}

function onActivity(id){
  snapshotRoster();
  const res=game.doActivity(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:'act',lbl:last.title,text:res.outcome.text,deltas:res.deltas,
    faces:newcomerFaces()});
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

// ---------------- autosave ----------------
// Every state change goes through render(), so that is the one reliable place
// to persist from. Cheap enough to do unconditionally.
function autosave(){
  if(!game || screen!=='play') return;
  saveGame(game, { feed, tab });
}

// ---------------- root ----------------
function render(){
  if(screen==='start') return renderStart();
  if(screen==='shared') return renderShared(sharedData);
  if(screen==='ending'){ clearSave(); return renderEnding(); }
  autosave();

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
  app.querySelectorAll('[data-life]').forEach(b=>b.onclick=()=>onLifeAction(b.dataset.life));
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const r=game.doLifeAction('buy_asset',{assetId:b.dataset.buy});
    if(r){ pushFeed({kind:'life',lbl:'Purchase',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }
  });
  app.querySelectorAll('[data-invest]').forEach(b=>b.onclick=()=>{
    const amt=Math.max(1000,Math.round(game.state.life.cash*0.25));
    const r=game.doLifeAction('invest',{stockId:b.dataset.invest,amount:amt});
    if(r){ pushFeed({kind:'life',lbl:'Investment',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }
  });
  app.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const r=game.doLifeAction('sell_stock',{stockId:b.dataset.sell});
    if(r){ pushFeed({kind:'life',lbl:'Sold',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }
  });
  app.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{actCat=b.dataset.cat;render();});
  const hm=$('#hmenu'); if(hm) hm.onclick=()=>{ sheet={kind:'menu'}; render(); };
  const mClose=$('#m-close'); if(mClose) mClose.onclick=()=>{ sheet=null; render(); };
  const mRestart=$('#m-restart'); if(mRestart) mRestart.onclick=()=>{ sheet={kind:'confirm-restart'}; render(); };
  const cNo=$('#c-no'); if(cNo) cNo.onclick=()=>{ sheet=null; render(); };
  const cYes=$('#c-yes'); if(cYes) cYes.onclick=()=>{
    clearSave(); game=null; draft=null; feed=[]; sheet=null; tab='life'; screen='start'; render();
  };
  const ok=$('#ok'); if(ok) ok.onclick=()=>{
    sheet=null;
    if(game.current){ render(); openEvent(); } else render();
  };
  const scrim=$('#scrim');
  if(scrim) scrim.onclick=e=>{
    if(e.target!==scrim) return;
    if(sheet && sheet.kind==='event') return;   // must decide
    // Tapping away from menu/confirm just cancels; it should not also move you
    // off whatever tab you were on.
    const keepTab = sheet && (sheet.kind==='menu' || sheet.kind==='confirm-restart');
    sheet=null; if(!keepTab) tab='life'; render();
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
if(shared){
  sharedData = shared; screen = 'shared';
} else {
  // Otherwise resume an autosaved life if one exists. A life is long; losing
  // one to a closed tab would be the worst failure this game could have.
  const save = loadSave();
  if(save){
    const restored = restoreGame(Game, save);
    if(restored && !restored.state.dead){
      game = restored;
      feed = save.ui?.feed || [];
      tab  = save.ui?.tab  || 'life';
      screen = 'play';
      // If a decision was on screen when they left, put it back.
      if(game.current) sheet = { kind:'event', ev: game.current };
    } else {
      clearSave();
    }
  }
}
render();
