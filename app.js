/* ===== Hlavní Aplikační Logika & UI Router ===== */

// Globální stav aplikace
let S = {}; 
let ALL = []; 
let BYID = {}; 
let curProfileId = 'default_user';
let sess = null; 
let aiChat = null;

// Pomocné funkce pro manipulaci s DOM
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const dateStr = ts => new Date(ts).toISOString().split('T')[0];

// --- 1. LOKALIZACE A PŘEKLADY ROZHRANÍ ---
const UI_STRINGS = {
  cs: {
    "Lvl": "Lvl", "Body": "Body", "dní": "dní", "Level": "Level", "bodů": "bodů",
    "b do levelu · série": "b do levelu · série", "Dnešní mise": "Dnešní mise",
    "dnešní cíl": "dnešní cíl", "Opakování": "Opakování", "Slova k zopakování (SRS)": "Slova k zopakování (SRS)",
    "Problémová slova": "Problémová slova", "Slova, ve kterých chybuješ": "Slova, ve kterých chybuješ",
    "Zamíchat vše": "Zamíchat vše", "Náhodně napříč tématy": "Náhodně napříč tématy",
    "5 minut denně": "5 minut denně", "Krátká rychlá lekce": "Krátká rychlá lekce",
    "Statistiky": "Statistiky", "Pokrok a slabá témata": "Pokrok a slabá témata",
    "Směr": "Směr", "Doplňování": "Doplňování", "Denní cíl": "Denní cíl",
    "Výběr": "Výběr", "Psaní": "Psaní", "Vyber úroveň znalosti": "Vyber úroveň znalosti",
    "🎯 Nevím, jakou úroveň zvolit — udělat rozřazovací test": "🎯 Nevím, jakou úroveň zvolit — udělat rozřazovací test",
    "Na jaké úrovni chceš procvičovat? Každá úroveň má vlastní témata i postup.": "Na jaké úrovni chceš procvičovat? Každá úroveň má vlastní témata i postup.",
    "Témata navíc": "Témata navíc", "Tematické sady nezávislé na úrovni — otevřené celé, sáhni si po tom, co zrovna potřebuješ.": "Tematické sady nezávislé na úrovni — otevřené celé, sáhni si po tom, co zrovna potřebuješ.",
    "Témata": "Témata", "← Změnit úroveň": "← Změnit úroveň", "Celkem": "Celkem",
    "slov · naučeno": "slov · naučeno", "Klikni na téma pro výběr cvičení.": "Klikni na téma pro výběr cvičení.",
    "Úspěchy": "Úspěchy", "Jakým jazykem mluvíš?": "Jakým jazykem mluvíš?",
    "Zvol jazyk, ve kterém ti bude appka vysvětlovat. Podle něj se nabídnou jazyky, které se můžeš učit.": "Zvol jazyk, ve kterém ti bude appka vysvětlovat. Podle něj se nabídnou jazyky, které se můžeš učit.",
    "← Zpět": "← Zpět", "Tvůj celkový pokrok.": "Tvůj celkový pokrok.", "Nejslabší témata": "Nejslabší témata",
    "Vymazat veškerý postup": "Vymazat veškerý postup", "← Ukončit": "← Ukončit"
  },
  en: {
    "Lvl": "Lvl", "Body": "Pts", "dní": "days", "Level": "Level", "bodů": "pts",
    "b do levelu · série": "pts to next · streak", "Dnešní mise": "Daily Mission",
    "dnešní cíl": "daily goal", "Opakování": "Review", "Slova k zopakování (SRS)": "Words to review (SRS)",
    "Problémová slova": "Weak Words", "Slova, ve kterých chybuješ": "Words you struggle with",
    "Zamíchat vše": "Shuffle All", "Náhodně napříč tématy": "Random across topics",
    "5 minut denně": "5-Minute Session", "Krátká rychlá lekce": "Quick bite-sized lesson",
    "Statistiky": "Statistics", "Pokrok a slabá témata": "Progress & weak areas",
    "Směr": "Direction", "Doplňování": "Mode", "Denní cíl": "Daily Goal",
    "Výběr": "Multiple Choice", "Psaní": "Typing", "Vyber úroveň znalosti": "Choose Knowledge Level",
    "🎯 Nevím, jakou úroveň zvolit — udělat rozřazovací test": "🎯 Not sure? Take a placement test",
    "Na jaké úrovni chceš procvičovat? Každá úroveň má vlastní témata i postup.": "Which level do you want to practice? Each level has its own topics.",
    "Témata navíc": "Extra Topics", "Tematické sady nezávislé na úrovni — otevřené celé, sáhni si po tom, co zrovna potřebuješ.": "Specialized topics independent of level — choose whatever you need.",
    "Témata": "Topics", "← Změnit úroveň": "← Change Level", "Celkem": "Total",
    "slov · naučeno": "words · learned", "Klikni na téma pro výběr cvičení.": "Click a topic to start practicing.",
    "Úspěchy": "Achievements", "Jakým jazykem mluvíš?": "What is your native language?",
    "Zvol jazyk, ve kterém ti bude appka vysvětlovat. Podle něj se nabídnou jazyky, které se můžeš učit.": "Select your interface language to tailor your course.",
    "← Zpět": "← Back", "Tvůj celkový pokrok.": "Your overall progress.", "Nejslabší témata": "Weakest Topics",
    "Vymazat veškerý postup": "Reset All Progress", "← Ukončit": "← Quit"
  }
};

