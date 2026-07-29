// Meldemodul: Version, Doppelzaehlung, Ausfallsicherheit
import fs from "node:fs";
import path from "node:path";
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));

// Attrappe: Berichte vorbereiten
const B = "tests/berichte";
fs.mkdirSync(B, { recursive: true });
const sicherung = {};
for (const d of ["letzter-lauf.json", "redteam.json"]) {
  const f = path.join(B, d);
  sicherung[d] = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}
fs.writeFileSync(path.join(B, "letzter-lauf.json"), JSON.stringify({
  version: "", gesamt: 93, bestanden: 92, fehlgeschlagen: 1,
  fehler: [{ name: "RT1-05 Grenzfall" }, { name: "D1 Echter Fehler" }] }));
fs.writeFileSync(path.join(B, "redteam.json"), JSON.stringify({
  verdachtsfaelle: [{ name: "RT1-05 Grenzfall" }] }));

let gesendet = null;
globalThis.fetch = async (url, opts) => {
  gesendet = JSON.parse(opts.body).bericht;
  return { ok: true, status: 200, text: async () => "{}" };
};
process.env.QA_TOKEN = "test";
delete process.env.ANTHROPIC_API_KEY;
process.argv = ["node", "test", "--anlass=test"];
const { melden } = await import("../melde.mjs?v=" + Math.random());
await melden();

p("Version wird direkt aus index.html gelesen (nicht 'unbekannt')",
  /^FUSION/.test(gesendet.version));
p("Red-Team-Fall erscheint NICHT doppelt als Fehler",
  gesendet.fehler.every((f) => !/^RT/.test(f.name)));
p("Echter Fehler bleibt erhalten",
  gesendet.fehler.some((f) => f.name.startsWith("D1")));
p("Verdachtsfall bleibt im Verdachtsteil",
  gesendet.verdachtsfaelle.length === 1);
p("Pruefzahlen werden uebernommen",
  gesendet.gesamt === 93 && gesendet.bestanden === 92);
p("Ueberschrift in Alltagssprache ergaenzt",
  /Fehler/.test(gesendet.ueberschrift));

for (const [d, inhalt] of Object.entries(sicherung)) {
  const f = path.join(B, d);
  if (inhalt === null) fs.unlinkSync(f); else fs.writeFileSync(f, inhalt);
}
console.log(`\nMeldemodul: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
