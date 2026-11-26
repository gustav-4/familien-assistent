/* netlify/functions/verify-code.js
   Validiert B2B- und Geschenkcodes serverseitig.
   Erwartet POST { code: string }
   Gibt zurueck: { valid: true, plan, expires_at } oder { valid: false }

   Env-Variablen:
     GIFT_CODES               - kommasepariert, Format CODE:plan
                                Single-use via Redis SETNX (atomar)
                                Beispiel: XXXX-XXXX-XXXX-XXXX:jahr

     B2B_CODES                - kommasepariert, Format CODE:maxEinloesungen
                                Multi-use via Redis INCR, immer lifetime
                                Beispiel: YYYY-YYYY-YYYY-YYYY:10,...

     UPSTASH_REDIS_REST_URL   - Upstash Redis REST Endpoint (Pflicht)
     UPSTASH_REDIS_REST_TOKEN - Upstash Redis REST Token (Pflicht)

   Rate Limiting: 10 Versuche pro IP / 15 Minuten (fail-closed bei Redis-Fehler)
   Sicherheit:
     - Codes werden nie an den Client zurueckgegeben
     - Codes haben kein erkennbares Muster (zufaellig generiert)
     - Format-Validierung blockiert Brute-Force-Varianten
*/

exports.handler = async function (event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  /* -- Eingabe parsen ---------------------------------------------------- */
  let code;
  try {
    const body = JSON.parse(event.body || '{}');
    code = (body.code || '').trim().toUpperCase();
  } catch (_) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!code) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
  }

  /* -- Format-Validierung: XXXX-XXXX-XXXX-XXXX --------------------------- */
  const CODE_RE = /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  if (!CODE_RE.test(code)) {
    return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
  }

  /* -- Redis-Hilfsfunktion ----------------------------------------------- */
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('[verify-code] UPSTASH_REDIS nicht konfiguriert');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  async function redis(...args) {
    const path = args.map(a => encodeURIComponent(String(a))).join('/');
    const res  = await fetch(`${redisUrl}/${path}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
    return res.json();
  }

  /* -- Rate Limiting: 10 Versuche / IP / 15 Minuten --------------------- */
  const ip     = (event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const ratKey = `rate:vc:${ip}`;
  try {
    const incr = await redis('incr', ratKey);
    if (incr.result === 1) {
      await redis('expire', ratKey, 900);
    }
    if (incr.result > 10) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many attempts' }) };
    }
  } catch (e) {
    console.error('[verify-code] Rate-Limit Redis-Fehler:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service unavailable' }) };
  }

  /* -- Laufzeit-Tabelle -------------------------------------------------- */
  const PLAN_MS = {
    monat:    30  * 24 * 60 * 60 * 1000,
    jahr:     365 * 24 * 60 * 60 * 1000,
    lifetime: 100 * 365 * 24 * 60 * 60 * 1000
  };

  /* -- 1. GIFT_CODES - Single-Use via SETNX (atomar) -------------------- */
  const rawGift = process.env.GIFT_CODES || '';
  for (const entry of rawGift.split(',').map(e => e.trim()).filter(Boolean)) {
    const sep  = entry.lastIndexOf(':');
    if (sep === -1) continue;
    const entryCode = entry.slice(0, sep).toUpperCase();
    const entryPlan = entry.slice(sep + 1).toLowerCase();
    if (entryCode !== code || PLAN_MS[entryPlan] === undefined) continue;

    try {
      const setnx = await redis('setnx', `gift:${code}`, '1');
      if (setnx.result !== 1) {
        return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid:      true,
          plan:       entryPlan,
          expires_at: Date.now() + PLAN_MS[entryPlan]
        })
      };
    } catch (e) {
      console.error('[verify-code] Gift-Redis-Fehler:', e.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service unavailable' }) };
    }
  }

  /* -- 2. B2B_CODES - Multi-Use via INCR mit Limit, immer lifetime ------- */
  const rawB2B = process.env.B2B_CODES || '';
  for (const entry of rawB2B.split(',').map(e => e.trim()).filter(Boolean)) {
    const sep     = entry.lastIndexOf(':');
    if (sep === -1) continue;
    const entryCode = entry.slice(0, sep).toUpperCase();
    const maxUses   = Number.parseInt(entry.slice(sep + 1), 10);
    if (entryCode !== code || Number.isNaN(maxUses) || maxUses < 1) continue;

    try {
      const incr  = await redis('incr', `b2b:${code}`);
      const count = incr.result;

      if (count > maxUses) {
        await redis('decr', `b2b:${code}`);
        return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid:      true,
          plan:       'lifetime',
          expires_at: Date.now() + PLAN_MS.lifetime
        })
      };
    } catch (e) {
      console.error('[verify-code] B2B-Redis-Fehler:', e.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service unavailable' }) };
    }
  }

  /* -- Kein Code gefunden ------------------------------------------------ */
  return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
};
