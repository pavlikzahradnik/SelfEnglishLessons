/* ===== SelfEnglishLessons — logika appky =====
   Patří k index.html + style.css. Nahrávej všechny tři soubory společně. */
window.__APP_OK=true;

/* ===== Jazyky, dvojice a dynamické načítání =====
   DŮLEŽITÉ: obsah se vede po DVOJICÍCH zdroj–cíl, ne po jazycích.
   'cs-en' = "Čech se učí anglicky" (výklad gramatiky je česky).
   Přidání nové dvojice = nový soubor lang-XX-YY.js + jeden řádek v PAIRS. */
const ALL_LEVELS=['A1','A2','B1','B2','C1','C2'];
const LANG_INFO={
  cs:{label:'Čeština',native:'Čeština',tts:'cs-CZ'},
  en:{label:'Angličtina',native:'English',tts:'en-GB'},
  de:{label:'Němčina',native:'Deutsch',tts:'de-DE'}
};
const PAIRS={
  'cs-en':'lang-cs-en.js',
  'cs-de':'lang-cs-de.js'
};
function pairKey(src,tgt){return src+'-'+tgt;}
function curSrc(){return (S.settings&&S.settings.srcLang)||'cs';}
function curTgt(){return (S.settings&&S.settings.tgtLang)||'en';}
function curPair(){return pairKey(curSrc(),curTgt());}
function srcLangsAvailable(){const o={};Object.keys(PAIRS).forEach(p=>o[p.split('-')[0]]=1);return Object.keys(o);}
function tgtLangsFor(src){return Object.keys(PAIRS).filter(p=>p.split('-')[0]===src).map(p=>p.split('-')[1]);}

window.LANG_DATA=window.LANG_DATA||{};
const _langLoading={};
function loadLangPack(pair,cb){
  if(!PAIRS[pair]){cb&&cb(false);return;}
  if(window.LANG_DATA[pair]){cb&&cb(true);return;}
  if(_langLoading[pair]){_langLoading[pair].push(cb);return;}
  _langLoading[pair]=[cb];
  const s=document.createElement('script');
  s.src=PAIRS[pair];
  s.onload=function(){const q=_langLoading[pair]||[];delete _langLoading[pair];q.forEach(f=>f&&f(true));};
  s.onerror=function(){delete _langLoading[pair];toast(tr('Nepodařilo se načíst jazyk – zkontroluj připojení a zkus to znovu'));cb&&cb(false);};
  document.head.appendChild(s);
}
function langLevels(pair){return (window.LANG_DATA[pair]&&window.LANG_DATA[pair].levels)||{};}
function langMeta(pair){return (window.LANG_DATA[pair]&&window.LANG_DATA[pair].meta)||{};}
/* Vertikála = tematická sada (Cestování, IT…). Je to TŘETÍ osa vedle jazyka a úrovně:
   není v CEFR řetězci, nemá prerekvizitu a je celá otevřená — člověk si sáhne pro to,
   co zrovna potřebuje. Jinak používá úplně stejný engine jako úrovně. */
function langVerticals(pair){return (window.LANG_DATA[pair]&&window.LANG_DATA[pair].verticals)||{};}
function isVertical(id){return !!langVerticals(curPair())[id];}
/* Skutečná CEFR úroveň uživatele — vertikála sama úrovní není, tak sáhneme
   po poslední zvolené (nebo po výsledku rozřazovacího testu). */
function curCefr(){
  const l=S.settings.level;
  if(ALL_LEVELS.indexOf(l)>=0)return l;
  const c=(S.settings.cefrByPair||{})[curPair()];
  if(ALL_LEVELS.indexOf(c)>=0)return c;
  return (S.settings.maxUnlockedByPair||{})[curPair()]||'A1';
}
function unitData(id){return langLevels(curPair())[id]||langVerticals(curPair())[id]||null;}
function langExamples(){const p=curPair();return (window.LANG_DATA[p]&&window.LANG_DATA[p].examples)||{};}

/* ===== Překlad rozhraní =====
   Klíčem je český text, čeština je tedy výchozí a zároveň záloha —
   chybějící překlad nikdy nerozbije appku, jen zůstane česky.
   Nový jazyk rozhraní = nový soubor ui-XX.js + řádek v UI_FILES. */
const UI_FILES={en:'ui-en.js',de:'ui-de.js'};
/* Příběhy jsou volitelný extra soubor per dvojice. Když chybí, sekce se prostě
   neukáže — appka bez nich funguje normálně (žádný crash). */
const STORY_FILES={'cs-en':'stories-cs-en.js'};
const _storyLoading={};
function loadStories(pair,cb){
  if(!STORY_FILES[pair]){cb&&cb(false);return;}
  if(window.LANG_DATA[pair]&&window.LANG_DATA[pair].stories){cb&&cb(true);return;}
  if(_storyLoading[pair]){_storyLoading[pair].push(cb);return;}
  _storyLoading[pair]=[cb];
  const s=document.createElement('script');
  s.src=STORY_FILES[pair];
  s.onload=function(){const q=_storyLoading[pair]||[];delete _storyLoading[pair];q.forEach(f=>f&&f(true));};
  s.onerror=function(){delete _storyLoading[pair];cb&&cb(false);};   /* bez příběhů appka jede dál */
  document.head.appendChild(s);
}
function langStories(pair){return (window.LANG_DATA[pair]&&window.LANG_DATA[pair].stories)||[];}
window.UI_DATA=window.UI_DATA||{};
const _uiLoading={};
function tr(s){const m=window.UI_DATA[curSrc()];return (m&&m[s])||s;}
/* Přeloží statické prvky označené data-i18n / data-i18n-title.
   Klíč = původní český text, který v HTML zůstává jako záloha. */
function applyStaticUI(){
  $$('[data-i18n]').forEach(function(el){
    if(!el._i18nKey)el._i18nKey=el.textContent.trim();
    el.textContent=tr(el._i18nKey);
  });
  $$('[data-i18n-title]').forEach(function(el){
    el.title=tr(el.getAttribute('data-i18n-title'));
  });
  /* popisky směru se řídí zvolenou dvojicí, ne napevno EN/CZ */
  const T=curTgt().toUpperCase(), Sc=curSrc().toUpperCase();
  const a=$('#dirT2S');if(a)a.textContent=T+'→'+Sc;
  const b=$('#dirS2T');if(b)b.textContent=Sc+'→'+T;
  document.documentElement.lang=curSrc();
}
function loadUI(lang,cb){
  if(lang==='cs'||!UI_FILES[lang]){cb&&cb(true);return;}
  if(window.UI_DATA[lang]){cb&&cb(true);return;}
  if(_uiLoading[lang]){_uiLoading[lang].push(cb);return;}
  _uiLoading[lang]=[cb];
  const s=document.createElement('script');
  s.src=UI_FILES[lang];
  s.onload=function(){const q=_uiLoading[lang]||[];delete _uiLoading[lang];q.forEach(f=>f&&f(true));};
  s.onerror=function(){delete _uiLoading[lang];cb&&cb(true);};   /* bez překladu jede čeština */
  document.head.appendChild(s);
}

let CATS, ALL, BYID, GRAMMAR, GMAP, PATH, CI, FINAL, TMAP;

const BADGES=[
 {id:'first',icon:'🌱',name:'Začátek',desc:'Dokonči první lekci'},
 /* levely */
 {id:'lvl5',icon:'🥉',name:'Level 5',desc:'Dosáhni levelu 5'},
 {id:'lvl10',icon:'🥈',name:'Level 10',desc:'Dosáhni levelu 10'},
 {id:'lvl20',icon:'🥇',name:'Level 20',desc:'Dosáhni levelu 20'},
 {id:'lvl50',icon:'👑',name:'Level 50',desc:'Dosáhni levelu 50'},
 /* série dní */
 {id:'days7',icon:'🔥',name:'7 dní',desc:'7 dní v řadě'},
 {id:'days30',icon:'🔥',name:'30 dní',desc:'30 dní v řadě'},
 {id:'days100',icon:'💯',name:'100 dní',desc:'100 dní v řadě'},
 /* naučená slova */
 {id:'learn50',icon:'⭐',name:'50 slov',desc:'Nauč se 50 slov'},
 {id:'learn150',icon:'⭐',name:'150 slov',desc:'Nauč se 150 slov'},
 {id:'learn500',icon:'🌟',name:'500 slov',desc:'Nauč se 500 slov'},
 {id:'learn1000',icon:'✨',name:'1000 slov',desc:'Nauč se 1000 slov'},
 /* dokončené úrovně */
 {id:'doneA',icon:'🎓',name:'Základ hotový',desc:'Dokonči úrovně A1 i A2'},
 {id:'doneB',icon:'🎓',name:'Střední hotová',desc:'Dokonči úrovně B1 i B2'},
 /* body */
 {id:'xp5k',icon:'💎',name:'5000 bodů',desc:'Nasbírej 5000 bodů'},
 {id:'noProblem',icon:'🧹',name:'Bez problémů',desc:'Vyčisti všechna problémová slova'}
];

const STEPS=[2, 60, 1440, 10080, 43200];
const MIN=60000;

/* ===== Rozřazovací test (adaptivní) — funguje pro dvojici, která má všech 6 úrovní ===== */
const PLC_LEVELS=ALL_LEVELS;
function placementAvailable(){const lv=langLevels(curPair());return !!(window.LANG_DATA[curPair()]||{}).placement && ALL_LEVELS.every(l=>lv[l]);}
function plcPool(lvl){
  const u=(langLevels(curPair())[lvl]||{});
  const arr=[];
  /* a) gramatika (doplň správný tvar) — jádro testu, rozliší časy a vazby */
  (u.gram||[]).forEach(gg=>gg.items.forEach((it,i)=>arr.push({level:lvl,topic:gg.title,gitem:it,key:gg.id+'#'+i})));
  /* b) VĚTY: doplň chybějící slovo do věty. Testují porozumění celku (slovosled,
     kontext, vazby) — rozliší úroveň mnohem líp než izolované slovíčko.
     Distraktory bereme z jiných slov téže kategorie. */
  (u.cats||[]).forEach(function(c){
    const bank=(c.vocab||[]).map(v=>v[0]);
    (c.sentences||[]).forEach(function(s,i){
      const answer=s[1];
      const others=shuffle(bank.filter(x=>x!==answer)).slice(0,3);
      if(others.length<3)return;
      const opts=shuffle([answer].concat(others));
      arr.push({level:lvl,topic:c.title,sentence:true,
        gitem:[s[0],answer,opts,'? '+tr('Doplň slovo do věty')],key:c.id+'#s'+i});
    });
  });
  /* c) slovní zásoba jen jako lehký doplněk (každé 5. slovo), aby test nebyl
     jen o větách, ale těžiště je jinde. */
  const words=[];(u.cats||[]).forEach(c=>(c.vocab||[]).forEach(v=>words.push(v)));
  if(words.length>=4){
    (u.cats||[]).forEach(function(c){
      (c.vocab||[]).forEach(function(v,i){
        if(i%5!==0)return;                       /* jen každé 5. slovo (dřív každé 2.) */
        const others=shuffle(words.filter(w=>w[0]!==v[0])).slice(0,3).map(w=>w[1]);
        if(others.length<3)return;
        const opts=shuffle([v[1]].concat(others));
        arr.push({level:lvl,topic:c.title,vocab:true,
          gitem:[v[0],v[1],opts,'? '+tr('Vyber překlad')],key:c.id+'#w'+i});
      });
    });
  }
  return arr;
}
function buildLevel(lvl){
  const p=curPair();
  const d=unitData(lvl);
  if(!d){console.warn('Jazykový balíček není načten:',p,lvl);return;}
  CATS=d.cats; GRAMMAR=d.gram; PATH=d.path;
  ALL=[]; CATS.forEach(c=>c.vocab.forEach((v,i)=>ALL.push({id:c.id+':'+i,en:v[0],cz:v[1],cat:c.id,catTitle:c.title})));
  BYID={}; ALL.forEach(w=>BYID[w.id]=w);
  GMAP={}; GRAMMAR.forEach(g=>GMAP[g.id]=g);
  CI={}; CATS.forEach((c,i)=>CI[c.id]=i);
  FINAL={id:d.test,title:tr('Závěrečný test'),type:'test'};
  TMAP={}; CATS.forEach(c=>TMAP[c.id]={type:'vocab',title:c.title,obj:c}); GRAMMAR.forEach(g=>TMAP[g.id]={type:'grammar',title:g.title,obj:g}); TMAP[FINAL.id]={type:'test',title:FINAL.title,obj:FINAL};
}
const LOOKAHEAD=3;   // kolik témat dopředu je vidět za dokončenou frontou
const DONE_EX=3;     // kolik cvičení ≥DONE_PCT dokončí slovníkové téma
const DONE_PCT=75;

