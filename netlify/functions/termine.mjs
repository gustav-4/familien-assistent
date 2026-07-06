/**
 * Termin-Speicher (Server-Funktion)
 * ---------------------------------
 * Sichert Termine, Routinen und Mitglieder pro Geraet im
 * Upstash-Speicher (Frankfurt). Grundlage fuer Phase 2
 * (Push-Erinnerungen bei geschlossener App) und Phase 3
 * (Familien-Sync per Code).
 *
 * GET  /api/termine?device=ID   -> gespeicherten Stand laden
 * POST /api/termine             -> { device, daten } speichern
 */

function antwort(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Speicher nicht konfiguriert");
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error("Speicher-Fehler " + r.status);
  return (await r.json()).result;
}

function cleanId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const device = cleanId(
        (event.queryStringParameters || {}).device);
      if (!device)
        return antwort(400, { success: false, error: "device fehlt" });
      const raw = await redis(["GET", "familie:" + device]);
      return antwort(200, {
        success: true,
        daten: raw ? JSON.parse(raw) : null,
      });
    }

    if (event.httpMethod === "POST") {
      let body;
      try { body = JSON.parse(event.body || "{}"); } catch {
        return antwort(400, { success: false, error: "Ungueltig" });
      }
      const device = cleanId(body.device);
      if (!device)
        return antwort(400, { success: false, error: "device fehlt" });

      const daten = body.daten || {};
      // Groessen-Limit: 200 Termine, 50 Routinen, 12 Mitglieder
      const sicher = {
        termine: (Array.isArray(daten.termine) ? daten.termine : [])
          .slice(0, 200),
        routinen: (Array.isArray(daten.routinen) ? daten.routinen : [])
          .slice(0, 50),
        mitglieder: (Array.isArray(daten.mitglieder) ? daten.mitglieder : [])
          .slice(0, 12),
        verbrauch: (daten.verbrauch && typeof daten.verbrauch === "object")
          ? daten.verbrauch : {},
        stand: new Date().toISOString(),
      };
      // Gesamtgroessen-Schutz (max ~200 KB pro Familie)
      if (JSON.stringify(sicher).length > 200000)
        return antwort(413, { success: false, error: "Daten zu gross" });
      await redis(["SET", "familie:" + device, JSON.stringify(sicher)]);
      return antwort(200, { success: true });
    }

    return antwort(405, { success: false, error: "Methode nicht erlaubt" });
  } catch (e) {
    return antwort(500, { success: false,
      error: String(e.message || e).slice(0, 150) });
  }
};
