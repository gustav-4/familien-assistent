/* B2B-Codes und Geschenkcodes serverseitig validieren
   Erwartet POST { code: string }
   Gibt zurueck: { valid: true, plan, expires_at } oder { valid: false }

   B2B_CODES  - kommasepariert, kein Suffix       -> immer lifetime, kein Single-Use
   GIFT_CODES - kommasepariert, Format CODE:plan  -> z.B. WEIHN25-XK9P:jahr
                Geschenkcodes sind single-use via Upstash Redis (SETNX - atomar)
*/
exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let code;
  try {
    const body = JSON.parse(event.body || '{}');
    code = (body.code || '').trim().toUpperCase();
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!code) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
  }

  const PLAN_MS = {
    monat:    30  * 24 * 60 * 60 * 1000,
    jahr:     365 * 24 * 60 * 60 * 1000,
    lifetime: 100 * 365 * 24 * 60 * 60 * 1000
  };

  /* 1. B2B-Codes pruefen (immer lifetime, kein Single-Use) */
  const rawB2B = process.env.B2B_CODES || '';
  const b2bCodes = rawB2B.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
  if (b2bCodes.includes(code)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        plan: 'lifetime',
        expires_at: Date.now() + PLAN_MS.lifetime
      })
    };
  }

  /* 2. Geschenkcode-Format validieren (CODE:plan in GIFT_CODES) */
  const rawGift = process.env.GIFT_CODES || '';
  const giftEntries = rawGift.split(',').map(e => e.trim()).filter(Boolean);

  let matchedPlan = null;
  for (const entry of giftEntries) {
    const colonIdx = entry.lastIndexOf(':');
    if (colonIdx === -1) continue;
    const entryCode = entry.slice(0, colonIdx).toUpperCase();
    const entryPlan = entry.slice(colonIdx + 1).toLowerCase();
    if (entryCode === code && PLAN_MS[entryPlan] !== undefined) {
      matchedPlan = entryPlan;
      break;
    }
  }

  if (!matchedPlan) {
    return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
  }

  /* 3. Single-Use via Redis SETNX (atomar - verhindert Doppeleinloesung) */
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('UPSTASH_REDIS nicht konfiguriert - kein Single-Use-Schutz aktiv');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    /* SETNX: setzt den Key nur wenn er noch nicht existiert (atomar).
       result === 1 -> erster Aufruf (einloesen)
       result === 0 -> Code wurde bereits eingeloest (ablehnen) */
    const setnxRes = await fetch(
      `${redisUrl}/setnx/${encodeURIComponent('gift:' + code)}/1`,
      { headers: { Authorization: `Bearer ${redisToken}` } }
    );
    const setnxData = await setnxRes.json();

    if (setnxData.result !== 1) {
      return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        plan: matchedPlan,
        expires_at: Date.now() + PLAN_MS[matchedPlan]
      })
    };
  } catch(e) {
    /* Redis-Fehler: sicherheitshalber ablehnen (fail-closed) */
    return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
  }
};
