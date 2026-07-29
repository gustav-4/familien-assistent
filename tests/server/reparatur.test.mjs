// Leitplanken des Reparatur-Moduls (ohne Modellaufruf)
import { pruefeAenderungen } from "../reparatur.mjs";
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));
const wirft = (fn, muster) => {
  try { fn(); return false; }
  catch (e) { return muster.test(String(e.message)); }
};
const lies = (d) => ({
  "index.html": "AAA einmalig BBB doppelt CCC doppelt DDD",
  "sw.js": "const VERSION = \"x\";",
}[d] ?? "");

p("Verbotene Datei -> Abbruch", wirft(() => pruefeAenderungen(
  [{ datei: ".github/workflows/qa.yml", alt: "name:", neu: "x" }], lies),
  /nicht erlaubt/));
p("Tests-Ordner ist tabu", wirft(() => pruefeAenderungen(
  [{ datei: "tests/run.js", alt: "a", neu: "b" }], lies), /nicht erlaubt/));
p("Mehrdeutiges Suchmuster -> Abbruch", wirft(() => pruefeAenderungen(
  [{ datei: "index.html", alt: "doppelt", neu: "x" }], lies), /kommt 2x vor/));
p("Nicht gefundenes Suchmuster -> Abbruch", wirft(() => pruefeAenderungen(
  [{ datei: "index.html", alt: "gibtesnicht", neu: "x" }], lies), /kommt 0x vor/));
p("Leerer Ersatztext -> Abbruch (kein Loeschen)", wirft(() => pruefeAenderungen(
  [{ datei: "index.html", alt: "einmalig", neu: "" }], lies), /Leerer Ersatztext/));
p("Leeres Suchmuster -> Abbruch", wirft(() => pruefeAenderungen(
  [{ datei: "index.html", alt: "", neu: "x" }], lies), /Leeres Suchmuster/));
const gut = pruefeAenderungen(
  [{ datei: "index.html", alt: "einmalig", neu: "geaendert" }], lies);
p("Eindeutige Aenderung wird zugelassen",
  gut.length === 1 && gut[0].neu === "geaendert");
p("Eine verbotene Aenderung kippt das GANZE Paket", wirft(() => pruefeAenderungen([
  { datei: "index.html", alt: "einmalig", neu: "ok" },
  { datei: "netlify.toml", alt: "a", neu: "b" }], lies), /nicht erlaubt/));
console.log(`\nReparatur-Leitplanken: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
