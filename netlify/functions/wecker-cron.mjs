/**
 * Stummer Wecker - Zeitgeber (laeuft alle 5 Minuten, siehe netlify.toml)
 * ----------------------------------------------------------------------
 * Prueft fuer jedes angemeldete Geraet, ob Erinnerungen faellig sind,
 * und schickt dann ein LEERES Push-Signal (kein Inhalt!). Das Geraet
 * baut den Klartext selbst aus seinem lokalen Speicher.
 *
 * BUGFIX 1 (Upstash-Tageslimit): Bisher kostete jeder Lauf
 * 2 + 2×Geraeteanzahl Redis-Befehle - bei 288 Laeufen/Tag war das
 * kostenlose Kontingent (10.000 Befehle/Tag) schnell erschoepft,
 * danach fielen ALLE Funktionen mit "Speicher-Fehler 429" aus.
 * Jetzt werden alle Lese- und Schreibbefehle eines Laufs per
 * Pipeline gebuendelt: konstant ~4-6 Befehle pro Lauf.
 *
 * BUGFIX 2 (tote Schluessel erkennen): Antwortet der Push-Dienst
 * mit 401/403, passt der VAPID-Schluessel nicht mehr zur alten
 * Anmeldung. Solche Anmeldungen werden jetzt geloescht, damit die
 * App sie beim naechsten Oeffnen automatisch erneuert (siehe
 * Selbstheilung in index.html) - vorher wurden sie als "Erfolg"
 * gezaehlt und blieben dauerhaft still.
 *
 * Web-Push-Signatur (VAPID/ES256) bewusst ohne Fremdpakete -
 * nur Node-Bordmittel, damit der Drag-and-Drop-Deploy funktioniert.
 */

import crypto from "node:crypto";
import { ensureVapid } from "./vapid.mjs";
import { faelligeRefs } from "./wecker.mjs";

function redisBasis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Speicher nicht konfiguriert");
  return { url, token };
}

async function redis(command) {
  const { url, token } = redisBasis();
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token,
      "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error("Speicher-Fehler " + r.status);
  return (await r.json()).result;
}

/** Mehrere Befehle in EINEM Aufruf (Upstash-Pipeline-Endpunkt). */
async function redisPipeline(commands) {
  if (!commands.length) return [];
  const { url, token } = redisBasis();
  const r = await fetch(url.replace(/\/+$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + token,
      "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error("Speicher-Fehler " + r.status);
  const arr = await r.json();
  return arr.map((x) => (x && "result" in x ? x.result : null));
}

function b64u(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function vapidAuthHeader(endpoint, keys) {
  const aud = new URL(endpoint).origin;
  const header = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = b64u(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:info@gustav-4.de",
  }));
  const input = header + "." + payload;
  const sig = crypto.sign("sha256", Buffer.from(input), {
    key: keys.privatePem,
    dsaEncoding: "ieee-p1363", // direkt r||s, kein DER-Umbau noetig
  });
  return `vapid t=${input + "." + b64u(sig)}, k=${keys.publicKey}`;
}

async function sendeWecksignal(sub, keys) {
  const r = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: "300",
      Urgency: "high",
      Authorization: vapidAuthHeader(sub.endpoint, keys),
    },
  });
  return r.status;
}

/** Digest-Zeitfenster: Montag + Donnerstag, 18-Uhr-Stunde (Berlin). */
export function digestFaellig(jetztMs) {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", weekday: "short",
    hour: "2-digit", hour12: false,
  }).formatToParts(new Date(jetztMs));
  const wd = (teile.find((p) => p.type === "weekday") || {}).value || "";
  const h = Number((teile.find((p) => p.type === "hour") || {}).value);
  return (wd.startsWith("Mo") || wd.startsWith("Do")) && h === 18;
}

