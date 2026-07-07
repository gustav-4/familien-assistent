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

/** Kanal-Kennung aus dem Familien-Code: Der Server kennt nur den
 * HASH - niemals den Code selbst (der ist zugleich der E2E-Schluessel
 * der Familie; Klartexte erreichen den Server nie). */
import crypto from "node:crypto";
function kanalVonCode(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!/^FAM-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(c)) return null;
  return crypto.createHash("sha256").update("ka1|" + c)
    .digest("hex").slice(0, 32);
}

export const handler = async (event) => {
  try {
    // ============ FAMILIEN-SYNC (Plus, E2E-verschluesselt) ============
    // GET  ?code=FAM-...            -> { plus, blob, stand }
    // POST { code, blob, stand }    -> speichern (nur freigeschaltet)
    // POST { admin_token, plus_freischalten: true } -> neuen Code erzeugen
    const q = event.queryStringParameters || {};
    if (event.httpMethod === "GET" && q.code) {
      const kanal = kanalVonCode(q.code);
      if (!kanal) return antwort(400, { success: false,
        error: "Code-Format ungültig" });
      const [plus, raw] = await Promise.all([
        redis(["GET", "plus:" + kanal]),
        redis(["GET", "sync:" + kanal]),
      ]);
      if (!plus) return antwort(402, { success: false, plus: false,
        error: "Dieser Familien-Code ist nicht freigeschaltet." });
      const d = raw ? JSON.parse(raw) : null;
      return antwort(200, { success: true, plus: true,
        blob: d ? d.blob : null, stand: d ? d.stand : 0 });
    }

    if (event.httpMethod === "POST") {
      let körper;
      try { körper = JSON.parse(event.body || "{}"); } catch {
        return antwort(400, { success: false, error: "Ungueltig" });
      }

      // Betreiber: neuen Plus-Code erzeugen (nach Zahlungseingang)
      if (körper.plus_freischalten === true) {
        const soll = process.env.ADMIN_TOKEN;
        if (!soll || körper.admin_token !== soll)
          return antwort(401, { success: false, error: "Kein Zugriff" });
        const Z = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne I,O,0,1
        const teil = (n) => Array.from(crypto.randomBytes(n))
          .map((b) => Z[b % Z.length]).join("");
        const code = "FAM-" + teil(5) + "-" + teil(5);
        await redis(["SET", "plus:" + kanalVonCode(code), "1"]);
        return antwort(200, { success: true, code });
      }

      // Familie: verschluesselten Stand speichern
      if (körper.code) {
        const kanal = kanalVonCode(körper.code);
        if (!kanal) return antwort(400, { success: false,
          error: "Code-Format ungültig" });
        const plus = await redis(["GET", "plus:" + kanal]);
        if (!plus) return antwort(402, { success: false, plus: false,
          error: "Dieser Familien-Code ist nicht freigeschaltet." });
        const blob = String(körper.blob || "");
        if (!blob || blob.length > 250000)
          return antwort(413, { success: false,
            error: "Daten fehlen oder zu groß" });
        const stand = Number(körper.stand) || Date.now();
        await redis(["SET", "sync:" + kanal,
          JSON.stringify({ blob, stand })]);
        return antwort(200, { success: true, stand });
      }
    }

    // ============ Alt-API (pro Geraet) unveraendert ============
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