function tr(key) {
  const lang = curSrc();
  if (UI_STRINGS[lang] && UI_STRINGS[lang][key]) return UI_STRINGS[lang][key];
  return key;
}

function translateDOM() {
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n-key') || el.textContent.trim();
    if (!el.getAttribute('data-i18n-key')) el.setAttribute('data-i18n-key', key);
    el.textContent = tr(key);
  });
  $$('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', tr(key));
  });
}

// --- 2. UNIVERZÁLNÍ ROUTING & ZOBRAZOVÁNÍ OBRAZOVEK ---
function showView(viewId) {
  ['home', 'srcPick', 'catMenu', 'stats', 'activity', 'gate', 'account'].forEach(id => {
    $('#' + id).classList.add('hidden');
  });
  $('#' + viewId).classList.remove('hidden');
  window.scrollTo(0, 0);
  
  // Zobrazení / skrytí tlačítka zpět na jazykovém výběru
  if (viewId === 'srcPick') {
    if (S.settings && S.settings.srcLang) $('#srcBack').classList.remove('hidden');
    else $('#srcBack').classList.add('hidden');
  }
}

function goHome() {
  showView('home');
  renderCats();
  renderMission();
  updateHeader();
}

function openSrcPick() {
  showView('srcPick');
  renderSrcPick();
}

// --- 3. RENDEROVÁNÍ LOBBY (LEVELY & TÉMATA) ---
function renderSrcPick() {
  const box = $('#srcPickBox');
  box.innerHTML = '';
  srcLangsAvailable().forEach(lang => {
    const btn = document.createElement('div');
    btn.className = 'lvlcard';
    btn.innerHTML = `
      <div class="lc-badge flagchip ${lang}"><span>${lang.toUpperCase()}</span></div>
      <div class="lc-t">${LANG_INFO[lang].native}</div>
      <div class="lc-d">${LANG_INFO[lang].label}</div>
    `;
    btn.onclick = () => selectSrcLang(lang);
    box.appendChild(btn);
  });
}

function selectSrcLang(lang) {
  S.settings.srcLang = lang;
  const tgts = tgtLangsFor(lang);
  if (!tgts.includes(S.settings.tgtLang)) S.settings.tgtLang = tgts[0];
  
  loadLangPack(curPair(), () => {
    ensureStateDefaults();
    persist();
    translateDOM();
    goHome();
  });
}

function toggleLanguage() {
  const tgts = tgtLangsFor(curSrc());
  if (tgts.length <= 1) return;
  const idx = tgts.indexOf(curTgt());
  S.settings.tgtLang = tgts[(idx + 1) % tgts.length];
  
  loadLangPack(curPair(), () => {
    ensureStateDefaults();
    rebuildWordIndex();
    persist();
    goHome();
  });
}

function rebuildWordIndex() {
  ALL = [];
  BYID = {};
  const pack = window.LANG_DATA[curPair()];
  if (!pack) return;

  // 1. INDEXACE Z CEFR ÚROVNÍ (Přizpůsobeno pro tvou strukturu cats)
  Object.keys(pack.levels || {}).forEach(lvlId => {
    const u = pack.levels[lvlId];
    
    // Pokud má úroveň vlastnost 'cats' (jako ve tvém souboru)
    if (u.cats) {
      Object.keys(u.cats).forEach(catKey => {
        const catData = u.cats[catKey];
        // Uložíme si informaci o CEFR úrovni přímo do témat
        catData.level = lvlId; 
        
        if (catData.words) {
          catData.words.forEach(w => {
            w.cat = catKey; // Přiřadíme ID kategorie ke slovíčku
            w._lvlId = lvlId; // Schováme si úroveň
            ALL.push(w);
            BYID[w.id] = w;
          });
        }
      });
    } 
    // Záložní varianta, pokud by to bylo napřímo
    else if (u.words) {
      u.words.forEach(w => {
        w.cat = lvlId;
        ALL.push(w);
        BYID[w.id] = w;
      });
    }
  });

  // 2. INDEXACE Z VERTIKÁL (Témata navíc)
  Object.keys(pack.verticals || {}).forEach(vId => {
    const u = pack.verticals[vId];
    if (u.words) {
      u.words.forEach(w => {
        w.cat = vId;
        ALL.push(w);
        BYID[w.id] = w;
      });
    }
  });
}

  // Indexace z Vertikál (Témata navíc)
  Object.keys(pack.verticals || {}).forEach(vId => {
    const u = pack.verticals[vId];
    if (u.words) u.words.forEach(w => {
      w.cat = vId;
      ALL.push(w);
      BYID[w.id] = w;
    });
  });
}

