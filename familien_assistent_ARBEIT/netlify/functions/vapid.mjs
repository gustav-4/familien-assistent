/**
 * VAPID-Schluessel fuer Web-Push.
 *
 * BUGFIX (Schluessel-Stabilitaet): Bisher lag der Schluessel NUR
 * im Upstash-Speicher. Ging der Eintrag verloren (Datenbank
 * geleert, Free-Tier-Bereinigung, versehentliches Loeschen),
 * wurde still ein NEUES Schluesselpaar erzeugt - damit waren
 * alle bestehenden Push-Anmeldungen dauerhaft ungueltig, ohne
 * jede Fehlermeldung.
 *
 * Neue Rangfolge:
 *   1. Umgebungsvariablen VAPID_PUBLIC_KEY + VAPID_PRIVATE_PEM
 *      (empfohlen - unverlierbar, im Netlify-Dashboard setzen)
 *   2. Upstash-Eintrag "vapid" (Bestandsschutz fuer bereits
 *      angemeldete Geraete)
 *   3. Nur wenn beides fehlt: einmalig erzeugen und speichern.
 *
 * Der oeffentliche Teil geht an den Browser, der private bleibt
 * auf dem Server.
 */

import crypto from "node:crypto";

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

function b64u(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function ensureVapid() {
  // 1) Umgebungsvariablen haben Vorrang (unverlierbar)
  const envPub = process.env.VAPID_PUBLIC_KEY;
  const envPem = process.env.VAPID_PRIVATE_PEM;
  if (envPub && envPem) {
    // \n-Ersatz erlauben (Netlify-Eingabefeld ist einzeilig)
    return { publicKey: envPub.trim(),
      privatePem: envPem.replace(/\\n/g, "\n") };
  }

  // 2) Bestehenden Speicher-Eintrag weiterverwenden
  const raw = await redis(["GET", "vapid"]);
  if (raw) return JSON.parse(raw);

  // 3) Letzter Ausweg: einmalig erzeugen und ablegen
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec",
    { namedCurve: "prime256v1" });
  const spki = publicKey.export({ type: "spki", format: "der" });
  const keys = {
    publicKey: b64u(spki.subarray(spki.length - 65)),
    privatePem: privateKey.export({ type: "pkcs8", format: "pem" }),
  };
  await redis(["SET", "vapid", JSON.stringify(keys)]);
  return keys;
}

export const handler = async () => {
  try {
    const keys = await ensureVapid();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: keys.publicKey }),
    };
  } catch (e) {
    return { statusCode: 500,
      body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
