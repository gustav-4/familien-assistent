// Servertests fuer den QA-Briefkasten
const speicher = {}; const listen = {}; const dispatches = [];
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes("api.github.com")) {
    dispatches.push(JSON.parse(opts.body));
    return { status: 204 };
  }
  const [name, key, a, b, c] = JSON.parse(opts.body);
  let result = null;
  if (name === "SET") { speicher[key] = a; result = "OK"; }
  if (name === "GET") result = speicher[key] ?? null;
  if (name === "LPUSH") { (listen[key] = listen[key] || []).unshift(a); result = listen[key].length; }
  if (name === "LRANGE") result = (listen[key] || []).slice(Number(a), Number(b) + 1);
  if (name === "LTRIM") result = "OK";
  return { ok: true, json: async () => ({ result }) };
};
process.env.UPSTASH_REDIS_REST_URL = "https://r.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "t";
process.env.ADMIN_TOKEN = "admin-geheim";
process.env.QA_TOKEN = "qa-geheim";
process.env.GITHUB_TOKEN = "ghp_test";
process.env.OWNER_DEVICE = "gOWNER";

const { handler } = await import("../../netlify/functions/qa.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));

// 1) Bericht schreiben
const bericht = { version: "FUSION17", gesamt: 56, bestanden: 54,
  fehlgeschlagen: 2, verdachtsfaelle: [{ name: "RT1-01 Umlaut-Fall",
  fehlertext: "" }], fehler: [{ name: "B01 Befehl", fehlertext: "" }],
  selbstheilung: ["Attrappe erweitert"], lauf: "https://github.com/x/actions/runs/1" };
const r1 = await handler({ httpMethod: "POST",
  body: JSON.stringify({ qa_token: "qa-geheim", bericht }) });
p("Bericht mit gueltigem QA-Token angenommen", r1.statusCode === 200);
p("Auffaelliger Bericht loest Handy-Meldung aus",
  JSON.parse(r1.body).gemeldet === true && speicher["ff:qa:gOWNER"] === "3");

const r2 = await handler({ httpMethod: "POST",
  body: JSON.stringify({ qa_token: "falsch", bericht }) });
p("Falscher QA-Token -> 401", r2.statusCode === 401);

// 2) Gruener Lauf meldet NICHT aufs Handy
delete speicher["ff:qa:gOWNER"];
const r3 = await handler({ httpMethod: "POST", body: JSON.stringify({
  qa_token: "qa-geheim", bericht: { version: "FUSION17", gesamt: 56,
    bestanden: 56, fehlgeschlagen: 0, verdachtsfaelle: [], fehler: [] } }) });
p("Gruener Lauf erzeugt keine Handy-Meldung (kein Rauschen)",
  JSON.parse(r3.body).gemeldet === false && !speicher["ff:qa:gOWNER"]);

// 3) Lesen
const r4 = await handler({ httpMethod: "GET",
  queryStringParameters: { token: "admin-geheim" } });
const d4 = JSON.parse(r4.body);
p("Postfach liefert letzten Bericht", r4.statusCode === 200 && d4.bericht.gesamt === 56);
p("Postfach liefert Verlauf", Array.isArray(d4.verlauf) && d4.verlauf.length === 2);
p("Lesen ohne Token -> 401", (await handler({ httpMethod: "GET",
  queryStringParameters: { token: "x" } })).statusCode === 401);

// 4) Freigaben
const r5 = await handler({ httpMethod: "POST", body: JSON.stringify({
  admin_token: "admin-geheim", freigabe: "reparatur", befund: "RT1-01" }) });
p("Freigabe 'reparatur' startet Workflow",
  r5.statusCode === 200 && dispatches[0].event_type === "qa-reparatur"
  && dispatches[0].client_payload.befund === "RT1-01");
const r6 = await handler({ httpMethod: "POST", body: JSON.stringify({
  admin_token: "admin-geheim", freigabe: "live" }) });
p("Freigabe 'live' startet Workflow",
  r6.statusCode === 200 && dispatches[1].event_type === "qa-live");
p("Freigabe mit QA-Token (statt Admin) -> 401",
  (await handler({ httpMethod: "POST", body: JSON.stringify({
    admin_token: "qa-geheim", freigabe: "live" }) })).statusCode === 401);
p("Unbekannte Freigabe -> 400",
  (await handler({ httpMethod: "POST", body: JSON.stringify({
    admin_token: "admin-geheim", freigabe: "alles-loeschen" }) })).statusCode === 400);
p("Genau 2 Workflow-Starts insgesamt", dispatches.length === 2);

console.log(`\nQA-Server: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
