// DEVLIFE — presentation layer.
// Three layers: an evolving illustrated WORLD, a LIFE CHRONICLE of prose, and
// an ACTION DOCK. Simulation logic is untouched; this file only decides how
// the run is seen.

import { Game } from '../engine/game.js';
import { STAT_DEFS } from '../engine/state.js';
import { ACTIVITY_CATEGORIES } from '../data/activities.js';
import { ENDINGS } from '../data/index.js';
import { activePeople, alumni, traitOf, roleOf, spriteStyle } from '../engine/people.js';
import { jobOf, netWorth, fmtMoney, ASSETS, ASSET_CATEGORIES, STOCKS, CRYPTO } from '../engine/life.js';
import { LIFE_CATEGORIES, LIFE_ACTIONS } from '../data/life-activities.js';
import { renderWorld, worldCaption, tierFor } from './world.js';
import { shareUrl, readSharedFromLocation } from './share.js';
import { saveGame, loadSave, clearSave, restoreGame } from '../engine/save.js';
import { initAnalytics, track } from './analytics.js';
import { celebrate } from './confetti.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app');

let game = null;
let screen = 'start';
let sheet = null;
let tab = 'life';
let actCat = 'career';
let assetCat = 'property';
let feed = [];
let sharedData = null;
let draft = null;