function isUnlocked(catId) {
  if (isVertical(catId)) return true;
  const pack = window.LANG_DATA[curPair()];
  if (!pack || !pack.levels || !pack.levels[catId]) return false;
  
  const targetLvl = pack.levels[catId].level;
  const maxUnlocked = (S.settings.maxUnlockedByPair || {})[curPair()] || 'A1';
  return ALL_LEVELS.indexOf(targetLvl) <= ALL_LEVELS.indexOf(maxUnlocked);
}

function renderCats() {
  const pair = curPair();
  if (!window.LANG_DATA[pair]) {
    loadLangPack(pair, () => { rebuildWordIndex(); renderCats(); });
    return;
  }

  // Update horní lišty s vlajkami
  $('#brandLang').textContent = LANG_INFO[curTgt()].label;
  $('#brandLvl').textContent = curCefr();
  $('#srcBtn').innerHTML = `<span class="flagchip ${curSrc()}"><span>${curSrc().toUpperCase()}</span></span>`;
  $('#langBtn').innerHTML = `<span class="flagchip ${curTgt()}"><span>${curTgt().toUpperCase()}</span></span>`;

  // Vygenerování karet pro výběr úrovně (A1-C2)
  const pBox = $('#lvlpickBox');
  pBox.innerHTML = '';
  
  const levels = langLevels(pair);
  const activeCefr = curCefr();
  
  // Seskupení témat podle CEFR
  const cefrGroups = {};
  Object.keys(levels).forEach(k => {
    const c = levels[k].level;
    cefrGroups[c] = cefrGroups[c] || [];
    cefrGroups[c].push(k);
  });

  ALL_LEVELS.forEach(lvl => {
    if (!cefrGroups[lvl]) return;
    const card = document.createElement('div');
    const maxUnlocked = (S.settings.maxUnlockedByPair || {})[curPair()] || 'A1';
    const locked = ALL_LEVELS.indexOf(lvl) > ALL_LEVELS.indexOf(maxUnlocked);
    
    card.className = `lvlcard ${locked ? 'locked' : ''} ${lvl === activeCefr ? 'active' : ''}`;
    card.innerHTML = `
      <div class="lc-badge">${lvl}</div>
      <div class="lc-t">${lvl === 'A1' ? 'Začátečník' : lvl === 'A2' ? 'Pokročilý začátečník' : 'Středně pokročilý'}</div>
      <div class="lc-d">${cefrGroups[lvl].length} témat k procvičení</div>
      <div class="lc-go">${locked ? '🔒 Uzamčeno' : 'Vstoupit →'}</div>
    `;
    
    if (!locked) {
      card.onclick = () => {
        S.settings.level = lvl;
        S.settings.cefrByPair = S.settings.cefrByPair || {};
        S.settings.cefrByPair[curPair()] = lvl;
        persist();
        renderCats();
      };
    }
    pBox.appendChild(card);
  });

  // Vykreslení témat pro aktivní úroveň
  const grid = $('#catGrid');
  grid.innerHTML = '';
  
  const currentTopics = cefrGroups[activeCefr] || [];
  let totalW = 0, learnedW = 0;

  currentTopics.forEach(catId => {
    const u = levels[catId];
    const words = u.words || [];
    totalW += words.length;
    
    const learnedInCat = words.filter(w => S.srs[w.id] && S.srs[w.id].step >= 2).length;
    learnedW += learnedInCat;
    
    const pct = words.length ? Math.round((learnedInCat / words.length) * 100) : 0;
    const dueCount = words.filter(w => !isNew(w.id) && isDue(w.id)).length;

    const el = document.createElement('div');
    el.className = `cat ${u.type || ''}`;
    el.innerHTML = `
      <div>
        <div class="t">${u.title}</div>
        <div class="m">${words.length} slov · ${pct}%</div>
      </div>
      ${dueCount > 0 ? `<div class="due">${dueCount} k opakování</div>` : ''}
      <div class="bar"><div style="width:${pct}%"></div></div>
    `;
    el.onclick = () => openCategoryMenu(catId, u);
    grid.appendChild(el);
  });

  $('#totalWords').textContent = totalW;
  $('#learnedWords').textContent = learnedW;
  $('#curLvlTag').textContent = activeCefr;

  // Vykreslení vertikál (Témata navíc)
  const vBox = $('#vertBox');
  vBox.innerHTML = '';
  const verts = langVerticals(pair);
  
  if (Object.keys(verts).length > 0) {
    $('#vertWrap').classList.remove('hidden');
    Object.keys(verts).forEach(vId => {
      const u = verts[vId];
      const words = u.words || [];
      const learnedInCat = words.filter(w => S.srs[w.id] && S.srs[w.id].step >= 2).length;
      const pct = words.length ? Math.round((learnedInCat / words.length) * 100) : 0;

      const el = document.createElement('div');
      el.className = 'cat gram';
      el.innerHTML = `
        <div>
          <div class="t">${u.title}</div>
          <div class="m">${words.length} prvků · ${pct}%</div>
        </div>
        <div class="bar"><div style="width:${pct}%"></div></div>
      `;
      el.onclick = () => openCategoryMenu(vId, u);
      vBox.appendChild(el);
    });
  } else {
    $('#vertWrap').classList.add('hidden');
  }
}

