// Extraktion der Red-Team-Testfaelle (der Fall, der im Live-Lauf scheiterte)
import { saeubereCode } from "../redteam.mjs";
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));
const zeilen = (s) => s ? s.split("\n").filter(Boolean).length : 0;

p("Einzeiler wird erkannt",
  zeilen(saeubereCode('pruefe("RT1-01 leer", befehl("") === undefined);')) === 1);

// Das ist der Fall, der im echten Lauf ALLES verworfen hat:
const mehrzeilig = `pruefe("RT1-02 Umlaut im Namen",
  smartQty({ name: "Öl", qty: 100, unit: "g" }, 1) === "100 g Öl");`;
p("MEHRZEILIGER Aufruf wird jetzt erkannt", zeilen(saeubereCode(mehrzeilig)) === 1);

p("Markdown-Zaun wird entfernt", zeilen(saeubereCode(
  '```javascript\npruefe("RT1-03 x", 1 === 1);\n```')) === 1);
p("Erklaerungstext davor stoert nicht", zeilen(saeubereCode(
  'Hier sind meine Testfaelle:\n\npruefe("RT1-04 y", 2 === 2);')) === 1);
p("Mehrere Faelle werden alle erfasst", zeilen(saeubereCode(
  'pruefe("A", 1);\npruefe("B", 2);\npruefe("C", 3);')) === 3);
p("Klammern IN Zeichenketten verwirren nicht", zeilen(saeubereCode(
  'pruefe("RT1-05 Klammer ) im Text", ttsSaeubern("a (b)") === "a, b,");')) === 1);
p("Verschachtelte Aufrufe bleiben ganz", (() => {
  const r = saeubereCode('pruefe("RT1-06", f(g(h(1))) === 2);');
  return zeilen(r) === 1 && r.includes("f(g(h(1)))");
})());
p("Unvollstaendiger Aufruf wird verworfen",
  zeilen(saeubereCode('pruefe("RT1-07 kaputt", 1 === ')) === 0);
p("Leere Antwort -> nichts", zeilen(saeubereCode("")) === 0);
p("Reiner Prosatext -> nichts", zeilen(saeubereCode(
  "Ich habe leider keine Testfaelle gefunden.")) === 0);
p("Jeder Fall endet mit Semikolon",
  saeubereCode('pruefe("A", 1)').trim().endsWith(";"));

console.log(`\nRed-Team-Extraktion: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
