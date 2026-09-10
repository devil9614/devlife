// DEVLIFE — presentation layer.
// Three layers: an evolving illustrated WORLD, a LIFE CHRONICLE of prose, and
// an ACTION DOCK. Simulation logic is untouched; this file only decides how
// the run is seen.

import { Game } from '../engine/game.js';
import { STAT_DEFS } from '../engine/state.js';
import { ACTIVITY_CATEGORIES } from '../data/activities.js';
import { ENDINGS } from '../data/index.js';
import { activePeople, alumni, traitOf, roleOf, spriteStyle } from '../engine/people.js';
import { jobOf, netWorth, fmtMoney, ASSETS, STOCKS } from '../engine/life.js';
import { LIFE_CATEGORIES, LIFE_ACTIONS } from '../data/life-activities.js';
import { renderWorld, worldCaption, tierFor } from './world.js';
import { shareUrl, readSharedFromLocation } from './share.js';
import { saveGame, loadSave, clearSave, restoreGame } from '../engine/save.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app');

let game = null;
let screen = 'start';
let sheet = null;
let tab = 'life';
let actCat = 'career';
let feed = [];
let sharedData = null;
let draft = null;

const RK = { friend:'Friend', partner:'Partner', ex:'Ex', fling:'Fling',
  cofounder:'Co-founder', rival:'Rival', mentor:'Mentor', investor:'Investor' };

const LAB_NAMES = ['Meridian Research','Cavendish Labs','Thousand Rivers','Quiet Systems',
  'Northwind AI','Ferrous Institute','Blue Mesa Research','Halden Labs','Orbital Cognition',
  'Third Axiom','Longwater','Pale Blue Compute','Ridgeline Intelligence','Verity Systems'];

// ---------------- custom monochrome dock symbols ----------------
const SYM = {
  life:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3h11l3 3v15H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  act:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  self:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  team:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.6"/><path d="M2.5 20c0-3.6 2.7-5.8 6-5.8s6 2.2 6 5.8"/><path d="M15 14.6c3 .2 5.4 2.3 5.4 5.4"/></svg>',
  lab:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18"/><path d="M8 7h8M8 11h8M8 15h4"/><circle cx="16.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
  menu:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
};

// ---------------- start ----------------
function rollDraft(){
  const seed = String(Math.floor(Math.random()*1e9));
  const g = new Game({ seed, name: LAB_NAMES[Math.floor(Math.random()*LAB_NAMES.length)], difficulty:'standard' });
  draft = { seed, game:g };
  return draft;
}

function renderStart(){
  const d = draft || rollDraft();
  const s = d.game.state, o = s.origin, c = s.complication;
  app.className = '';
  app.innerHTML = `
    <div class="title-screen">
      <div class="title-mark">
        <h1>DEV<em>LIFE</em></h1>
        <div class="sub">a future history, one year at a time</div>
      </div>

      <div class="dossier-card">
        <div class="dc-plate">${renderWorld(d.game.state,'slice')}</div>
        <div class="dc-body">
          <div class="dc-top">
            <div class="portrait"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},1)}"></i></div>
            <div style="min-width:0;flex:1">
              <div class="dc-name" id="labname" contenteditable="true" spellcheck="false">${esc(s.name)}</div>
              <div class="dc-meta">${esc(o.label)}${c.id!=='none'?' · '+esc(c.label):''} · age ${s.age}</div>
            </div>
            <button class="dc-reroll" id="reroll" title="Another life">&#8635;</button>
          </div>
          <p class="dc-origin">${esc(o.opener)}${c.opener?' '+esc(c.opener):''}</p>
          <div class="dc-stats">
            ${[['capability','Capability'],['funding','Funding'],['reputation','Standing'],['talent','Talent']]
              .map(([k,l])=>`<div class="dc-stat"><span>${l}</span><b>${Math.round(s.stats[k])}</b></div>`).join('')}
          </div>
        </div>
      </div>

      <button class="btn" id="go">Begin</button>
      <details class="adv">
        <summary>Advanced</summary>
        <div class="adv-in">
          <select id="df">
            <option value="sandbox">Sandbox — forgiving</option>
            <option value="standard" selected>Standard</option>
            <option value="hardline">Hardline — thin margins</option>
          </select>
          <input id="sd" placeholder="Seed (optional)"/>
        </div>
      </details>
    </div>`;
  $('#reroll').onclick = () => { rollDraft(); render(); };
  $('#go').onclick = begin;
}