function openCategoryMenu(id, u) {
  showView('catMenu');
  $('#cmTitle').textContent = u.title;
  $('#cmSub').textContent = `${u.words ? u.words.length : 0} slovíček v této sadě. Zvol si formu učení.`;
  
  const box = $('#modeBox');
  box.innerHTML = '';

  const modes = [
    { type: 'learn', name: '🧠 Učit se nová slovíčka', desc: 'Představení nových slov a okamžité procvičení.' },
    { type: 'choice', name: '👁️ Výběr z možností', desc: 'Rychlé testování pasivní slovní zásoby.' },
    { type: 'write', name: '✍️ Psaní a doplňování', desc: 'Trénink aktivního psaní bez nápovědy.' },
    { type: 'speak', name: '🗣️ Výslovnost (Mluvení)', desc: 'Rozpoznávání hlasu přes mikrofon.' }
  ];

  modes.forEach(m => {
    const el = document.createElement('button');
    el.className = 'mode';
    el.innerHTML = `<div class="mt">${m.name}</div><small>${m.desc}</small>`;
    el.onclick = () => startSession(id, m.type);
    box.appendChild(el);
  });
}

function backToLevels() {
  goHome();
}

// --- 4. HERNÍ SEANCE & ADAPTIVNÍ KARTIČKY ---
function startSession(catId, modeType) {
  const u = unitData(catId);
  if (!u || !u.words || u.words.length === 0) return;

  sess = {
    catId: catId,
    mode: modeType,
    words: [...u.words],
    queue: [],
    index: 0,
    history: [],
    score: 0,
    startTime: Date.now()
  };

  // Příprava fronty otázek podle typu lekce
  if (modeType === 'learn') {
    // Vezmi max 5 neznámých slovíček
    const fresh = sess.words.filter(w => isNew(w.id)).slice(0, 5);
    if (fresh.length === 0) {
      toast('Všechna slovíčka z tohoto tématu už znáš! Spouštím procvičování.');
      sess.mode = 'choice';
      sess.queue = sess.words.sort(() => 0.5 - Math.random()).slice(0, 10);
    } else {
      sess.queue = fresh;
    }
  } else {
    // Zamíchej a vezmi 10 slov
    sess.queue = sess.words.sort(() => 0.5 - Math.random()).slice(0, 10);
  }

  showView('activity');
  renderQuestion();
}

function renderQuestion() {
  if (sess.index >= sess.queue.length) {
    finishSession();
    return;
  }

  const w = sess.queue[sess.index];
  const prog = $('#prog');
  prog.style.width = `${(sess.index / sess.queue.length) * 100}%`;
  $('#counter').textContent = `Otázka ${sess.index + 1} z ${sess.queue.length}`;

  const stage = $('#stage');
  stage.innerHTML = '';

  if (sess.mode === 'learn') {
    renderLearnCard(w, stage);
  } else if (sess.mode === 'choice') {
    renderChoiceCard(w, stage);
  } else if (sess.mode === 'write') {
    renderWriteCard(w, stage);
  } else if (sess.mode === 'speak') {
    renderSpeakCard(w, stage);
  }
}

