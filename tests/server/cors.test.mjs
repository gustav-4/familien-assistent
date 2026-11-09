// F-032: Der Rezept-Dienst darf nicht von beliebigen fremden Webseiten aus
// aufrufbar sein (kein "Access-Control-Allow-Origin: *"). Die App ruft ihn
// von der eigenen Adresse auf, dafuer braucht es keine Freigabe.
process.env.ANTHROPIC_API_KEY = "sk-test";
const modul = await import("../../netlify/functions/rezept.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n)) : (fail++, console.log("  FEHL " + n));
const r = await modul.default(new Request("http://x/api/rezept", {
  method: "OPTIONS", headers: { Origin: "https://boese.example" } }));
p("F-032 Rezept-Dienst erlaubt keine fremde Herkunft (kein Stern)", r.headers.get("access-control-allow-origin") !== "*");
const r2 = await modul.default(new Request("http://x/api/rezept", { method: "GET" }));
p("F-032 Antworten tragen keinen Freibrief fuer fremde Seiten", r2.headers.get("access-control-allow-origin") !== "*");
console.log("\n" + ok + " ok, " + fail + " fehl");
process.exit(fail ? 1 : 0);