/* ---- profily (lokální, offline) ---- */
const AVA_COLORS=['#4f46e5','#0ea5e9','#0d9488','#7c3aed','#db2777','#ea580c','#16a34a','#d97706'];
function loadProfiles(){try{return JSON.parse(localStorage.getItem('anj_profiles'))||[];}catch(e){return[];}}
function saveProfiles(){try{localStorage.setItem('anj_profiles',JSON.stringify(PROFILES));}catch(e){}scheduleCloudSave();}
function stateKey(id){return 'anj_state_'+id;}
function newId(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
let PROFILES=loadProfiles();
let curProfileId=localStorage.getItem('anj_cur')||null;
let S={};
function load(){try{return JSON.parse(localStorage.getItem(stateKey(curProfileId)))||{};}catch(e){return{};}}
function persist(){if(!curProfileId)return;try{localStorage.setItem(stateKey(curProfileId),JSON.stringify(S));}catch(e){}scheduleCloudSave();}
function ensureStateDefaults(){
  const freshProfile=!S.settings;
  S.settings=S.settings||{dir:'en2cz',fill:'easy',theme:'dark',goal:15};
  if(!S.settings.level)S.settings.level='A1';
  if(typeof S.settings.aiOn!=='boolean')S.settings.aiOn=false;   /* AI je vypnutá, dokud si ji uživatel nezapne */
  S.srs=S.srs||{};S.exlog=S.exlog||{};
  /* XP, denní mise, statistiky a odznaky se vedou zvlášť pro každou dvojici.
     Úplně starý (jednojazyčný) postup se jednorázově přesune pod angličtinu. */
  if(!S._langs){
    S._langs={};
    S._langs.en={
      xp:S.xp||0,
      stats:S.stats||{c:0,w:0,byCat:{},timeMs:0,bestDays:0},
      daily:S.daily||{date:'',done:0,ids:[],met:false,streak:0},
      badges:S.badges||[]
    };
    delete S.xp;delete S.stats;delete S.daily;delete S.badges;
  }
  /* --- migrace: dřív byl jazyk 'en'/'de', teď dvojice 'cs-en'/'cs-de' --- */
  if(!S.settings.srcLang){
    if(!freshProfile || S.settings.lang)S.settings.srcLang='cs';           /* stávající uživatel = Čech */
    else if(srcLangsAvailable().length===1)S.settings.srcLang=srcLangsAvailable()[0];
  }
  if(S.settings.lang){S.settings.tgtLang=S.settings.tgtLang||S.settings.lang;delete S.settings.lang;}
  if(S.settings.srcLang&&!S.settings.tgtLang)S.settings.tgtLang=tgtLangsFor(S.settings.srcLang)[0];
  if(S.settings.levelByLang){
    S.settings.levelByPair=S.settings.levelByPair||{};
    Object.keys(S.settings.levelByLang).forEach(function(l){
      if(!S.settings.levelByPair['cs-'+l])S.settings.levelByPair['cs-'+l]=S.settings.levelByLang[l];
    });
    delete S.settings.levelByLang;
  }
  if(S.settings.maxUnlockedLevel){
    S.settings.maxUnlockedByPair=S.settings.maxUnlockedByPair||{};
    if(!S.settings.maxUnlockedByPair['cs-en'])S.settings.maxUnlockedByPair['cs-en']=S.settings.maxUnlockedLevel;
    delete S.settings.maxUnlockedLevel;
  }
  ['en','de'].forEach(function(l){
    if(S._langs[l]&&!S._langs['cs-'+l]){S._langs['cs-'+l]=S._langs[l];delete S._langs[l];}
  });
  function langBucket(){
    const p=curPair();
    if(!S._langs[p])S._langs[p]={xp:0,stats:{c:0,w:0,byCat:{},timeMs:0,bestDays:0},daily:{date:'',done:0,ids:[],met:false,streak:0},badges:[]};
    return S._langs[p];
  }
  /* enumerable:false — hodnoty žijí v S._langs, ať se neukládají (a nesynchronizují) dvakrát */
  Object.defineProperty(S,'xp',{get:()=>langBucket().xp,set:v=>{langBucket().xp=v;},configurable:true,enumerable:false});
  Object.defineProperty(S,'stats',{get:()=>langBucket().stats,set:v=>{langBucket().stats=v;},configurable:true,enumerable:false});
  Object.defineProperty(S,'daily',{get:()=>langBucket().daily,set:v=>{langBucket().daily=v;},configurable:true,enumerable:false});
  Object.defineProperty(S,'badges',{get:()=>langBucket().badges,set:v=>{langBucket().badges=v;},configurable:true,enumerable:false});
}

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function clearAuthFields(){['acPass','cpCur','cpNew'].forEach(function(id){const el=$('#'+id);if(el)el.value='';});}
function show(id){if(id!=='account')clearAuthFields();['home','catMenu','stats','activity','gate','account','srcPick','langGate','story'].forEach(x=>$('#'+x).classList.add('hidden'));$('#'+id).classList.remove('hidden');const tb=$('#topbar');if(tb)tb.style.display=(id==='gate'||id==='langGate'||(id==='srcPick'&&!S.settings.srcLang))?'none':'flex';window.scrollTo(0,0);}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function distractors(w,key,n){let pool=shuffle(ALL.filter(x=>x.cat===w.cat && x.id!==w.id && x[key]!==w[key]));if(pool.length<n){const extra=shuffle(ALL.filter(x=>x.id!==w.id && x[key]!==w[key] && x.cat!==w.cat));pool=pool.concat(extra);}return pool.slice(0,n);}
function isGrammar(id){return TMAP[id]&&TMAP[id].type==='grammar';}
function topicTitle(id){return TMAP[id]?TMAP[id].title:id;}
function topicExTypes(id){return isGrammar(id)?['gquiz','gfill','theory']:['flash','quiz','fill','listen','dict'];}
function exlogScores(catId){return topicExTypes(catId).map(t=>S.exlog[catId+':'+t]).filter(Boolean);}
function hasExlog(catId){return exlogScores(catId).length>0;}
function worstScore(catId){const s=exlogScores(catId);return s.length?Math.min.apply(null,s.map(e=>e.last)):null;}
function goodExCount(catId){return exlogScores(catId).filter(e=>e.last>=DONE_PCT).length;}
function isTopicDone(id){
  if(TMAP[id]&&TMAP[id].type==='test'){const e=S.exlog[id+':test'];return !!(e&&e.last>=DONE_PCT);}
  if(isGrammar(id))return grammarDone(id);       /* gramatika: teorie + kvíz + doplň, vše hotové */
  return goodExCount(id)>=DONE_EX;               /* slovníkové téma: 3 cvičení na 75 % */
}
/* Gramatika je hotová, jen když je přečtená teorie A kvíz i doplňovačka na práh. */
function grammarDone(id){
  const theory=!!S.exlog[id+':theory'];
  const quiz=(S.exlog[id+':gquiz']||{}).last>=DONE_PCT;
  const fill=(S.exlog[id+':gfill']||{}).last>=DONE_PCT;
  return theory && quiz && fill;
}
function completedCount(){let n=0;for(const id of PATH){if(isTopicDone(id))n++;else break;}return n;}
/* Úroveň je „hotová", když je splněný její závěrečný test. Funguje i pro úroveň,
   ve které zrovna nejsem (čte přímo z balíčku, ne z aktuálně načteného PATH). */
function levelDone(pair,lvl){
  const u=(langLevels(pair)||{})[lvl];
  if(!u||!u.test)return false;
  const e=S.exlog[u.test+':test'];
  return !!(e&&e.last>=DONE_PCT);
}
/* Nejvyšší dokončená úroveň dané dvojice (nebo null). */
function highestDoneLevel(pair){
  let out=null;
  ALL_LEVELS.forEach(function(l){ if(levelDone(pair,l))out=l; });
  return out;
}
/* Úroveň potvrzená rozřazovacím testem je celá otevřená — nemá smysl
   nutit člověka znovu procházet témata popořadě, když už úroveň prokázal. */
function levelFullyOpen(){
  if(isVertical(S.settings.level))return true;      /* vertikály se neodemykají postupně */
  const maxU=(S.settings.maxUnlockedByPair||{})[curPair()];
  if(!maxU)return false;
  return ALL_LEVELS.indexOf(S.settings.level)<=ALL_LEVELS.indexOf(maxU);
}
function isUnlocked(id){if(levelFullyOpen())return true;const i=PATH.indexOf(id);if(TMAP[id]&&TMAP[id].type==='test'){return i>0 && isTopicDone(PATH[i-1]);}return i < completedCount()+LOOKAHEAD;}
function unlockedWords(){return ALL.filter(w=>isUnlocked(w.cat));}
function nextToComplete(){const i=completedCount();return i<PATH.length?PATH[i]:null;}
/* ===== AI vysvětlení =====
   Volitelná vrstva. Když AI není nastavená (ai.js, mode:'off'), tlačítko se
   nezobrazí a appka se chová přesně jako dřív. */
let aiCtx=null;
/* ai.js se nahrává jako samostatný soubor, takže může být starší než index.html.
   Voláme ho proto vždy přes tuhle pojistku — chybějící funkce nesmí nic shodit. */
function aiCall(fn,dflt){
  try{ return (window.AI && typeof window.AI[fn]==='function') ? window.AI[fn]() : dflt; }
  catch(e){ return dflt; }
}
function aiAvailable(){return !!(S.settings.aiOn && aiCall('configured',false));}
function aiFmt(s){
  return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))
    .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<b>$1</b>');
}
function aiSystem(){
  const tgt=LANG_INFO[curTgt()].native, src=LANG_INFO[curSrc()].native, lvl=S.settings.level;
  return 'You are a patient '+tgt+' teacher helping a learner at CEFR level '+lvl+'.\n'+
    'ALWAYS reply in '+src+'. Never reply in any other language.\n'+
    'Keep it to 4 short sentences or fewer. Be concrete, warm and plain-spoken.\n'+
    'Explain WHY the correct answer is correct; if the learner answered, say why theirs does not work.\n'+
    'Match the explanation to level '+lvl+' — do not use terminology above that level.\n'+
    'Never invent grammar rules. If you are not certain, say so plainly rather than guessing.';
}
function aiUserMsg(extra){
  const c=aiCtx||{};
  let m='Language being learned: '+LANG_INFO[curTgt()].native+'\n';
  if(c.topic)m+='Topic: '+c.topic+'\n';
  if(c.theory)m+='Topic explanation shown in the app: '+String(c.theory).replace(/<[^>]*>/g,' ').slice(0,400)+'\n';
  if(c.q)m+='Exercise: "'+c.q+'"\n';
  if(c.answer)m+='Correct answer: "'+c.answer+'"\n';
  if(c.user)m+='The learner answered: "'+c.user+'"\n';
  return m+'\n'+(extra||'Explain why the correct answer is correct.');
}
function aiKey(extra){
  const c=aiCtx||{};
  return [curSrc(),curTgt(),S.settings.level,c.topic||'',c.q||'',c.answer||'',c.user||'',extra||''].join('|').slice(0,400);
}
function aiPanel(){
  const stage=$('#stage');
  if($('#aibox'))return;
  const d=document.createElement('div');
  d.innerHTML='<div class="aibox" id="aibox">'+
    '<div class="aihd">💡 '+tr('Vysvětlení')+'</div>'+
    '<div class="aitxt" id="aitxt"></div>'+
    '<div id="aiqa"></div>'+
    '<div class="aiask"><input id="aiq" placeholder="'+tr('Zeptej se na cokoli k tomuhle…')+'"><button id="aisend">'+tr('Zeptat se')+'</button></div>'+
    '</div>';
  stage.appendChild(d);
  $('#aisend').onclick=aiFollowUp;
  $('#aiq').addEventListener('keydown',e=>{if(e.key==='Enter')aiFollowUp();});
}
function aiRun(extra,target){
  const el=$(target);if(!el)return;
  el.innerHTML='<span class="aidots">'+tr('Přemýšlím')+'</span>';
  window.AI.ask(aiSystem(),aiUserMsg(extra),aiKey(extra))
    .then(t=>{el.innerHTML='<span class="aitxt">'+aiFmt(t)+'</span>';})
    .catch(e=>{el.innerHTML='<span class="aierr">'+tr('AI se teď nepodařilo zeptat')+': '+aiFmt(e.message||'')+'</span>';});
}
function aiExplain(){
  const b=$('#aiExplainBtn');if(b)b.remove();
  aiPanel();
  aiRun(null,'#aitxt');
}
function aiFollowUp(){
  const inp=$('#aiq');if(!inp)return;
  const q=(inp.value||'').trim();if(!q)return;
  inp.value='';
  const wrap=$('#aiqa');
  const id='aia'+Date.now();
  wrap.insertAdjacentHTML('beforeend','<div class="aiqa"><div class="aiq">'+aiFmt(q)+'</div><div class="aitxt" id="'+id+'"></div></div>');
  aiRun('The learner asks: "'+q+'". Answer that question.','#'+id);
}
function aiAddButton(ok){
  try{ if(!aiAvailable()||!aiCtx)return; }catch(e){ return; }
  const stage=$('#stage');
  const b=document.createElement('button');
  b.className='aibtn';b.id='aiExplainBtn';
  b.textContent=ok?('💬 '+tr('Zeptat se na to')):('💡 '+tr('Proč je to špatně?'));
  b.onclick=()=>{ if(ok){const x=$('#aiExplainBtn');if(x)x.remove();aiPanel();} else aiExplain(); };
  stage.appendChild(b);
}
function showContinue(done,ok,needRelease,ctx){
  aiCtx=ctx||null;
  const stage=$('#stage');
  aiAddButton(ok);
  const bar=document.createElement('div');bar.style.marginTop='14px';
  bar.innerHTML='<button class="btn big" id="nextBtn">'+tr('Další')+' →</button>';stage.appendChild(bar);
  let armed=!needRelease, fired=false;
  function go(){if(fired)return;fired=true;document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onUp);const b=$('#nextBtn');if(b)b.disabled=true;done(ok);}
  const onUp=(e)=>{if(e.key==='Enter')armed=true;};
  const onKey=(e)=>{if(e.key==='Enter'&&armed){e.preventDefault();go();}};
  $('#nextBtn').onclick=go;
  document.addEventListener('keyup',onUp);
  document.addEventListener('keydown',onKey);
}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400);}
function norm(s){return s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z]/g,'');}
function dateStr(d){return new Date(d).toISOString().slice(0,10);}
function relTime(ts){const s=(Date.now()-ts)/1000;if(s<60)return tr('právě teď');const m=Math.floor(s/60);if(m<60)return tr('před')+' '+m+' '+tr('min');const h=Math.floor(m/60);if(h<24)return tr('před')+' '+h+' h';const d=Math.floor(h/24);return d===1?tr('včera'):tr('před')+' '+d+' '+tr('dny');}

let VOICES={};
function pickVoice(){
  const vs=speechSynthesis.getVoices();
  if(!vs||!vs.length)return;                  /* Edge/Chrome plní hlasy asynchronně */
  Object.keys(LANG_INFO).forEach(function(l){
    const tag=LANG_INFO[l].tts, base=l;
    /* Edge má rozbité online „Natural" hlasy (vracejí undefined a nepřehrají).
       Proto preferujeme LOKÁLNÍ hlasy (localService=true) daného jazyka a teprve
       pak cokoli dalšího. Pořadí: lokální přesná shoda → lokální jazyk →
       jakákoli přesná shoda → jakýkoli jazyk. */
    const local=vs.filter(v=>v.localService!==false);
    VOICES[l]=
      local.find(v=>new RegExp(tag.replace('-','[-_]'),'i').test(v.lang))||
      local.find(v=>new RegExp('^'+base+'[-_]','i').test(v.lang))||
      local.find(v=>new RegExp('^'+base,'i').test(v.lang))||
      vs.find(v=>new RegExp(tag.replace('-','[-_]'),'i').test(v.lang))||
      vs.find(v=>new RegExp('^'+base+'[-_]','i').test(v.lang))||
      vs.find(v=>new RegExp('^'+base,'i').test(v.lang))||null;
  });
  /* uživatelská volba hlasu má přednost před automatickým výběrem */
  const saved=S&&S.settings&&S.settings.voiceByTgt;
  if(saved)Object.keys(saved).forEach(function(l){
    const v=vs.find(x=>x.voiceURI===saved[l]);
    if(v)VOICES[l]=v;
  });
}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
function voiceList(){
  if(!('speechSynthesis' in window))return [];
  const prefix=(LANG_INFO[curTgt()]||LANG_INFO.en).tts.split('-')[0];
  return speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith(prefix));
}
function speak(txt,cb){
  if(!('speechSynthesis' in window)){cb&&cb();return;}
  try{speechSynthesis.cancel();}catch(e){}
  const lang=curTgt();                       /* mluví se vždy v cílovém jazyce */
  if(!VOICES[lang])pickVoice();
  const doSpeak=function(){
    const u=new SpeechSynthesisUtterance(txt);
    const v=VOICES[lang];
    /* Když máme konkrétní hlas, nastav lang podle NĚJ (ne natvrdo en-GB),
       aby to fungovalo i s en-US apod. Bez hlasu použij obecný tag jazyka. */
    if(v){u.voice=v;u.lang=v.lang;}
    else{u.lang=(LANG_INFO[lang]||LANG_INFO.en).tts;}
    u.rate=.9;
    if(cb)u.onend=cb;
    try{
      speechSynthesis.speak(u);
      /* Edge/Chrome bug: syntéza občas zůstane „paused" a nic se nepřehraje.
         Krátce po startu ji probudíme resume(). Neškodí, když běží normálně. */
      setTimeout(function(){try{if(speechSynthesis.paused)speechSynthesis.resume();}catch(e){}},120);
    }catch(e){cb&&cb();}
  };
  if(!VOICES[lang] && (!speechSynthesis.getVoices()||!speechSynthesis.getVoices().length)){
    /* hlasy ještě nedorazily — zkus po krátké prodlevě znovu */
    setTimeout(function(){pickVoice();doSpeak();},250);
  }else{
    doSpeak();
  }
}

function srsOf(id){return S.srs[id];}
function isDue(id){const e=S.srs[id];if(!e)return true;return (e.due||0)<=Date.now();}
function isNew(id){return !S.srs[id];}
function grade(id,good){
  let e=S.srs[id]||{step:-1,reps:0,lapses:0,c:0,w:0,p:false};
  if(good){e.step=e.step<1?1:Math.min(e.step+1,STEPS.length-1);e.reps++;e.c++;e.p=false;}
  else{e.step=0;e.lapses++;e.w++;e.p=true;}
  e.due=Date.now()+STEPS[e.step]*MIN;
  S.srs[id]=e;
  const cat=BYID[id]?BYID[id].cat:null;
  if(good)S.stats.c++;else S.stats.w++;
  if(cat){S.stats.byCat[cat]=S.stats.byCat[cat]||{c:0,w:0};if(good)S.stats.byCat[cat].c++;else S.stats.byCat[cat].w++;}
  ensureDaily();
  if(!S.daily.ids.includes(id)){S.daily.ids.push(id);S.daily.done=S.daily.ids.length;checkDailyMet();}
  persist();
}
function learnedCount(){return ALL.filter(w=>(S.srs[w.id]&&S.srs[w.id].step>=2)).length;}
/* Slova CELÉ dvojice (všechny úrovně i vertikály) — „opakování je matka moudrosti":
   SRS opakuje vše, co ses kdy naučil, i když jsi mezitím postoupil na vyšší úroveň.
   Bere se jen to, co má záznam v SRS (co jsi opravdu viděl) — nová slova z jiných
   úrovní se sem nepletou, ta se učíš až tam. */
