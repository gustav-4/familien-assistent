// =====================================================================
// F-014a: SonarCloud HIGH in tests/pipeline.js:151
//   "Make sure that this dynamic injection or execution of code is safe."
// Die Stufe-1-Syntaxpruefung benutzte new Function(code). Das erzeugt
// aus fremdem Quelltext ein AUSFUEHRBARES Objekt. pipeline.js ist die
// Abnahmestelle und laeuft in der CI mit Schreibrechten - dort soll
// kein ausfuehrbares Artefakt aus index.html entstehen.
// Ersatz: vm.Script kompiliert und meldet Syntaxfehler, ohne den Code
// auszufuehren und ohne eine aufrufbare Funktion zurueckzugeben.
// Diese Datei prueft, dass die Pruefschaerfe dabei ERHALTEN bleibt.
// =====================================================================
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..", "..");
const require = createRequire(import.meta.url);

let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));

const modul = require(path.join(WURZEL, "tests/pipeline.js"));

p("F-014a pipeline.js stellt pruefeSkriptSyntax bereit",
  typeof modul.pruefeSkriptSyntax === "function");

if (typeof modul.pruefeSkriptSyntax === "function") {
  const pruefe = modul.pruefeSkriptSyntax;

  p("F-014a Gueltiger Code liefert keinen Fehler",
    pruefe("const a = 1; function f(){ return a + 1; }") === null);

  p("F-014a Absichtlicher Syntaxfehler wird erkannt",
    typeof pruefe("function kaputt( { return 1; }") === "string");

  p("F-014a Unbalancierte Klammer wird erkannt",
    typeof pruefe("if (true) { console.log('x');") === "string");

  p("F-014a Ungueltiges Schluesselwort wird erkannt",
    typeof pruefe("const = 5;") === "string");

  p("F-014a Fehlermeldung nennt die Ursache",
    String(pruefe("const = 5;")).length > 5);

  // Kernpunkt des Befundes: Der Pruefer darf den Code NICHT ausfuehren
  // und keine aufrufbare Funktion herausgeben.
  globalThis.__F014A_MARKER = 0;
  pruefe("globalThis.__F014A_MARKER = 1;");
  p("F-014a Gepruefter Code wird NICHT ausgefuehrt",
    globalThis.__F014A_MARKER === 0);

  p("F-014a Rueckgabe ist niemals aufrufbar",
    typeof pruefe("const a = 1;") !== "function");
}

// Der Befund selbst muss verschwunden sein.
// Kommentarzeilen ausklammern: Der Verweis auf die alte Fassung DARF
// stehenbleiben, ausfuehrbarer Code mit new Function nicht.
const quelle = fs.readFileSync(path.join(WURZEL, "tests/pipeline.js"), "utf8");
const codeZeilen = quelle.split("\n")
  .filter((z) => !/^\s*(\/\/|\*|\/\*)/.test(z));
p("F-014a Kein ausfuehrbares new Function mehr in pipeline.js",
  codeZeilen.join("\n").indexOf("new Function(") === -1);
p("F-014a Syntaxpruefung benutzt vm.Script",
  /new vm\.Script\(/.test(codeZeilen.join("\n")));

console.log("\nPipeline-Selbsttest: " + ok + " bestanden, " + fail + " fehlgeschlagen");
process.exit(fail ? 1 : 0);