function begin(){
  const typedSeed = $('#sd')?.value.trim();
  const typedName = $('#labname')?.textContent.trim();
  const diff = $('#df')?.value || 'standard';
  if (draft && !typedSeed && diff === 'standard') {
    game = draft.game;
    if (typedName && typedName !== game.state.name) game.state.name = typedName;
  } else {
    game = new Game({ seed: typedSeed || String(Math.floor(Math.random()*1e9)),
      name: typedName || 'Unnamed Lab', difficulty: diff });
  }
  draft = null;
  const o = game.state.origin, c = game.state.complication;
  feed = [
    { kind:'human', lbl:`${o.label}${c.id!=='none'?' · '+c.label:''}`,
      text:`${o.opener}${c.opener?' '+c.opener:''}`, year:0 },
    { kind:'', lbl:'The beginning', year:0,
      text:`You found ${game.state.name}. The first model is called ${game.state.modelName}.` },
  ];
  screen='play'; sheet=null; tab='life';
  snapshotRoster();
  render();
}

// ---------------- world layer ----------------
function worldHtml(){
  const s = game.state, cap = worldCaption(s);
  const wide = window.matchMedia('(min-width:900px)').matches;
  return `<div class="world">
    ${renderWorld(s, wide ? 'slice' : 'meet')}
    <div class="world-year"><b>${s.year}</b><span>YEAR · AGE ${s.age}</span></div>
    <div class="world-plate">
      <div class="wp-name">${esc(cap.name)}</div>
      <div class="wp-note">${esc(cap.note)}</div>
    </div>
    <button class="world-menu" id="hmenu" title="Pause">${SYM.menu}</button>
  </div>`;
}

// ---------------- life pulse ----------------
function pulseHtml(){
  const s = game.state, st = s.stats, L = s.life;
  const nw = netWorth(L);
  const money = L.debt > L.cash ? { k:'Debt', v:fmtMoney(L.debt), danger:true }
                                : { k:'Worth', v:fmtMoney(nw), danger:nw<0 };
  const meters = [
    ['Happy', L.happiness, 'human'],
    ['Health', st.health, 'vital'],
    ['Capable', Math.min(100,(st.capability/260)*100), 'tech'],
    ['Control', st.containment, st.containment<35?'risk':'vital'],
  ];
  return `<div class="pulse">
    <div class="pulse-item">
      <div class="pulse-k">${money.k}</div>
      <div class="pulse-v money ${money.danger?'danger':''}">${money.v}</div>
    </div>
    ${meters.map(([k,v,cls])=>`<div class="pulse-item">
      <div class="pulse-k">${k}</div>
      <div class="tick ${cls}"><i style="width:${Math.max(0,Math.min(100,v))}%"></i></div>
    </div>`).join('')}
  </div>`;
}

// ---------------- chronicle ----------------
const cap1 = s => s.charAt(0).toUpperCase()+s.slice(1);

function chronicleHtml(){
  if(!feed.length) return `<div class="chronicle" id="feed"><div class="empty">Nothing has happened yet.</div></div>`;
  let out='', lastYear=null;
  for(const f of feed){
    if(f.year!=null && f.year!==lastYear){
      out += `<div class="year-rule"><b>Year ${f.year}</b><i></i><span>AGE ${game.state.age - (game.state.year - f.year)}</span></div>`;
      lastYear = f.year;
    }
    const mag = f.deltas ? Object.values(f.deltas).reduce((a,v)=>a+Math.abs(v),0) : 0;
    const weight = mag >= 30 ? ' major' : (!f.deltas && !f.lbl) ? ' quiet' : '';
    const marks = f.deltas ? `<div class="marks">${Object.entries(f.deltas).map(([k,v])=>
      `<span class="mark ${v>0?'up':'down'}">${STAT_DEFS[k]?.label||cap1(k)} <b>${v>0?'+':''}${v}</b></span>`).join('')}</div>` : '';
    const faces = (f.faces&&f.faces.length)
      ? `<div class="e-faces">${f.faces.map(p=>
          `<span class="e-face"><span class="portrait small">
            <i class="sprite" style="${spriteStyle(p,1)}"></i></span>${esc(p.name)}</span>`).join('')}</div>` : '';
    out += `<div class="entry ${f.kind||''}${weight}">
      ${f.lbl?`<div class="e-k">${esc(f.lbl)}</div>`:''}
      <p>${esc(f.text)}</p>${faces}${marks}</div>`;
  }
  return `<div class="chronicle" id="feed">${out}</div>`;
}

