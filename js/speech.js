/* ===== Audio & Speech Module ===== */
let VOICES = {};

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  Object.keys(LANG_INFO).forEach(function (l) {
    const tag = LANG_INFO[l].tts, base = l;
    VOICES[l] = vs.find(v => new RegExp(tag.replace('-', '[-_]'), 'i').test(v.lang)) ||
              vs.find(v => new RegExp('^' + base, 'i').test(v.lang)) || null;
  });
  const saved = S && S.settings && S.settings.voiceByTgt;
  if (saved) Object.keys(saved).forEach(function (l) {
    const v = vs.find(x => x.voiceURI === saved[l]);
    if (v) VOICES[l] = v;
  });
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function voiceList() {
  if (!('speechSynthesis' in window)) return [];
  const prefix = (LANG_INFO[curTgt()] || LANG_INFO.en).tts.split('-')[0];
  return speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(prefix));
}

function speak(txt, cb) {
  if (!('speechSynthesis' in window)) { cb && cb(); return; }
  speechSynthesis.cancel();
  const lang = curTgt();
  const u = new SpeechSynthesisUtterance(txt);
  u.lang = (LANG_INFO[lang] || LANG_INFO.en).tts; u.rate = .9;
  const v = VOICES[lang]; if (v) u.voice = v;
  if (cb) u.onend = cb;
  speechSynthesis.speak(u);
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

function stopRec() {
  try { if (rec) { rec.onresult = null; rec.onerror = null; rec.onend = null; rec.stop(); rec = null; } } catch (e) { }
}