function pairWords(){
  const p=curPair(), out=[];
  function addUnit(u){
    if(!u||!u.cats)return;
    u.cats.forEach(function(c){
      (c.vocab||[]).forEach(function(v,i){
        out.push({id:c.id+':'+i,en:v[0],cz:v[1],cat:c.id,catTitle:c.title});
      });
    });
  }
  const lv=langLevels(p);Object.keys(lv).forEach(k=>addUnit(lv[k]));
  const vs=langVerticals(p);Object.keys(vs).forEach(k=>addUnit(vs[k]));
  return out;
}
function dueWords(){return pairWords().filter(w=>!isNew(w.id)&&isDue(w.id));}
function newWords(){return ALL.filter(w=>isUnlocked(w.cat)&&isNew(w.id));}
function problemWords(){return pairWords().filter(w=>S.srs[w.id]&&S.srs[w.id].p);}

const XP_PER_LEVEL=200;
function level(){return Math.floor(S.xp/XP_PER_LEVEL)+1;}
function levelProgress(){return (S.xp%XP_PER_LEVEL)/XP_PER_LEVEL;}
function toNext(){return XP_PER_LEVEL-(S.xp%XP_PER_LEVEL);}
function addXP(n){
  const before=level();
  S.xp+=n;persist();updateHeader();
  if(level()>before){toast('Level '+level()+'! 🎉');checkMilestones();}
}

function ensureDaily(){
  const today=dateStr(Date.now());
  if(S.daily.date!==today){
    const prev=S.daily.date;
    const yesterday=dateStr(Date.now()-86400000);
    if(!(prev===yesterday && S.daily.met)) S.daily.streak=0;
    S.daily.date=today;S.daily.done=0;S.daily.ids=[];S.daily.met=false;
    persist();
  }
}
function checkDailyMet(){
  if(!S.daily.met && S.daily.done>=S.settings.goal){
    S.daily.met=true;S.daily.streak++;
    if(S.daily.streak>S.stats.bestDays)S.stats.bestDays=S.daily.streak;
    persist();toast(tr('Denní cíl splněn! Série')+' '+S.daily.streak+' '+tr('dní')+' 🔥');
    if(S.daily.streak>=7)award('days7');checkMilestones();
    updateHeader();renderMission();
  }
}

function award(id){if(S.badges.includes(id))return;S.badges.push(id);persist();renderAch();updateHeader();const b=BADGES.find(x=>x.id===id);if(b)toast(tr('Úspěch')+': '+tr(b.name));}
function checkMilestones(){
  const lc=learnedCount();
  if(lc>=50)award('learn50');
  if(lc>=150)award('learn150');
  if(lc>=500)award('learn500');
  if(lc>=1000)award('learn1000');
  if(problemWords().length===0 && S.stats.w>0)award('noProblem');
  const lv=level();
  if(lv>=5)award('lvl5');if(lv>=10)award('lvl10');if(lv>=20)award('lvl20');if(lv>=50)award('lvl50');
  if(S.xp>=5000)award('xp5k');
  const st=(S.daily&&S.daily.streak)||0;
  if(st>=7)award('days7');if(st>=30)award('days30');if(st>=100)award('days100');
  const pair=curPair();
  if(levelDone(pair,'A1')&&levelDone(pair,'A2'))award('doneA');
  if(levelDone(pair,'B1')&&levelDone(pair,'B2'))award('doneB');
}

function updateHeader(){$('#hLevel').textContent=level();$('#hXp').textContent=S.xp;$('#hDays').textContent=S.daily.streak;}
function renderMission(){
  ensureDaily();
  const goal=S.settings.goal,done=Math.min(S.daily.done,goal);
  $('#ringDone').textContent=S.daily.done;$('#ringGoal').textContent=goal;
  $('#ring').style.setProperty('--p', Math.round(done/goal*100));
  $('#mLevel').textContent=level();$('#mXp').textContent=S.xp;
  $('#mLevelBar').style.width=Math.round(levelProgress()*100)+'%';
  $('#mToNext').textContent=toNext();
  $('#mDays').textContent=S.daily.streak;
}
function catDueCount(c){return c.vocab.map((v,i)=>c.id+':'+i).filter(id=>!isNew(id)&&isDue(id)).length;}
function catLearned(c){return c.vocab.map((v,i)=>c.id+':'+i).filter(id=>S.srs[id]&&S.srs[id].step>=2).length;}
function catSeen(c){return c.vocab.map((v,i)=>c.id+':'+i).filter(id=>S.srs[id]).length;}
function topicArt(t,id){
  /* Pozice ve vlastním 4×4 archu ikon (sloupec řádek). Gramatika záměrně sdílí jeden obrázek (puzzle).
     Legenda archu:
       [0 0] ruka+bublina  [1 0] kostky   [2 0] paleta      [3 0] puzzle
       [0 1] rodina        [1 1] jídlo    [2 1] zvířata     [3 1] batoh
       [0 2] postava/tělo  [1 2] nábytek  [2 2] rostlina    [3 2] oblečení
       [0 3] hodiny        [1 3] kolo     [2 3] město       [3 3] auto     */
  const pos={
    /* A1 */
    greet:'0 0',numbers:'1 0',colors:'2 0',family:'0 1',food:'1 1',animals:'2 1',
    body:'0 2',house:'1 2',clothes:'3 2',time:'0 3',transport:'1 3',town:'2 3',
    weather:'2 0',verbs:'0 2',adj:'2 0',
    /* A2 */
    a2_jobs:'3 1',a2_health:'0 2',a2_travel:'3 1',a2_shopping:'3 1',a2_restaurant:'1 1',
    a2_hobbies:'2 0',a2_tech:'2 3',a2_feelings:'0 0',a2_people:'0 1',a2_education:'1 0',
    a2_nature:'2 2',a2_directions:'2 3',a2_house:'1 2',a2_money:'3 1',
    /* vertikály */
    tv_airport:'3 1',tv_hotel:'1 2',tv_transport:'1 3',tv_restaurant:'1 1',tv_directions:'2 3',
    tv_money:'3 1',tv_problems:'0 0',tv_booking:'0 3',
    it_hw:'1 0',it_dev:'3 0',it_net:'2 3',it_data:'1 0',it_sec:'3 2',it_agile:'0 3',it_support:'0 0',it_cloud:'2 0',
    in_prod:'1 0',in_tools:'1 2',in_mat:'1 0',in_safety:'0 2',in_quality:'2 0',in_maint:'1 2',in_log:'3 1',in_meas:'0 3',
    bs_meet:'0 1',bs_mail:'0 0',bs_pres:'2 0',bs_nego:'0 1',bs_fin:'3 1',bs_sales:'2 3',bs_hr:'0 1',bs_phone:'0 0'
  };
  const key=String(id||'').replace(/^de_/,'');   /* německé balíčky mají prefix de_, mapa ikon je společná */
  const p=t.type==='grammar'?'3 0':(pos[key]||'2 0'),a=p.split(' '),shift=['0%','33.333%','66.667%','100%'];
  return '<span class="topic-art" style="--px:'+shift[a[0]]+';--py:'+shift[a[1]]+'" aria-hidden="true"></span>';
}
function renderCats(){
  $('#totalWords').textContent=ALL.length;
  $('#learnedWords').textContent=learnedCount();
  $('#catGrid').innerHTML=PATH.map((id,pi)=>{
    const t=TMAP[id];
    if(!isUnlocked(id)){
      const gate=(TMAP[id].type==='test')?PATH[pi-1]:PATH[pi-LOOKAHEAD];const gateDone=gate?isTopicDone(gate):false;
      return '<div class="cat locked'+(isGrammar(id)?' gram':'')+'"><span class="lock">🔒</span>'+
        '<div class="t">'+topicArt(t,id)+t.title+'</div>'+
        '<div class="m">'+(isGrammar(id)?tr('Gramatika')+' · '+tr('zamčeno'):tr('Zamčeno'))+'</div>'+
        '<div class="req">'+(gate?tr('dokonči')+' „'+topicTitle(gate)+'"'+(gateDone?' ✓':''):tr('pokračuj v cestě'))+'</div></div>';
    }
    if(TMAP[id].type==='test'){
      const e=S.exlog[id+':test'],done=isTopicDone(id);
      return '<button class="cat test" onclick="openTopic(\''+id+'\')">'+(done?'<span class="due done">hotovo ✓</span>':'')+
        '<div class="t">'+topicArt(t,id)+t.title+'</div>'+
        '<div class="m">'+(e?tr('nejlepší výsledek')+': '+e.last+' %':tr('prověř všechna témata'))+'</div>'+
        '<div class="bar"><div style="width:'+(e?e.last:0)+'%"></div></div></button>';
    }
    const seen=hasExlog(id), weak=seen && worstScore(id)!==null && worstScore(id)<DONE_PCT, done=isTopicDone(id);
    const badge=weak?'<span class="due">'+tr('k opakování')+'</span>':(done?'<span class="due done">'+tr('hotovo')+' ✓</span>':'');
    if(isGrammar(id)){
      const g=t.obj,prog=Math.min(100,Math.round(goodExCount(id)/DONE_EX*100));
      return '<button class="cat gram" onclick="openTopic(\''+id+'\')">'+badge+
        '<div class="t">'+topicArt(t,id)+t.title+'</div>'+
        '<div class="m">'+tr('Gramatika')+' · '+g.items.length+' '+tr('cvičení')+(done?' · '+tr('hotovo'):'')+'</div>'+
        '<div class="bar"><div style="width:'+prog+'%"></div></div></button>';
    }
    const c=t.obj,learned=catLearned(c),inprog=catSeen(c)-learned,pct=Math.round(learned/c.vocab.length*100);
    return '<button class="cat" onclick="openTopic(\''+id+'\')">'+badge+
      '<div class="t">'+topicArt(t,id)+t.title+'</div>'+
      '<div class="m">'+tr('naučeno')+' '+learned+' / '+c.vocab.length+((seen&&inprog>0)?' · '+inprog+' '+tr('rozpracováno'):'')+'</div>'+
      '<div class="bar"><div style="width:'+pct+'%"></div></div></button>';
  }).join('');
}
function renderAch(){$('#ach').innerHTML=BADGES.map(b=>{const on=S.badges.includes(b.id);return '<div class="badge '+(on?'':'locked')+'" title="'+tr(b.desc)+'">'+b.icon+' '+tr(b.name)+'</div>';}).join('');}
function renderActions(){
  const d=dueWords().length,p=problemWords().length;
  $('#dueCount').textContent=d; $('#probCount').textContent=p;
  $('#actReview').classList.toggle('disabled', d===0);
  $('#actProblem').classList.toggle('disabled', p===0);
}
let levelChosen=false;
const A2_UNLOCK_PCT=90;
/* Prerekvizita se odvodí z balíčku: k odemčení úrovně je potřeba
   závěrečný test nejbližší nižší dostupné úrovně na >=90 %. */
function lvlPrereq(lvl){
  if(isVertical(lvl))return null;                   /* vertikály jsou vždy přístupné */
  const i=ALL_LEVELS.indexOf(lvl);if(i<=0)return null;
  const lv=langLevels(curPair());
  for(let j=i-1;j>=0;j--){const prev=lv[ALL_LEVELS[j]];if(prev)return prev.test;}
  return null;
}
function levelUnlocked(lvl){
  if(isVertical(lvl))return true;
  const maxU=(S.settings.maxUnlockedByPair||{})[curPair()];
  if(maxU && ALL_LEVELS.indexOf(lvl)<=ALL_LEVELS.indexOf(maxU))return true;
  const pr=lvlPrereq(lvl);if(!pr)return true;
  const e=S.exlog[pr+':test'];return !!(e&&e.last>=A2_UNLOCK_PCT);
}
function flagChip(lang){return '<span class="flagchip '+lang+'"><span>'+lang.toUpperCase()+'</span></span>';}
function cefrRank(l){const i=ALL_LEVELS.indexOf(l);return i<0?-1:i;}
/* „Tvoje aktuální úroveň" v liště: vyšší z (nejvyšší dokončená úroveň) a
   (úroveň z rozřazovacího testu). To je reálná úroveň studenta, ne to,
   co má zrovna otevřené na obrazovce. */