const RK = { match:'Signal match', friend:'Friend', partner:'Partner', spouse:'Spouse', ex:'Ex', fling:'Fling',
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
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M15 14h3"/><path d="M8 3v3"/></svg>',
  lab:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18"/><path d="M8 7h8M8 11h8M8 15h4"/><circle cx="16.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
  job:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/><path d="M10 13v2h4v-2"/></svg>',
  ai:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="7" width="10" height="10" rx="2"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
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
  const s = d.game.state, o = s.origin, c = s.complication, L=s.life, job=jobOf(L);
  app.className = '';
  app.innerHTML = `
    <div class="title-screen">
      <div class="title-mark">
        <div class="new-game">NEW LIFE · NEW MESS</div>
        <h1>DEV<span>LIFE</span></h1>
        <div class="sub">Build the AI. Build the empire. Try to keep a life.</div>
      </div>

      <div class="dossier-card">
        <div class="dc-plate start-profile-art">
          <div class="code-rain">01&nbsp;10&nbsp;01&nbsp;11&nbsp;00<br/>const future = new AI();<br/>future.train();</div>
          <div class="portrait hero"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},2)}"></i></div>
          <div class="start-badge">YOUR NEW LIFE</div>
        </div>
        <div class="dc-body">
          <div class="dc-top">
            <div class="portrait"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},1)}"></i></div>
            <div style="min-width:0;flex:1">
              <div class="dc-name" id="labname" contenteditable="true" spellcheck="false">${esc(s.name)}</div>
              <div class="dc-meta">${esc(job.title)} · age ${s.age}</div>
            </div>
            <button class="dc-reroll" id="reroll" title="Roll another life">🎲</button>
          </div>
          <div class="origin-tag">${esc(o.label)}${c.id!=='none'?' · '+esc(c.label):''}</div>
          <p class="dc-origin">${esc(o.opener)}${c.opener?' '+esc(c.opener):''}</p>
          <div class="dc-stats">
            <div class="dc-stat"><span>💵 Cash</span><b>${fmtMoney(L.cash)}</b></div>
            <div class="dc-stat ${L.debt?'bad':''}"><span>💳 Debt</span><b>${fmtMoney(L.debt)}</b></div>
            <div class="dc-stat"><span>💼 Salary</span><b>${fmtMoney(job.salary)}</b></div>
            <div class="dc-stat"><span>🤖 First AI</span><b>${esc(s.modelName)}</b></div>
          </div>
        </div>
      </div>

      <div class="starter-goals"><span>💼 get hired</span><span>🚀 found a company</span><span>❤️ find somebody</span><span>📈 get rich</span></div>
      <button class="btn" id="go">Start this life <b>→</b></button>
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
  track('game_started',{age:game.state.age,difficulty:game.state.difficulty||diff});
  snapshotRoster();
  render();
}

// ---------------- world layer ----------------
function worldHtml(){
  const s = game.state, L=s.life, job=jobOf(L);
  const partner=L.people.find(p=>p.kind==='partner'||p.kind==='spouse');
  return `<div class="world profile-head">
    <div class="profile-bar"><div class="brand-chip">DEV<span>LIFE</span></div>
      <button class="world-menu" id="hmenu" title="Menu">${SYM.menu}</button></div>
    <div class="profile-main">
      <div class="portrait player"><i class="sprite" style="${spriteStyle({sprite:s.founderSprite},2)}"></i></div>
      <div class="profile-copy"><div class="profile-name">${esc(s.name)}</div>
        <div class="profile-age">Age ${s.age} · ${esc(job.title)}</div>
        <div class="profile-life">${partner?'❤️ '+esc(partner.name):'💔 Single'} &nbsp;·&nbsp; ${L.pregnancy?'🤍 Baby due next year':L.kids.length?'👶 '+L.kids.length+' kid'+(L.kids.length===1?'':'s'):'No kids'}</div>
      </div>
      <div class="cash-box"><span>NET WORTH</span><b>${fmtMoney(netWorth(L))}</b></div>
    </div>
  </div>`;
}

// ---------------- life pulse ----------------
function pulseHtml(){
  const s = game.state, st = s.stats, L = s.life;
  const vitals=[['Happiness',L.happiness,'happy'],['Health',st.health,'health'],['Reputation',st.reputation,'reputation'],['AI safety',st.containment,st.containment<35?'danger':'safety']];
  return `<div class="pulse">${vitals.map(([k,v,cls])=>`<div class="vital"><div><span>${k}</span><b>${Math.round(v)}</b></div><div class="vital-track"><i class="${cls}" style="width:${Math.max(2,Math.min(100,v))}%"></i></div></div>`).join('')}</div>`;
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
  return `<div class="dock">
    <div class="tabs bit-tabs">
      <button data-nav="life" class="${tab==='life'?'on':''}">${SYM.life}<span>Life</span></button>
      <button data-nav="job" class="${tab==='job'?'on':''}">${SYM.job}<span>Job</span></button>
      <button data-nav="model" class="${tab==='model'?'on':''}">${SYM.ai}<span>AI</span></button>
      <button class="age-btn ${pending?'pending':''}" id="age"><b>${pending?'!':'+'}</b><span>${pending?'Decision':'Age'}</span></button>
      <button data-nav="me" class="${tab==='me'?'on':''}">${SYM.money}<span>Money</span></button>
      <button data-nav="team" class="${tab==='team'?'on':''}">${SYM.team}<span>Relations</span></button>
      <button data-nav="activities" data-open-cat="social" class="all-actions">${SYM.act}<span>Activities</span></button>
    </div>
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

function choiceHint(label){
  const tone=choiceTone(label);
  return tone==='risky'?'CHAOS':tone==='bold'?'BIG MOVE':tone==='careful'?'SAFE PLAY':'YOUR CALL';
}

function personSheetHtml(personId){
  const p=game.state.life.people.find(x=>x.id===personId);
  if(!p) return `<div class="panel-bd"><div class="empty">This relationship has moved on.</div></div>`;
  const L=game.state.life, yearsKnown=Math.max(0,game.state.year-(p.metYear??game.state.year));
  const gap=Math.abs((p.age??game.state.age)-game.state.age);
  const dateReady=(p.conversations||0)>=3&&game.state.year>(p.metYear??game.state.year)&&p.lastDateYear!==game.state.year;
  const hearts=Math.max(1,Math.ceil(p.closeness/20));
  const acts=[
    {id:'talk', label:'Have a real conversation', desc:(p.conversations||0)>=3?'Keep the conversation alive between milestones.':`${3-(p.conversations||0)} more conversation${(p.conversations||0)===2?'':'s'} before asking for a date.`, tone:'careful'},
    {id:'spend', label:'Spend time together', desc:'Put the phone away for an evening.', tone:'careful'},
    {id:'gift', label:'Send a thoughtful gift', desc:'Costs cash. Builds closeness.', tone:'bold'},
  ];
  if(['match','friend','fling','cofounder'].includes(p.kind)) acts.push({id:'date',label:'Ask them on a date',desc:dateReady?(p.dates?`Plan date ${p.dates+1}. Relationships take more than one good night.`:'Make an actual plan, off the app.'):(game.state.year<=(p.metYear??game.state.year)?'You met this year. Let time pass first.':'Have three real conversations first.'),tone:'risky'});
  if(['partner','spouse','fling'].includes(p.kind)) {
    acts.push({id:'intimacy_protected',label:'Spend a protected night',desc:'Adult, consensual intimacy without a pregnancy risk.',tone:'careful'});
    acts.push({id:'intimacy_unprotected',label:'Take a chance',desc:'Adult, consensual intimacy without protection. A pregnancy can change next year.',tone:'risky'});
  }
  if(p.kind==='partner') acts.push({id:'propose',label:'Propose marriage',desc:p.closeness<55?'Build the relationship a little more first.':'Make a promise in public.',tone:'bold'});
  if(['partner','spouse'].includes(p.kind)) acts.push({id:'try_child',label:'Try for a child',desc:L.pregnancy?'A baby is already due next year.':'Start a family. Birth happens after an age-up.',tone:'bold'});
  if(p.kind==='partner'||p.kind==='spouse') acts.push({id:'breakup',label:p.kind==='spouse'?'File for divorce':'End the relationship',desc:p.kind==='spouse'?'This will change both of your lives.':'Hard now, harder later.',tone:'risky'});
  const title=RK[p.kind]||p.kind;
  return `<div class="person-hero"><div class="portrait full"><i class="sprite" style="${spriteStyle(p,2)}"></i></div><div><span>${esc(title)}${p.cofounder?' · CO-FOUNDER':''}</span><h2>${esc(p.name)}</h2><div class="heartline">${'♥'.repeat(hearts)}<i>${'♥'.repeat(5-hearts)}</i></div></div></div>
    <div class="panel-hd"><div class="p-k">Age ${p.age??'?'} · ${gap} year age gap · ${yearsKnown?'known '+yearsKnown+' year'+(yearsKnown===1?'':'s'):'met this year'}</div><h2>What do you do?</h2></div>
    <div class="panel-bd"><div class="relationship-meter"><span>CONVERSATIONS <b>${p.conversations||0}</b></span><span>DATES <b>${p.dates||0}</b></span><span>CLOSENESS <b>${Math.round(p.closeness)}</b></span></div>${acts.map(a=>`<button class="choice ${a.tone}" data-rel="${a.id}" data-person="${p.id}"><span class="choice-tag">RELATIONSHIP</span><span class="c-t">${esc(a.label)}</span><span class="c-d">${esc(a.desc)}</span><span class="choice-arrow">→</span></button>`).join('')}</div>`;
}

function jobSheetHtml(){
  const L=game.state.life, job=jobOf(L);
  const tenure=Math.max(0,game.state.year-(L.tenureStartYear??game.state.year));
  const perf=Math.round(L.performance??55);
  const rungs=Math.max(1,Math.ceil(perf/20));
  const isFounder=L.equity>0;
  const acts=[];
  if(L.jobIndex>0) acts.push({id:'put_in_work',label:'Put in the work',desc:'No dice roll, just hours toward the next review.',tone:'careful'});
  if(L.jobIndex>0) acts.push({id:'ask_raise',label:'Ask for a raise',desc:tenure<1?'You just started here. Give it a year.':perf<40?'Standing is too thin for that conversation yet.':'Walk in with a track record.',tone:'bold'});
  acts.push({id:'job_hunt',label:'Interview elsewhere',desc:'See what the market thinks you are worth.',tone:'risky'});
  if(!isFounder&&L.jobIndex>=3) acts.push({id:'quit_found',label:'Quit and found your own lab',desc:'Trade a salary for equity and the right to decide things.',tone:'bold'});
  if(isFounder) acts.push({id:'poach_rival',label:'Poach a rival\'s star',desc:'Expensive, effective, and they will remember it.',tone:'risky'});
  if(isFounder) acts.push({id:'sabotage',label:'Leak a rival\'s roadmap',desc:'You have the document. Using it is a choice about who you are.',tone:'risky'});
  return `<div class="person-hero job-hero"><div class="portrait full job-portrait"><span>${SYM.job}</span></div><div><span>${esc(L.employer||game.state.name)}${isFounder?' · FOUNDER':''}</span><h2>${esc(job.title)}</h2><div class="heartline">${'●'.repeat(rungs)}<i>${'●'.repeat(5-rungs)}</i></div></div></div>
    <div class="panel-hd"><div class="p-k">${tenure===0?'Started this year':tenure+' year'+(tenure===1?'':'s')+' in the seat'} · ${fmtMoney(job.salary)}/yr</div><h2>Your career</h2></div>
    <div class="panel-bd"><div class="relationship-meter career-meter"><span>TENURE <b>${tenure}</b></span><span>STANDING <b>${perf}</b></span><span>${isFounder?'EQUITY <b>'+(L.equity*100).toFixed(1)+'%</b>':'SALARY <b>'+fmtMoney(job.salary)+'</b>'}</span></div>${acts.map(a=>`<button class="choice ${a.tone}" data-life="${a.id}"><span class="choice-tag">CAREER</span><span class="c-t">${esc(a.label)}</span><span class="c-d">${esc(a.desc)}</span><span class="choice-arrow">→</span></button>`).join('')}
    <button class="choice" data-nav="activities" data-open-cat="career"><span class="c-t">All career moves</span><span class="choice-arrow">→</span></button></div>`;
}

function coworkerSheetHtml(workerId){
  const p=game.state.people.find(x=>x.id===workerId);
  if(!p) return `<div class="panel-bd"><div class="empty">They no longer work here.</div></div>`;
  const known=game.state.life.people.find(x=>x.name===p.name);
  const trait=traitOf(p), role=roleOf(p);
  return `<div class="person-hero"><div class="portrait full"><i class="sprite" style="${spriteStyle(p,2)}"></i></div><div><span>${esc(role.label)} · COWORKER</span><h2>${esc(p.name)}</h2><small>★ ${p.skill>=75?'Elite':p.skill>=50?'Strong':'Learning'} · ${esc(trait.label)}</small></div></div>
    <div class="panel-hd"><div class="p-k">Joined ${p.joinedYear===game.state.year?'this year':'year '+p.joinedYear}</div><h2>Outside work</h2></div>
    <div class="panel-bd">${known?`<button class="choice bold" data-open-person="${known.id}"><span class="c-t">Open relationship</span><span class="c-d">${esc(p.name)} is already a ${esc(RK[known.kind]||known.kind)} in your life.</span><span class="choice-arrow">→</span></button>`:`<button class="choice bold" data-befriend="${p.id}"><span class="choice-tag">MAKE A FRIEND</span><span class="c-t">Ask them for coffee</span><span class="c-d">Turn a coworker into somebody who calls.</span><span class="choice-arrow">→</span></button>`}</div>`;
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
        <span class="choice-tag">${choiceHint(c.label)}</span><span class="c-t">${esc(c.label)}</span><span class="choice-arrow">→</span></button>`).join('')}</div>`;
  }

  if(sheet.kind==='outcome'){
    const marks=Object.entries(sheet.deltas||{}).map(([k,v])=>
      `<span class="mark ${v>0?'up':'down'}">${STAT_DEFS[k]?.label||cap1(k)} <b>${v>0?'+':''}${v}</b></span>`).join('');
    inner=`<div class="ch-hd"><div class="ch-k">${esc(sheet.title||'What happened')}</div></div>
      <div class="ch-bd"><p style="color:var(--ivory)">${esc(sheet.text)}</p>
      ${marks?`<div class="marks" style="margin-bottom:20px">${marks}</div>`:''}
      ${sheet.finance?`<button class="btn ghost" data-finance="${esc(sheet.finance.assetId)}">Ask ${esc(game.state.life.bank?.name||'the bank')} to finance it</button>`:''}
      <button class="btn" id="ok">Go on</button></div>`;
  }

  if(sheet.kind==='activities'){
    const isLife=LIFE_CATEGORIES.some(c=>c.id===actCat);
    const list=isLife?game.availableLifeActions().filter(a=>a.cat===actCat)
                     :game.availableActivities().filter(a=>a.cat===actCat);
    const cats=[...LIFE_CATEGORIES,...ACTIVITY_CATEGORIES];
    inner=`<div class="panel-hd"><div class="p-k">Do as much as you want before aging up</div>
      <h2>Activities</h2></div>
      <div class="cats">${cats.map(c=>
        `<button data-cat="${c.id}" class="${actCat===c.id?'on':''}">${c.icon||'⚡'} ${esc(c.label)}</button>`).join('')}</div>
      <div class="panel-bd">${list.length?list.map(a=>
        `<button class="choice ${choiceTone(a.label)}" data-${isLife?'life':'act'}="${a.id}">
          <span class="choice-tag">${choiceHint(a.label)}</span><span class="c-t">${esc(a.label)}</span><span class="c-d">${esc(a.desc)}</span><span class="choice-arrow">→</span></button>`).join('')
        :`<div class="empty">Nothing here yet.</div>`}</div>`;
  }

  if(sheet.kind==='dating'){
    const L=game.state.life;
    const matches=L.people.filter(p=>p.kind==='match'&&!p.faded);
    inner=`<div class="dating-hero"><span>◌</span><div><small>SIGNAL · PEOPLE AROUND YOUR AGE</small><h2>Dating, slowly</h2></div></div>
      <div class="panel-bd"><p class="asset-desc">A profile is an introduction, not a relationship. Start a conversation, let a year pass, then see where an actual date goes.</p>
      ${matches.length?matches.map(p=>`<button class="dating-profile" data-open-person="${p.id}">
        <div class="portrait tall"><i class="sprite" style="${spriteStyle(p,1)}"></i></div><div><b>${esc(p.name)}, ${p.age}</b><small>${esc(p.note||'Signal match')} · ${Math.abs(p.age-game.state.age)} year age gap</small><em>${p.conversations||0} conversations · ${p.dates||0} dates</em></div><i>→</i></button>`).join('')
        :`<div class="empty">No live matches. Come back after time passes.</div>`}</div>`;
  }

  if(sheet.kind==='shop'){
    const L=game.state.life;
    inner=`<div class="panel-hd"><div class="p-k">${fmtMoney(L.cash)} on hand</div><h2>Acquisitions</h2></div>
      <div class="asset-cats">${ASSET_CATEGORIES.map(c=>`<button data-asset-cat="${c.id}" class="${assetCat===c.id?'on':''}"><b>${c.icon}</b><span>${esc(c.label)}</span></button>`).join('')}</div>
      <div class="panel-bd asset-grid">${ASSETS.filter(a=>a.cat===assetCat).map(a=>{
        const owned=L.owns.some(o=>o.assetId===a.id), afford=L.cash>=a.price;
        return `<button class="asset-tile ${owned?'owned':''}" data-asset-detail="${a.id}">
          <span class="asset-visual v-${esc(a.visual)}">${a.icon}</span><span class="asset-copy"><b>${esc(a.name)}</b>
          <small>${owned?'Yours · '+fmtMoney(L.owns.find(o=>o.assetId===a.id)?.value||a.price):(afford?'Available':'Finance available')} · ${fmtMoney(a.price)}</small></span><i>→</i></button>`;}).join('')}</div>`;
  }

  if(sheet.kind==='asset-detail'){
    const L=game.state.life, a=ASSETS.find(x=>x.id===sheet.assetId), owned=L.owns.some(o=>o.assetId===a?.id);
    if(!a) { sheet={kind:'shop'}; return sheetHtml(); }
    const short=Math.max(0,a.price-L.cash), limit=Math.round(((L.bank?.creditScore||680)-470)*2600+Math.max(0,jobOf(L).salary||L.salary)*.7-L.debt*.25);
    inner=`<div class="asset-hero v-${esc(a.visual)}"><span>${a.icon}</span><div><small>${esc(a.cat)}</small><b>${esc(a.name)}</b></div></div>
      <div class="panel-hd"><div class="p-k">${owned?'In your collection':fmtMoney(a.price)}</div><h2>${esc(a.name)}</h2></div>
      <div class="panel-bd"><p class="asset-desc">${esc(a.desc)}</p>
        <div class="asset-facts"><span>VALUE <b>${fmtMoney(owned?(L.owns.find(o=>o.assetId===a.id)?.value||a.price):a.price)}</b></span><span>JOY <b>+${a.joy}</b></span><span>YOU HAVE <b>${fmtMoney(L.cash)}</b></span></div>
        ${owned?`<button class="btn ghost" data-share-asset="${a.id}">Make a share card</button>`:
          `<button class="btn" data-buy="${a.id}">${L.cash>=a.price?'Buy it for '+fmtMoney(a.price):'Try to buy · '+fmtMoney(short)+' short'}</button>
           ${short>0?`<p class="finance-note">${esc(L.bank?.name||'Your bank')} could finance up to ${fmtMoney(Math.max(0,limit))}. Buying will show the real offer.</p>`:''}`}
      </div>`;
  }

  if(sheet.kind==='asset-share'){
    const a=ASSETS.find(x=>x.id===sheet.assetId), L=game.state.life;
    if(!a) { sheet={kind:'shop'}; return sheetHtml(); }
    inner=`<div class="flex-card v-${esc(a.visual)}"><div class="flex-top"><span>DEV<span>LIFE</span> · YEAR ${game.state.year}</span><b>NEW ACQUISITION</b></div><div class="flex-thing">${a.icon}</div><h2>${esc(a.name)}</h2><p>${esc(game.state.name)} just added it to the collection.</p><div class="flex-stats"><span>NET WORTH <b>${fmtMoney(netWorth(L))}</b></span><span>AGE <b>${game.state.age}</b></span><span>JOY <b>+${a.joy}</b></span></div></div>
      <div class="panel-bd"><p class="asset-desc">Made for a screenshot, a flex, or a post.</p><button class="btn" data-x-share="${a.id}">Share to X</button><button class="btn ghost" data-copy-flex="${a.id}" style="margin-top:9px">Copy the caption</button></div>`;
  }

  if(sheet.kind==='bank'){
    const L=game.state.life, bank=L.bank||{}, limit=Math.max(10000,Math.round(((bank.creditScore||680)-470)*2600+Math.max(0,jobOf(L).salary||L.salary)*.7-L.debt*.25));
    const offers=[10000,50000,150000].filter(n=>n<=limit); if(!offers.length) offers.push(Math.max(5000,Math.round(limit)));
    inner=`<div class="bank-card"><span>YOUR BANK</span><b>${esc(bank.name||'Perimeter Bank')}</b><div><i>Credit score</i><strong>${Math.round(bank.creditScore||680)}</strong></div></div>
      <div class="panel-hd"><div class="p-k">Available credit ${fmtMoney(limit)}</div><h2>Borrow carefully</h2></div>
      <div class="panel-bd"><p class="asset-desc">Loans fund a move today and add to your yearly payment. Credit improves when you repay.</p>
      ${offers.map(n=>`<button class="choice bold" data-loan="${n}"><span class="c-t">Borrow ${fmtMoney(n)}</span><span class="c-d">Personal credit · rate set by your score</span><span class="choice-arrow">→</span></button>`).join('')}
      ${bank.loans?.length?`<div class="sec-rule"><b>Open loans</b><i></i></div><div class="ledger">${bank.loans.map(x=>`<div class="ledger-row"><span class="k">${esc(x.purpose)}</span><span class="v neg">${fmtMoney(x.principal)}</span></div>`).join('')}</div>`:''}</div>`;
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

  if(sheet.kind==='crypto'){
    const L=game.state.life, amount=Math.max(250,Math.round(L.cash*.15));
    inner=`<div class="panel-hd"><div class="p-k">Placing ${fmtMoney(amount)} from cash</div><h2>Crypto exchange</h2></div><div class="panel-bd">${CRYPTO.map(c=>`<button class="choice risky" data-crypto="${c.id}"><span class="choice-tag">${esc(c.ticker)} · HIGH VOLATILITY</span><span class="c-t">${c.icon} ${esc(c.name)}</span><span class="c-d">The move can be enormous in either direction.</span><span class="choice-arrow">→</span></button>`).join('')}</div>`;
  }

  if(sheet.kind==='markets'){
    const L=game.state.life, stockValue=Object.values(L.portfolio).reduce((sum,h)=>sum+h.shares*(h.price??h.basis),0), cryptoValue=Object.values(L.crypto||{}).reduce((sum,h)=>sum+h.units*(h.price??h.basis),0);
    inner=`<div class="panel-hd"><div class="p-k">${fmtMoney(L.cash)} investable cash</div><h2>Markets</h2></div><div class="panel-bd">
      <button class="market-door stock" data-market-open="invest"><span>📈</span><div><b>Stock market</b><small>${fmtMoney(stockValue)} invested · funds, equities, pre-IPO bets</small></div><i>→</i></button>
      <button class="market-door crypto" data-market-open="crypto"><span>₿</span><div><b>Crypto exchange</b><small>${fmtMoney(cryptoValue)} in coins · extreme volatility</small></div><i>→</i></button>
      ${stockValue?`<button class="choice" data-market-open="sell"><span class="c-t">Sell stock positions</span><span class="choice-arrow">→</span></button>`:''}
      ${cryptoValue?`<button class="choice risky" data-market-open="crypto-sell"><span class="c-t">Cash out crypto</span><span class="choice-arrow">→</span></button>`:''}
    </div>`;
  }

  if(sheet.kind==='crypto-sell'){
    const held=Object.entries(game.state.life.crypto||{});
    inner=`<div class="panel-hd"><div class="p-k">Your coin positions</div><h2>Cash out crypto</h2></div><div class="panel-bd">${held.length?held.map(([id,h])=>{ const c=CRYPTO.find(x=>x.id===id), value=Math.round(h.units*(h.price??h.basis)); return `<button class="choice risky" data-crypto-sell="${id}"><span class="c-t">${c?.icon||'◈'} ${esc(c?.name||id)}</span><span class="c-d">${fmtMoney(value)} current value</span><span class="choice-arrow">→</span></button>`; }).join(''):`<div class="empty">No coins yet. You can buy them in Markets.</div>`}</div>`;
  }

  if(sheet.kind==='job') inner=jobSheetHtml();
  if(sheet.kind==='person') inner=personSheetHtml(sheet.personId);
  if(sheet.kind==='coworker') inner=coworkerSheetHtml(sheet.workerId);

  if(sheet.kind==='pane') inner=paneHtml(sheet.pane);

  if(sheet.kind==='menu'){
    const saved=game.state.life.bank?.lastSavedAt ? new Date(game.state.life.bank.lastSavedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'now';
    inner=`<div class="panel-hd"><div class="p-k">Year ${game.state.year} · saved on this device at ${esc(saved)}</div><h2>Pause</h2></div>
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
    const pcard=p=>`<button class="dossier dossier-button" data-open-person="${p.id}">
      <div class="portrait tall"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
      <div class="d-body">
        <div class="d-name">${esc(p.name)}</div>
        <div class="d-role">${esc(RK[p.kind]||p.kind)}${p.serious?' · serious':''}</div>
        <div class="heartline" title="Closeness ${p.closeness}">${'♥'.repeat(Math.max(1,Math.ceil(p.closeness/20)))}<i>${'♥'.repeat(Math.max(0,5-Math.ceil(p.closeness/20)))}</i></div>
      </div></button>`;
    return `<div class="panel-hd"><div class="p-k">${fmtMoney(netWorth(L))} · ${esc(job.title)}</div><h2>Yourself</h2></div>
      <div class="panel-bd">
        <div class="ledger">
          ${row('Employer', esc(L.employer||s.name))}
          ${row('Salary', fmtMoney(job.salary))}
          ${row('Cash', fmtMoney(L.cash))}
          ${row('Bank', esc(L.bank?.name||'Perimeter Bank'))}
          ${row('Credit score', Math.round(L.bank?.creditScore||680))}
          ${L.debt>0?row('Debt', fmtMoney(L.debt), true):''}
          ${L.equity>0?row('Equity',(L.equity*100).toFixed(1)+'%'):''}
          ${row('Net worth', fmtMoney(netWorth(L)), netWorth(L)<0)}
        </div>
        <div class="money-hub"><button data-money-open="shop"><b>🏎️</b><span>Browse assets</span></button><button data-money-open="bank"><b>🏦</b><span>Bank & loans</span></button><button data-money-open="markets"><b>📈</b><span>Markets</span></button></div>
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
        ${Object.keys(L.crypto||{}).length?secRule('Crypto')+`<div class="ledger">${
          Object.entries(L.crypto).map(([id,h])=>{ const coin=CRYPTO.find(x=>x.id===id); return row(coin?coin.ticker:id,fmtMoney(Math.round(h.units*(h.price??h.basis)))); }).join('')}</div>`:''}
      </div>`;
  }

  if(which==='team'){
    const roster=activePeople(s), gone=alumni(s);
    const card=p=>{
      const t=traitOf(p), r=roleOf(p), tenure=s.year-p.joinedYear;
      return `<button class="dossier dossier-button" data-open-coworker="${p.id}">
        <div class="portrait tall"><i class="sprite" style="${spriteStyle(p,1)}"></i></div>
        <div class="d-body">
          <div class="d-name">${esc(p.name)}</div>
          <div class="d-role">${esc(r.label)} · ${tenure===0?'joined this year':tenure+' years'}</div>
          <div class="team-readout"><span>★ ${p.skill>=75?'Elite':p.skill>=50?'Strong':'Learning'}</span><span>${p.morale>=65?'🔥 Fired up':p.morale>=35?'🙂 Steady':'😤 Ready to quit'}</span></div>
          <span class="d-trait ${t.good?'':'warn'}">${esc(t.label)}</span>
        </div></button>`;
    };
    const personal=L.people.filter(p=>!p.faded);
    const personalCard=p=>`<button class="dossier dossier-button" data-open-person="${p.id}"><div class="portrait tall"><i class="sprite" style="${spriteStyle(p,1)}"></i></div><div class="d-body"><div class="d-name">${esc(p.name)}</div><div class="d-role">${esc(RK[p.kind]||p.kind)}${p.cofounder?' · co-founder':''}</div><div class="heartline">${'♥'.repeat(Math.max(1,Math.ceil(p.closeness/20)))}<i>${'♥'.repeat(Math.max(0,5-Math.ceil(p.closeness/20)))}</i></div></div><span class="dossier-arrow">→</span></button>`;
    const single=!L.people.some(p=>p.kind==='partner'||p.kind==='spouse');
    const datingCta=single?`<button class="choice bold" data-life="date_apps"><span class="choice-tag">SIGNAL</span><span class="c-t">Open dating</span><span class="c-d">Browse age-compatible matches near you.</span><span class="choice-arrow">→</span></button>`:'';
    return `<div class="panel-hd"><div class="p-k">${personal.length} personal · ${roster.length} at work</div>
      <h2>Relationships</h2></div>
      <div class="panel-bd">
        ${datingCta}
        ${personal.length?personal.map(personalCard).join(''):`<div class="empty">Nobody close yet. Try dating.</div>`}
        ${secRule('Coworkers')}
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
    const modelRow=(icon,label,value,note,bad=false)=>`<div class="model-stat ${bad?'bad':''}"><span class="model-icon">${icon}</span><div><b>${label}</b><small>${note}</small></div><strong>${value}</strong></div>`;
    return `<div class="panel-hd"><div class="p-k">${esc(s.modelName)} · generation ${s.modelGen||1}</div>
      <h2>Your AI</h2></div>
      <div class="panel-bd">
        <div class="model-grid">
          ${modelRow('🧠','Benchmark score',Math.round(st.capability)+'/260','problems solved')}
          ${modelRow('🛡️','Safety tests',Math.round(st.alignment)+'/100','passed in evaluation',st.alignment<35)}
          ${modelRow('🔬','Circuits mapped',Math.round(st.interpretability),'understood by your team')}
          ${modelRow('🔌','Shutdown drills',Math.round(st.containment)+'/100','successful',st.containment<35)}
          ${modelRow('🕹️','Solo actions',Math.round(st.autonomy),'without asking',st.autonomy>50)}
          ${modelRow('🖥️','GPU clusters',Math.max(1,Math.round(st.compute/10)),'under your control')}
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
  if(e.tone==='triumph') celebrate(160);
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

function showLifeResult(res, fallbackTitle, kind='human'){
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:kindOf(res.deltas,kind),lbl:last?.title||fallbackTitle,text:res.outcome.text,deltas:res.deltas,faces:newcomerFaces()});
  sheet={kind:'outcome',title:last?.title||fallbackTitle,text:res.outcome.text,deltas:res.deltas,finance:res.finance};
  if(res.celebrate) celebrate();
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onLifeAction(id){
  if(id==='buy_asset'){ sheet={kind:'shop'}; render(); return; }
  if(id==='invest'){ sheet={kind:'invest'}; render(); return; }
  if(id==='sell_stock'){ sheet={kind:'sell'}; render(); return; }
  if(id==='bank_loan'){ sheet={kind:'bank'}; render(); return; }
  if(id==='buy_crypto'){ sheet={kind:'crypto'}; render(); return; }
  if(id==='sell_crypto'){ sheet={kind:'crypto-sell'}; render(); return; }
  if(id==='date_apps'){
    snapshotRoster();
    const res=game.doLifeAction(id);
    if(!res) return;
    const last=game.state.log[game.state.log.length-1];
    pushFeed({kind:'human',lbl:last?.title||'Signal dating',text:res.outcome.text,deltas:res.deltas,faces:newcomerFaces()});
    tab='activities'; sheet={kind:'dating'};
    track('dating_app_opened',{age:game.state.age, year:game.state.year});
    render();
    return;
  }
  snapshotRoster();
  const res=game.doLifeAction(id);
  track('life_action',{action:id,age:game.state.age,year:game.state.year});
  showLifeResult(res,'Life', 'human');
}

function onActivity(id){
  snapshotRoster();
  const res=game.doActivity(id);
  if(!res) return;
  const last=game.state.log[game.state.log.length-1];
  pushFeed({kind:kindOf(res.deltas,'tech'),lbl:last.title,text:res.outcome.text,deltas:res.deltas,faces:newcomerFaces()});
  sheet={kind:'outcome',title:last.title,text:res.outcome.text,deltas:res.deltas};
  if(game.isOver){ screen='ending'; sheet=null; }
  render();
}

function onAge(){
  if(game.current){ openEvent(); return; }
  const notes=game.nextYear();
  track('age_up',{age:game.state.age,year:game.state.year,kids:game.state.life.kids.length,has_baby_due:Boolean(game.state.life.pregnancy)});
  for(const n of notes){
    pushFeed({ kind: n.kind==='danger'||n.kind==='warn' ? 'danger' : n.kind==='good' ? 'good' : '',
      lbl:'', text:n.text });
    if(n.celebrate) celebrate();
  }
  if(game.isOver){ screen='ending'; render(); return; }
  if(game.current){ render(); openEvent(); return; }
  render();
}

function autosave(){
  if(game && screen==='play') {
    game.state.life.bank ||= {};
    game.state.life.bank.lastSavedAt=Date.now();
    saveGame(game,{feed,tab,actCat,assetCat});
  }
}

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
      if(b.dataset.openCat) actCat=b.dataset.openCat;
      if(id==='life'){ tab='life'; sheet=null; }
      else if(id==='activities'){ tab='activities'; sheet={kind:'activities'}; }
      else if(id==='job'){ tab='job'; sheet={kind:'job'}; }
      else { tab=id; sheet={kind:'pane',pane:id}; }
      render();
    };
  });
  app.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>onChoice(+b.dataset.ch));
  app.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>onActivity(b.dataset.act));
  app.querySelectorAll('[data-life]').forEach(b=>b.onclick=()=>onLifeAction(b.dataset.life));
  app.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{actCat=b.dataset.cat;render();});
  app.querySelectorAll('[data-asset-cat]').forEach(b=>b.onclick=()=>{assetCat=b.dataset.assetCat;render();});
  app.querySelectorAll('[data-asset-detail]').forEach(b=>b.onclick=()=>{sheet={kind:'asset-detail',assetId:b.dataset.assetDetail};render();});
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    snapshotRoster(); const r=game.doLifeAction('buy_asset',{assetId:b.dataset.buy}); showLifeResult(r,'Acquired','human'); });
  app.querySelectorAll('[data-finance]').forEach(b=>b.onclick=()=>{
    snapshotRoster(); const r=game.runLifeHandler('financeAsset',{assetId:b.dataset.finance},'Bank financing'); showLifeResult(r,'Bank financing','human'); });
  app.querySelectorAll('[data-loan]').forEach(b=>b.onclick=()=>{
    snapshotRoster(); const r=game.runLifeHandler('bankLoan',{amount:+b.dataset.loan},'Bank loan'); showLifeResult(r,'Bank loan','human'); });
  app.querySelectorAll('[data-invest]').forEach(b=>b.onclick=()=>{
    const amt=Math.max(1000,Math.round(game.state.life.cash*0.25));
    snapshotRoster(); const r=game.doLifeAction('invest',{stockId:b.dataset.invest,amount:amt}); showLifeResult(r,'Invested',''); });
  app.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    snapshotRoster(); const r=game.doLifeAction('sell_stock',{stockId:b.dataset.sell}); showLifeResult(r,'Sold',''); });
  app.querySelectorAll('[data-crypto]').forEach(b=>b.onclick=()=>{
    const amt=Math.max(250,Math.round(game.state.life.cash*.15)); snapshotRoster();
    const r=game.runLifeHandler('buyCrypto',{coinId:b.dataset.crypto,amount:amt},'Crypto exchange'); showLifeResult(r,'Crypto exchange',''); });
  app.querySelectorAll('[data-crypto-sell]').forEach(b=>b.onclick=()=>{
    snapshotRoster(); const r=game.runLifeHandler('sellCrypto',{coinId:b.dataset.cryptoSell},'Crypto exchange'); showLifeResult(r,'Crypto exchange',''); });
  app.querySelectorAll('[data-open-person]').forEach(b=>b.onclick=()=>{sheet={kind:'person',personId:b.dataset.openPerson};render();});
  app.querySelectorAll('[data-open-coworker]').forEach(b=>b.onclick=()=>{sheet={kind:'coworker',workerId:b.dataset.openCoworker};render();});
  app.querySelectorAll('[data-money-open]').forEach(b=>{
    b.onclick=()=>{ sheet={kind:b.dataset.moneyOpen}; render(); };
  });
  app.querySelectorAll('[data-market-open]').forEach(b=>b.onclick=()=>{sheet={kind:b.dataset.marketOpen};render();});
  app.querySelectorAll('[data-rel]').forEach(b=>b.onclick=()=>{snapshotRoster(); const r=game.interactWithPerson(b.dataset.person,b.dataset.rel); track('relationship_action',{action:b.dataset.rel,age:game.state.age,year:game.state.year}); showLifeResult(r,'Relationship','human');});
  app.querySelectorAll('[data-befriend]').forEach(b=>b.onclick=()=>{snapshotRoster(); const r=game.befriendCoworker(b.dataset.befriend); showLifeResult(r,'Relationship','human');});
  app.querySelectorAll('[data-share-asset]').forEach(b=>b.onclick=()=>{sheet={kind:'asset-share',assetId:b.dataset.shareAsset};render();});
  app.querySelectorAll('[data-copy-flex]').forEach(b=>b.onclick=async()=>{
    const a=ASSETS.find(x=>x.id===b.dataset.copyFlex); const text=`${game.state.name} just bought a ${a?.name||'new asset'} in DEVLIFE. Age ${game.state.age} · Net worth ${fmtMoney(netWorth(game.state.life))}.`;
    try { await navigator.clipboard.writeText(text); toast('Caption copied'); } catch { toast('Could not copy'); }
  });
  app.querySelectorAll('[data-x-share]').forEach(b=>b.onclick=()=>{
    const a=ASSETS.find(x=>x.id===b.dataset.xShare); const text=`${game.state.name} just bought a ${a?.name||'new asset'} in DEVLIFE. Age ${game.state.age} · Net worth ${fmtMoney(netWorth(game.state.life))}.`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  });

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

initAnalytics();
const shared = readSharedFromLocation();
if(shared){ sharedData=shared; screen='shared'; }
else {
  const save=loadSave();
  if(save){
    const restored=restoreGame(Game,save);
    if(restored && !restored.state.dead){
      game=restored; feed=save.ui?.feed||[]; tab=save.ui?.tab||'life'; actCat=save.ui?.actCat||'career'; assetCat=save.ui?.assetCat||'property'; screen='play';
      snapshotRoster();
      if(game.current) sheet={kind:'event',ev:game.current};
    } else clearSave();
  }
}
render();
