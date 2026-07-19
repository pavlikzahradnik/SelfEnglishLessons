/* ===== Firebase Sync & Auth ===== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAAYYkEVxwZvtjNHGh0RwCYg93J2Rqdv0k",
  authDomain: "selfenglishlessons.firebaseapp.com",
  projectId: "selfenglishlessons",
  storageBucket: "selfenglishlessons.firebasestorage.app",
  messagingSenderId: "324188722820",
  appId: "1:324188722820:web:9de207cda63986b2a994d1",
  measurementId: "G-K2SBZ8YFFJ"
};

const FIREBASE_READY = !!FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('VLOZ') !== 0;
let fbAuth = null, fbDb = null, fbUser = null, cloudTimer = null, cloudStat = '';

function initFirebase() {
  if (!FIREBASE_READY || typeof firebase === 'undefined') return;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth(); fbDb = firebase.firestore();
    fbAuth.onAuthStateChanged(function (u) { fbUser = u; onAuthChange(); });
  } catch (e) { }
}

function gatherLocal() { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('anj_') === 0) o[k] = localStorage.getItem(k); } return o; }
function applyLocal(o) { Object.keys(o).forEach(function (k) { try { localStorage.setItem(k, o[k]); } catch (e) { } }); }
function setCloudStat(s) { cloudStat = s; const el = $('#cloudStat'); if (el) el.textContent = s; }
function scheduleCloudSave() { if (!fbUser || !fbDb) return; clearTimeout(cloudTimer); cloudTimer = setTimeout(cloudSave, 1500); }

function cloudSave() {
  if (!fbUser || !fbDb) return;
  setCloudStat(tr('Ukládám do cloudu…'));
  fbDb.collection('users').doc(fbUser.uid).set({ data: gatherLocal(), updatedAt: Date.now() }).then(function () { setCloudStat(tr('Uloženo') + ' ' + new Date().toLocaleTimeString()); }).catch(function () { setCloudStat(tr('Chyba ukládání (zkontroluj pravidla Firestore)')); });
}

function cloudLoad(cb) { if (!fbUser || !fbDb) { cb && cb(false); return; } fbDb.collection('users').doc(fbUser.uid).get().then(function (doc) { if (doc.exists && doc.data() && doc.data().data) { applyLocal(doc.data().data); cb && cb(true); } else { cb && cb(false); } }).catch(function () { setCloudStat(tr('Chyba načítání')); cb && cb(false); }); }

function onAuthChange() {
  renderAccount();
  if (fbUser) {
    cloudLoad(function (had) {
      if (had) { reloadFromStorage(); setCloudStat(tr('Načteno z cloudu ✓')); }
      else { cloudSave(); }
      renderAccount();
    });
  }
}

function fbChangePass() {
  if (!fbUser) return;
  const cur = ($('#cpCur').value || ''), pw = ($('#cpNew').value || '');
  if (!cur) return toast(tr('Zadej současné heslo'));
  if (pw.length < 6) return toast(tr('Nové heslo musí mít aspoň 6 znaků'));
  function doUpdate() {
    fbUser.updatePassword(pw).then(function () {
      toast(tr('Heslo změněno ✓'));
      const a = $('#cpCur'), b = $('#cpNew'); if (a) a.value = ''; if (b) b.value = '';
    }).catch(function (e) { toast('Chyba: ' + fbErr(e)); });
  }
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, cur);
    fbUser.reauthenticateWithCredential(cred).then(doUpdate).catch(function (e) {
      const c = (e && e.code) || '';
      if (c.indexOf('wrong-password') >= 0 || c.indexOf('invalid-cred') >= 0) toast(tr('Současné heslo je špatně'));
      else toast('Chyba: ' + fbErr(e));
    });
  } catch (e) { doUpdate(); }
}

function fbErr(e) { const c = (e && e.code) || ''; if (c.indexOf('wrong-password') >= 0 || c.indexOf('invalid-cred') >= 0) return tr('špatný e-mail nebo heslo'); if (c.indexOf('user-not-found') >= 0) return tr('účet neexistuje'); if (c.indexOf('email-already') >= 0) return tr('e-mail už je použit'); if (c.indexOf('weak-password') >= 0) return tr('slabé heslo (min. 6 znaků)'); if (c.indexOf('invalid-email') >= 0) return tr('neplatný e-mail'); return (e && e.message) || tr('chyba'); }
function fbRegister() { if (!fbAuth) return; const em = ($('#acEmail').value || '').trim(), pw = $('#acPass').value || ''; if (!em || !pw) return toast(tr('Vyplň e-mail a heslo')); fbAuth.createUserWithEmailAndPassword(em, pw).then(function () { toast(tr('Účet vytvořen ✓')); }).catch(function (e) { toast('Chyba: ' + fbErr(e)); }); }
/* Pokračování metod fbLogin, fbResetPass a fbLogout najdeš v app.js navázané na UI prvků */