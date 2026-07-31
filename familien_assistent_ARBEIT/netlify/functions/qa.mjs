/**
 * QA-BRIEFKASTEN
 * --------------------------------------------------------------
 * Bindeglied zwischen der automatischen Qualitaetssicherung
 * (GitHub Actions) und dem Betreiber-Handy.
 *
 *  POST  { qa_token, bericht }        <- von GitHub Actions
 *        legt den Bericht ab und markiert eine Handy-Meldung vor
 *  GET   ?token=ADMIN_TOKEN           <- vom QA-Postfach im Browser
 *        liefert den letzten Bericht
 *  POST  { admin_token, freigabe: "reparatur"|"live", befund }
 *        startet den zugehoerigen GitHub-Workflow (Tor 1 / Tor 2)
 *
 * Sicherheitsprinzip: Zwei getrennte Schluessel. GitHub darf nur
 * schreiben (QA_TOKEN), der Betreiber nur lesen und freigeben
 * (ADMIN_TOKEN). Ein erbeuteter GitHub-Schluessel kann damit keine
 * Freigabe ausloesen.
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

/** Startet einen Workflow im Repo (repository_dispatch). */
async function starteWorkflow(typ, nutzlast) {
  const pat = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "gustav-4/familien-assistent";
  if (!pat) return { ok: false, grund: "GITHUB_TOKEN fehlt" };
  const r = await fetch("https://api.github.com/repos/" + repo + "/dispatches", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + pat,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "familien-assistent-qa",
    },
    body: JSON.stringify({ event_type: typ, client_payload: nutzlast || {} }),
  });
  return { ok: r.status === 204, status: r.status };
}

/** Uebernimmt nur bekannte Felder eines Befunds (Laengen begrenzt). */
function befundFeld(v) {
  const k = (x, n) => String((v && v[x]) || "").slice(0, n);
  return {
    name: k("name", 200), fehlertext: k("fehlertext", 300),
    bereich: k("bereich", 60), klartext: k("klartext", 300),
    auswirkung: k("auswirkung", 300), vorschlag: k("vorschlag", 300),
    dringlichkeit: ["hoch", "mittel", "niedrig"].includes(v && v.dringlichkeit)
      ? v.dringlichkeit : "",
  };
}

