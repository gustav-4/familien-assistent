/* B2B-Codes serverseitig validieren
   Erwartet POST { code: string }
   Gibt zurueck: { valid: true, plan, expires_at } oder { valid: false }
   Codes werden als kommaseparierte Liste in Netlify-Env-Var B2B_CODES gesetzt.
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

  const rawCodes = process.env.B2B_CODES || '';
  const validCodes = rawCodes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

  if (validCodes.includes(code)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        plan: 'lifetime',
        expires_at: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
      })
    };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ valid: false }) };
};
