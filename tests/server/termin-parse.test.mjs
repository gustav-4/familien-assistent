// F-030: Der KI-Dienst fuer Sprach-Termine ist abgeschaltet (Termine werden
// seit FUSION47 auf dem Handy verstanden). Er darf keine KI mehr aufrufen und
// keine Kosten verursachen; alte App-Staende bekommen einen klaren Hinweis.
let aufrufe = 0;
globalThis.fetch = async () => { aufrufe++; return { ok: true, json: async () => ({}) }; };
process.env.ANTHROPIC_API_KEY = "sk-test";
const modul = await import("../../netlify/functions/termin-parse.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n)) : (fail++, console.log("  FEHL " + n));
const r = await modul.default(new Request("http://x/api/termin-parse", {
  method: "POST", body: JSON.stringify({ text: "Zahnarzt morgen um 8 Uhr" }) }));
const d = await r.json().catch(() => ({}));
p("F-030 Antwort ist 410 (abgeschaltet)", r.status === 410);
p("F-030 Hinweis nennt das App-Update", /aktualisier/i.test(String(d.error)));
p("F-030 es wird kein KI-Dienst aufgerufen", aufrufe === 0);
console.log("\n" + ok + " ok, " + fail + " fehl");
process.exit(fail ? 1 : 0);
