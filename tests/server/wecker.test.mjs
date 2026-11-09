// F-031: Der Wecker-Server darf bei kaputten Anfragen nicht mit 500 abstuerzen.
const speicher = {};
globalThis.fetch = async (url, opts) => {
  const [name, key, a] = JSON.parse(opts.body);
  let result = null;
  if (name === "SET") { speicher[key] = a; result = "OK"; }
  if (name === "GET") result = speicher[key] ?? null;
  return { ok: true, json: async () => ({ result }) };
};
process.env.UPSTASH_REDIS_REST_URL = "https://r.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "t";
const { handler } = await import("../../netlify/functions/wecker.mjs");
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n)) : (fail++, console.log("  FEHL " + n));
let r = await handler({ httpMethod: "POST", body: "{kaputt" });
p("F-031 kaputtes JSON ergibt 400 statt 500", r.statusCode === 400);
r = await handler({ httpMethod: "POST", body: JSON.stringify({ device: "gA", eintraege: [null, 7, { ref: "r1", fireAt: Date.now() + 60000, endAt: Date.now() + 120000 }] }) });
p("F-031 leere Eintraege in der Liste stuerzen nicht ab", r.statusCode === 200);
p("F-031 intakter Eintrag bleibt erhalten", JSON.parse(r.body).eintraege === 1);
r = await handler({ httpMethod: "POST", body: JSON.stringify({ device: "gA", eintraege: "keine liste" }) });
p("F-031 Eintraege ohne Liste ergeben 400", r.statusCode === 400);
console.log("\n" + ok + " ok, " + fail + " fehl");
process.exit(fail ? 1 : 0);