function myLevel(){
  const pair=curPair();
  const done=highestDoneLevel(pair);
  const test=(S.settings.cefrByPair||{})[pair];
  let best=null;
  [done,test].forEach(function(l){ if(cefrRank(l)>cefrRank(best))best=l; });
  return best;
}
function updateBrand(){
  const u=S.settings.level, v=langVerticals(curPair())[u];
  const ml=myLevel();
  const badge=v?(v.icon+' '+v.title):(ml||u);
  const bl=$('#brandLvl');if(bl)bl.textContent=badge;
  const ct=$('#curLvlTag');if(ct)ct.textContent=badge;
  const bb=$('#backLvlBtn');if(bb)bb.textContent=v?tr('← Zpět na výběr'):tr('← Změnit úroveň');
  const bn=$('#brandLang');if(bn)bn.textContent=tr(LANG_INFO[curTgt()].label);
  /* velká vlajka v záhlaví + podtitulek se přepínají podle cíleného jazyka */
  const hd=document.querySelector('header.top');if(hd)hd.classList.toggle('de',curTgt()==='de');
  const SUBS={en:'Učím se anglicky každý den',de:'Učím se německy každý den'};
  const bs=document.querySelector('.brand-sub');if(bs&&SUBS[curTgt()])bs.textContent=tr(SUBS[curTgt()]);
  document.title=tr(LANG_INFO[curTgt()].label)+' '+badge+' — '+tr('adaptivní učení');
  const lb=$('#langBtn');if(lb){
    lb.innerHTML=flagChip(curTgt());
    lb.style.display=(tgtLangsFor(curSrc()).length>1)?'':'none';
  }
  const sb=$('#srcBtn');if(sb){
    sb.innerHTML=flagChip(curSrc());
    sb.title=tr('Změnit jazyk rozhraní');
    sb.style.display=(srcLangsAvailable().length>1)?'':'none';
  }
}
function renderLevelPick(){
  const pair=curPair(), lv=langLevels(pair), meta=langMeta(pair);
  const box=$('#lvlpickBox');if(!box)return;
  box.innerHTML=ALL_LEVELS.map(function(lvl){
    if(!lv[lvl]){
      return '<button class="lvlcard locked" disabled style="opacity:.55;cursor:default">'+
        '<div class="lc-badge">'+lvl+'</div><div class="lc-t">'+tr('Připravujeme')+'</div>'+
        '<div class="lc-d">'+tr('Tato úroveň zatím není k dispozici.')+'</div>'+
        '<div class="lc-go">🚧 '+tr('Brzy')+'</div></button>';
    }
    const m=meta[lvl]||{t:lvl,d:''};
    const ok=levelUnlocked(lvl);
    const done=levelDone(pair,lvl);
    const pr=lvlPrereq(lvl);const e=pr?S.exlog[pr+':test']:null;
    const goTxt=done?('<span style="color:var(--ok)">✓ '+tr('Hotovo')+'</span> · '+tr('Procvičovat')+' →')
      :ok?(tr('Začít')+' '+lvl+' →')
      :('🔒 '+tr('Odemkni testem na')+' '+A2_UNLOCK_PCT+' %'+(e?' <span style="color:var(--muted)">('+tr('teď')+' '+e.last+' %)</span>':''));
    const check=done?'<span class="lc-check" title="'+tr('Úroveň dokončena')+'">✓</span>':'';
    return '<button class="lvlcard'+(ok?'':' locked')+(done?' done':'')+'" onclick="chooseLevel(\''+lvl+'\')">'+check+
      '<div class="lc-badge">'+lvl+'</div><div class="lc-t">'+m.t+'</div><div class="lc-d">'+m.d+'</div>'+
      '<div class="lc-go">'+goTxt+'</div></button>';
  }).join('');
  const plcBtn=$('#placementBtn');if(plcBtn)plcBtn.style.display=placementAvailable()?'':'none';
  renderVerticals();
  renderStories();
}
function renderStories(){
  const wrap=$('#storyWrap'), box=$('#storyBox');
  if(!wrap||!box)return;
  const pair=curPair();
  /* Líné načtení: když soubor s příběhy ještě není, natáhni ho a překresli.
     Když chybí (nenahraný / jiná dvojice), sekce zůstane skrytá — appka jede dál. */
  if(STORY_FILES[pair] && !(window.LANG_DATA[pair]&&window.LANG_DATA[pair].stories)){
    wrap.classList.add('hidden');
    loadStories(pair,function(ok){ if(ok)renderStories(); });
    return;
  }
  const list=langStories(pair);
  wrap.classList.toggle('hidden', list.length===0);
  if(!list.length)return;
  box.innerHTML=list.map(function(s){
    const rd=(S.storyRead&&S.storyRead[s.id]);            // dřív přečtený?
    const best=(S.storyScore&&S.storyScore[s.id]);        // nejlepší výsledek kvízu
    const badge='<span class="lvl" style="background:var(--surface2);color:var(--muted);margin-left:6px">'+s.level+'</span>';
    const stat=best!=null?('<div class="lc-go" style="color:var(--ok)">'+best+' % ✓</div>')
              :(rd?'<div class="lc-go" style="color:var(--muted)">'+tr('Přečteno')+'</div>':'<div class="lc-go">'+tr('Číst')+' →</div>');
    return '<button class="lvlcard" onclick="openStory(\''+s.id+'\')">'+
      '<div class="lc-badge" style="font-size:1.5rem">'+(s.art||'📖')+'</div>'+
      '<div class="lc-t">'+storyTitle(s)+badge+'</div>'+
      '<div class="lc-d">'+s.sents.length+' '+tr('vět')+' · '+s.q.length+' '+tr('otázek')+'</div>'+
      stat+'</button>';
  }).join('');
}
/* Nadpis příběhu: v datech je „Ráno / Morning" — vezmi českou část pro rozhraní. */
function storyTitle(s){return String(s.title).split('/')[0].trim();}
function renderVerticals(){
  const vs=langVerticals(curPair()), ids=Object.keys(vs);
  const wrap=$('#vertWrap'), box=$('#vertBox');
  if(!wrap||!box)return;
  wrap.classList.toggle('hidden', ids.length===0);
  if(!ids.length)return;
  box.innerHTML=ids.map(function(id){
    const v=vs[id];
    const words=v.cats.reduce((s,c)=>s+c.vocab.length,0);
    const done=v.path.filter(x=>isTopicDone(x)).length;
    const prog=done?('<div class="lc-go" style="color:var(--ok)">'+done+'/'+v.path.length+' ✓</div>')
                   :('<div class="lc-go">'+tr('Začít')+' →</div>');
    /* Doporučená úroveň je jen vodítko — vertikála se nikdy nezamyká. */
    const rec=v.level?('<span class="lvl" style="background:var(--surface2);color:var(--muted);margin-left:6px">'+tr('od')+' '+v.level+'</span>'):'';
    const hard=v.level && ALL_LEVELS.indexOf(v.level)>ALL_LEVELS.indexOf(curCefr());
    const note=hard?('<div class="lc-d" style="color:var(--warn);margin-top:4px">⚠ '+tr('Bude náročnější než tvoje úroveň')+'</div>'):'';
    return '<button class="lvlcard" onclick="chooseLevel(\''+id+'\')">'+
      '<div class="lc-badge" style="font-size:1.5rem">'+v.icon+'</div>'+
      '<div class="lc-t">'+v.title+rec+'</div>'+
      '<div class="lc-d">'+v.desc+'</div>'+
      '<div class="lc-d" style="color:var(--muted);margin-top:4px">'+words+' '+tr('slov')+' · '+v.cats.length+' '+tr('témat')+'</div>'+
      note+prog+'</button>';
  }).join('');
}
function chooseLevel(lvl){
  if(!isVertical(lvl) && !levelUnlocked(lvl)){toast(tr('Úroveň')+' '+lvl+' '+tr('se odemkne po zvládnutí předchozího závěrečného testu na')+' '+A2_UNLOCK_PCT+' % 🔒');return;}
  S.settings.level=lvl;
  S.settings.levelByPair=S.settings.levelByPair||{};S.settings.levelByPair[curPair()]=lvl;
  /* CEFR úroveň si pamatujeme zvlášť — vertikála ji nesmí přepsat */
  if(ALL_LEVELS.indexOf(lvl)>=0){S.settings.cefrByPair=S.settings.cefrByPair||{};S.settings.cefrByPair[curPair()]=lvl;}
  persist();buildLevel(lvl);levelChosen=true;refreshHome();
}
function backToLevels(){levelChosen=false;refreshHome();}
/* --- přepnutí cílového jazyka (co se učím) --- */
function switchTarget(tgt){
  const p=pairKey(curSrc(),tgt);
  if(!PAIRS[p])return;
  loadLangPack(p,function(ok){
    if(!ok)return;
    S.settings.tgtLang=tgt;
    const remembered=(S.settings.levelByPair||{})[p];
    if(remembered && unitData(remembered)){
      S.settings.level=remembered;buildLevel(remembered);
    }else{
      const first=ALL_LEVELS.find(l=>langLevels(p)[l]);
      S.settings.level=first;buildLevel(first);
    }
    levelChosen=false;   /* po přepnutí jazyka vždy ukázat výběr úrovní a témat */
    persist();refreshHome();show('home');
    toast(tr('Přepnuto na')+': '+tr(LANG_INFO[tgt].label));
  });
}
function toggleLanguage(){
  const tgts=tgtLangsFor(curSrc());
  if(tgts.length<2)return;
  switchTarget(tgts[(tgts.indexOf(curTgt())+1)%tgts.length]);
}
/* --- přepnutí zdrojového jazyka (kterým mluvím = jazyk rozhraní) --- */
function switchSource(src){
  if(srcLangsAvailable().indexOf(src)<0)return;
  loadUI(src,function(){
    S.settings.srcLang=src;
    const tgts=tgtLangsFor(src);
    const tgt=(tgts.indexOf(curTgt())>=0)?curTgt():tgts[0];
    const p=pairKey(src,tgt);
    loadLangPack(p,function(ok){
      if(!ok)return;
      S.settings.tgtLang=tgt;
      const remembered=(S.settings.levelByPair||{})[p];
      const lvl=(remembered&&langLevels(p)[remembered])?remembered:ALL_LEVELS.find(l=>langLevels(p)[l]);
      S.settings.level=lvl;buildLevel(lvl);levelChosen=!!(remembered&&langLevels(p)[remembered]);
      persist();applyStaticUI();refreshHome();show('home');
    });
  });
}
function openSrcPick(){
  const box=$('#srcPickBox');if(!box)return;
  const bb=$('#srcBack');if(bb)bb.classList.toggle('hidden',!S.settings.srcLang);
  const tb=$('#topbar');if(tb)tb.style.display=S.settings.srcLang?'flex':'none';
  box.innerHTML=srcLangsAvailable().map(function(l){
    const on=(l===curSrc());
    return '<button class="lvlcard'+(on?'':'')+'" onclick="switchSource(\''+l+'\')">'+
      '<div class="lc-badge">'+flagChip(l)+'</div>'+
      '<div class="lc-t">'+LANG_INFO[l].native+'</div>'+
      '<div class="lc-d">'+tgtLangsFor(l).map(x=>flagChip(x)+' '+LANG_INFO[x].native).join('&nbsp; ')+'</div>'+
      '<div class="lc-go">'+(on?'✓ '+tr('zvoleno'):tr('Zvolit')+' →')+'</div></button>';
  }).join('');
  show('srcPick');
}
function refreshHome(){
  updateHeader();renderMission();renderActions();updateBrand();
  const lp=$('#levelPick'),tv=$('#topicsView');
  if(levelChosen){lp.classList.add('hidden');tv.classList.remove('hidden');renderCats();renderAch();}
  else{tv.classList.add('hidden');lp.classList.remove('hidden');renderLevelPick();}
}
let langGateShown=false;   /* úvodní volba jazyka se ukáže jednou za otevření appky */
function goHome(){
  if(window.speechSynthesis)speechSynthesis.cancel();stopRec();
  if(!langGateShown){openLangGate();return;}
  refreshHome();show('home');
}
function openLangGate(){
  const tg=tgtLangsFor(curSrc());
  if(tg.length<2){langGateShown=true;refreshHome();show('home');return;}   /* jediný jazyk = není co vybírat */
  const grid=$('#langGrid');
  if(grid)grid.innerHTML=tg.map(function(l){
    const p=pairKey(curSrc(),l);
    const b=(S._langs&&S._langs[p])||{};
    const lvl=(S.settings.levelByPair||{})[p];
    const vd=(window.LANG_DATA[p]&&window.LANG_DATA[p].verticals)||{};
    const lvlTxt=lvl?((vd[lvl]&&(vd[lvl].icon+' '+vd[lvl].title))||lvl):null;
    const st=lvlTxt?(tr('Pokračovat')+' · '+lvlTxt):tr('Začít od výběru úrovně');
    const xp=b.xp?('<br>'+b.xp+' XP'):'';
    return '<button class="langcard" onclick="pickTodayLang(\''+l+'\')">'+
      '<span class="flagchip big '+l+'"><span>'+l.toUpperCase()+'</span></span>'+
      '<span class="lg-t">'+tr(LANG_INFO[l].label)+'</span>'+
      '<span class="lg-s">'+st+xp+'</span></button>';
  }).join('');
  const sl=$('#srcLine');
  if(sl){
    let h=tr('Tvůj hlavní jazyk')+': '+flagChip(curSrc())+' <b>'+tr(LANG_INFO[curSrc()].native)+'</b>';
    if(srcLangsAvailable().length>1)h+=' &nbsp;·&nbsp; <a href="#" onclick="openSrcPick();return false">'+tr('Změnit')+'</a>';
    sl.innerHTML=h;
  }
  show('langGate');
}
function backToLangGate(){
  /* Návrat na úvodní „Jaký jazyk se dnes chceš učit?" — bezpečně ukončí i běžící cvičení. */
  if(window.speechSynthesis)speechSynthesis.cancel();stopRec();sess=null;plc=null;
  langGateShown=false;
  openLangGate();
}
function pickTodayLang(l){
  langGateShown=true;
  if(l===curTgt()){levelChosen=false;refreshHome();show('home');return;}
  switchTarget(l);
}

function initSeg(segId,key,after){
  const seg=$('#'+segId);
  function paint(){seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==String(S.settings[key])));}
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{S.settings[key]=(key==='goal')?parseInt(b.dataset.v):b.dataset.v;persist();paint();after&&after();});
  paint();
}

function applyTheme(){document.documentElement.setAttribute('data-theme',(S.settings&&S.settings.theme)||'dark');}
$('#themeBtn').onclick=()=>{S.settings.theme=S.settings.theme==='dark'?'light':'dark';persist();applyTheme();};

