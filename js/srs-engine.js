/* ===== SRS & Pokrok Engine ===== */
const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANG_INFO = {
  cs: { label: 'Čeština', native: 'Čeština', tts: 'cs-CZ' },
  en: { label: 'Angličtina', native: 'English', tts: 'en-GB' },
  de: { label: 'Němčina', native: 'Deutsch', tts: 'de-DE' }
};
const PAIRS = {
  'cs-en': 'data/lang-cs-en.js',
  'cs-de': 'data/lang-cs-de.js'
};

function pairKey(src, tgt) { return src + '-' + tgt; }
function curSrc() { return (S.settings && S.settings.srcLang) || 'cs'; }
function curTgt() { return (S.settings && S.settings.tgtLang) || 'en'; }
function curPair() { return pairKey(curSrc(), curTgt()); }
function srcLangsAvailable() { const o = {}; Object.keys(PAIRS).forEach(p => o[p.split('-')[0]] = 1); return Object.keys(o); }
function tgtLangsFor(src) { return Object.keys(PAIRS).filter(p => p.split('-')[0] === src).map(p => p.split('-')[1]); }

window.LANG_DATA = window.LANG_DATA || {};
const _langLoading = {};

function loadLangPack(pair, cb) {
  if (!PAIRS[pair]) { cb && cb(false); return; }
  if (window.LANG_DATA[pair]) { cb && cb(true); return; }
  if (_langLoading[pair]) { _langLoading[pair].push(cb); return; }
  _langLoading[pair] = [cb];
  
  const s = document.createElement('script');
  // POJIŠTĚNÍ CESTY: Vezme cestu z PAIRS, a pokud nezačíná na 'data/', tak ji tam přidá
  let srcPath = PAIRS[pair];
  if (!srcPath.startsWith('data/')) {
    srcPath = 'data/' + srcPath;
  }
  s.src = srcPath;
  
  s.onload = function () { 
    const q = _langLoading[pair] || []; 
    delete _langLoading[pair]; 
    q.forEach(f => f && f(true)); 
  };
  s.onerror = function (err) { 
    delete _langLoading[pair]; 
    console.error("Chyba načítání souboru:", srcPath, err); // Tohle nám vypíše přesný problém do F12
    toast(tr('Nepodařilo se načíst jazyk – zkontroluj připojení a zkus to znovu')); 
    cb && cb(false); 
  };
  document.head.appendChild(s);
}

function langLevels(pair) { return (window.LANG_DATA[pair] && window.LANG_DATA[pair].levels) || {}; }
function langMeta(pair) { return (window.LANG_DATA[pair] && window.LANG_DATA[pair].meta) || {}; }
function langVerticals(pair) { return (window.LANG_DATA[pair] && window.LANG_DATA[pair].verticals) || {}; }
function isVertical(id) { return !!langVerticals(curPair())[id]; }

function curCefr() {
  const l = S.settings.level;
  if (ALL_LEVELS.indexOf(l) >= 0) return l;
  const c = (S.settings.cefrByPair || {})[curPair()];
  if (ALL_LEVELS.indexOf(c) >= 0) return c;
  return (S.settings.maxUnlockedByPair || {})[curPair()] || 'A1';
}
function unitData(id) { return langLevels(curPair())[id] || langVerticals(curPair())[id] || null; }
function langExamples() { const p = curPair(); return (window.LANG_DATA[p] && window.LANG_DATA[p].examples) || {}; }

const BADGES = [
  { id: 'first', icon: '●', name: 'Začátek', desc: 'Dokonči první lekci' },
  { id: 'lvl5', icon: '◆', name: 'Level 5', desc: 'Dosáhni levelu 5' },
  { id: 'days7', icon: '🔥', name: '7 dní', desc: '7 dní v řadě' },
  { id: 'learn50', icon: '★', name: '50 slov', desc: 'Nauč se 50 slov' },
  { id: 'learn150', icon: '★', name: '150 slov', desc: 'Nauč se 150 slov' },
  { id: 'noProblem', icon: '✓', name: 'Bez problémů', desc: 'Vyčisti všechna problémová slova' }
];

const STEPS = [2, 60, 1440, 10080, 43200];
const MIN = 60000;
const LOOKAHEAD = 3;
const DONE_EX = 2;
const DONE_PCT = 60;

function stateKey(id) { return 'anj_state_' + id; }
function newId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function load() { try { return JSON.parse(localStorage.getItem(stateKey(curProfileId))) || {}; } catch (e) { return {}; } }
function persist() { if (!curProfileId) return; try { localStorage.setItem(stateKey(curProfileId), JSON.stringify(S)); } catch (e) { } scheduleCloudSave(); }

