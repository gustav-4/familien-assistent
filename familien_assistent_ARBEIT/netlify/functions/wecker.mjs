/**
 * Stummer Wecker - Plan-Verwaltung (Zero-Knowledge)
 * --------------------------------------------------
 * Der Server kennt NUR: Zufallsnummern (ref), Weckzeiten,
 * Wiederholungs-Minuten. Keine Titel, keine Namen, keine
 * Kategorien - die Klartexte existieren nur auf dem Geraet.
 *
 * POST {device, eintraege:[{ref,fireAt,endAt,repeatMin}]} -> Plan setzen
 * POST {device, bestaetige: ref}                          -> bestaetigen
 * POST {device, loeschen: true}                           -> ALLES loeschen
 * GET  ?device=X&due=1                                    -> faellige refs
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
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
}
function antwort(statusCode, obj) {
  return { statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj) };
}

/**
 * SENDE-Logik (nur fuer den Cron): beruecksichtigt die
 * Wiederhol-Sperre, damit nicht bei jedem Lauf erneut ein
 * Push-Signal rausgeht.
 */
export function faelligeRefs(plan, jetzt) {
  const refs = [];
  for (const e of plan.eintraege || []) {
    if ((plan.bestaetigt || []).includes(e.ref)) continue;
    if (jetzt < e.fireAt || jetzt > e.endAt + 5 * 60000) continue;
    const zuletzt = (plan.lastSent || {})[e.ref] || 0;
    if (jetzt - zuletzt < (e.repeatMin || 10) * 60000) continue;
    refs.push(e.ref);
  }
  return refs;
}

/**
 * ANZEIGE-Logik (fuer den GET-Abruf des Service Workers):
 * OHNE Wiederhol-Sperre.
 * BUGFIX: Der Cron setzt lastSent unmittelbar nach dem
 * Absenden. Bis das Push-Signal am Geraet ankommt und der
 * Service Worker nachfragt, ist die Sperre laengst aktiv -
 * die alte Logik lieferte deshalb eine LEERE Liste zurueck
 * und die Benachrichtigung blieb stumm. Die Anzeige darf
 * daher nur pruefen: nicht bestaetigt + Zeitfenster aktiv.
 */
export function anzeigeRefs(plan, jetzt) {
  const refs = [];
  for (const e of plan.eintraege || []) {
    if ((plan.bestaetigt || []).includes(e.ref)) continue;
    if (jetzt < e.fireAt || jetzt > e.endAt + 5 * 60000) continue;
    refs.push(e.ref);
  }
  return refs;
}

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const q = event.queryStringParameters || {};
      const device = cleanId(q.device);
      if (!device) return antwort(400, { error: "device fehlt" });
      const raw = await redis(["GET", "wecker:" + device]);
      const plan = raw ? JSON.parse(raw) : { eintraege: [] };
      // Feedback-Digest (nur fuer das Betreiber-Geraet hinterlegt):
      // Zahl einmalig abholen und zuruecksetzen (GETDEL)
      let digest = 0;
      let qa = 0;
      try {
        digest = Number(await redis(["GETDEL", "ff:digest:" + device])) || 0;
      } catch (e) { /* aeltere Redis ohne GETDEL: dann kein Digest */ }
      try {
        qa = Number(await redis(["GETDEL", "ff:qa:" + device])) || 0;
      } catch (e) { /* dito */ }
      return antwort(200, { refs: anzeigeRefs(plan, Date.now()), digest, qa });
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const device = cleanId(body.device);
      if (!device) return antwort(400, { error: "device fehlt" });
      const key = "wecker:" + device;

      // Komplett-Loeschung (Datenschutz-Knopf)
      if (body.loeschen === true) {
        await redis(["DEL", key]);
        await redis(["DEL", "sub:" + device]);
        await redis(["DEL", "familie:" + device]); // alte Klartext-Reste
        await redis(["SREM", "geraete", device]);
        return antwort(200, { success: true, geloescht: true });
      }

      const raw = await redis(["GET", key]);
      const plan = raw ? JSON.parse(raw)
        : { eintraege: [], lastSent: {}, bestaetigt: [] };

      if (body.bestaetige) {
        const ref = cleanId(body.bestaetige);
        if (!plan.bestaetigt.includes(ref)) plan.bestaetigt.push(ref);
        plan.bestaetigt = plan.bestaetigt.slice(-500);
        await redis(["SET", key, JSON.stringify(plan)]);
        return antwort(200, { success: true });
      }

      if (Array.isArray(body.eintraege)) {
        const neu = body.eintraege.slice(0, 600).map((e) => ({
          ref: cleanId(e.ref),
          fireAt: Number(e.fireAt) || 0,
          endAt: Number(e.endAt) || 0,
          repeatMin: Math.min(Math.max(Number(e.repeatMin) || 10, 3), 120),
        })).filter((e) => e.ref && e.fireAt > 0);
        plan.eintraege = neu;
        // lastSent/bestaetigt nur fuer noch existierende refs behalten
        const refSet = new Set(neu.map((e) => e.ref));
        plan.bestaetigt = (plan.bestaetigt || [])
          .filter((r) => refSet.has(r));
        const ls = {};
        for (const [r, ts] of Object.entries(plan.lastSent || {}))
          if (refSet.has(r)) ls[r] = ts;
        plan.lastSent = ls;
        await redis(["SET", key, JSON.stringify(plan)]);
        await redis(["SADD", "geraete", device]);
        return antwort(200, { success: true,
          eintraege: plan.eintraege.length });
      }

      return antwort(400, { error: "Keine bekannte Aktion" });
    }

    return antwort(405, { error: "Methode nicht erlaubt" });
  } catch (e) {
    return antwort(500, { error: String(e.message || e).slice(0, 150) });
  }
};
