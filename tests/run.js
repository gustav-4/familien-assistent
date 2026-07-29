// =====================================================================
// TESTLAEUFER
// Aufruf:  node tests/run.js            (deterministische Szenarien)
//          node tests/run.js --json     (Maschinenlesbarer Bericht)
//          node tests/run.js --extra=DATEI  (zusaetzliche Szenariendatei,
//                                            z. B. vom Red-Team erzeugt)
// Exit-Code 0 = alles gruen, 1 = mindestens ein Fehlschlag.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const { umgebungAufbauen, appQuelltext } = require("./lib/browser.js");

const WURZEL = path.resolve(__dirname, "..");
const alsJson = process.argv.includes("--json");
const extraArg = process.argv.find((a) => a.startsWith("--extra="));
const extraDatei = extraArg ? extraArg.split("=")[1] : null;

const ergebnisse = [];
let offeneAsyncPruefungen = [];

umgebungAufbauen();

// Pruef-Werkzeuge fuer die Szenariendateien bereitstellen
global.pruefe = function (name, bedingung) {
  let bestanden = false;
  let fehlertext = "";
  try { bestanden = Boolean(bedingung); }
  catch (e) { fehlertext = String(e && e.message); }
  ergebnisse.push({ name, bestanden, fehlertext });
};
global.warte = function (fn) { offeneAsyncPruefungen.push(fn()); };

const quelltext = appQuelltext(WURZEL);
global.APPQUELLE = quelltext;
global.APPHTML = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");

const szenarien = fs.readFileSync(path.join(__dirname, "szenarien.js"), "utf8");
const extra = extraDatei && fs.existsSync(extraDatei)
  ? fs.readFileSync(extraDatei, "utf8") : "";

let ladeFehler = null;
try {
  // App + Szenarien in EINEM Kontext - sonst sind const/let unsichtbar
  (0, eval)(quelltext + "\n;\n" + szenarien + "\n;\n" + extra);
} catch (e) {
  ladeFehler = e;
}

(async () => {
  try { await Promise.all(offeneAsyncPruefungen); } catch (e) { /* siehe pruefe */ }

  const { attrappenLuecken } = require("./lib/browser.js");
  const luecken = global.attrappenLuecken ? global.attrappenLuecken() : [];

  if (ladeFehler) {
    ergebnisse.unshift({ name: "A0 App laedt ohne Absturz", bestanden: false,
      fehlertext: String(ladeFehler && ladeFehler.stack || ladeFehler).slice(0, 400) });
  }

  const bestanden = ergebnisse.filter((e) => e.bestanden).length;
  const fehlgeschlagen = ergebnisse.length - bestanden;
  const bericht = {
    zeitpunkt: new Date().toISOString(),
    version: (global.APP_VERSION || "unbekannt"),
    gesamt: ergebnisse.length, bestanden, fehlgeschlagen,
    selbstheilung: {
      geschlosseneAttrappenLuecken: luecken,
      hinweis: luecken.length
        ? "Diese Browser-Eigenschaften fehlten der Attrappe und wurden zur "
          + "Laufzeit ergaenzt. Dauerhaft in tests/lib/browser.js aufnehmen."
        : "Keine Attrappen-Luecken.",
    },
    fehler: ergebnisse.filter((e) => !e.bestanden),
  };

  if (alsJson) {
    console.log(JSON.stringify(bericht, null, 2));
  } else {
    for (const e of ergebnisse) {
      console.log((e.bestanden ? "  OK   " : "  FEHL ") + e.name
        + (e.fehlertext ? "  [" + e.fehlertext + "]" : ""));
    }
    if (luecken.length) {
      console.log("\n  SELBSTHEILUNG: " + luecken.length
        + " Attrappen-Luecke(n) automatisch geschlossen:");
      luecken.forEach((l) => console.log("    - " + l));
    }
    console.log(`\nErgebnis: ${bestanden} bestanden, ${fehlgeschlagen} fehlgeschlagen`);
  }

  const ordner = path.join(__dirname, "berichte");
  if (!fs.existsSync(ordner)) fs.mkdirSync(ordner, { recursive: true });
  fs.writeFileSync(path.join(ordner, "letzter-lauf.json"),
    JSON.stringify(bericht, null, 2));

  process.exit(fehlgeschlagen ? 1 : 0);
})();