// ---------------- dock ----------------
function dockHtml(){
  const pending = !!game.current;
  const items = [['life','Life',SYM.life],['activities','Act',SYM.act],
    ['me','Self',SYM.self],['team','Team',SYM.team],['model','Lab',SYM.lab]];
  return `<div class="dock">
    <div class="dock-age">
      <div class="acts-left"><b>${game.state.actionsLeft}</b><span>acts</span></div>
      <button class="age-btn ${pending?'pending':''}" id="age">
        ${pending?'Continue':'Let the year pass'}
        <small>${pending?'a decision is waiting':'+1 year'}</small>
      </button>
    </div>
    <div class="tabs">${items.map(([id,l,ic])=>
      `<button data-nav="${id}" class="${tab===id?'on':''}">${ic}${l}</button>`).join('')}</div>
  </div>`;
}

// ---------------- decision chapters & panels ----------------
// Choice personality is inferred from language, so risk is sensed not stated.
function choiceTone(label){
  const s = String(label).toLowerCase();
  if (/refuse|halt|freeze|stop|decline|resist|shut|hold|keep it|do not|restrict|pass/.test(s)) return 'careful';
  if (/leak|hide|ignore|override|quietly|secret|sabotage|cover|bypass|patch that|nothing/.test(s)) return 'risky';
  if (/publish|open|ship|launch|grant|approve|accept|sell|take|sign|full/.test(s)) return 'bold';
  return '';
}

