/**
 * Push-Anmeldung: speichert die Zustell-Adresse des Geraets.
 * Enthaelt KEINE Inhalte - nur die technische Browser-Adresse,
 * an die der stumme Wecker spaeter klingelt.
 */

async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Speicher nicht konfiguriert");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token,
      "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error("Speicher-Fehler " + r.status);
  return (await r.json()).result;
}

function cleanId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

export const handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers,
      body: JSON.stringify({ success: false, error: "Nur POST" }) };
  try {
    const body = JSON.parse(event.body || "{}");
    const device = cleanId(body.device);
    const sub = body.subscription;
    if (!device || !sub || !sub.endpoint ||
        !String(sub.endpoint).startsWith("https://"))
      return { statusCode: 400, headers,
        body: JSON.stringify({ success: false, error: "Ungueltig" }) };

    await redis(["SET", "sub:" + device,
      JSON.stringify(sub).slice(0, 4000)]);
    await redis(["SADD", "geraete", device]);
    return { statusCode: 200, headers,
      body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers,
      body: JSON.stringify({ success: false,
        error: String(e.message || e).slice(0, 150) }) };
  }
};