export const handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  // ---------- LESEN: Postfach im Browser ----------
  if (event.httpMethod === "GET") {
    const soll = process.env.ADMIN_TOKEN;
    const ist = (event.queryStringParameters || {}).token || "";
    if (!soll || ist !== soll) {
      return { statusCode: 401, headers,
        body: JSON.stringify({ success: false, error: "Kein Zugriff" }) };
    }
    try {
      const roh = await redis(["GET", "qa:bericht"]);
      const verlauf = (await redis(["LRANGE", "qa:verlauf", "0", "9"])) || [];
      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        bericht: roh ? JSON.parse(roh) : null,
        verlauf: verlauf.map((v) => { try { return JSON.parse(v); }
          catch (e) { return null; } }).filter(Boolean),
      }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({
        success: false, error: String(e.message || e).slice(0, 120) }) };
    }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false }) };
  }

  let körper;
  try { körper = JSON.parse(event.body || "{}"); }
  catch (e) {
    return { statusCode: 400, headers,
      body: JSON.stringify({ success: false, error: "Ungueltig" }) };
  }

  // ---------- SCHREIBEN: Bericht von GitHub Actions ----------
  if (körper.bericht) {
    const soll = process.env.QA_TOKEN;
    if (!soll || körper.qa_token !== soll) {
      return { statusCode: 401, headers,
        body: JSON.stringify({ success: false, error: "Kein Zugriff" }) };
    }
    const b = körper.bericht;
    const kompakt = {
      zeitpunkt: new Date().toISOString(),
      version: String(b.version || "unbekannt").slice(0, 30),
      anlass: String(b.anlass || "lauf").slice(0, 30),
      gesamt: Number(b.gesamt) || 0,
      bestanden: Number(b.bestanden) || 0,
      fehlgeschlagen: Number(b.fehlgeschlagen) || 0,
      ueberschrift: String(b.ueberschrift || "").slice(0, 200),
      klartextHinweis: String(b.klartextHinweis || "").slice(0, 200),
      stoerung: String(b.stoerung || "").slice(0, 300),
      verdachtsfaelle: (Array.isArray(b.verdachtsfaelle) ? b.verdachtsfaelle
        : []).slice(0, 25).map(befundFeld),
      fehler: (Array.isArray(b.fehler) ? b.fehler : []).slice(0, 25)
        .map(befundFeld),
      selbstheilung: Array.isArray(b.selbstheilung)
        ? b.selbstheilung.slice(0, 20).map((s) => String(s).slice(0, 200)) : [],
      lauf: String(b.lauf || "").slice(0, 200), // Link zum GitHub-Lauf
    };
    // Eine Stoerung (z. B. KI nicht erreichbar) oder ein Lauf ohne
    // jede Pruefung ist IMMER meldepflichtig - sonst wiegt sich der
    // Betreiber in falscher Sicherheit.
    const auffaellig = kompakt.fehlgeschlagen > 0
      || kompakt.verdachtsfaelle.length > 0
      || Boolean(kompakt.stoerung)
      || kompakt.gesamt === 0;
    const befehle = [
      ["SET", "qa:bericht", JSON.stringify(kompakt)],
      ["LPUSH", "qa:verlauf", JSON.stringify({
        zeitpunkt: kompakt.zeitpunkt, version: kompakt.version,
        bestanden: kompakt.bestanden, fehlgeschlagen: kompakt.fehlgeschlagen,
        verdacht: kompakt.verdachtsfaelle.length })],
      ["LTRIM", "qa:verlauf", "0", "49"],
    ];
    // Handy-Meldung nur bei Auffaelligkeiten (kein Rauschen)
    const owner = process.env.OWNER_DEVICE;
    if (auffaellig && owner) {
      befehle.push(["SET", "ff:qa:" + owner,
        String(kompakt.fehlgeschlagen + kompakt.verdachtsfaelle.length),
        "EX", "172800"]);
    }
    try {
      for (const b2 of befehle) await redis(b2);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({
        success: false, error: String(e.message || e).slice(0, 120) }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({
      success: true, gemeldet: auffaellig }) };
  }

  // ---------- FREIGABE: Betreiber startet Workflow ----------
  if (körper.freigabe) {
    const soll = process.env.ADMIN_TOKEN;
    if (!soll || körper.admin_token !== soll) {
      return { statusCode: 401, headers,
        body: JSON.stringify({ success: false, error: "Kein Zugriff" }) };
    }
    const erlaubt = { reparatur: "qa-reparatur", live: "qa-live" };
    const typ = erlaubt[körper.freigabe];
    if (!typ) {
      return { statusCode: 400, headers, body: JSON.stringify({
        success: false, error: "Unbekannte Freigabe" }) };
    }
    const ergebnis = await starteWorkflow(typ, {
      befund: String(körper.befund || "").slice(0, 500),
      ausgeloest: new Date().toISOString(),
    });
    if (!ergebnis.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({
        success: false,
        error: "Workflow-Start fehlgeschlagen (" +
          (ergebnis.grund || "HTTP " + ergebnis.status) + ")" }) };
    }
    try {
      await redis(["SET", "qa:letzteFreigabe", JSON.stringify({
        typ: körper.freigabe, zeitpunkt: new Date().toISOString() })]);
    } catch (e) { /* Protokoll ist Kuer */ }
    return { statusCode: 200, headers, body: JSON.stringify({
      success: true, gestartet: typ }) };
  }

  return { statusCode: 400, headers,
    body: JSON.stringify({ success: false, error: "Nichts zu tun" }) };
};
