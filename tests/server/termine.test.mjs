// Servertests Familien-Abgleich: Der Familien-Code (zugleich Schluessel) darf
// den Server nie erreichen muessen - die Kennung (Hash) reicht (F-029).
import crypto from "node:crypto";
const speicher = {};
globalThis.fetch = async (url, opts) => {
  const [name, key, a] = JSON.parse(opts.body);
  let result = null;
  if (name === "SET") { speicher[key] = a; result = "OK"; }
  if (name === "GET") result = speicher[key] ?? null;
  if (name === "SADD" || name === "SREM") result = 1;
  if (name === "SCARD") result = 1;
  return { ok: true, json: async () => ({ result }) };
};
process.env.UPSTASH_REDIS_REST_URL = "https://r.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "t";
process.env.ADMIN_TOKEN = "admin-geheim";
const { handler } = await import("../../netlify/functions/termine.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n)) : (fail++, console.log("  FEHL " + n));

const CODE = "FAM-ABCDE-23456";
const kanal = crypto.createHash("sha256").update("ka1|" + CODE).digest("hex").slice(0, 32);
speicher["plus:" + kanal] = "1";

// Speichern nur mit Kennung (ohne Code)
let r = await handler({ httpMethod: "POST", body: JSON.stringify({ kanal, blob: "AAAA.BBBB", stand: 5, device: "gTest1" }) });
p("F-029 Speichern mit Kennung statt Code klappt", r.statusCode === 200 && speicher["sync:" + kanal] !== undefined);
// Laden nur mit Kennung
r = await handler({ httpMethod: "GET", queryStringParameters: { kanal } });
const d = JSON.parse(r.body);
p("F-029 Laden mit Kennung liefert den Stand", r.statusCode === 200 && d.blob === "AAAA.BBBB" && d.stand === 5);
// Unbekannte Kennung: nicht freigeschaltet
r = await handler({ httpMethod: "GET", queryStringParameters: { kanal: "0".repeat(32) } });
p("F-029 unbekannte Kennung ist nicht freigeschaltet (402)", r.statusCode === 402);
// Ungueltige Kennung
r = await handler({ httpMethod: "GET", queryStringParameters: { kanal: "xyz" } });
p("F-029 ungueltige Kennung wird abgewiesen (400)", r.statusCode === 400);
// Altes Verfahren mit Code bleibt kompatibel
r = await handler({ httpMethod: "GET", queryStringParameters: { code: CODE } });
p("F-029 alte Apps mit Code funktionieren weiter", r.statusCode === 200 && JSON.parse(r.body).blob === "AAAA.BBBB");
// Admin-Token
r = await handler({ httpMethod: "POST", body: JSON.stringify({ plus_freischalten: true, admin_token: "falsch" }) });
p("Admin: falsches Token wird abgewiesen", r.statusCode === 401);
r = await handler({ httpMethod: "POST", body: JSON.stringify({ plus_freischalten: true, admin_token: "admin-geheim" }) });
p("Admin: richtiges Token erzeugt Code", r.statusCode === 200 && /^FAM-/.test(JSON.parse(r.body).code));

console.log("\n" + ok + " ok, " + fail + " fehl");
process.exit(fail ? 1 : 0);
