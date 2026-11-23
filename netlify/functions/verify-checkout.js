/* Stripe-Session serverseitig validieren
   Erwartet POST { session_id: string, plan: "monat"|"jahr"|"lifetime" }
   Gibt zurueck: { valid: true, plan, expires_at } oder { error: string }
*/
exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  let session_id, plan;
  try {
    const body = JSON.parse(event.body || '{}');
    session_id = (body.session_id || '').replace(/[^a-zA-Z0-9_]/g, '');
    plan = body.plan;
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const VALID_PLANS = ['monat', 'jahr', 'lifetime'];
  if (!session_id || !VALID_PLANS.includes(plan)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid parameters' }) };
  }

  const PLAN_MS = {
    monat:    30  * 24 * 60 * 60 * 1000,
    jahr:     365 * 24 * 60 * 60 * 1000,
    lifetime: 100 * 365 * 24 * 60 * 60 * 1000
  };

  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session_id}`,
      { headers: { Authorization: `Bearer ${STRIPE_KEY}` } }
    );

    if (!res.ok) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Session not found' }) };
    }

    const session = await res.json();

    if (session.payment_status !== 'paid') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment not completed' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        plan: plan,
        expires_at: Date.now() + PLAN_MS[plan]
      })
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Verification failed' }) };
  }
};