function renderLearnCard(w, stage) {
  stage.innerHTML = `
    <div class="flash" id="fcard" onclick="this.classList.toggle('flip')">
      <div class="flash-inner">
        <div class="face front">
          <div class="word">${w.en}</div>
          <div class="sub">Klikni pro otočení</div>
        </div>
        <div class="face back-face">
          <div class="word">${w.cs}</div>
          ${w.ex ? `<div class="exlist"><div class="exs"><span>${w.ex}</span><em>${w.trans || ''}</em></div></div>` : ''}
        </div>
      </div>
    </div>
    <div class="knowbtns">
      <button class="kno" onclick="handleLearn(false)">Nevím</button>
      <button class="kyes" onclick="handleLearn(true)">Vím</button>
    </div>
  `;
}

function handleLearn(known) {
  const w = sess.queue[sess.index];
  grade(w.id, known);
  sess.index++;
  renderQuestion();
}

function renderChoiceCard(w, stage) {
  // Vygenerování distractorů (špatných odpovědí)
  const options = [w.cs];
  const pool = ALL.filter(x => x.id !== w.id).map(x => x.cs);
  while (options.length < 4 && pool.length > 0) {
    const rand = pool[Math.floor(Math.random() * pool.length)];
    if (!options.includes(rand)) options.push(rand);
  }
  options.sort(() => 0.5 - Math.random());

  stage.innerHTML = `
    <div class="qword">${w.en}</div>
    <div class="qsub">Vyber správný překlad:</div>
    <div class="opts" id="optBox"></div>
    <div class="feedback" id="qFeed"></div>
    <button class="btn big hidden" id="nextBtn" onclick="nextQuestion()">Pokračovat</button>
  `;

  const box = $('#optBox');
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = o;
    b.onclick = () => checkChoice(b, o, w.cs);
    box.appendChild(b);
  });
}

function checkChoice(btn, selected, correct) {
  const isCorrect = selected === correct;
  const w = sess.queue[sess.index];
  
  $$('.opt').forEach(b => b.disabled = true);
  
  if (isCorrect) {
    btn.classList.add('correct');
    $('#qFeed').innerHTML = '<span class="ok">Správně! 🎉</span>';
    sess.score++;
    grade(w.id, true);
  } else {
    btn.classList.add('wrong');
    $$('.opt').forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
    $('#qFeed').innerHTML = '<span class="bad">Chyba 😢</span>';
    grade(w.id, false);
  }

  // Automatické vyslovení anglického slovíčka
  speak(w.en);

  $('#nextBtn').classList.remove('hidden');
}

function renderWriteCard(w, stage) {
  stage.innerHTML = `
    <div class="qword">${w.cs}</div>
    <div class="qsub">Napiš anglický překlad:</div>
    <div class="typerow">
      <input type="text" class="tinput" id="wInput" autocomplete="off" autofocus>
      <button class="btn" id="wCheck" onclick="checkWrite()">Zkontrolovat</button>
    </div>
    <div class="feedback" id="qFeed"></div>
    <button class="btn big hidden" id="nextBtn" onclick="nextQuestion()">Pokračovat</button>
  `;

  $('#wInput').onkeydown = (e) => { if (e.key === 'Enter') checkWrite(); };
}

function checkWrite() {
  const input = $('#wInput');
  const userAns = input.value.trim().toLowerCase();
  const w = sess.queue[sess.index];
  const correctAns = w.en.toLowerCase();

  if (!userAns) return;

  input.disabled = true;
  $('#wCheck').disabled = true;

  if (userAns === correctAns) {
    input.style.borderColor = 'var(--ok)';
    $('#qFeed').innerHTML = '<span class="ok">Perfektní! 🌟</span>';
    sess.score++;
    grade(w.id, true);
  } else {
    input.style.borderColor = 'var(--bad)';
    $('#qFeed').innerHTML = `<span class="bad">Správně je: <b>${w.en}</b></span>`;
    grade(w.id, false);
  }

  speak(w.en);
  $('#nextBtn').classList.remove('hidden');
}

function renderSpeakCard(w, stage) {
  stage.innerHTML = `
    <div class="qword">${w.en}</div>
    <div class="qsub">Stiskni mikrofon a vyslov slovíčko nahlas:</div>
    <button class="micbtn" id="micBtn" onclick="toggleListening()">🎤</button>
    <div class="feedback" id="qFeed"></div>
    <button class="btn big hidden" id="nextBtn" onclick="nextQuestion()">Pokračovat</button>
  `;
}