function sheetHtml(){
  if(!sheet) return '';
  let inner='', cls='';

  if(sheet.kind==='event'){
    const ev=sheet.ev;
    cls = /leak|fail|crisis|control|shutdown|swarm/i.test(ev.title) ? 'danger'
        : /model|replicat|autonom|compute|scal/i.test(ev.title) ? 'tech' : '';
    inner=`<div class="ch-plate">${renderWorld(game.state,'slice')}</div>
      <div class="ch-hd"><div class="ch-k">Year ${game.state.year} · a decision</div>
      <h2>${esc(ev.title)}</h2></div>
      <div class="ch-bd"><p>${esc(ev.text)}</p>
      ${ev.choices.map((c,i)=>`<button class="choice ${choiceTone(c.label)}" data-ch="${i}">
        <span class="c-t">${esc(c.label)}</span></button>`).join('')}</div>`;
  }

  if(sheet.kind==='outcome'){
    const marks=Object.entries(sheet.deltas||{}).map(([k,v])=>
      `<span class="mark ${v>0?'up':'down'}">${STAT_DEFS[k]?.label||cap1(k)} <b>${v>0?'+':''}${v}</b></span>`).join('');
    inner=`<div class="ch-hd"><div class="ch-k">${esc(sheet.title||'What happened')}</div></div>
      <div class="ch-bd"><p style="color:var(--ivory)">${esc(sheet.text)}</p>
      ${marks?`<div class="marks" style="margin-bottom:20px">${marks}</div>`:''}
      <button class="btn" id="ok">Go on</button></div>`;
  }

  if(sheet.kind==='activities'){
    const none=game.state.actionsLeft<=0;
    const isLife=LIFE_CATEGORIES.some(c=>c.id===actCat);
    const list=isLife?game.availableLifeActions().filter(a=>a.cat===actCat)
                     :game.availableActivities().filter(a=>a.cat===actCat);
    const cats=[...LIFE_CATEGORIES,...ACTIVITY_CATEGORIES];
    inner=`<div class="panel-hd"><div class="p-k">${game.state.actionsLeft} action${game.state.actionsLeft===1?'':'s'} remaining</div>
      <h2>What do you do?</h2></div>
      <div class="cats">${cats.map(c=>
        `<button data-cat="${c.id}" class="${actCat===c.id?'on':''}">${esc(c.label)}</button>`).join('')}</div>
      <div class="panel-bd">${list.length?list.map(a=>
        `<button class="choice ${none?'locked':''} ${choiceTone(a.label)}" data-${isLife?'life':'act'}="${a.id}">
          <span class="c-t">${esc(a.label)}</span><span class="c-d">${esc(a.desc)}</span></button>`).join('')
        :`<div class="empty">Nothing here yet.</div>`}
        ${none?`<div class="empty">The year is spent. Let it pass.</div>`:''}</div>`;
  }

  if(sheet.kind==='shop'){
    const L=game.state.life;
    inner=`<div class="panel-hd"><div class="p-k">${fmtMoney(L.cash)} on hand</div><h2>Acquisitions</h2></div>
      <div class="panel-bd">${ASSETS.map(a=>{
        const owned=L.owns.some(o=>o.assetId===a.id), afford=L.cash>=a.price;
        return `<button class="choice ${(!afford||owned)?'locked':''}" data-buy="${a.id}">
          <span class="c-t">${esc(a.name)}</span>
          <span class="c-d">${owned?'already yours':fmtMoney(a.price)}</span></button>`;}).join('')}</div>`;
  }

  if(sheet.kind==='invest'){
    const amt=Math.max(1000,Math.round(game.state.life.cash*0.25));
    inner=`<div class="panel-hd"><div class="p-k">Placing ${fmtMoney(amt)}</div><h2>The market</h2></div>
      <div class="panel-bd">${STOCKS.map(st=>
        `<button class="choice ${st.vol>0.5?'risky':st.vol<0.2?'careful':'bold'}" data-invest="${st.id}">
          <span class="c-t">${esc(st.name)}</span>
          <span class="c-d">${st.vol>0.5?'extremely volatile':st.vol>0.25?'volatile':'steady'}</span></button>`).join('')}</div>`;
  }

  if(sheet.kind==='sell'){
    const L=game.state.life, held=Object.entries(L.portfolio);
    inner=`<div class="panel-hd"><div class="p-k">Your positions</div><h2>Liquidate</h2></div>
      <div class="panel-bd">${held.length?held.map(([id,h])=>{
        const st=STOCKS.find(x=>x.id===id);
        const val=Math.round(h.shares*(h.price??h.basis)), cost=Math.round(h.shares*h.basis);
        const gain=val-cost;
        return `<button class="choice ${gain>=0?'bold':'risky'}" data-sell="${id}">
          <span class="c-t">${esc(st?.name||id)}</span>
          <span class="c-d">${fmtMoney(val)} · ${gain>=0?'+':''}${fmtMoney(gain)}</span></button>`;}).join('')
        :`<div class="empty">You hold nothing.</div>`}</div>`;
  }

  if(sheet.kind==='pane') inner=paneHtml(sheet.pane);

  if(sheet.kind==='menu'){
    inner=`<div class="panel-hd"><div class="p-k">Year ${game.state.year} · saved automatically</div><h2>Pause</h2></div>
      <div class="panel-bd">
        <p style="font-family:var(--serif);color:var(--ivory-3);font-size:14px;margin:0 0 16px">
          This life keeps itself. You can close the tab and return to it.</p>
        <button class="choice" id="m-close"><span class="c-t">Keep going</span></button>
        <button class="choice risky" id="m-restart"><span class="c-t">Abandon this life</span>
          <span class="c-d">Year ${game.state.year} · ${game.state.log.length} decisions</span></button>
      </div>`;
  }
  if(sheet.kind==='confirm-restart'){
    cls='danger';
    inner=`<div class="panel-hd"><div class="p-k">No ending, no record</div><h2>Abandon it?</h2></div>
      <div class="panel-bd">
        <p style="font-family:var(--serif);font-size:15px;line-height:1.6;color:var(--ivory-2);margin:0 0 18px">
          ${esc(game.state.name)} — year ${game.state.year}, ${game.state.log.length} decisions,
          ${activePeople(game.state).length} people who work here.</p>
        <button class="btn ghost" id="c-no">Keep going</button>
        <button class="btn danger" id="c-yes" style="margin-top:9px">Abandon it</button>
      </div>`;
  }

  return `<div class="scrim" id="scrim"><div class="chapter ${cls}">${inner}</div></div>`;
}