let curCat=null, curGram=null, currentTopicId=null;
function exStatHtml(id,type){
  const e=S.exlog[id+':'+type];
  if(!e)return '<div class="exstat"><span class="d"></span>'+tr('Nevyzkoušeno')+'</div>';
  const cls=e.last>=80?'done':e.last>=50?'mid':'low';
  return '<div class="exstat '+cls+'"><span class="d"></span>'+tr('Naposledy')+' '+e.last+' % · '+relTime(e.ts)+(e.done>1?' · '+e.done+'×':'')+'</div>';
}
function buildVocabMenu(){
  const id=curCat.id;
  let defs=[['flash','▤','i1',tr('Slovíčka'),tr('Kartičky · Umím / Neumím')],['quiz','?','i2',tr('Kvíz'),tr('Výběr překladu')],['fill','✎','i3',tr('Doplň větu'),tr('Výběr nebo psaní')],['listen','♪','i4',tr('Poslech'),tr('Přehraje se jednou')],['dict','✍','i5',tr('Diktát'),tr('Poslechni a napiš')]];
  if(SR)defs.push(['pron','🎙','i6',tr('Mluvení'),tr('Bonus · nehodnotí se')]);
  $('#modeBox').innerHTML=defs.map(d=>'<button class="mode" onclick="startCat(\''+d[0]+'\')"><div class="mt"><span class="ic '+d[2]+'">'+d[1]+'</span> '+d[3]+'</div><small>'+d[4]+'</small>'+exStatHtml(id,d[0])+'</button>').join('');
}
function buildGrammarMenu(){
  const id=curGram.id;
  const defs=[['theory','📖','i2',tr('Teorie'),tr('Vysvětlení + příklady')],['gquiz','?','i1',tr('Kvíz'),tr('Vyber správný tvar')],['gfill','✎','i3',tr('Doplň'),tr('Napiš správný tvar')]];
  $('#modeBox').innerHTML=defs.map(d=>{
    const st=d[0]==='theory'
      ? (S.exlog[id+':theory']?'<div class="exstat done"><span class="d"></span>'+tr('Přečteno')+' ✓</div>':'<div class="exstat"><span class="d"></span>'+tr('Nepřečteno')+'</div>')
      : exStatHtml(id,d[0]);
    return '<button class="mode" onclick="startGrammar(\''+d[0]+'\')"><div class="mt"><span class="ic '+d[2]+'">'+d[1]+'</span> '+d[3]+'</div><small>'+d[4]+'</small>'+st+'</button>';
  }).join('');
}
/* ===== Čtečka příběhů: čti + poslouchej + otázky na porozumění ===== */
let curStory=null, storyPlaying=false;
function findStory(id){return langStories(curPair()).find(s=>s.id===id)||null;}
function openStory(id){
  const s=findStory(id);if(!s){toast(tr('Příběh se nepodařilo načíst'));return;}
  curStory=s;storyPlaying=false;
  $('#storyTitle').textContent=(s.art?s.art+'  ':'')+storyTitle(s)+'  ('+s.level+')';
  const back=$('#storyBack');if(back)back.onclick=function(){stopStory();levelChosen=false;refreshHome();show('home');};
  renderStoryText();
  show('story');
}
function stopStory(){storyPlaying=false;if(window.speechSynthesis)speechSynthesis.cancel();}
function storyExit(){stopStory();levelChosen=false;refreshHome();show('home');}
function renderStoryText(){
  const s=curStory;if(!s)return;
  let showCz=!!(S.settings&&S.settings.storyCz);
  const lines=s.sents.map(function(p,i){
    const cz=showCz?'<div class="st-cz">'+p[1]+'</div>':'';
    return '<div class="st-line" id="stl'+i+'" onclick="playFrom('+i+')"><div class="st-en">'+p[0]+'</div>'+cz+'</div>';
  }).join('');
  $('#storyBody').innerHTML=
    '<div class="st-ctrl">'+
      '<button class="btn big" id="stPlay">▶ '+tr('Přehrát celé')+'</button>'+
      '<button class="btn big ghost" id="stCz">'+(showCz?tr('Skrýt překlad'):tr('Zobrazit překlad'))+'</button>'+
    '</div>'+
    '<div class="st-text">'+lines+'</div>'+
    '<div style="text-align:center;margin-top:18px"><button class="btn big" id="stQuiz">'+tr('Otázky na porozumění')+' →</button></div>';
  $('#stPlay').onclick=function(){storyPlaying?stopStory():playFrom(0);};
  $('#stCz').onclick=function(){S.settings.storyCz=!showCz;persist();renderStoryText();};
  $('#stQuiz').onclick=startStoryQuiz;
}
function highlightLine(i){
  const all=document.querySelectorAll('.st-line');
  if(all&&all.forEach)all.forEach(function(el){el.classList.remove('on');});
  const cur=$('#stl'+i);if(cur){cur.classList.add('on');if(cur.scrollIntoView)cur.scrollIntoView({block:'center',behavior:'smooth'});}
}
function playFrom(idx){
  const s=curStory;if(!s)return;
  if(!('speechSynthesis' in window)){toast(tr('Přehrávání není v tomto prohlížeči dostupné.'));return;}
  stopStory();storyPlaying=true;
  const btn=$('#stPlay');if(btn)btn.textContent='⏸ '+tr('Zastavit');
  let i=idx;
  function next(){
    if(!storyPlaying||i>=s.sents.length){storyPlaying=false;const b=$('#stPlay');if(b)b.textContent='▶ '+tr('Přehrát celé');highlightLine(-1);return;}
    highlightLine(i);
    speak(s.sents[i][0], function(){ if(storyPlaying){i++;setTimeout(next,350);} });
  }
  next();
}
/* ---- kvíz na porozumění ---- */
let storyQuiz=null;
function startStoryQuiz(){
  stopStory();
  const s=curStory;if(!s||!s.q||!s.q.length){toast(tr('K tomuto příběhu nejsou otázky.'));return;}
  storyQuiz={i:0,correct:0};
  renderStoryQuestion();
}
function renderStoryQuestion(){
  const s=curStory,qz=storyQuiz;if(!s||!qz)return;
  if(qz.i>=s.q.length)return finishStoryQuiz();
  const q=s.q[qz.i];
  const opts=q[1].map(function(o,k){return '<button class="opt" onclick="answerStory('+k+')">'+o+'</button>';}).join('');
  $('#storyBody').innerHTML=
    '<p class="lead">'+tr('Otázka')+' '+(qz.i+1)+' / '+s.q.length+'</p>'+
    '<div class="qword" style="font-size:1.25rem;margin-bottom:16px">'+q[0]+'</div>'+
    '<div class="opts" id="stOpts">'+opts+'</div>'+
    '<div class="feedback" id="stFb"></div>';
}
function answerStory(k){
  const s=curStory,qz=storyQuiz;if(!s||!qz)return;
  const q=s.q[qz.i], correct=q[2];
  const box=$('#stOpts');if(box){const bs=box.querySelectorAll('button');if(bs&&bs.forEach)bs.forEach(function(b,idx){b.disabled=true;if(idx===correct)b.classList.add('good');else if(idx===k)b.classList.add('bad');});}
  const fb=$('#stFb');
  if(k===correct){qz.correct++;if(fb){fb.textContent=tr('Správně');fb.className='feedback ok';}}
  else if(fb){fb.textContent=tr('Správně')+': '+q[1][correct];fb.className='feedback bad';}
  setTimeout(function(){qz.i++;renderStoryQuestion();},1400);
}
function finishStoryQuiz(){
  const s=curStory,qz=storyQuiz;if(!s||!qz)return;
  const pct=Math.round(qz.correct/s.q.length*100);
  S.storyRead=S.storyRead||{};S.storyRead[s.id]=1;
  S.storyScore=S.storyScore||{};
  if(S.storyScore[s.id]==null||pct>S.storyScore[s.id])S.storyScore[s.id]=pct;
  if(qz.correct>0)addXP(qz.correct*5);
  persist();
  const stars=pct===100?'★★★':pct>=66?'★★':pct>=33?'★':'☆';
  $('#storyBody').innerHTML='<div class="result"><div class="stars">'+stars+'</div><div class="score">'+pct+'%</div>'+
    '<div class="rowstat"><div><b>'+qz.correct+'/'+s.q.length+'</b>'+tr('správně')+'</div></div>'+
    '<div class="resbtns">'+
    '<button class="btn big" onclick="openStory(\''+s.id+'\')">← '+tr('Zpět na příběh')+'</button>'+
    '<button class="btn big ghost" onclick="storyExit()">'+tr('Hotovo')+'</button>'+
    '</div></div>';
  storyQuiz=null;
}
function reopenTopic(){
  if(currentTopicId&&TMAP[currentTopicId])openTopic(currentTopicId);
  else goHome();
}
function openTopic(id){
  if(!isUnlocked(id)){toast(tr('Nejdřív dokonči předchozí témata 🔒'));return;}
  currentTopicId=id;const t=TMAP[id];$('#cmTitle').textContent=t.title;
  if(t.type==='test'){
    curGram=null;curCat=null;const e=S.exlog[FINAL.id+':test'];
    $('#cmSub').textContent=tr('Prověř všechna témata najednou')+(e?' · '+tr('nejlepší')+' '+e.last+' %':'');
    $('#modeBox').innerHTML='<button class="mode" style="grid-column:1/-1" onclick="startTest()"><div class="mt"><span class="ic" style="background:#f7b500">🎓</span> '+tr('Spustit test')+'</div><small>'+tr('30 otázek napříč slovíčky i gramatikou · na')+' '+DONE_PCT+' % '+tr('ho dokončíš')+'</small>'+(e?'<div class="exstat done"><span class="d"></span>'+tr('Nejlepší')+' '+e.last+' %</div>':'<div class="exstat"><span class="d"></span>'+tr('Nevyzkoušeno')+'</div>')+'</button>';
    show('catMenu');return;
  }
  if(t.type==='grammar'){
    curGram=t.obj;curCat=null;
    $('#cmSub').textContent=tr('Gramatika')+' · '+(isTopicDone(id)?tr('dokončeno')+' ✓':tr('přečti teorii a zvládni kvíz i doplňovačku na')+' '+DONE_PCT+' %+');
    buildGrammarMenu();
  }else{
    curCat=t.obj;curGram=null;const g=goodExCount(id);
    $('#cmSub').textContent=t.obj.vocab.length+' '+tr('slov')+' · '+(isTopicDone(id)?tr('téma dokončeno')+' ✓':tr('dokonči')+' '+DONE_EX+' '+tr('cvičení na')+' '+DONE_PCT+' %+ ('+g+'/'+DONE_EX+')');
    buildVocabMenu();
  }
  show('catMenu');
}

let sess=null;
function pickDir(){const d=S.settings.dir;return d==='mix'?(Math.random()<.5?'en2cz':'cz2en'):d;}
function buildCards(words,opts){
  opts=opts||{};
  return words.map(w=>{
    let type=opts.type;
    if(!type){
      const pool=['quiz','flash','listen'];
      if(pickDir()==='cz2en')pool.push('type');
      type=pool[Math.floor(Math.random()*pool.length)];
    }
    return {word:w, type, dir: opts.dir||pickDir()};
  });
}
function startSession(cards, meta){
  if(!cards.length){toast(tr('Nic k procvičení.'));return;}
  sess={queue:shuffle(cards), total:cards.length, done:0, correct:0, meta:meta||{}, lastTs:Date.now(), timeLimit:meta&&meta.timeLimit, startTs:Date.now()};
  $('#sessTag').style.display=meta&&meta.tag?'inline-block':'none';
  if(meta&&meta.tag)$('#sessTag').textContent=meta.tag;
  show('activity');
  nextCard();
}
function nextCard(){
  if(!sess)return;
  /* Ukonči případné čtení předchozí otázky — jinak by AI/TTS dočetlo starou větu,
     i když už jsem u nové otázky (typicky u kvízu, který sám nemluví). */
  if(window.speechSynthesis)speechSynthesis.cancel();
  if(sess.timeLimit && Date.now()-sess.startTs>sess.timeLimit){return finishSession();}
  if(sess.queue.length===0)return finishSession();
  const card=sess.queue.shift();
  $('#counter').textContent=tr('Hotovo')+' '+sess.done+' · '+tr('zbývá')+' '+sess.queue.length+(sess.timeLimit?'  ·  ⏱':'');
  setProg(sess.done, sess.done+sess.queue.length+1);
  const done=(good)=>afterAnswer(card,good);
  if(card.type==='flash')exFlash(card,done);
  else if(card.type==='quiz')exChoice(card,done);
  else if(card.type==='listen')exListen(card,done);
  else if(card.type==='fill')exFill(card,done);
  else if(card.type==='type')exType(card,done);
  else if(card.type==='dict')exDict(card,done);
  else if(card.type==='pron')exPron(card,done);
  else if(card.type==='gquiz')exGQuiz(card,done);
  else if(card.type==='gfill')exGFill(card,done);
}
/* XP jen za skutečný pokrok. Za slovo/cvičení už jednou zvládnuté dnes dostaneš
   jen malou opakovací odměnu (ne plný zisk), aby se levely nedaly farmit
   opakováním téhož dokola. „Opakování je matka moudrosti", ale ne zdroj levelů. */
function xpFor(card,good){
  if(!good)return 0;
  const base=card.xp||10;
  const id=card.word&&card.word.id;
  if(!id)return base;                       // gramatika bez ID – ber jak dřív
  S.xpSeen=S.xpSeen||{};
  const day=Math.floor(Date.now()/864e5);
  if(S.xpSeen[id]===day)return Math.max(1,Math.round(base*0.2));   // dnes už bráno → 20 %
  S.xpSeen[id]=day;
  return base;
}
function afterAnswer(card,good){
  const dt=Math.min(Date.now()-sess.lastTs,60000);S.stats.timeMs+=dt;sess.lastTs=Date.now();
  if(card.type==='pron'){ if(good){sess.correct++;addXP(xpFor(card,true)||8);} sess.done++;checkMilestones();nextCard();return; }
  if(card.word && card.word.id) grade(card.word.id, good);
  if(good){sess.correct++;addXP(xpFor(card,good));}
  else{const pos=Math.min(4,sess.queue.length);sess.queue.splice(pos,0,card);}
  sess.done++;
  checkMilestones();
  nextCard();
}
function setProg(d,t){$('#prog').style.width=(t?Math.round(d/t*100):0)+'%';}
function finishSession(){
  if(window.speechSynthesis)speechSynthesis.cancel();stopRec();
  award('first');
  const total=sess.done, correct=sess.correct, pct=total?Math.round(correct/total*100):0;
  if(sess.meta.cat && sess.meta.type) recordExlog(sess.meta.cat, sess.meta.type, pct);
  const secs=Math.round((Date.now()-sess.startTs)/1000);
  const stars=pct===100?'★★★':pct>=66?'★★':pct>=33?'★':'☆';
  $('#sessTag').style.display='none';$('#counter').textContent='';setProg(1,1);
  $('#stage').innerHTML='<div class="result"><div class="stars">'+stars+'</div><div class="score">'+pct+'%</div>'+
    '<div class="rowstat"><div><b>'+correct+'/'+total+'</b>'+tr('správně')+'</div><div><b>'+secs+'s</b>'+tr('čas')+'</div><div><b>'+S.daily.done+'/'+S.settings.goal+'</b>'+tr('denní cíl')+'</div></div>'+
    '<div class="resbtns">'+
    (currentTopicId&&TMAP[currentTopicId]?'<button class="btn big" onclick="reopenTopic()">← '+tr('Zpět na téma')+'</button>':'')+
    '<button class="btn big ghost" onclick="goHome()">'+tr('Výběr témat')+'</button></div></div>';
  sess=null;persist();
}
function quitSession(){
  const wasPlacement=!!plc;
  sess=null;plc=null;
  if(window.speechSynthesis)speechSynthesis.cancel();stopRec();
  /* Rozřazovací test nepatří do žádného tématu → domů.
     Jinak se vrať do tématu, ze kterého jsme přišli (ne až na výběr témat). */
  if(!wasPlacement && currentTopicId&&TMAP[currentTopicId])reopenTopic();
  else goHome();
}
function recordExlog(cat,type,pct){
  const beforeC=completedCount();
  const k=cat+':'+type;const p=S.exlog[k]||{done:0};S.exlog[k]={done:p.done+1,last:pct,ts:Date.now()};
  const afterC=completedCount();persist();
  if(afterC>beforeC){for(let idx=beforeC+LOOKAHEAD; idx<=afterC+LOOKAHEAD-1 && idx<PATH.length; idx++){(function(t){setTimeout(()=>toast(tr('Nové téma odemčeno')+': '+t+' 🔓'),500);})(topicTitle(PATH[idx]));}}
}
/* ---- gramatika: teorie + cvičení ---- */
function startGrammar(type){
  const g=curGram;
  if(type==='theory')return showTheory(g);
  /* Nejdřív teorie, pak cvičení. Kdo teorii ještě nečetl, uvidí ji teď —
     a z ní se tlačítkem přesune rovnou do vybraného cvičení. Kdo ji už četl,
     jde do cvičení bez zdržování. */
  if(!S.exlog[g.id+':theory']){ return showTheory(g, type); }
  const cards=g.items.map((it,i)=>({gitem:it, word:{id:g.id+'#'+i}, type:(type==='gfill'?'gfill':'gquiz'), xp:type==='gfill'?14:10}));
  startSession(cards,{tag:g.title+' · '+(type==='gfill'?tr('doplň'):tr('kvíz')), cat:g.id, type:type});
}
function startTest(){
  const vocabPick=shuffle(ALL).slice(0,18).map(w=>({word:w,type:'quiz',dir:pickDir(),xp:10}));
  const gramItems=[];GRAMMAR.forEach(g=>g.items.forEach((it,i)=>gramItems.push({gitem:it,word:{id:g.id+'#'+i},type:'gquiz',xp:10})));
  const gramPick=shuffle(gramItems).slice(0,12);
  const cards=shuffle(vocabPick.concat(gramPick));
  startSession(cards,{tag:tr('Závěrečný test'), cat:FINAL.id, type:'test'});
}
/* ---- rozřazovací test: adaptivně určí startovní úroveň ---- */
let plc=null;
function startPlacement(){
  loadLangPack(curPair(),function(ok){
    if(!ok)return;
    const pools={};PLC_LEVELS.forEach(l=>pools[l]=shuffle(plcPool(l)));
    const idx0={};PLC_LEVELS.forEach(l=>idx0[l]=0);
    plc={pools, idx:idx0, ability:Math.floor((PLC_LEVELS.length-1)/2), step:1, n:0, history:[], levelStats:{}};
    PLC_LEVELS.forEach(l=>plc.levelStats[l]={c:0,n:0});
    show('activity');
    $('#sessTag').style.display='inline-block';$('#sessTag').textContent=tr('Rozřazovací test');
    nextPlacementQ();
  });
}
function plcCurLevel(){return PLC_LEVELS[Math.max(0,Math.min(PLC_LEVELS.length-1,Math.floor(plc.ability)))];}
function plcDrawItem(){
  const lvl=plcCurLevel();
  const order=[lvl].concat(PLC_LEVELS.filter(l=>l!==lvl));
  for(const l of order){const pool=plc.pools[l];if(plc.idx[l]<pool.length)return pool[plc.idx[l]++];}
  return null;
}
function nextPlacementQ(){
  if(!plc)return;
  if(plc.n>=60)return finishPlacement();
  /* Úplný začátečník: po pár otázkách je jasné, že to nejde ani na nejnižší úrovni.
     Nemá smysl ho nutit do 50 otázek, kterým nerozumí — nabídneme rovnou A1. */
  if(plc.n>=6 && !plc.beginnerOffered){
    const easy=cefrRank(plcCurLevel())<=1;                 // drží se dole (A1/A2)
    const acc=plc.history.length?plc.history.filter(h=>h.ok).length/plc.history.length:1;
    if(easy && acc<=0.34){plc.beginnerOffered=true;return offerBeginner();}
  }
  /* Ukončí až po min. 25 otázkách A když je odhad opravdu ustálený
     (posledních 10 v rozpětí ≤0.5 úrovně). Dřív stačilo 15 a rozpětí 0.55. */
  if(plc.n>=25){
    const last10=plc.history.slice(-10).map(h=>h.ability);
    if(last10.length>=10 && (Math.max.apply(null,last10)-Math.min.apply(null,last10))<=0.5)return finishPlacement();
  }
  const item=plcDrawItem();
  if(!item)return finishPlacement();
  plc.cur=item;
  $('#counter').textContent=tr('Otázka')+' '+(plc.n+1)+' · '+tr('odhad úrovně')+': '+plcCurLevel();
  setProg(plc.n, Math.max(plc.n+1,25));
  const q=item.gitem[0],a=item.gitem[1],opts=item.gitem[2],cz=item.gitem[3];
  const options=shuffle(opts.slice());
  $('#stage').innerHTML='<div class="tag" style="display:inline-block">'+item.level+' · '+item.topic+'</div>'+
    '<div class="sentence">'+q.replace('___','<span class="blank">?</span>')+'</div><div class="cztrans">'+cz+'</div>'+
    '<div class="opts" id="opts"></div><div class="feedback" id="fb"></div>';
  $('#opts').innerHTML=options.map((o,k)=>'<button class="opt" data-k="'+k+'">'+o+'</button>').join('');
  $$('#opts .opt').forEach((btn,k)=>btn.onclick=()=>{
    const ok=options[k]===a;
    $$('#opts .opt').forEach((b,j)=>{b.disabled=true;if(options[j]===a)b.classList.add('correct');else if(j===k)b.classList.add('wrong');});
    const fb=$('#fb'),full=q.replace('___',a);
    if(ok){fb.textContent=tr('Správně');fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+full;fb.className='feedback bad';}
    speak(full);
    aiCtx={q:q,answer:a,user:options[k],topic:item.topic,kind:'grammar'};
    answerPlacement(ok);
  });
}
function answerPlacement(ok){
  if(!plc)return;
  const pctx=aiCtx;
  plc.n++;
  const qlvl=plc.cur.level;
  const st=plc.levelStats[qlvl];if(st){st.n++;if(ok)st.c++;}
  plc.ability=Math.max(0,Math.min(PLC_LEVELS.length-1, plc.ability + (ok?plc.step:-plc.step)));
  if(plc.n%8===0)plc.step=Math.max(0.4, plc.step*0.8);   /* pomalejší doznívání = přesnější zařazení */
  plc.history.push({ok:ok, lvlIdx:Math.floor(plc.ability), ability:plc.ability});
  showContinue(()=>nextPlacementQ(), ok, false, pctx);
}
/* Úplný začátečník: nabídneme mu jemně A1, ať nemusí dělat 50 otázek naslepo.
   Může ale i pokračovat, kdyby chtěl (třeba se jen zahřívá). */
