/* ═══════════════════════════════════════════════════════════════════════
   Familien-Assistent – Lizenz-Funktion
   GET  /.netlify/functions/lizenz?id=DEVICE_ID  → Lizenzstatus prüfen
   POST /.netlify/functions/lizenz               → Stripe-Webhook empfangen
   ═══════════════════════════════════════════════════════════════════════ */

const { getStore } = require('@netlify/blobs');
const crypto       = require('crypto');

const TAG = '[lizenz]';

exports.handler = async function(event) {
  if (event.httpMethod === 'GET')  return handleGet(event);
  if (event.httpMethod === 'POST') return handleWebhook(event);
  return { statusCode: 405, body: 'Method Not Allowed' };
};

/* ── GET: Lizenzstatus abfragen ─────────────────────────────────────── */
async function handleGet(event) {
  const deviceId = (event.queryStringParameters || {}).id || '';
  if (deviceId.length < 8) return json({ aktiv: false });

  try {
    const store = getStore('lizenzen');
    const raw   = await store.get(deviceId);
    if (!raw) return json({ aktiv: false });

    const lizenz = JSON.parse(raw);
    if (lizenz.ablauf && Date.now() > lizenz.ablauf) {
      return json({ aktiv: false });
    }
    return json({ aktiv: true, ablauf: lizenz.ablauf, plan: lizenz.plan });
  } catch (e) {
    console.error(TAG, 'GET Fehler:', e.message);
    return json({ aktiv: false });
  }
}

/* ── POST: Stripe-Webhook ───────────────────────────────────────────── */
async function handleWebhook(event) {
  const sig    = event.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return { statusCode: 400, body: 'Fehlende Konfiguration' };

  let stripeEvent;
  try {
    stripeEvent = verifyAndParse(event.body, sig, secret);
  } catch (e) {
    console.error(TAG, 'Signatur ungültig:', e.message);
    return { statusCode: 400, body: 'Ungültige Signatur' };
  }

  const lizenzen   = getStore('lizenzen');
  const subMapping = getStore('sub-mapping');
  const type       = stripeEvent.type;
  const obj        = stripeEvent.data.object;

  console.log(TAG, 'Event:', type);

  try {
    if (type === 'checkout.session.completed') {
      const deviceId       = obj.client_reference_id;
      const subscriptionId = obj.subscription;
      if (!deviceId) return ok();

      const MONAT_MS = 30  * 24 * 60 * 60 * 1000;
      const JAHR_MS  = 365 * 24 * 60 * 60 * 1000;

      let plan   = 'lifetime';
      let ablauf = Date.now() + 100 * JAHR_MS;

      if (subscriptionId) {
        plan   = (obj.amount_total || 0) < 1500 ? 'monat' : 'jahr';
        ablauf = Date.now() + (plan === 'monat' ? MONAT_MS : JAHR_MS);
        await subMapping.set(subscriptionId, deviceId);
      }

      await lizenzen.set(deviceId, JSON.stringify({ aktiv: true, plan, ablauf }));
      console.log(TAG, 'Neue Lizenz:', deviceId, plan);
    }

    else if (type === 'invoice.payment_succeeded') {
      const subscriptionId = obj.subscription;
      if (!subscriptionId) return ok();

      const deviceId = await subMapping.get(subscriptionId);
      if (!deviceId) return ok();

      const periodEnd = obj.lines?.data?.[0]?.period?.end;
      const ablauf    = periodEnd
        ? periodEnd * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000;

      const existing = await lizenzen.get(deviceId);
      const lizenz   = existing ? JSON.parse(existing) : { plan: 'monat' };
      await lizenzen.set(deviceId, JSON.stringify({ ...lizenz, aktiv: true, ablauf }));
      console.log(TAG, 'Verlängert:', deviceId, 'bis', new Date(ablauf).toISOString());
    }

    else if (type === 'customer.subscription.deleted') {
      const subscriptionId = obj.id;
      const deviceId       = await subMapping.get(subscriptionId);
      if (!deviceId) return ok();

      const ablauf   = (obj.current_period_end || 0) * 1000;
      const existing = await lizenzen.get(deviceId);
      const lizenz   = existing ? JSON.parse(existing) : {};
      await lizenzen.set(deviceId, JSON.stringify({
        ...lizenz,
        aktiv:  ablauf > Date.now(),
        ablauf
      }));
      console.log(TAG, 'Kündigung:', deviceId, 'läuft bis', new Date(ablauf).toISOString());
    }

  } catch (e) {
    console.error(TAG, 'Verarbeitungsfehler:', e.message);
    return { statusCode: 500, body: 'Interner Fehler' };
  }

  return ok();
}

/* ── Stripe-Signatur verifizieren (ohne SDK) ────────────────────────── */
function verifyAndParse(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const t  = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) throw new Error('Fehlende Signaturteile');

  const signedPayload = `${t}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))) {
    throw new Error('Signatur stimmt nicht überein');
  }
  return JSON.parse(payload);
}

/* ── Hilfsfunktionen ────────────────────────────────────────────────── */
function json(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}
function ok() { return { statusCode: 200, body: 'ok' }; }