function ensureStateDefaults() {
  const freshProfile = !S.settings;
  S.settings = S.settings || { dir: 'en2cz', fill: 'easy', theme: 'dark', goal: 15 };
  if (!S.settings.level) S.settings.level = 'A1';
  if (typeof S.settings.aiOn !== 'boolean') S.settings.aiOn = false;
  S.srs = S.srs || {}; S.exlog = S.exlog || {};
  if (!S._langs) {
    S._langs = {};
    S._langs.en = {
      xp: S.xp || 0,
      stats: S.stats || { c: 0, w: 0, byCat: {}, timeMs: 0, bestDays: 0 },
      daily: S.daily || { date: '', done: 0, ids: [], met: false, streak: 0 },
      badges: S.badges || []
    };
    delete S.xp; delete S.stats; delete S.daily; delete S.badges;
  }
  if (S.settings.lang) { S.settings.tgtLang = S.settings.tgtLang || S.settings.lang; delete S.settings.lang; }
  if (!S.settings.srcLang) {
    if (!freshProfile) S.settings.srcLang = 'cs';
    else if (srcLangsAvailable().length === 1) S.settings.srcLang = srcLangsAvailable()[0];
  }
  if (S.settings.srcLang && !S.settings.tgtLang) S.settings.tgtLang = tgtLangsFor(S.settings.srcLang)[0];
  if (S.settings.levelByLang) {
    S.settings.levelByPair = S.settings.levelByPair || {};
    Object.keys(S.settings.levelByLang).forEach(function (l) {
      if (!S.settings.levelByPair['cs-' + l]) S.settings.levelByPair['cs-' + l] = S.settings.levelByLang[l];
    });
    delete S.settings.levelByLang;
  }
  if (S.settings.maxUnlockedLevel) {
    S.settings.maxUnlockedByPair = S.settings.maxUnlockedByPair || {};
    if (!S.settings.maxUnlockedByPair['cs-en']) S.settings.maxUnlockedByPair['cs-en'] = S.settings.maxUnlockedLevel;
    delete S.settings.maxUnlockedLevel;
  }
  ['en', 'de'].forEach(function (l) {
    if (S._langs[l] && !S._langs['cs-' + l]) { S._langs['cs-' + l] = S._langs[l]; delete S._langs[l]; }
  });

  function langBucket() {
    const p = curPair();
    if (!S._langs[p]) S._langs[p] = { xp: 0, stats: { c: 0, w: 0, byCat: {}, timeMs: 0, bestDays: 0 }, daily: { date: '', done: 0, ids: [], met: false, streak: 0 }, badges: [] };
    return S._langs[p];
  }
  Object.defineProperty(S, 'xp', { get: () => langBucket().xp, set: v => { langBucket().xp = v; }, configurable: true, enumerable: false });
  Object.defineProperty(S, 'stats', { get: () => langBucket().stats, set: v => { langBucket().stats = v; }, configurable: true, enumerable: false });
  Object.defineProperty(S, 'daily', { get: () => langBucket().daily, set: v => { langBucket().daily = v; }, configurable: true, enumerable: false });
  Object.defineProperty(S, 'badges', { get: () => langBucket().badges, set: v => { langBucket().badges = v; }, configurable: true, enumerable: false });
}

function srsOf(id) { return S.srs[id]; }
function isDue(id) { const e = S.srs[id]; if (!e) return true; return (e.due || 0) <= Date.now(); }
function isNew(id) { return !S.srs[id]; }

function grade(id, good) {
  let e = S.srs[id] || { step: -1, reps: 0, lapses: 0, c: 0, w: 0, p: false };
  if (good) { e.step = e.step < 1 ? 1 : Math.min(e.step + 1, STEPS.length - 1); e.reps++; e.c++; e.p = false; }
  else { e.step = 0; e.lapses++; e.w++; e.p = true; }
  e.due = Date.now() + STEPS[e.step] * MIN;
  S.srs[id] = e;
  const cat = BYID[id] ? BYID[id].cat : null;
  if (good) S.stats.c++; else S.stats.w++;
  if (cat) { S.stats.byCat[cat] = S.stats.byCat[cat] || { c: 0, w: 0 }; if (good) S.stats.byCat[cat].c++; else S.stats.byCat[cat].w++; }
  ensureDaily();
  if (!S.daily.ids.includes(id)) { S.daily.ids.push(id); S.daily.done = S.daily.ids.length; checkDailyMet(); }
  persist();
}

function learnedCount() { return ALL.filter(w => (S.srs[w.id] && S.srs[w.id].step >= 2)).length; }
function dueWords() { return ALL.filter(w => isUnlocked(w.cat) && !isNew(w.id) && isDue(w.id)); }
function newWords() { return ALL.filter(w => isUnlocked(w.cat) && isNew(w.id)); }
function problemWords() { return ALL.filter(w => isUnlocked(w.cat) && S.srs[w.id] && S.srs[w.id].p); }

const XP_PER_LEVEL = 200;
function level() { return Math.floor(S.xp / XP_PER_LEVEL) + 1; }
function levelProgress() { return (S.xp % XP_PER_LEVEL) / XP_PER_LEVEL; }
function toNext() { return XP_PER_LEVEL - (S.xp % XP_PER_LEVEL); }
function addXP(n) { const before = level(); S.xp += n; persist(); updateHeader(); if (level() > before) { toast('Level ' + level() + '! 🎉'); if (level() >= 5) award('lvl5'); } }

function ensureDaily() {
  const today = dateStr(Date.now());
  if (S.daily.date !== today) {
    const prev = S.daily.date;
    const yesterday = dateStr(Date.now() - 86400000);
    if (!(prev === yesterday && S.daily.met)) S.daily.streak = 0;
    S.daily.date = today; S.daily.done = 0; S.daily.ids = []; S.daily.met = false;
    persist();
  }
}

function checkDailyMet() {
  if (!S.daily.met && S.daily.done >= S.settings.goal) {
    S.daily.met = true; S.daily.streak++;
    if (S.daily.streak > S.stats.bestDays) S.stats.bestDays = S.daily.streak;
    persist(); toast(tr('Denní cíl splněn! Série') + ' ' + S.daily.streak + ' ' + tr('dní') + ' 🔥');
    if (S.daily.streak >= 7) award('days7');
    updateHeader(); renderMission();
  }
}

function award(id) { if (S.badges.includes(id)) return; S.badges.push(id); persist(); renderAch(); updateHeader(); const b = BADGES.find(x => x.id === id); if (b) toast(tr('Úspěch') + ': ' + tr(b.name)); }
function checkMilestones() { const lc = learnedCount(); if (lc >= 50) award('learn50'); if (lc >= 150) award('learn150'); if (problemWords().length === 0 && S.stats.w > 0) award('noProblem'); }