/** Feedback-Digest an den Betreiber (2x woechentlich, max. 1 Push/Tag). */
async function feedbackDigest(keys, jetzt, bericht) {
  const owner = process.env.OWNER_DEVICE;
  if (!owner || !digestFaellig(jetzt)) return;
  const heute = new Date(jetzt).toISOString().slice(0, 10);
  // Tages-Sperre: verhindert Doppel-Push innerhalb des 18-Uhr-Fensters
  const [sperre] = await redisPipeline([
    ["SET", "digest:gesendet:" + heute, "1", "NX", "EX", "90000"]]);
  if (sperre !== "OK") return;
  const [len, cursorRaw, subRaw] = await redisPipeline([
    ["LLEN", "feedback"], ["GET", "digest:cursor"], ["GET", "sub:" + owner]]);
  const neu = Math.max(0, Number(len || 0) - Number(cursorRaw || 0));
  bericht.digest = { neu };
  if (!neu || !subRaw) return;
  // Anzahl fuer den Service Worker hinterlegen + Cursor vorruecken
  await redisPipeline([
    ["SET", "ff:digest:" + owner, String(neu), "EX", "21600"],
    ["SET", "digest:cursor", String(len)]]);
  bericht.digest.status = await sendeWecksignal(JSON.parse(subRaw), keys);
}

export const handler = async () => {
  const bericht = { geraete: 0, signale: 0, tot: 0,
    schluesselFehler: 0, fehler: [] };
  try {
    const keys = await ensureVapid();
    const geraete = ((await redis(["SMEMBERS", "geraete"])) || [])
      .slice(0, 500);
    bericht.geraete = geraete.length;
    const jetzt0 = Date.now();
    try { await feedbackDigest(keys, jetzt0, bericht); }
    catch (e) { bericht.fehler.push("digest: " + String(e.message || e).slice(0, 60)); }
    if (!geraete.length) {
      console.log("WECKER-CRON", JSON.stringify(bericht));
      return { statusCode: 200, body: JSON.stringify(bericht) };
    }
    const jetzt = Date.now();

    // ALLE Plaene und Anmeldungen mit nur 2 Befehlen laden
    const [plaeneRaw, subsRaw] = await redisPipeline([
      ["MGET", ...geraete.map((d) => "wecker:" + d)],
      ["MGET", ...geraete.map((d) => "sub:" + d)],
    ]);

    const schreibBefehle = [];

    for (let i = 0; i < geraete.length; i++) {
      const device = geraete[i];
      try {
        const planRaw = (plaeneRaw || [])[i];
        const subRaw = (subsRaw || [])[i];
        if (!planRaw || !subRaw) continue;
        const plan = JSON.parse(planRaw);
        const refs = faelligeRefs(plan, jetzt);
        if (!refs.length) continue;

        const status = await sendeWecksignal(JSON.parse(subRaw), keys);
        if (status === 404 || status === 410) {
          // Geraet abgemeldet/Browser-Daten geloescht -> aufraeumen
          schreibBefehle.push(["DEL", "sub:" + device]);
          schreibBefehle.push(["SREM", "geraete", device]);
          bericht.tot++;
          continue;
        }
        if (status === 401 || status === 403) {
          // Schluessel passt nicht mehr zur Anmeldung -> Anmeldung
          // loeschen; die App erneuert sie beim naechsten Oeffnen
          schreibBefehle.push(["DEL", "sub:" + device]);
          bericht.schluesselFehler++;
          continue;
        }
        bericht.signale++;
        plan.lastSent = plan.lastSent || {};
        refs.forEach((ref) => { plan.lastSent[ref] = jetzt; });
        schreibBefehle.push(["SET", "wecker:" + device,
          JSON.stringify(plan)]);
      } catch (e) {
        bericht.fehler.push(device + ": " + String(e.message || e).slice(0, 60));
      }
    }

    // Alle Schreibvorgaenge gebuendelt in EINEM Aufruf
    if (schreibBefehle.length) await redisPipeline(schreibBefehle);

    console.log("WECKER-CRON", JSON.stringify(bericht));
    return { statusCode: 200, body: JSON.stringify(bericht) };
  } catch (e) {
    console.log("WECKER-CRON FEHLER", String(e));
    return { statusCode: 500, body: String(e.message || e) };
  }
};