function offerBeginner(){
  if(!plc)return;
  $('#sessTag').style.display='none';$('#counter').textContent='';setProg(1,1);
  $('#stage').innerHTML='<div class="result"><div class="stars">🌱</div>'+
    '<div class="score" style="font-size:1.4rem">'+tr('Začneme od začátku?')+'</div>'+
    '<p class="lead" style="margin-top:10px;max-width:460px;margin-left:auto;margin-right:auto">'+
      tr('Zdá se, že angličtina je pro tebe nová — a to je úplně v pořádku! Nemusíš dělat celý test. Doporučujeme začít od úrovně A1, kde tě všechno naučíme od nuly.')+'</p>'+
    '<div class="resbtns" style="margin-top:16px">'+
      '<button class="btn big" onclick="applyPlacement(\'A1\')">🌱 '+tr('Začít od úplných začátků (A1)')+'</button>'+
      '<button class="btn big ghost" onclick="resumePlacement()">'+tr('Přesto pokračovat v testu')+'</button>'+
    '</div></div>';
}
function resumePlacement(){ if(plc)nextPlacementQ(); }
function finishPlacement(){
  if(!plc)return;
  /* Do úrovně tě zařadí, jen když jsi v ní měl aspoň 3 otázky a ≥75 % správně.
     Dřív stačilo 2 otázky a 60 % — proto test „přeceňoval". */
  let lvl=PLC_LEVELS[0];
  PLC_LEVELS.forEach(function(l){const st=plc.levelStats[l];if(st && st.n>=3 && (st.c/st.n)>=0.75)lvl=l;});
  const n=plc.n;
  $('#sessTag').style.display='none';$('#counter').textContent='';setProg(1,1);
  $('#stage').innerHTML='<div class="result"><div class="stars">🎯</div><div class="score">'+lvl+'</div>'+
    '<div class="rowstat"><div><b>'+n+'</b>'+tr('otázek')+'</div><div><b>'+(PLC_LEVELS.indexOf(lvl)+1)+'/'+PLC_LEVELS.length+'</b>'+tr('úroveň')+'</div></div>'+
    '<p class="lead" style="margin-top:10px">'+tr('Podle tvých odpovědí ti nejlíp sedí úroveň')+' <b>'+lvl+'</b>. '+tr('Nižší úrovně zůstanou odemčené, kdybys je někdy chtěl projít.')+'</p>'+
    '<button class="btn big" onclick="applyPlacement(\''+lvl+'\')">'+tr('Začít na úrovni')+' '+lvl+' →</button></div>';
  plc=null;
}
function applyPlacement(lvl){
  const p=curPair();
  S.settings.maxUnlockedByPair=S.settings.maxUnlockedByPair||{};
  const cur=S.settings.maxUnlockedByPair[p];
  if(!cur || ALL_LEVELS.indexOf(lvl)>ALL_LEVELS.indexOf(cur))S.settings.maxUnlockedByPair[p]=lvl;
  S.settings.level=lvl;
  S.settings.levelByPair=S.settings.levelByPair||{};S.settings.levelByPair[p]=lvl;
  S.settings.cefrByPair=S.settings.cefrByPair||{};S.settings.cefrByPair[p]=lvl;
  persist();buildLevel(lvl);levelChosen=true;persist();
  toast(tr('Nastaveno na úroveň')+' '+lvl+' ✓');refreshHome();
}
function showTheory(g, thenType){
  show('activity');
  $('#sessTag').style.display='inline-block';$('#sessTag').textContent=g.title+' · teorie';
  $('#counter').textContent='';setProg(1,1);
  let tbl='';
  if(g.table){tbl='<table class="gtab">'+g.table.map((row,ri)=>'<tr>'+row.map(c=>ri===0?'<th>'+c+'</th>':'<td>'+c+'</td>').join('')+'</tr>').join('')+'</table>';}
  const exHtml=g.items.slice(0,3).map(it=>'<div class="exs"><span>'+it[0].replace('___','<b>'+it[1]+'</b>')+'</span><em>'+it[3]+'</em></div>').join('');
  $('#stage').innerHTML='<div class="theory"><p class="theorytext">'+g.theory+'</p>'+tbl+
    '<div class="sec-label">'+tr('Příklady')+'</div><div class="exlist" style="max-width:none">'+exHtml+'</div>'+
    '<button class="btn big" id="thok" style="margin-top:18px">'+(thenType?tr('Rozumím — jdeme cvičit')+' →':tr('Rozumím')+' ✓')+'</button></div>';
  $('#thok').onclick=()=>{
    addXP(5);recordExlog(g.id,'theory',100);toast(tr('Teorie přečtena · +5'));
    /* Když jsme sem přišli z pokusu o cvičení, plynule pokračuj do něj. */
    if(thenType){ startGrammar(thenType); } else { openTopic(g.id); }
  };
}
function exGQuiz(card,done){
  const q=card.gitem[0],a=card.gitem[1],opts=card.gitem[2],cz=card.gitem[3];
  const options=shuffle(opts.slice());
  $('#stage').innerHTML='<div class="tag" style="display:inline-block">gramatika</div>'+
    '<div class="sentence">'+q.replace('___','<span class="blank">?</span>')+'</div><div class="cztrans">'+cz+'</div>'+
    '<div class="opts" id="opts"></div><div class="feedback" id="fb"></div>';
  $('#opts').innerHTML=options.map((o,k)=>'<button class="opt" data-k="'+k+'">'+o+'</button>').join('');
  $$('#opts .opt').forEach((btn,k)=>btn.onclick=()=>{
    const ok=options[k]===a;
    $$('#opts .opt').forEach((b,j)=>{b.disabled=true;if(options[j]===a)b.classList.add('correct');else if(j===k)b.classList.add('wrong');});
    const fb=$('#fb'),full=q.replace('___',a);
    if(ok){fb.textContent=tr('Správně');fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+full;fb.className='feedback bad';}
    speak(full);
    showContinue(done,ok,false,{q:q,answer:a,user:options[k],topic:(curGram&&curGram.title)||'',theory:(curGram&&curGram.theory)||'',kind:'grammar'});
  });
}
function exGFill(card,done){
  const q=card.gitem[0],a=card.gitem[1],cz=card.gitem[3];
  $('#stage').innerHTML='<div class="tag" style="display:inline-block">gramatika</div>'+
    '<div class="sentence">'+q.replace('___','<span class="blank">?</span>')+'</div><div class="cztrans">'+cz+'</div>'+
    '<div class="typerow"><input class="tinput" id="ti" placeholder="'+tr('napiš správný tvar')+'" autocomplete="off" autocapitalize="off"><button class="btn" id="chk">OK</button></div><div class="feedback" id="fb"></div>';
  const inp=$('#ti');inp.focus();
  const go=()=>{if(inp.disabled)return;inp.disabled=true;$('#chk').disabled=true;const typed=inp.value;const ok=norm(typed)===norm(a);inp.style.borderColor=ok?'var(--ok)':'var(--bad)';const fb=$('#fb'),full=q.replace('___',a);if(ok){fb.textContent=tr('Správně');fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+full;fb.className='feedback bad';}speak(full);showContinue(done,ok,true,{q:q,answer:a,user:typed,topic:(curGram&&curGram.title)||'',theory:(curGram&&curGram.theory)||'',kind:'grammar'});};
  $('#chk').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}

function startCat(type){
  const words=curCat.vocab.map((v,i)=>BYID[curCat.id+':'+i]);
  if(type==='fill'){
    const cards=curCat.sentences.map(s=>({sent:s, word:findWordByEn(curCat,s[1]), type:'fill', dir:'en2cz', xp:S.settings.fill==='hard'?15:8}));
    return startSession(cards,{tag:curCat.title+' · '+tr('doplň větu'), cat:curCat.id, type:'fill'});
  }
  const dir=type==='pron'||type==='dict'?'en2cz':pickDir();
  const cards=words.map(w=>({word:w,type,dir, xp: type==='dict'?15:(type==='pron'?12:10)}));
  startSession(cards,{tag:curCat.title, cat:curCat.id, type:type});
}
function findWordByEn(cat,en){const i=cat.vocab.findIndex(v=>norm(v[0])===norm(en));return i>=0?BYID[cat.id+':'+i]:null;}
function startDaily(){
  ensureDaily();
  const need=Math.max(S.settings.goal - S.daily.done, 5);
  let pool=dueWords().concat(shuffle(newWords())).slice(0,Math.max(need,10));
  if(pool.length<8)pool=shuffle(unlockedWords()).slice(0,12);
  startSession(buildCards(pool,{}),{tag:tr('Dnešní mise')});
}
function startReview(){const w=dueWords();if(!w.length)return toast(tr('Teď není co opakovat 👌'));startSession(buildCards(shuffle(w).slice(0,20),{}),{tag:tr('Opakování')});}
function startProblem(){const w=problemWords();if(!w.length)return toast(tr('Žádná problémová slova 🎉'));startSession(buildCards(w,{}),{tag:tr('Problémová slova')});}
function startMixed(){startSession(buildCards(shuffle(unlockedWords()).slice(0,20),{}),{tag:tr('Zamíchat vše')});}
function start5min(){startSession(buildCards(shuffle(unlockedWords()),{}),{tag:'5 minut', timeLimit:5*60000});}
$('#startDaily').onclick=startDaily;

function exFlash(card,done){
  const w=card.word, showEn=card.dir!=='cz2en';
  const front=showEn?w.en:w.cz, back=showEn?w.cz:w.en;
  const ex=langExamples()[norm(w.en)];
  const exHtml=ex?'<div class="exlist">'+ex.slice(0,2).map(e=>'<div class="exs"><span>'+e[0]+'</span><em>'+e[1]+'</em></div>').join('')+'</div>':'';
  /* Tlačítko výslovnosti patří k ANGLICKÉMU slovu — ať je vpředu nebo vzadu.
     Když je angličtina vpředu (showEn), dáme ho na front; jinak na zadní stranu,
     aby po otočení na „Nurse" šlo slovo přehrát a znovu přehrát. */
  const spkBtn='<button class="speak" id="spk">♪ '+tr('Výslovnost')+'</button>';
  $('#stage').innerHTML=
    '<div class="flash" id="flash"><div class="flash-inner">'+
      '<div class="face front"><div class="word">'+front+'</div>'+
      (showEn?spkBtn:'')+
      '<div class="sub">'+tr('klikni pro překlad')+'</div></div>'+
      '<div class="face back-face"><div class="word">'+back+'</div><div class="sub" style="color:var(--muted)">'+front+'</div>'+
      (!showEn?spkBtn:'')+exHtml+'</div>'+
    '</div></div>'+
    '<div class="knowbtns"><button class="kno" id="bno">✕ '+tr('Neumím')+'</button><button class="kyes" id="byes">✓ '+tr('Umím')+'</button></div>';
  const f=$('#flash');
  f.onclick=()=>{
    f.classList.toggle('flip');
    /* Po otočení na anglickou stranu slovo automaticky přehraj (zvuková paměť). */
    if(!showEn && f.classList.contains('flip'))speak(w.en);
  };
  if($('#spk'))$('#spk').onclick=(e)=>{e.stopPropagation();speak(w.en);};
  $('#bno').onclick=()=>done(false);
  $('#byes').onclick=()=>done(true);
  if(showEn)setTimeout(()=>speak(w.en),150);
}
function exChoice(card,done){
  const w=card.word, en2cz=card.dir!=='cz2en';
  const prompt=en2cz?w.en:w.cz;
  const key=en2cz?'cz':'en';
  const distract=distractors(w,key,3);
  const opts=shuffle([w,...distract]);
  $('#stage').innerHTML='<div class="qword">'+prompt+'</div>'+
    '<p class="qsub">'+tr('Vyber překlad')+' '+(en2cz?'<button class="speak" id="spk" style="background:var(--surface2);color:var(--ink);border:1px solid var(--line)">♪</button>':'')+'</p>'+
    '<div class="opts" id="opts"></div><div class="feedback" id="fb"></div>';
  if($('#spk'))$('#spk').onclick=()=>speak(w.en);
  $('#opts').innerHTML=opts.map((o,k)=>'<button class="opt" data-k="'+k+'">'+o[key]+'</button>').join('');
  $$('#opts .opt').forEach((btn,k)=>btn.onclick=()=>{
    const ok=opts[k].id===w.id;
    $$('#opts .opt').forEach((b,j)=>{b.disabled=true;if(opts[j].id===w.id)b.classList.add('correct');else if(j===k)b.classList.add('wrong');});
    const fb=$('#fb');
    if(ok){fb.textContent=tr('Správně');fb.className='feedback ok';}
    else{fb.textContent=tr('Správně')+': '+w[key];fb.className='feedback bad';}
    if(en2cz)speak(w.en);
    showContinue(done,ok);
  });
}
function exListen(card,done){
  const w=card.word;
  const distract=distractors(w,'en',3);
  const opts=shuffle([w,...distract]);
  $('#stage').innerHTML='<p class="qsub">'+tr('Poslechni a vyber slovo (přehraje se jen jednou)')+'</p>'+
    '<button class="bigspeak playing" id="big">♪</button>'+
    '<div class="opts" id="opts"></div><div class="feedback" id="fb"></div>';
  const big=$('#big');
  big.onclick=()=>toast(tr('Přehraje se jen jednou — poslouchej pozorně 🙂'));
  setTimeout(()=>speak(w.en,()=>big.classList.remove('playing')),250);
  $('#opts').innerHTML=opts.map((o,k)=>'<button class="opt" data-k="'+k+'">'+o.en+'</button>').join('');
  $$('#opts .opt').forEach((btn,k)=>btn.onclick=()=>{
    const ok=opts[k].id===w.id;
    $$('#opts .opt').forEach((b,j)=>{b.disabled=true;if(opts[j].id===w.id)b.classList.add('correct');else if(j===k)b.classList.add('wrong');});
    const fb=$('#fb');
    if(ok){fb.textContent=tr('Správně')+' · '+w.en+' = '+w.cz;fb.className='feedback ok';}
    else{fb.textContent='Bylo to: '+w.en+' ('+w.cz+')';fb.className='feedback bad';}
    /* Po odpovědi se tlačítko změní na „přehrát znovu" — teď už si můžeš slovo
       pustit kolikrát chceš (na zapamatování). Před odpovědí schválně jen jednou. */
    big.classList.add('replay');big.title=tr('Přehrát znovu');
    big.onclick=()=>{big.classList.add('playing');speak(w.en,()=>big.classList.remove('playing'));};
    showContinue(done,ok);
  });
}
function exFill(card,done){
  const t=card.sent[0], a=card.sent[1], cz=card.sent[2];
  const hard=S.settings.fill==='hard';
  $('#stage').innerHTML='<div class="sentence">'+t.replace('___','<span class="blank">?</span>')+'</div><div class="cztrans">'+cz+'</div>'+
    (hard
      ? '<div class="typerow"><input class="tinput" id="ti" placeholder="'+tr('napiš chybějící slovo')+'" autocomplete="off"><button class="btn" id="chk">OK</button></div><div class="feedback" id="fb"></div>'
      : '<div class="opts" id="opts"></div><div class="feedback" id="fb"></div>');
  let fillUser=null;
  const finish=(ok)=>{const fb=$('#fb');const full=t.replace('___',a);if(ok){fb.textContent=tr('Správně');fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+full;fb.className='feedback bad';}speak(full);showContinue(done,ok,hard,{q:t,answer:a,user:fillUser,topic:(curCat&&curCat.title)||'',kind:'vocab'});};
  if(hard){
    const inp=$('#ti');inp.focus();
    const go=()=>{if(inp.disabled)return;inp.disabled=true;fillUser=inp.value;const ok=norm(inp.value)===norm(a);inp.style.borderColor=ok?'var(--ok)':'var(--bad)';$('#chk').disabled=true;finish(ok);};
    $('#chk').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  }else{
    const catId=(card.word&&card.word.cat)||(curCat&&curCat.id);
    const pool=[...new Set(ALL.filter(x=>x.cat===catId).map(x=>x.en.toLowerCase().split(' ')[0]).concat([a.toLowerCase()]))];
    const opts=shuffle([a,...shuffle(pool.filter(x=>x!==a.toLowerCase())).slice(0,3)]);
    $('#opts').innerHTML=opts.map((o,k)=>'<button class="opt" data-k="'+k+'">'+o+'</button>').join('');
    $$('#opts .opt').forEach((btn,k)=>btn.onclick=()=>{const ok=norm(opts[k])===norm(a);$$('#opts .opt').forEach((b,j)=>{b.disabled=true;if(norm(opts[j])===norm(a))b.classList.add('correct');else if(j===k)b.classList.add('wrong');});finish(ok);});
  }
}
function exType(card,done){
  const w=card.word;
  $('#stage').innerHTML='<div class="qword">'+w.cz+'</div><p class="qsub">'+tr('Napiš překlad')+'</p>'+
    '<div class="typerow"><input class="tinput" id="ti" placeholder="anglicky…" autocomplete="off" autocapitalize="off"><button class="btn" id="chk">OK</button></div><div class="feedback" id="fb"></div>';
  const inp=$('#ti');inp.focus();
  const go=()=>{if(inp.disabled)return;inp.disabled=true;$('#chk').disabled=true;const ok=norm(inp.value)===norm(w.en);inp.style.borderColor=ok?'var(--ok)':'var(--bad)';const fb=$('#fb');if(ok){fb.textContent=tr('Správně')+' · '+w.en;fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+w.en;fb.className='feedback bad';}speak(w.en);showContinue(done,ok,true);};
  $('#chk').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}