function toggleListening() {
  if (!SR) {
    toast('Rozpoznávání řeči není v tomto prohlížeči podporováno.');
    return;
  }

  const btn = $('#micBtn');
  const w = sess.queue[sess.index];

  if (btn.classList.contains('rec')) {
    stopRec();
    btn.classList.remove('rec');
  } else {
    btn.classList.add('rec');
    $('#qFeed').textContent = 'Poslouchám... Speak now.';
    
    rec = new SR();
    rec.lang = (LANG_INFO[curTgt()] || LANG_INFO.en).tts;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const result = e.results[0][0].transcript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      const target = w.en.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      
      btn.classList.remove('rec');
      stopRec();

      if (result === target) {
        $('#qFeed').innerHTML = `<span class="ok">Skvělá výslovnost! ("${e.results[0][0].transcript}")</span>`;
        sess.score++;
        grade(w.id, true);
      } else {
        $('#qFeed').innerHTML = `<span class="bad">Slyšel jsem: "${e.results[0][0].transcript}" -> Zkus to znovu nebo pokračuj.</span>`;
        grade(w.id, false);
      }
      $('#nextBtn').classList.remove('hidden');
    };

    rec.onerror = () => {
      btn.classList.remove('rec');
      $('#qFeed').textContent = 'Nerozuměl jsem, zkus to znovu.';
      stopRec();
    };

    rec.start();
  }
}

function nextQuestion() {
  sess.index++;
  renderQuestion();
}

function quitSession() {
  if (confirm('Opravdu chceš ukončit lekci? Tvůj dosavadní postup bude uložen.')) {
    goHome();
  }
}

function finishSession() {
  const duration = Math.round((Date.now() - sess.startTime) / 1000);
  const xpGained = sess.score * 2;
  addXP(xpGained);

  const stage = $('#stage');
  stage.innerHTML = `
    <div class="result">
      <div class="score">${Math.round((sess.score / sess.queue.length) * 100)}%</div>
      <div class="stars">${'★'.repeat(Math.ceil(sess.score / 3.4))}${'☆'.repeat(3 - Math.ceil(sess.score / 3.4))}</div>
      <h3>Lekce dokončena!</h3>
      <div class="rowstat">
        <div>Získáno: <b>+${xpGained} XP</b></div>
        <div>Správně: <b>${sess.score} z ${sess.queue.length}</b></div>
        <div>Čas: <b>${duration}s</b></div>
      </div>
      <button class="btn big" onclick="goHome()">Zpět na přehled</button>
    </div>
  `;
  
  $('#counter').textContent = '';
  $('#prog').style.width = '100%';
  checkMilestones();
}

// --- 5. SPECIÁLNÍ MÓDY (SRS OPAKOVÁNÍ, EXPERT / MIX, STATISTIKY) ---
function startReview() {
  const due = dueWords();
  if (due.length === 0) {
    toast('Nemáš žádná slovíčka k opakování. Skvělá práce!');
    return;
  }
  sess = {
    catId: 'review', mode: S.settings.fill === 'hard' ? 'write' : 'choice',
    queue: due.sort(() => 0.5 - Math.random()).slice(0, 12),
    index: 0, score: 0, startTime: Date.now()
  };
  showView('activity');
  renderQuestion();
}

function startProblem() {
  const probs = problemWords();
  if (probs.length === 0) {
    toast('Nemáš žádná problémová slovíčka! Jen tak dál.');
    return;
  }
  sess = {
    catId: 'problem', mode: 'choice',
    queue: probs.sort(() => 0.5 - Math.random()).slice(0, 10),
    index: 0, score: 0, startTime: Date.now()
  };
  showView('activity');
  renderQuestion();
}

function startMixed() {
  if (ALL.length === 0) return;
  sess = {
    catId: 'mixed', mode: Math.random() > 0.5 ? 'choice' : 'write',
    queue: ALL.sort(() => 0.5 - Math.random()).slice(0, 15),
    index: 0, score: 0, startTime: Date.now()
  };
  showView('activity');
  renderQuestion();
}

function start5min() {
  if (ALL.length === 0) return;
  sess = {
    catId: '5min', mode: 'choice',
    queue: ALL.sort(() => 0.5 - Math.random()).slice(0, 8),
    index: 0, score: 0, startTime: Date.now()
  };
  showView('activity');
  renderQuestion();
}

function startPlacement() {
  // Rozřazovací test napříč všemi úrovněmi
  const testWords = [];
  const pack = window.LANG_DATA[curPair()];
  if (!pack || !pack.levels) return;

  ALL_LEVELS.forEach(lvl => {
    const cats = Object.keys(pack.levels).filter(k => pack.levels[k].level === lvl);
    if (cats.length > 0) {
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      const words = pack.levels[randomCat].words || [];
      if (words.length > 0) {
        // Vezmi 3 náhodná slova z dané úrovně do testu
        const sampled = words.sort(() => 0.5 - Math.random()).slice(0, 3);
        sampled.forEach(w => { w._testLvl = lvl; testWords.push(w); });
      }
    }
  });

  sess = {
    catId: 'placement',
    mode: 'choice',
    queue: testWords,
    index: 0,
    score: 0,
    levelScores: {},
    startTime: Date.now()
  };

  ALL_LEVELS.forEach(l => sess.levelScores[l] = { total: 0, correct: 0 });
  
  showView('activity');
  // Přepsání chování dokončení pro účely vyhodnocení testu
  sess.customFinish = finishPlacementTest;
  renderQuestion();
}