function paneHtml(which){
  const s=game.state, st=s.stats, L=s.life;
  const row=(k,v,neg)=>`<div class="ledger-row"><span class="k">${k}</span><span class="v ${neg?'neg':''}">${v}</span></div>`;
  const secRule=t=>`<div class="sec-rule"><b>${t}</b><i></i></div>`;

  if(which==='me'){
    const job=jobOf(L), alive=L.people.filter(p=>!p.faded);
    const pcard=p=>`<div class="dossier">
      <div class="portrait"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
      <div class="d-body">
        <div class="d-name">${esc(p.name)}</div>
        <div class="d-role">${esc(RK[p.kind]||p.kind)}${p.serious?' · serious':''}</div>
        <div class="d-meters"><div class="d-meter"><span>Closeness</span>
          <div class="tick human"><i style="width:${p.closeness}%"></i></div></div></div>
      </div></div>`;
    return `<div class="panel-hd"><div class="p-k">${fmtMoney(netWorth(L))} · ${esc(job.title)}</div><h2>Yourself</h2></div>
      <div class="panel-bd">
        <div class="ledger">
          ${row('Employer', esc(L.employer||s.name))}
          ${row('Salary', fmtMoney(job.salary))}
          ${row('Cash', fmtMoney(L.cash))}
          ${L.debt>0?row('Debt', fmtMoney(L.debt), true):''}
          ${L.equity>0?row('Equity',(L.equity*100).toFixed(1)+'%'):''}
          ${row('Net worth', fmtMoney(netWorth(L)), netWorth(L)<0)}
        </div>
        ${L.kids.length?secRule('Children')+L.kids.map(k=>`<div class="dossier">
          <div class="portrait"><i class="sprite" style="${spriteStyle(k,1)}"></i></div>
          <div class="d-body"><div class="d-name">${esc(k.name)}</div>
          <div class="d-role">age ${k.age}</div></div></div>`).join(''):''}
        ${secRule('People')}
        ${alive.length?alive.map(pcard).join(''):`<div class="empty">Colleagues, but nobody who calls.</div>`}
        ${L.owns.length?secRule('Holdings')+`<div class="ledger">${L.owns.map(o=>{
          const d=ASSETS.find(a=>a.id===o.assetId);
          return row(d?d.name:o.assetId, fmtMoney(o.value));}).join('')}</div>`:''}
        ${Object.keys(L.portfolio).length?secRule('Positions')+`<div class="ledger">${
          Object.entries(L.portfolio).map(([id,h])=>{
            const stk=STOCKS.find(x=>x.id===id);
            return row(stk?stk.name:id, fmtMoney(Math.round(h.shares*(h.price??h.basis))));}).join('')}</div>`:''}
      </div>`;
  }

  if(which==='team'){
    const roster=activePeople(s), gone=alumni(s);
    const card=p=>{
      const t=traitOf(p), r=roleOf(p), tenure=s.year-p.joinedYear;
      return `<div class="dossier">
        <div class="portrait"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
        <div class="d-body">
          <div class="d-name">${esc(p.name)}</div>
          <div class="d-role">${esc(r.label)} · ${tenure===0?'joined this year':tenure+' years'}</div>
          <div class="d-meters">
            <div class="d-meter"><span>Skill</span><div class="tick tech"><i style="width:${p.skill}%"></i></div></div>
            <div class="d-meter"><span>Morale</span><div class="tick ${p.morale<35?'risk':'human'}"><i style="width:${p.morale}%"></i></div></div>
          </div>
          <span class="d-trait ${t.good?'':'warn'}">${esc(t.label)}</span>
        </div></div>`;
    };
    return `<div class="panel-hd"><div class="p-k">${roster.length} on staff${gone.length?` · ${gone.length} departed`:''}</div>
      <h2>The room</h2></div>
      <div class="panel-bd">
        ${roster.length?roster.map(card).join(''):`<div class="empty">Nobody works here yet.</div>`}
        ${gone.length?secRule('Departed')+gone.map(p=>`<div class="dossier gone">
          <div class="portrait"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
          <div class="d-body"><div class="d-name">${esc(p.name)}</div>
          <div class="d-role">${esc(roleOf(p).label)} · left year ${p.history[p.history.length-1]?.year??'?'}</div>
          </div></div>`).join(''):''}
      </div>`;
  }

  if(which==='model'){
    const on=Object.entries(s.flags).filter(([,v])=>v).map(([k])=>k);
    const meter=(k,label,hi,cls)=>`<div class="ledger-row">
      <span class="k">${label}</span><span class="v">${Math.round(st[k])}</span></div>
      <div class="tick ${cls}" style="margin:-4px 0 9px"><i style="width:${Math.min(100,(st[k]/hi)*100)}%"></i></div>`;
    return `<div class="panel-hd"><div class="p-k">${esc(s.modelName)} · generation ${s.modelGen||1}</div>
      <h2>The work</h2></div>
      <div class="panel-bd">
        <div class="ledger">
          ${meter('capability','Capability',260,'tech')}
          ${meter('alignment','Alignment',100,'human')}
          ${meter('interpretability','Interpretability',100,'tech')}
          ${meter('containment','Control',100, st.containment<35?'risk':'vital')}
          ${meter('autonomy','Autonomy',260, st.autonomy>50?'risk':'tech')}
          ${meter('compute','Compute',100,'tech')}
        </div>
        ${secRule('The world')}
        <div class="ledger">
          ${row('Public trust', Math.round(st.publicTrust))}
          ${row('Regulatory heat', Math.round(st.regulatory), st.regulatory>65)}
          ${row('Standing', Math.round(st.reputation))}
        </div>
        ${on.length?secRule(`${on.length} conditions`)+`<div class="tag-row">${
          on.map(f=>`<span class="tag">${esc(f.replace(/_/g,' '))}</span>`).join('')}</div>`:''}
      </div>`;
  }
  return '';
}

