// Servertest F-038: Der Wochenplan ist reine Plus-Funktion. Es gibt KEINE
// kostenlose Probe mehr (die Probe haengte an einer Geraete-Kennung).
const befehle = [];
let anthropicAufrufe = 0;
const speicher = {};
globalThis.fetch = async (url, opts) => {
  if (String(url).includes("anthropic")) { anthropicAufrufe++; return { ok: false, status: 500, json: async () => ({}), text: async () => "" }; }
  const cmd = JSON.parse(opts.body);
  befehle.push(cmd);
  let result = null;
  if (cmd[0] === "GET") result = speicher[cmd[1]] ?? null;
  if (cmd[0] === "SET") { speicher[cmd[1]] = cmd[2]; result = "OK"; }
  if (cmd[0] === "INCR") result = 1;
  return { ok: true, json: async () => ({ result }) };
};
process.env.UPSTASH_REDIS_REST_URL = "https://r.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "t";
process.env.ANTHROPIC_API_KEY = "sk-test";
const modul = await import("../../netlify/functions/rezept.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n)) : (fail++, console.log("  FEHL " + n));

const res = await modul.default(new Request("https://familienassistent.net/api/rezept", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ modus: "wochenplan", device: "gTest1",
    unvertraeglichkeiten: [], ernaehrungsformen: [] }) }));
const r = { statusCode: res.status, body: await res.text() };
p("F-038 Wochenplan ohne Plus wird abgelehnt (402)", r.statusCode === 402);
p("F-038 Ablehnung nennt Familien-Plus", /Plus/.test(JSON.parse(r.body).error || ""));
p("F-038 keine Probe-Marke wird mehr gespeichert",
  !befehle.some((c) => String(c[1] || "").startsWith("wpfrei")));
p("F-038 kein KI-Aufruf ohne Plus", anthropicAufrufe === 0);

console.log(`\nF-038 Server: ${ok} OK, ${fail} FEHL`);
process.exit(fail ? 1 : 0);
