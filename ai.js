/* ===== AI vrstva =====
   Záměrně oddělená od zbytku appky: index.html o poskytovateli nic neví,
   volá jen AI.ask(). Výměna OpenAI ↔ Claude ↔ vlastní backend = změna tady.

   ZAP/VYP řeší uživatel posuvníkem v Účtu — tady se nastavuje jen ZPŮSOB PŘIPOJENÍ:
     'key'    – klíč si zadá každý uživatel sám, uloží se jen do jeho prohlížeče.
                Dobré na testování. Klíč NIKDY nepatří do tohoto souboru —
                na GitHubu si ho může přečíst kdokoli.
     'proxy'  – DOPORUČENO pro ostrý provoz. Requesty jdou na tvůj endpoint
                (např. Cloudflare Worker) a klíč zůstane na serveru.
     'off'    – úplné vypnutí i s posuvníkem (kdybys AI nechtěl vůbec nabízet).
*/
(function () {
  const AI_CONFIG = {
    mode: 'soon',                      // 'soon' | 'proxy' | 'key' | 'off'
    endpoint: '',                      // SEM vlož adresu svého Workeru, např. 'https://anj-ai.tvujucet.workers.dev'
    provider: 'openai',                // pro 'key': 'openai' | 'anthropic'
    model: 'gpt-4o-mini',              // levný a na tohle bohatě stačí
    maxTokens: 400,
    timeoutMs: 20000
  };

  const KEY_LS = 'anj_ai_key';         // klíč uživatele (jen režim 'key')
  const CACHE_LS = 'anj_ai_cache';     // cache odpovědí, ať se neplatí dvakrát za totéž
  const CACHE_MAX = 200;

  /* ---------- cache ---------- */
  function cacheLoad() {
    try { return JSON.parse(localStorage.getItem(CACHE_LS) || '{}'); } catch (e) { return {}; }
  }
  function cacheGet(k) { return cacheLoad()[k] || null; }
  function cacheSet(k, v) {
    try {
      const c = cacheLoad();
      c[k] = v;
      const keys = Object.keys(c);
      if (keys.length > CACHE_MAX) keys.slice(0, keys.length - CACHE_MAX).forEach(x => delete c[x]);
      localStorage.setItem(CACHE_LS, JSON.stringify(c));
    } catch (e) { /* plné úložiště cache neřešíme */ }
  }
  function cacheClear() { try { localStorage.removeItem(CACHE_LS); } catch (e) {} }

  /* ---------- klíč uživatele ---------- */
  function userKey() { try { return localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; } }
  function setUserKey(k) {
    try { k ? localStorage.setItem(KEY_LS, k.trim()) : localStorage.removeItem(KEY_LS); } catch (e) {}
  }

  /* Je připojení nastavené? (O tom, jestli AI uživatel CHCE, rozhoduje posuvník v appce.) */
  /* Je AI schopná odeslat požadavek? (Nezávisí na tom, jestli ji uživatel chce —
     to hlídá posuvník v appce.) Pro 'soon' i 'off' vždy false. */
  function configured() {
    if (AI_CONFIG.mode === 'proxy') return !!AI_CONFIG.endpoint;
    if (AI_CONFIG.mode === 'key') return !!userKey();
    return false;
  }
  /* Smí se sekce v Účtu vůbec zobrazit? */
  function enabled() { return AI_CONFIG.mode !== 'off'; }
  /* Jen ukázka „připravujeme" — posuvník zamčený, nikam se nevolá. */
  function soon() { return AI_CONFIG.mode === 'soon'; }

  /* ---------- volání ---------- */
  function buildRequest(system, user) {
    if (AI_CONFIG.mode === 'proxy') {
      return {
        url: AI_CONFIG.endpoint,
        headers: { 'Content-Type': 'application/json' },
        body: { system: system, user: user, model: AI_CONFIG.model, maxTokens: AI_CONFIG.maxTokens }
      };
    }
    if (AI_CONFIG.provider === 'anthropic') {
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': userKey(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: { model: AI_CONFIG.model, max_tokens: AI_CONFIG.maxTokens, system: system,
                messages: [{ role: 'user', content: user }] }
      };
    }
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userKey() },
      body: { model: AI_CONFIG.model, max_tokens: AI_CONFIG.maxTokens,
              messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
    };
  }

  /* Odpověď rozbalíme tolerantně — každý poskytovatel má jiný tvar. */
  function extractText(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.text) return data.text;                                  // vlastní proxy
    if (data.reply) return data.reply;
    if (Array.isArray(data.content)) {                                 // Anthropic
      return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    }
    if (data.choices && data.choices[0]) {                             // OpenAI
      const m = data.choices[0].message;
      return (m && m.content) || data.choices[0].text || '';
    }
    return '';
  }

  function ask(system, user, cacheKey) {
    if (!configured()) return Promise.reject(new Error('AI není nastavená'));
    if (cacheKey) {
      const hit = cacheGet(cacheKey);
      if (hit) return Promise.resolve(hit);
    }
    const req = buildRequest(system, user);
    const ctrl = ('AbortController' in window) ? new AbortController() : null;
    const timer = setTimeout(function () { ctrl && ctrl.abort(); }, AI_CONFIG.timeoutMs);

    return fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) {
        return r.text().then(function (t) {
          let msg = 'HTTP ' + r.status;
          try { const j = JSON.parse(t); msg = (j.error && (j.error.message || j.error)) || msg; } catch (e) {}
          if (r.status === 401 || r.status === 403) msg = 'Neplatný nebo chybějící API klíč';
          if (r.status === 429) msg = 'Vyčerpaný limit požadavků — zkus to za chvíli';
          throw new Error(msg);
        });
      }
      return r.json();
    }).then(function (data) {
      const txt = extractText(data).trim();
      if (!txt) throw new Error('Prázdná odpověď');
      if (cacheKey) cacheSet(cacheKey, txt);
      return txt;
    }).catch(function (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Vypršel časový limit');
      throw e;
    });
  }

  window.AI = {
    config: AI_CONFIG,
    configured: configured,
    enabled: enabled,
    soon: soon,
    ask: ask,
    userKey: userKey,
    setUserKey: setUserKey,
    cacheClear: cacheClear
  };
})();
