/* ===== Cloudflare Worker: AI proxy pro SelfEnglishLessons =====

   K čemu to je: API klíč nesmí být ve stránce (GitHub je veřejný). Tenhle Worker
   sedí mezi appkou a OpenAI — klíč zná jen on, appka o něm neví.

   ---------- NASAZENÍ (jednou, ~10 minut) ----------
   1) Založ si účet na cloudflare.com (zdarma).
   2) Workers & Pages → Create → Workers → Create Worker.
      Pojmenuj třeba "anj-ai". Deploy.
   3) Edit code → smaž vzorový kód → vlož celý tenhle soubor → Deploy.
   4) Settings → Variables and Secrets:
        OPENAI_KEY        (typ: Secret)  = tvůj klíč z platform.openai.com
        ALLOWED_ORIGINS   (typ: Text)    = https://pavlikzahradnik.github.io
                                           (víc adres odděl čárkou)
   5) Volitelné, ale doporučené — limit požadavků:
      Storage & Databases → KV → Create → jméno "RATE".
      Pak zpět ve Workeru: Settings → Bindings → Add → KV namespace,
      Variable name: RATE, KV namespace: RATE.
   6) Zkopíruj adresu Workeru (např. https://anj-ai.tvujucet.workers.dev)
      a vlož ji do ai.js do AI_CONFIG.endpoint.

   ---------- CO TO HLÍDÁ ----------
   - Klíč nikdy neopustí server.
   - Pouští jen požadavky z tvých adres (ALLOWED_ORIGINS).
   - Model i strop tokenů si určuje SERVER — klient si nemůže vyžádat
     dražší model. (Kdyby mohl, stačilo by ti to poslat účet.)
   - Limit na IP za den (když je zapnuté KV).
   - Omezená délka vstupu.
*/

const MODEL = 'gpt-4o-mini';   // server si model určuje sám, klientovi se nevěří
const MAX_TOKENS = 400;
const MAX_SYSTEM = 2000;       // znaků
const MAX_USER = 2000;
const DAILY_LIMIT = 200;       // požadavků na IP za den (jen s KV)

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), origin, env);
    if (request.method !== 'POST') return err(405, 'Method not allowed', origin, env);
    if (!originOk(origin, env)) return err(403, 'Origin not allowed', origin, env);
    if (!env.OPENAI_KEY) return err(500, 'Na serveru chybí OPENAI_KEY', origin, env);

    // ---- limit na IP ----
    const ip = request.headers.get('CF-Connecting-IP') || 'x';
    if (env.RATE) {
      const key = 'd:' + new Date().toISOString().slice(0, 10) + ':' + ip;
      const used = parseInt((await env.RATE.get(key)) || '0', 10);
      if (used >= DAILY_LIMIT) return err(429, 'Denní limit vyčerpán', origin, env);
      await env.RATE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });
    }

    // ---- vstup ----
    let body;
    try { body = await request.json(); } catch (e) { return err(400, 'Neplatný JSON', origin, env); }
    const system = String(body.system || '').slice(0, MAX_SYSTEM);
    const user = String(body.user || '').slice(0, MAX_USER);
    if (!user) return err(400, 'Prázdný dotaz', origin, env);

    // ---- OpenAI ----
    let r;
    try {
      r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OPENAI_KEY },
        body: JSON.stringify({
          model: MODEL,                 // pevně, ne z klienta
          max_tokens: MAX_TOKENS,       // pevně, ne z klienta
          temperature: 0.3,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
        })
      });
    } catch (e) {
      return err(502, 'Nepodařilo se spojit s AI', origin, env);
    }

    if (!r.ok) {
      const t = await r.text();
      let msg = 'AI vrátila chybu ' + r.status;
      try { const j = JSON.parse(t); msg = (j.error && j.error.message) || msg; } catch (e) {}
      // detaily o klíči ven neposíláme
      if (r.status === 401) msg = 'Chyba nastavení serveru';
      return err(r.status === 429 ? 429 : 502, msg, origin, env);
    }

    const data = await r.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    return cors(new Response(JSON.stringify({ text: text.trim() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }), origin, env);
  }
};

/* ---------- pomocné ---------- */
function allowedList(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
}
function originOk(origin, env) {
  const list = allowedList(env);
  if (!list.length) return false;          // nenastaveno = radši nepouštět nikoho
  return list.indexOf(origin) >= 0;
}
function cors(res, origin, env) {
  const list = allowedList(env);
  const allow = list.indexOf(origin) >= 0 ? origin : (list[0] || '');
  res.headers.set('Access-Control-Allow-Origin', allow);
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Max-Age', '86400');
  res.headers.set('Vary', 'Origin');
  return res;
}
function err(status, message, origin, env) {
  return cors(new Response(JSON.stringify({ error: { message: message } }),
    { status: status, headers: { 'Content-Type': 'application/json' } }), origin, env);
}