function exDict(card,done){
  const w=card.word;
  $('#stage').innerHTML='<p class="qsub">'+tr('Poslechni a napiš, co jsi slyšel/a (jen jednou)')+'</p>'+
    '<button class="bigspeak playing" id="big">♪</button>'+
    '<div class="typerow"><input class="tinput" id="ti" placeholder="'+tr('napiš překlad…')+'" autocomplete="off" autocapitalize="off"><button class="btn" id="chk">OK</button></div><div class="feedback" id="fb"></div>';
  const big=$('#big');big.onclick=()=>toast(tr('Přehraje se jen jednou 🙂'));
  setTimeout(()=>speak(w.en,()=>big.classList.remove('playing')),250);
  const inp=$('#ti');inp.focus();
  const go=()=>{if(inp.disabled)return;inp.disabled=true;$('#chk').disabled=true;const ok=norm(inp.value)===norm(w.en);inp.style.borderColor=ok?'var(--ok)':'var(--bad)';const fb=$('#fb');if(ok){fb.textContent=tr('Správně')+' · '+w.en+' = '+w.cz;fb.className='feedback ok';}else{fb.textContent=tr('Správně')+': '+w.en+' ('+w.cz+')';fb.className='feedback bad';}
    /* Po odpovědi jde přehrát znovu (na zapamatování správné výslovnosti). */
    big.classList.add('replay');big.title=tr('Přehrát znovu');
    big.onclick=()=>{big.classList.add('playing');speak(w.en,()=>big.classList.remove('playing'));};
    speak(w.en);showContinue(done,ok,true);};
  $('#chk').onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null;
function stopRec(){try{if(rec){rec.onresult=null;rec.onerror=null;rec.onend=null;rec.stop();rec=null;}}catch(e){}}
function exPron(card,done){
  const w=card.word;
  if(!SR){$('#stage').innerHTML='<div class="note">'+tr('Rozpoznávání řeči tvůj prohlížeč nepodporuje. Vyzkoušej Chrome nebo Edge.')+'</div>'+
    '<button class="btn big ghost" id="pnext">'+tr('Další')+' →</button>';$('#pnext').onclick=()=>done(false);return;}
  let recognized=false;
  $('#stage').innerHTML='<p class="qsub">'+tr('Mluvení na zkoušku — řekni slovo a uvidíš, jestli ti appka rozumí.')+' <b>'+tr('Není to známka z výslovnosti')+'</b>, '+tr('jen cvičení.')+' 🙂</p>'+
    '<div class="qword">'+w.en+'</div>'+
    '<div style="text-align:center"><button class="speak" id="spk" style="background:var(--surface2);color:var(--ink);border:1px solid var(--line);margin-bottom:14px">♪ '+tr('Poslechni vzor')+'</button></div>'+
    '<button class="micbtn" id="mic">🎙</button><p class="qsub" id="hint">'+tr('Klikni na mikrofon a zkus slovo říct')+'</p><div class="feedback" id="fb"></div>'+
    '<div style="text-align:center;margin-top:10px"><button class="btn big ghost" id="pnext">'+tr('Další')+' →</button></div>';
  $('#spk').onclick=()=>speak(w.en);
  $('#pnext').onclick=()=>done(recognized);
  let cd=null;
  function stopCountdown(){if(cd){clearInterval(cd);cd=null;}}
  $('#mic').onclick=()=>{
    stopRec();stopCountdown();rec=new SR();rec.lang='en-US';rec.interimResults=false;rec.maxAlternatives=3;
    $('#mic').classList.add('rec');
    /* Vizuální odpočet, ať student ví, jak dlouho ho appka ještě poslouchá. */
    let left=6;
    const tick=()=>{$('#hint').textContent=tr('Poslouchám…')+' ('+left+' s)';};
    tick();
    cd=setInterval(()=>{left--; if(left<=0){stopCountdown();stopRec();$('#hint').textContent=tr('Klikni na mikrofon a zkus slovo říct');} else tick();},1000);
    rec.onresult=(ev)=>{
      stopCountdown();
      let heard='';for(let i=0;i<ev.results[0].length;i++){heard+=' '+ev.results[0][i].transcript;}
      const target=norm(w.en);const ok=norm(heard).includes(target)||target.includes(norm(ev.results[0][0].transcript));
      const fb=$('#fb');
      if(ok){recognized=true;fb.textContent=tr('Super, appka ti rozuměla! Slyšela:')+' „'+ev.results[0][0].transcript+'" 👍';fb.className='feedback ok';$('#hint').textContent=tr('Můžeš zkusit znovu, nebo pokračovat dál.');setTimeout(()=>done(true),2600);}
      else{fb.textContent=tr('Nerozpoznala jsem to úplně (slyšela')+' „'+ev.results[0][0].transcript+'"). '+tr('Nevadí — zkus to klidně znovu.');fb.className='feedback bad';$('#hint').textContent=tr('Zkus to znovu, nebo pokračuj tlačítkem Další.');}
      $('#mic').classList.remove('rec');
    };
    rec.onerror=()=>{stopCountdown();$('#mic').classList.remove('rec');$('#hint').textContent=tr('Mikrofon se nepodařilo použít — můžeš pokračovat dál.');};
    rec.onend=()=>{stopCountdown();$('#mic').classList.remove('rec');};
    try{rec.start();}catch(e){stopCountdown();}
  };
}

function openStats(){
  const tot=S.stats.c+S.stats.w, acc=tot?Math.round(S.stats.c/tot*100):0;
  const mins=Math.round(S.stats.timeMs/60000);
  $('#statGrid').innerHTML=[
    [tr('Naučená slova'),learnedCount()+' / '+ALL.length],
    [tr('Úspěšnost'),acc+' %'],
    [tr('Level'),level()],
    [tr('Nejlepší série'),S.stats.bestDays+' '+tr('dní')],
    [tr('Dnešní pokrok'),S.daily.done+' / '+S.settings.goal],
    [tr('Problémová slova'),problemWords().length],
    [tr('Celkem odpovědí'),tot],
    [tr('Čas učení'),mins+' min']
  ].map(x=>'<div class="stat"><div class="n">'+x[1]+'</div><div class="l">'+x[0]+'</div></div>').join('');
  const rows=CATS.map(c=>{const s=S.stats.byCat[c.id];const t=s?s.c+s.w:0;const a=t?Math.round(s.c/t*100):null;return {title:c.title,a,t};}).filter(r=>r.t>0).sort((x,y)=>x.a-y.a).slice(0,6);
  $('#weakList').innerHTML=rows.length?rows.map(r=>'<div class="row"><span>'+r.title+'</span><span class="pct" style="color:'+(r.a>=70?'var(--ok)':r.a>=40?'var(--warn)':'var(--bad)')+'">'+r.a+' %</span></div>').join(''):'<p class="lead">'+tr('Zatím žádná data — začni procvičovat.')+'</p>';
  show('stats');
}
function resetProgress(){if(confirm(tr('Opravdu vymazat veškerý postup tohoto profilu?'))){try{localStorage.removeItem(stateKey(curProfileId));}catch(e){}S={};ensureStateDefaults();persist();ensureDaily();refreshHome();show('home');toast(tr('Postup profilu vymazán'));}}

/* ---- profilové obrazovky ---- */
function openProfiles(){renderProfiles();show('gate');}
function renderProfiles(){
  const list=PROFILES.map(p=>{
    const initial=(p.name.trim()[0]||'?').toUpperCase();
    let lvl='Level 1';try{const st=JSON.parse(localStorage.getItem(stateKey(p.id))||'{}');lvl='Level '+(Math.floor((st.xp||0)/200)+1);}catch(e){}
    return '<div class="pf" onclick="pickProfile(\''+p.id+'\')">'+
      '<span class="pdel" onclick="event.stopPropagation();delProfile(\''+p.id+'\')">✕</span>'+
      '<div class="pav" style="background:'+p.color+'">'+initial+(p.pin?'<span class="plock">🔒</span>':'')+'</div>'+
      '<div class="pn">'+p.name+'</div><div class="pl">'+lvl+'</div></div>';
  }).join('');
  $('#gate').innerHTML='<h2 style="text-align:center">'+tr('Kdo se učí?')+'</h2>'+
    '<p class="lead" style="text-align:center">'+tr('Vyber svůj profil nebo vytvoř nový.')+'</p>'+
    '<div class="pfgrid">'+list+
    '<div class="pf add" onclick="createProfileUI()"><div class="pav">＋</div><div class="pn">'+tr('Nový profil')+'</div></div></div>';
}
function createProfileUI(){
  $('#gate').innerHTML='<button class="back" onclick="openProfiles()">'+tr('← Zpět')+'</button><h2>'+tr('Nový profil')+'</h2>'+
    '<p class="lead">'+tr('Zadej jméno. PIN je nepovinný (4 číslice, chrání profil).')+'</p>'+
    '<div class="typerow"><input class="tinput" id="pfName" placeholder="'+tr('jméno')+'" maxlength="20" autocomplete="off"></div>'+
    '<div class="typerow" style="margin-top:10px"><input class="tinput" id="pfPin" placeholder="'+tr('PIN (nepovinné)')+'" inputmode="numeric" maxlength="4" autocomplete="off"></div>'+
    '<div style="margin-top:14px"><button class="btn big" id="pfCreate">'+tr('Vytvořit profil')+'</button></div>';
  $('#pfCreate').onclick=createProfile;
  setTimeout(()=>{try{$('#pfName').focus();}catch(e){}},50);
}
function createProfile(){
  const name=(($('#pfName').value)||'').trim();if(!name)return toast(tr('Zadej jméno'));
  const pin=(($('#pfPin').value)||'').replace(/\D/g,'').slice(0,4);
  const p={id:newId(),name,color:AVA_COLORS[PROFILES.length%AVA_COLORS.length],pin};
  PROFILES.push(p);saveProfiles();selectProfile(p.id);
}
function pickProfile(id){
  const p=PROFILES.find(x=>x.id===id);if(!p)return;
  if(p.pin){const v=prompt('PIN pro '+p.name+':');if(v===null)return;if(v.replace(/\D/g,'')!==p.pin)return toast(tr('Špatný PIN'));}
  selectProfile(id);
}
function delProfile(id){
  const p=PROFILES.find(x=>x.id===id);if(!p)return;
  if(!confirm('Smazat profil „'+p.name+'" i jeho postup?'))return;
  PROFILES=PROFILES.filter(x=>x.id!==id);saveProfiles();
  try{localStorage.removeItem(stateKey(id));}catch(e){}
  if(curProfileId===id){curProfileId=null;try{localStorage.removeItem('anj_cur');}catch(e){}}
  renderProfiles();
}
function selectProfile(id){
  curProfileId=id;try{localStorage.setItem('anj_cur',id);}catch(e){}
  S=load();ensureStateDefaults();
  const p=PROFILES.find(x=>x.id===id);
  const wb=$('#whoBtn');if(wb)wb.textContent=p?(p.name.trim()[0]||'?').toUpperCase():'?';
  applyTheme();
  /* Bez zvoleného zdrojového jazyka (a je-li z čeho vybírat) nejdřív výběr. */
  if(!S.settings.srcLang){initSeg('segDir','dir');initSeg('segFill','fill');initSeg('segGoal','goal',renderMission);openSrcPick();return;}
  loadUI(S.settings.srcLang,function(){
    let p=curPair();
    if(!PAIRS[p]){S.settings.tgtLang=tgtLangsFor(curSrc())[0];p=curPair();}
    loadLangPack(p,function(ok){
      if(!ok)return;
      if(!langLevels(p)[S.settings.level])S.settings.level=ALL_LEVELS.find(l=>langLevels(p)[l]);
      buildLevel(S.settings.level);persist();ensureDaily();
      initSeg('segDir','dir');initSeg('segFill','fill');initSeg('segGoal','goal',renderMission);
      levelChosen=false;applyStaticUI();refreshHome();show('home');
    });
  });
}
function migrateOld(){
  try{const old=localStorage.getItem('anj_a1_v2');
    if(old && !PROFILES.length){
      const p={id:newId(),name:'Já',color:AVA_COLORS[0],pin:''};
      PROFILES.push(p);saveProfiles();
      localStorage.setItem(stateKey(p.id),old);
      curProfileId=p.id;localStorage.setItem('anj_cur',p.id);
      localStorage.removeItem('anj_a1_v2');
    }}catch(e){}
}
/* Tiše zajistí jeden profil na pozadí (bez obrazovky výběru profilu). */
function ensureDefaultProfile(){
  PROFILES=loadProfiles();
  curProfileId=localStorage.getItem('anj_cur')||null;
  if(curProfileId && PROFILES.find(p=>p.id===curProfileId)){selectProfile(curProfileId);return;}
  if(PROFILES.length){selectProfile(PROFILES[0].id);return;}
  const p={id:newId(),name:'Já',color:AVA_COLORS[0],pin:''};
  PROFILES.push(p);saveProfiles();selectProfile(p.id);
}
/* ================= FIREBASE SYNCHRONIZACE ================= */
/* !!! Sem vlož svůj Firebase config z konzole (Project settings). apiKey je pro klienta bezpečný. */
const FIREBASE_CONFIG={
  apiKey:"AIzaSyAAYYkEVxwZvtjNHGh0RwCYg93J2Rqdv0k",
  authDomain:"selfenglishlessons.firebaseapp.com",
  projectId:"selfenglishlessons",
  storageBucket:"selfenglishlessons.firebasestorage.app",
  messagingSenderId:"324188722820",
  appId:"1:324188722820:web:9de207cda63986b2a994d1",
  measurementId:"G-K2SBZ8YFFJ"
};
const FIREBASE_READY=!!FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('VLOZ')!==0;
let fbAuth=null,fbDb=null,fbUser=null,cloudTimer=null,cloudStat='';
function initFirebase(){
  if(!FIREBASE_READY || typeof firebase==='undefined')return;
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth=firebase.auth();fbDb=firebase.firestore();
    fbAuth.onAuthStateChanged(function(u){fbUser=u;onAuthChange();});
  }catch(e){}
}
function gatherLocal(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf('anj_')===0)o[k]=localStorage.getItem(k);}return o;}
function applyLocal(o){Object.keys(o).forEach(function(k){try{localStorage.setItem(k,o[k]);}catch(e){}});}
function setCloudStat(s){cloudStat=s;const el=$('#cloudStat');if(el)el.textContent=s;}
function scheduleCloudSave(){if(!fbUser||!fbDb)return;clearTimeout(cloudTimer);cloudTimer=setTimeout(cloudSave,1500);}
function cloudSave(){if(!fbUser||!fbDb)return;setCloudStat(tr('Ukládám do cloudu…'));fbDb.collection('users').doc(fbUser.uid).set({data:gatherLocal(),updatedAt:Date.now()}).then(function(){setCloudStat(tr('Uloženo')+' '+new Date().toLocaleTimeString());}).catch(function(){setCloudStat(tr('Chyba ukládání (zkontroluj pravidla Firestore)'));});}
function cloudLoad(cb){if(!fbUser||!fbDb){cb&&cb(false);return;}fbDb.collection('users').doc(fbUser.uid).get().then(function(doc){if(doc.exists&&doc.data()&&doc.data().data){applyLocal(doc.data().data);cb&&cb(true);}else{cb&&cb(false);}}).catch(function(){setCloudStat(tr('Chyba načítání'));cb&&cb(false);});}
function onAuthChange(){
  renderAccount();
  if(fbUser){
    cloudLoad(function(had){
      if(had){reloadFromStorage();setCloudStat(tr('Načteno z cloudu ✓'));}
      else{cloudSave();}
      renderAccount();
    });
  }
}
function reloadFromStorage(){
  ensureDefaultProfile();
  goHome();
}
function togglePw(id,btn){const el=$('#'+id);if(!el)return;const hidden=el.type==='password';el.type=hidden?'text':'password';if(btn){btn.textContent=hidden?'🙈':'👁';btn.title=hidden?tr('Skrýt heslo'):tr('Zobrazit heslo');}el.focus();}
function fbChangePass(){
  if(!fbUser)return;
  const cur=($('#cpCur').value||''),pw=($('#cpNew').value||'');
  if(!cur)return toast(tr('Zadej současné heslo'));
  if(pw.length<6)return toast(tr('Nové heslo musí mít aspoň 6 znaků'));
  function doUpdate(){
    fbUser.updatePassword(pw).then(function(){
      toast(tr('Heslo změněno ✓'));
      const a=$('#cpCur'),b=$('#cpNew');if(a)a.value='';if(b)b.value='';
    }).catch(function(e){toast('Chyba: '+fbErr(e));});
  }
  try{
    const cred=firebase.auth.EmailAuthProvider.credential(fbUser.email,cur);
    fbUser.reauthenticateWithCredential(cred).then(doUpdate).catch(function(e){
      const c=(e&&e.code)||'';
      if(c.indexOf('wrong-password')>=0||c.indexOf('invalid-cred')>=0)toast(tr('Současné heslo je špatně'));
      else toast('Chyba: '+fbErr(e));
    });
  }catch(e){doUpdate();}
}
function fbErr(e){const c=(e&&e.code)||'';if(c.indexOf('wrong-password')>=0||c.indexOf('invalid-cred')>=0)return tr('špatný e-mail nebo heslo');if(c.indexOf('user-not-found')>=0)return tr('účet neexistuje');if(c.indexOf('email-already')>=0)return tr('e-mail už je použit');if(c.indexOf('weak-password')>=0)return tr('slabé heslo (min. 6 znaků)');if(c.indexOf('invalid-email')>=0)return tr('neplatný e-mail');return (e&&e.message)||tr('chyba');}
function fbRegister(){if(!fbAuth)return;const em=($('#acEmail').value||'').trim(),pw=$('#acPass').value||'';if(!em||!pw)return toast(tr('Vyplň e-mail a heslo'));fbAuth.createUserWithEmailAndPassword(em,pw).then(function(){toast(tr('Účet vytvořen ✓'));}).catch(function(e){toast('Chyba: '+fbErr(e));});}
function fbLogin(){if(!fbAuth)return;const em=($('#acEmail').value||'').trim(),pw=$('#acPass').value||'';if(!em||!pw)return toast(tr('Vyplň e-mail a heslo'));fbAuth.signInWithEmailAndPassword(em,pw).then(function(){toast(tr('Přihlášeno ✓'));}).catch(function(e){toast('Chyba: '+fbErr(e));});}
function fbResetPass(){
  if(!fbAuth)return;
  const em=($('#acEmail').value||'').trim();
  if(!em)return toast(tr('Napiš e-mail výše a klikni znovu'));
  fbAuth.sendPasswordResetEmail(em).then(function(){
    toast(tr('Poslali jsme e-mail pro obnovení hesla ✓'));
  }).catch(function(e){toast('Chyba: '+fbErr(e));});
}
function fbLogout(){if(fbAuth)fbAuth.signOut().then(function(){toast(tr('Odhlášeno'));renderAccount();});}
function openAccount(){renderAccount();show('account');}
function renderAccount(){
  const el=$('#account');if(!el)return;
  let html='<button class="back" onclick="goHome()">'+tr('← Zpět')+'</button><h2>☁ '+tr('Účet a synchronizace')+'</h2>';
  if(!FIREBASE_READY){
    html+='<div class="note">'+tr('Synchronizace zatím není nastavená. Do souboru je potřeba jednou vložit tvůj')+' <b>Firebase config</b> '+tr('(do části FIREBASE_CONFIG v kódu). Je to zdarma a na pár minut.')+'</div>'+
      '<p class="lead">'+tr('Bez nastavení appka funguje normálně, jen ukládá postup lokálně na tomto počítači.')+'</p>';
    el.innerHTML=html;return;
  }
  if(fbUser){
    html+='<p class="lead">'+tr('Přihlášen jako')+' <b>'+(fbUser.email||tr('uživatel'))+'</b>. '+tr('Postup se ukládá do cloudu automaticky a načte se na jiném zařízení po přihlášení.')+'</p>'+
      '<p class="lead" id="cloudStat">'+(cloudStat||tr('Synchronizováno'))+'</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="cloudSave()">'+tr('Uložit teď')+'</button><button class="btn ghost" onclick="fbLogout()">'+tr('Odhlásit')+'</button></div>'+
      '<div class="setcol" style="max-width:440px"><h3 style="margin-bottom:2px">🔑 '+tr('Změnit heslo')+'</h3>'+
      '<div class="typerow" style="margin-top:8px"><div class="pwrap"><input class="tinput" id="cpCur" type="password" placeholder="'+tr('současné heslo')+'" autocomplete="current-password"><button class="eye" type="button" title="'+tr('Zobrazit heslo')+'" onclick="togglePw(\'cpCur\',this)">👁</button></div></div>'+
      '<div class="typerow" style="margin-top:8px"><div class="pwrap"><input class="tinput" id="cpNew" type="password" placeholder="'+tr('nové heslo (min. 6 znaků)')+'" autocomplete="new-password"><button class="eye" type="button" title="'+tr('Zobrazit heslo')+'" onclick="togglePw(\'cpNew\',this)">👁</button></div></div>'+
      '<div style="margin-top:10px"><button class="btn" onclick="fbChangePass()">'+tr('Uložit nové heslo')+'</button></div></div>';
  }else{
    html+='<p class="lead">'+tr('Přihlas se, aby se tvůj postup ukládal do cloudu a byl dostupný i na druhém počítači.')+'</p>'+
      '<div class="typerow"><input class="tinput" id="acEmail" placeholder="'+tr('e-mail')+'" autocomplete="username"></div>'+
      '<div class="typerow" style="margin-top:10px"><div class="pwrap"><input class="tinput" id="acPass" type="password" placeholder="'+tr('heslo (min. 6 znaků)')+'" autocomplete="current-password"><button class="eye" type="button" title="'+tr('Zobrazit heslo')+'" onclick="togglePw(\'acPass\',this)">👁</button></div></div>'+
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn" onclick="fbLogin()">'+tr('Přihlásit')+'</button><button class="btn ghost" onclick="fbRegister()">'+tr('Vytvořit účet')+'</button></div>'+
      '<div style="margin-top:12px"><a href="#" onclick="fbResetPass();return false;" style="color:var(--accent);font-weight:600;text-decoration:none">'+tr('Zapomněl jsi heslo?')+'</a></div>';
  }
  try{ html+=voiceSettingsHtml(); }catch(e){ console.warn('Hlas sekce přeskočena:',e.message); }
  try{ html+=aiSettingsHtml(); }catch(e){ console.warn('AI sekce přeskočena:',e.message); }
  el.innerHTML=html;
  const sw=$('#aiOn');if(sw)sw.onchange=function(){aiToggle(this.checked);};
  const vsel=$('#voiceSel');if(vsel)vsel.onchange=voiceSave;
  const vtest=$('#voiceTest');if(vtest)vtest.onclick=voiceTest;
  const sk=$('#aiKeySave');if(sk)sk.onclick=aiSaveKey;
}
function voiceSettingsHtml(){
  if(!('speechSynthesis' in window))return '';
  const list=voiceList();
  let h='<div class="setcol" style="max-width:440px"><h3 style="margin-bottom:2px">🔊 '+tr('Hlas')+'</h3>';
  if(!list.length){
    return h+'<p class="lead">'+tr('Hlasy se ještě načítají, nebo je tento prohlížeč nemá k dispozici.')+'</p></div>';
  }
  const savedURI=(S.settings.voiceByTgt||{})[curTgt()];
  h+='<p class="lead">'+tr('Vyber si hlas, kterým ti appka bude číst slovíčka a věty.')+'</p>'+
    '<div class="typerow" style="margin-top:8px"><select class="tinput" id="voiceSel">'+
    list.map((v,i)=>'<option value="'+i+'"'+(v.voiceURI===savedURI?' selected':'')+'>'+v.name+' ('+v.lang+')</option>').join('')+
    '</select></div>'+
    '<div style="margin-top:10px"><button class="btn ghost" id="voiceTest">▶ '+tr('Přehrát ukázku')+'</button></div></div>';
  return h;
}
function voiceSave(){
  const sel=$('#voiceSel');if(!sel)return;
  const list=voiceList();
  const v=list[parseInt(sel.value,10)];if(!v)return;
  S.settings.voiceByTgt=S.settings.voiceByTgt||{};
  S.settings.voiceByTgt[curTgt()]=v.voiceURI;
  persist();pickVoice();
  toast(tr('Hlas uložen ✓'));
}
function voiceTest(){
  const words=(typeof ALL!=='undefined'&&ALL&&ALL.length)?ALL:null;
  speak(words?words[Math.floor(Math.random()*words.length)].en:'Hello');
}
function aiSettingsHtml(){
  if(!window.AI || !aiCall('enabled',false))return '';   /* mode:'off' nebo chybějící ai.js → sekce se skryje */
  const soon=aiCall('soon',true);                        /* při pochybnostech radši „Připravujeme" */
  const on=!soon && !!S.settings.aiOn;
  const m=(window.AI.config&&window.AI.config.mode)||'soon';
  const cfg=aiCall('configured',false);
  let h='<div class="setcol" style="max-width:440px"><h3 style="margin-bottom:2px">🤖 '+tr('AI vysvětlování')+
    (soon?' <span class="lvl" style="background:var(--surface);color:var(--muted)">'+tr('Připravujeme')+'</span>':'')+'</h3>'+
    '<p class="lead">'+tr('Po špatné odpovědi ti AI vysvětlí, proč je to špatně — a můžeš se doptat.')+'</p>'+
    '<div class="swrow'+(soon?' locked':'')+'"><label class="sw"><input type="checkbox" id="aiOn"'+(on?' checked':'')+(soon?' disabled':'')+'><span class="sl"></span></label>'+
    '<span class="swlbl" id="aiOnLbl">'+(soon?tr('Zatím nedostupné'):(on?tr('Zapnuto'):tr('Vypnuto')))+'</span></div>';
  if(soon)return h+'<p class="lead" style="margin-top:10px">🚧 '+tr('Pracujeme na tom — máme to připravené, pustíme to, až doladíme detaily.')+'</p></div>';
  if(on && m==='key'){
    h+='<p class="lead" style="margin-top:12px">'+tr('Vlož svůj vlastní API klíč. Uloží se jen do tohoto prohlížeče, nikam se neodesílá.')+'</p>'+
      '<div class="typerow" style="margin-top:8px"><div class="pwrap"><input class="tinput" id="aiKey" type="password" placeholder="'+tr('API klíč')+'" autocomplete="off" value="'+(window.AI.userKey()?'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022':'')+'"><button class="eye" type="button" title="'+tr('Zobrazit heslo')+'" onclick="togglePw(\'aiKey\',this)">👁</button></div></div>'+
      '<div style="margin-top:10px"><button class="btn" id="aiKeySave">'+tr('Uložit klíč')+'</button></div>';
    if(!cfg)h+='<p class="lead" style="color:var(--warn);margin-top:10px">'+tr('Bez klíče se AI tlačítka nezobrazí.')+'</p>';
  }
  if(on && m==='proxy'){
    h+='<p class="lead" style="margin-top:12px'+(cfg?'':';color:var(--warn)')+'">'+
      (cfg?tr('Zapnuto přes vlastní server ✓'):tr('Režim proxy, ale chybí endpoint v ai.js'))+'</p>';
  }
  return h+'</div>';
}
function aiToggle(v){
  if(aiCall('soon',true))return;   /* v režimu 'soon' se zapnout nedá */
  S.settings.aiOn=!!v;persist();
  const l=$('#aiOnLbl');if(l)l.textContent=v?tr('Zapnuto'):tr('Vypnuto');
  renderAccount();
}
function aiSaveKey(){
  const el=$('#aiKey');if(!el)return;
  const v=(el.value||'').trim();
  if(v.indexOf('\u2022')>=0)return;                  /* nezměněné maskované pole */
  window.AI.setUserKey(v);
  window.AI.cacheClear();
  toast(v?tr('Klíč uložen ✓'):tr('Klíč smazán'));
  renderAccount();
}

function init(){
  applyTheme();
  initFirebase();
  migrateOld();
  ensureDefaultProfile();          /* tiše připraví postup na pozadí */
  /* Není profilová obrazovka – rovnou přihlášení e-mailem.
     Pokud je uživatel z minula přihlášený, onAuthChange po načtení
     z cloudu automaticky přejde do appky. Bez přihlášení appka
     funguje lokálně (tlačítko „← Zpět" na přihlašovací obrazovce). */
  if(FIREBASE_READY && !(fbAuth && fbAuth.currentUser)){
    openAccount();
  }else{
    goHome();
  }
}
init();