// ---------------- ending ----------------
function summaryHtml({tone,title,text,year,decisions,moments,flags,isLive,seed,people,state}){
  const momentsBlock = moments.length ? `<div class="sec-rule"><b>Defining moments</b><i></i></div>` +
    moments.map(m=>`<div class="entry"><div class="e-k">Year ${m.year} · ${esc(m.title)}</div>
      <p>${esc(m.text)}</p></div>`).join('') : '';
  const peopleBlock = (people&&people.length) ? `<div class="sec-rule"><b>Who was there</b><i></i></div>
    <div class="e-faces">${people.map(p=>`<span class="e-face">
      <span class="portrait small"><i class="sprite" style="${spriteStyle(p,1)}"></i></span>
      ${esc(p.name)}</span>`).join('')}</div>` : '';
  return `<div class="ending">
    <div class="end-plate">${state?renderWorld(state,'slice'):''}</div>
    <div class="end-body">
      <span class="end-tone t-${tone}">${esc(tone)}</span>
      <h1 class="end-title">${esc(title)}</h1>
      <p class="end-text">${esc(text)}</p>
      <div class="end-figs">
        <div class="end-fig"><b>${year}</b><span>Years</span></div>
        <div class="end-fig"><b>${decisions}</b><span>Decisions</span></div>
        <div class="end-fig"><b>${flags.length}</b><span>Marks left</span></div>
      </div>
      ${momentsBlock}
      ${peopleBlock}
      ${flags.length?`<div class="sec-rule"><b>The world you leave</b><i></i></div>
        <div class="tag-row">${flags.slice(0,14).map(f=>`<span class="tag">${esc(f.replace(/_/g,' '))}</span>`).join('')}</div>`:''}
      <div style="margin-top:26px">
        ${isLive?`<button class="btn" id="share">Share this life</button>
          <button class="btn ghost" id="cp" style="margin-top:9px">Copy link</button>
          <button class="btn ghost" id="again" style="margin-top:9px">Begin another</button>
          <div style="text-align:center;font-family:var(--mono);font-size:9.5px;color:var(--ivory-3);
            letter-spacing:.12em;margin-top:16px">SEED · ${esc(seed)}</div>`
        :`<button class="btn" id="tryit">Live your own</button>`}
      </div>
    </div>
  </div>
  <div class="toast" id="toast"></div>`;
}

function toast(msg){
  const t=$('#toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toast._h); toast._h=setTimeout(()=>t.classList.remove('show'),1800);
}

function renderEnding(){
  const e=game.state.ending;
  const flags=Object.entries(game.state.flags).filter(([,v])=>v).map(([k])=>k);
  const moments=[...game.state.log]
    .map(l=>({year:l.year,title:l.title,text:l.text,mag:Object.values(l.deltas||{}).reduce((a,v)=>a+Math.abs(v),0)}))
    .sort((a,b)=>b.mag-a.mag).slice(0,4).sort((a,b)=>a.year-b.year);
  app.className='';
  app.innerHTML=summaryHtml({tone:e.tone,title:e.title,text:e.text,
    year:game.state.year,decisions:game.state.log.length,
    moments,flags,isLive:true,seed:game.seed,state:game.state,
    people:activePeople(game.state).slice(0,8).map(p=>({sprite:p.sprite,name:p.name}))});
  $('#again').onclick=()=>{screen='start';render();};
  $('#cp').onclick=async()=>{
    try{ await navigator.clipboard.writeText(shareUrl(game)); toast('Link copied'); }
    catch{ toast('Could not copy'); }
  };
  $('#share').onclick=async()=>{
    const url=shareUrl(game);
    const txt=`${game.state.name} — ${e.title}. ${game.state.year} years.`;
    if(navigator.share){ try{ await navigator.share({title:'DEVLIFE',text:txt,url}); }catch{} }
    else { try{ await navigator.clipboard.writeText(url); toast('Link copied'); }catch{ toast('Could not copy'); } }
  };
}

function renderShared(data){
  const e=ENDINGS[data.end]||{title:data.end,tone:'grey',text:''};
  app.className='';
  app.innerHTML=summaryHtml({tone:e.tone,title:e.title,text:e.text,
    year:data.yr,decisions:data.decisions,moments:data.moments||[],
    flags:data.flags||[],isLive:false,state:null});
  $('#tryit').onclick=()=>{ history.replaceState(null,'',location.pathname); screen='start'; sharedData=null; render(); };
}

// ---------------- actions ----------------
function openEvent(){ if(game.current) sheet={kind:'event',ev:game.current}; render(); }
function pushFeed(entry){ feed.push({...entry, year:game.state.year}); }

let _rosterSnapshot=new Set();
function snapshotRoster(){ _rosterSnapshot=new Set(game.state.people.map(p=>p.id)); }
function newcomerFaces(){
  game.takeRosterNotes?.();
  const added=game.state.people.filter(p=>!_rosterSnapshot.has(p.id));
  snapshotRoster();
  return added.length?added.map(p=>({sprite:p.sprite,name:p.name})):null;
}

// Classify an entry so the chronicle can colour it by meaning.
function kindOf(deltas, fallback=''){
  if(!deltas) return fallback;
  const d=deltas;
  if((d.containment||0)<-8 || (d.autonomy||0)>8) return 'danger';
  if((d.capability||0)>20) return 'good';
  if((d.capability||0)>6 || (d.interpretability||0)>6) return 'tech';
  if((d.happiness||0)>5 || (d.morale||0)>6) return 'human';
  return fallback;
}

function onChoice(i){
  const ev=game.current;
  snapshotRoster();
  const res=game.choose(i);
  if(!res) return;
  pushFeed({kind:kindOf(res.deltas),lbl:ev.title,text:res.outcome.text,deltas:res.deltas,faces:newcomerFaces()});
  sheet={kind:'outcome',title:ev.title,text:res.outcome.text,deltas:res.deltas};
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onLifeAction(id){
  if(id==='buy_asset'){ sheet={kind:'shop'}; render(); return; }
  if(id==='invest'){ sheet={kind:'invest'}; render(); return; }
  if(id==='sell_stock'){ sheet={kind:'sell'}; render(); return; }
  snapshotRoster();
  const res=game.doLifeAction(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:kindOf(res.deltas,'human'),lbl:last.title,text:res.outcome.text,deltas:res.deltas});
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onActivity(id){
  snapshotRoster();
  const res=game.doActivity(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:kindOf(res.deltas,'tech'),lbl:last.title,text:res.outcome.text,deltas:res.deltas,faces:newcomerFaces()});
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onAge(){
  if(game.current){ openEvent(); return; }
  const notes=game.nextYear();
  for(const n of notes) pushFeed({
    kind: n.kind==='danger'||n.kind==='warn' ? 'danger' : n.kind==='good' ? 'good' : '',
    lbl:'', text:n.text });
  if(game.isOver){ screen='ending'; render(); return; }
  if(game.current){ render(); openEvent(); return; }
  render();
}

function autosave(){ if(game && screen==='play') saveGame(game,{feed,tab}); }

// ---------------- root ----------------
function render(){
  if(screen==='start') return renderStart();
  if(screen==='shared') return renderShared(sharedData);
  if(screen==='ending'){ clearSave(); return renderEnding(); }
  autosave();

  const wide = window.matchMedia('(min-width:900px)').matches;
  if(wide){
    app.className='wide';
    app.innerHTML=`
      <div class="col col-left">${chronicleHtml()}</div>
      <div class="col col-mid">${worldHtml()}${pulseHtml()}${dockHtml()}</div>
      <div class="col col-right">
        <div class="desk-panel">${paneHtml('team')}</div>
        <div class="desk-panel">${paneHtml('model')}</div>
      </div>
      ${sheetHtml()}`;
  } else {
    app.className='';
    app.innerHTML=worldHtml()+pulseHtml()+chronicleHtml()+dockHtml()+sheetHtml();
  }

  const ageBtn=$('#age'); if(ageBtn) ageBtn.onclick=onAge;
  const hm=$('#hmenu'); if(hm) hm.onclick=()=>{ sheet={kind:'menu'}; render(); };
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
  app.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{actCat=b.dataset.cat;render();});
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const r=game.doLifeAction('buy_asset',{assetId:b.dataset.buy});
    if(r){ pushFeed({kind:'human',lbl:'Acquired',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }});
  app.querySelectorAll('[data-invest]').forEach(b=>b.onclick=()=>{
    const amt=Math.max(1000,Math.round(game.state.life.cash*0.25));
    const r=game.doLifeAction('invest',{stockId:b.dataset.invest,amount:amt});
    if(r){ pushFeed({kind:'',lbl:'Invested',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }});
  app.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const r=game.doLifeAction('sell_stock',{stockId:b.dataset.sell});
    if(r){ pushFeed({kind:'',lbl:'Sold',text:r.outcome.text,deltas:r.deltas}); sheet=null; render(); }});

  const ok=$('#ok'); if(ok) ok.onclick=()=>{ sheet=null; if(game.current){ render(); openEvent(); } else render(); };
  const mClose=$('#m-close'); if(mClose) mClose.onclick=()=>{sheet=null;render();};
  const mRestart=$('#m-restart'); if(mRestart) mRestart.onclick=()=>{sheet={kind:'confirm-restart'};render();};
  const cNo=$('#c-no'); if(cNo) cNo.onclick=()=>{sheet=null;render();};
  const cYes=$('#c-yes'); if(cYes) cYes.onclick=()=>{
    clearSave(); game=null; draft=null; feed=[]; sheet=null; tab='life'; screen='start'; render(); };

  const scrim=$('#scrim');
  if(scrim) scrim.onclick=e=>{
    if(e.target!==scrim) return;
    if(sheet&&sheet.kind==='event') return;
    const keep = sheet&&(sheet.kind==='menu'||sheet.kind==='confirm-restart');
    sheet=null; if(!keep) tab='life'; render();
  };

  const f=$('#feed'); if(f) f.scrollTop=f.scrollHeight;
}

document.addEventListener('keydown',e=>{
  if(screen!=='play') return;
  if(sheet?.kind==='event' && /^[1-9]$/.test(e.key)){
    const i=+e.key-1; if(sheet.ev.choices[i]) onChoice(i);
  } else if(e.key==='Enter'){ const b=$('#ok')||$('#age'); b?.click(); }
});

let _rz; addEventListener('resize',()=>{ clearTimeout(_rz); _rz=setTimeout(()=>{ if(screen==='play') render(); },180); });

const shared = readSharedFromLocation();
if(shared){ sharedData=shared; screen='shared'; }
else {
  const save=loadSave();
  if(save){
    const restored=restoreGame(Game,save);
    if(restored && !restored.state.dead){
      game=restored; feed=save.ui?.feed||[]; tab=save.ui?.tab||'life'; screen='play';
      snapshotRoster();
      if(game.current) sheet={kind:'event',ev:game.current};
    } else clearSave();
  }
}
render();