function finishPlacementTest() {
  sess.queue.forEach((w, idx) => {
    const lvl = w._testLvl;
    sess.levelScores[lvl].total++;
    // Zde orientačně počítáme úspěšnost (pokud uživatel klikal správně)
    // Protože u standardního grade se inkrementuje S.stats, musíme vyhodnotit lokálně v sess
  });

  // Určení nejvhodnější úrovně (poslední úroveň, kde měl uživatel aspoň 66 % správně)
  let recommended = 'A1';
  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const l = ALL_LEVELS[i];
    const score = sess.levelScores[l];
    // V simulaci/testu počítáme reálné skóre. Pro jednoduchost vezmeme celkové dosažené skóre.
    if (sess.score >= (i * 3) + 2) {
      recommended = l;
    }
  }

  S.settings.maxUnlockedByPair = S.settings.maxUnlockedByPair || {};
  S.settings.maxUnlockedByPair[curPair()] = recommended;
  S.settings.level = recommended;
  persist();

  const stage = $('#stage');
  stage.innerHTML = `
    <div class="result">
      <div class="score">${recommended}</div>
      <h3>Tvoje doporučená úroveň</h3>
      <p class="lead" style="padding:0; text-align:center;">Na základě tvých odpovědí jsme ti odemkli úroveň ${recommended}. Můžeš začít plnit úkoly.</p>
      <button class="btn big" onclick="goHome()">Vstoupit do studia</button>
    </div>
  `;
}

// Interceptor pro odchycení konce rozřazovacího testu
const originalFinishSession = finishSession;
finishSession = function() {
  if (sess && sess.customFinish) {
    sess.customFinish();
  } else {
    originalFinishSession();
  }
};

