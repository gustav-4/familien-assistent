/**
 * Feedback-Sammler (Testphase)
 * ----------------------------
 * Nimmt gesprochene/getippte Rueckmeldungen entgegen und legt sie
 * im Upstash-Speicher ab (Liste "feedback", max. 1000 Eintraege).
 *
 * LESEN (fuer den Betreiber): Upstash-Konsole -> Data Browser ->
 * Key "feedback" - kein extra Login noetig, kein Admin-Panel.
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

export const handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  // LESEN (Betreiber-Postfach): GET ?token=ADMIN_TOKEN
  if (event.httpMethod === "GET") {
    const soll = process.env.ADMIN_TOKEN;
    const ist = (event.queryStringParameters || {}).token || "";
    if (!soll || ist !== soll)
      return { statusCode: 401, headers,
        body: JSON.stringify({ success: false, error: "Kein Zugriff" }) };
    try {
      const roh = (await redis(["LRANGE", "feedback", "0", "199"])) || [];
      const eintraege = roh.map((s) => {
        try { return JSON.parse(s); } catch (e) { return { text: s }; }
      });
      return { statusCode: 200, headers,
        body: JSON.stringify({ success: true,
          anzahl: eintraege.length, eintraege }) };
    } catch (e) {
      return { statusCode: 500, headers,
        body: JSON.stringify({ success: false,
          error: String(e.message || e).slice(0, 100) }) };
    }
  }

  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers,
      body: JSON.stringify({ success: false }) };
  try {
    const body = JSON.parse(event.body || "{}");
    const text = String(body.text || "").trim().slice(0, 600);
    if (text.length < 3)
      return { statusCode: 400, headers,
        body: JSON.stringify({ success: false, error: "Zu kurz" }) };

    const eintrag = {
      text,
      bereich: String(body.tab || "?").slice(0, 20),
      geraet: String(body.device || "").slice(0, 40),
      zeit: new Date().toISOString(),
    };
    await redis(["LPUSH", "feedback", JSON.stringify(eintrag)]);
    await redis(["LTRIM", "feedback", "0", "999"]);
    return { statusCode: 200, headers,
      body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers,
      body: JSON.stringify({ success: false,
        error: String(e.message || e).slice(0, 100) }) };
  }
};