function openStats() {
  showView('stats');
  const grid = $('#statGrid');
  grid.innerHTML = `
    <div class="stat"><div class="n">${S.stats.c + S.stats.w}</div><div class="l">Celkem odpovědí</div></div>
    <div class="stat"><div class="n">${learnedCount()}</div><div class="l">Naučených slov (SRS)</div></div>
    <div class="stat"><div class="n">${S.daily.streak} dní</div><div class="l">Aktuální série</div></div>
    <div class="stat"><div class="n">${S.stats.bestDays || 0} dní</div><div class="l">Nejlepší série</div></div>
  `;

  const wList = $('#weakList');
  wList.innerHTML = '';
  const probs = problemWords().slice(0, 5);
  
  if (probs.length === 0) {
    wList.innerHTML = '<p class="lead" style="padding:0;">Nemáš žádná problémová slovíčka. Skvělé!</p>';
  } else {
    probs.forEach(w => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span><b>${w.en}</b> — ${w.cs}</span> <span class="pct bad">Problémové</span>`;
      wList.appendChild(row);
    });
  }
}

function resetProgress() {
  if (confirm('Opravdu chceš smazat veškerý svůj postup, XP a historii opakování? Tuto akci nelze vrátit.')) {
    localStorage.removeItem(stateKey(curProfileId));
    S = {};
    ensureStateDefaults();
    persist();
    rebuildWordIndex();
    goHome();
  }
}

// --- 6. ÚČTY A FIREBASE UI EVENTY ---
function openAccount() {
  showView('account');
  renderAccount();
}

function renderAccount() {
  const box = $('#account');
  box.innerHTML = '';

  if (fbUser) {
    box.innerHTML = `
      <button class="back" onclick="goHome()">← Zpět</button>
      <h2>Můj Účet</h2>
      <p class="lead" style="padding:0;">Přihlášen jako: <b>${fbUser.email}</b></p>
      <div class="note" id="cloudStat">${cloudStat || 'Synchronizace s cloudem je aktivní.'}</div>
      
      <h3 style="margin-top:20px;">Změna hesla</h3>
      <div class="setline" style="margin-bottom:10px;">
        <input type="password" class="tinput" id="cpCur" placeholder="Současné heslo">
      </div>
      <div class="setline" style="margin-bottom:14px;">
        <input type="password" class="tinput" id="cpNew" placeholder="Nové heslo (min. 6 znaků)">
      </div>
      <button class="btn" onclick="fbChangePass()">Aktualizovat heslo</button>
      
      <hr style="margin:20px 0; border:0; border-top:1px solid var(--line);">
      <button class="btn ghost" onclick="fbLogout()">Odhlásit se</button>
    `;
  } else {
    box.innerHTML = `
      <button class="back" onclick="goHome()">← Zpět</button>
      <h2>Cloudová synchronizace</h2>
      <p class="lead" style="padding:0;">Zaregistruj se nebo se přihlas, aby se tvůj pokrok ukládal na server a mohl/a ses učit na mobilu i počítači současně.</p>
      
      <div class="setline" style="margin-bottom:10px;">
        <input type="email" class="tinput" id="acEmail" placeholder="Tvůj e-mail">
      </div>
      <div class="setline" style="margin-bottom:14px;">
        <input type="password" class="tinput" id="acPass" placeholder="Heslo">
      </div>
      
      <div class="rowbtns">
        <button class="btn" onclick="fbLogin()">Přihlásit se</button>
        <button class="btn ghost" onclick="fbRegister()">Vytvořit účet</button>
      </div>
    `;
  }
}

function fbLogin() {
  if (!fbAuth) return;
  const em = ($('#acEmail').value || '').trim();
  const pw = $('#acPass').value || '';
  if (!em || !pw) return toast('Vyplň e-mail a heslo');

  fbAuth.signInWithEmailAndPassword(em, pw)
    .then(() => { toast('Úspěšně přihlášeno! 🎉'); })
    .catch(e => { toast('Chyba přihlášení: ' + fbErr(e)); });
}

function fbLogout() {
  if (!fbAuth) return;
  fbAuth.signOut().then(() => {
    fbUser = null;
    toast('Odhlášeno');
    renderAccount();
  });
}

function reloadFromStorage() {
  S = load();
  ensureStateDefaults();
}

// --- 7. GLOBÁLNÍ UI PRVKY & INICIALIZACE ---
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function updateHeader() {
  $('#hLevel').textContent = level();
  $('#hXp').textContent = S.xp;
  $('#hDays').textContent = S.daily.streak || 0;
  
  // Přepínače nastavení v sidebaru
  const dirBtn = $(`#segDir button[data-v="${S.settings.dir}"]`);
  if (dirBtn) { $$('#segDir button').forEach(b => b.classList.remove('on')); dirBtn.classList.add('on'); }
  
  const fillBtn = $(`#segFill button[data-v="${S.settings.fill}"]`);
  if (fillBtn) { $$('#segFill button').forEach(b => b.classList.remove('on')); fillBtn.classList.add('on'); }

  const goalBtn = $(`#segGoal button[data-v="${S.settings.goal}"]`);
  if (goalBtn) { $$('#segGoal button').forEach(b => b.classList.remove('on')); goalBtn.classList.add('on'); }

  // Počítadla v sidebaru
  $('#dueCount').textContent = dueWords().length;
  $('#probCount').textContent = problemWords().length;
}

function renderMission() {
  $('#mLevel').textContent = level();
  $('#mXp').textContent = S.xp;
  $('#mToNext').textContent = toNext();
  $('#mDays').textContent = S.daily.streak || 0;
  $('#mLevelBar').style.width = `${levelProgress() * 100}%`;

  $('#ringDone').textContent = S.daily.done;
  $('#ringGoal').textContent = S.settings.goal;
  
  const pct = Math.min(100, (S.daily.done / S.settings.goal) * 100);
  $('#ring').style.setProperty('--p', pct);
}

function renderAch() {
  // Prázdná pomocná funkce pro render úspěchů na hlavní obrazovce, pokud je vyžadováno
}

// Inicializace event listenerů pro sidebar nastavení
function initSettingsListeners() {
  $$('#segDir button').forEach(b => {
    b.onclick = () => { S.settings.dir = b.getAttribute('data-v'); persist(); updateHeader(); };
  });
  $$('#segFill button').forEach(b => {
    b.onclick = () => { S.settings.fill = b.getAttribute('data-v'); persist(); updateHeader(); };
  });
  $$('#segGoal button').forEach(b => {
    b.onclick = () => { S.settings.goal = parseInt(b.getAttribute('data-v'), 10); persist(); renderMission(); updateHeader(); };
  });
  
  $('#themeBtn').onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    S.settings.theme = next;
    persist();
  };
  
  $('#startDaily').onclick = () => {
    if (dueWords().length > 0) startReview();
    else startMixed();
  };
}

// HLAVNÍ SPOUŠTĚČ APLIKACE
function init() {
  initFirebase();
  S = load();
  ensureStateDefaults();
  
  // Nastavení uloženého vizuálního tématu
  document.documentElement.setAttribute('data-theme', S.settings.theme || 'dark');
  
  initSettingsListeners();

  // Načtení výchozího jazykového balíčku
  loadLangPack(curPair(), success => {
    rebuildWordIndex();
    ensureDaily();
    translateDOM();
    goHome();
  });
}

// Odstartujeme celou aplikaci po načtení DOMu
window.addEventListener('DOMContentLoaded', init);
