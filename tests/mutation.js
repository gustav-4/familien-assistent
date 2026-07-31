// =====================================================================
// MUTATIONSTESTER (Gegenprobe)
// ---------------------------------------------------------------------
// Ein gruener Test beweist nichts. Er beweist erst dann etwas, wenn er
// ROT wird, sobald man die zugehoerige Reparatur zerstoert.
//
// Dieses Werkzeug macht genau das: Es baut jede Reparatur einzeln
// wieder kaputt, laesst die Szenarien laufen und verlangt, dass die
// benannten Tests fehlschlagen. Bleibt alles gruen, ist der Test
// wertlos - er wird hier als LUECKE gemeldet.
//
// Anlass: Der alte Test G6 suchte nur eine Zeichenkette im Quelltext.
// Er wurde rot, als der Selbsthoer-Schutz VERBESSERT wurde, und waere
// gruen geblieben, haette man ihn geloescht. Solche Tests darf es in
// diesem Projekt nicht mehr geben.
//
// Aufruf:  node tests/mutation.js
// Exit-Code 0 = jede Mutation wurde bemerkt, 1 = mindestens eine Luecke.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const WURZEL = path.resolve(__dirname, "..");

// Jede Mutation zerstoert GENAU EINE Reparatur.
// erwarteRot = Tests, die das bemerken muessen (Praefix genuegt).
const MUTATIONEN = [
  {
    name: "Selbsthoer-Schutz entfernt",
    datei: "index.html",
    suchen: "      if (istEigenesEcho(said, ttsEchoAktuell, ttsEchoVorher)) return;",
    ersetzen: "      if (false) return;",
    erwarteRot: ["M1", "G6"],
  },
  {
    name: "Echo-Erkennung meldet immer 'kein Echo'",
    datei: "index.html",
    suchen: "function istEigenesEcho(gehoert, aktuell, vorher) {\n  const h = gvNorm(gehoert);",
    ersetzen: "function istEigenesEcho(gehoert, aktuell, vorher) {\n  if (true) return false;\n  const h = gvNorm(gehoert);",
    erwarteRot: ["M1", "M4", "G6"],
  },
  {
    name: "Echo-Erkennung verschluckt auch einzelne Woerter",
    datei: "index.html",
    suchen: "    if (woerter.length < 2) {\n      if (quelle === h) return true;\n      continue;\n    }",
    ersetzen: "    if (woerter.length < 2) {\n      if (quelle.includes(h)) return true;\n      continue;\n    }",
    erwarteRot: ["M3"],
  },
  {
    name: "Aktivton wieder bei jedem Neustart",
    datei: "index.html",
    suchen: "  const warAus = !GlobalVoice.aktiv;\n  GlobalVoice.aktiv = true;\n  gvLetztesErgebnis = Date.now();\n  if (warAus) tonAktiv();",
    ersetzen: "  const warAus = !GlobalVoice.aktiv;\n  GlobalVoice.aktiv = true;\n  gvLetztesErgebnis = Date.now();\n  tonAktiv();",
    erwarteRot: ["M8"],
  },
  {
    name: "Einschlafton entfernt",
    datei: "index.html",
    suchen: "        tonSchlaf(); // deutlicher, absteigender Hinweiston",
    ersetzen: "        // Ton entfernt",
    erwarteRot: ["M15"],
  },
  {
    name: "Sprechblasen-Deckel von 15 Sekunden zurueck",
    datei: "index.html",
    suchen: "    }, Math.max(6000, text.length * 90) + 2000);",
    ersetzen: "    }, Math.min(4000 + text.length * 60, 15000));",
    erwarteRot: ["M11"],
  },
  {
    name: "Chip luegt waehrend der Ansage wieder gruen",
    datei: "index.html",
    suchen: '  gvChip("🔊 Ich rede – du kannst mich unterbrechen", "redet");',
    ersetzen: '  gvChip("🎤 an – ich höre", "an");',
    erwarteRot: ["M13"],
  },
  {
    name: "Eigene Redezeit zaehlt wieder als Stille",
    datei: "index.html",
    suchen: "    gvLetztesErgebnis = Date.now();\n    ttsDanach = typeof danach === \"function\" ? danach : null;",
    ersetzen: "    ttsDanach = typeof danach === \"function\" ? danach : null;",
    erwarteRot: ["M16"],
  },
  {
    name: "Einkaufsbefehl wieder eng gefasst",
    datei: "index.html",
    suchen: "  if (!m && t.length <= 60 && /\\bauf\\s+die\\s+(?:\\w+\\s+)?(?:einkaufs\\s*)?liste\\b/.test(t)",
    ersetzen: "  if (false && t.length <= 60 && /\\bauf\\s+die\\s+(?:\\w+\\s+)?(?:einkaufs\\s*)?liste\\b/.test(t)",
    erwarteRot: ["M22a", "M22b"],
  },
  {
    name: "Zurueck-Befehl ohne Alleinstehend-Sicherung",
    datei: "index.html",
    suchen: "function istZurueck(text) {\n  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, \"\");",
    ersetzen: "function istZurueck(text) {\n  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, \"\");\n  if (/zur(?:ü|ue)ck/.test(t)) return true;",
    erwarteRot: ["M26", "M27", "M45"],
  },
  {
    name: "prevStep zaehlt nicht zurueck",
    datei: "index.html",
    suchen: "  if (stepIndex > 0) {\n    stepIndex--;\n    document.getElementById(\"favoriteBox\").classList.add(\"hidden\");",
    ersetzen: "  if (stepIndex > 0) {\n    document.getElementById(\"favoriteBox\").classList.add(\"hidden\");",
    erwarteRot: ["M28"],
  },
  {
    name: "Synonymgruppen im Ausschluss abgeschaltet",
    datei: "index.html",
    suchen: "      if (gruppe.some((g) => g === w || w.includes(g) || g.includes(w))) {\n        gruppe.forEach((g) => raus.add(g));\n      }",
    ersetzen: "      if (false) { gruppe.forEach((g) => raus.add(g)); }",
    erwarteRot: ["M36", "M37", "M39"],
  },
  {
    name: "Ausschluss prueft die Schritttexte nicht mehr",
    datei: "index.html",
    suchen: "  (recipe.steps || []).forEach((s) => felder.push(String(s && s.text || \"\")));\n  felder.push(String(recipe.name || \"\"));",
    ersetzen: "  felder.push(String(recipe.name || \"\"));",
    erwarteRot: ["M40"],
  },
  {
    name: "Einkaufs-Zurueck entfernt den Artikel nicht",
    datei: "index.html",
    suchen: "        vState.liste.splice(i, 1);\n        break;",
    ersetzen: "        break;",
    erwarteRot: ["M33"],
  },
];

function laufen() {
  try {
    const roh = execFileSync("node", [path.join(WURZEL, "tests/run.js"), "--json"],
      { cwd: WURZEL, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(roh);
  } catch (e) {
    // Exit-Code 1 bei roten Tests ist der Normalfall - Bericht steht in stdout
    const roh = (e && e.stdout) || "";
    try { return JSON.parse(roh); } catch (e2) {
      return { gesamt: 0, fehlgeschlagen: -1, fehler: [],
        ladefehler: String((e && e.message) || e2).slice(0, 300) };
    }
  }
}

const ergebnisse = [];
let luecken = 0;

// Ausgangslage: alles muss gruen sein, sonst ist die Gegenprobe wertlos.
const start = laufen();
if (start.fehlgeschlagen !== 0) {
  console.error("ABBRUCH: Die Szenarien sind nicht gruen (" +
    start.fehlgeschlagen + " rot). Erst reparieren, dann mutieren.");
  process.exit(1);
}
console.log("Ausgangslage: " + start.bestanden + " Tests gruen.\n");

for (const m of MUTATIONEN) {
  const pfad = path.join(WURZEL, m.datei);
  const original = fs.readFileSync(pfad, "utf8");
  const treffer = original.split(m.suchen).length - 1;

  if (treffer !== 1) {
    console.log("LUECKE  " + m.name +
      "  (Muster " + treffer + "x gefunden, erwartet 1x)");
    luecken++;
    ergebnisse.push({ name: m.name, status: "muster-fehlt", treffer });
    continue;
  }

  fs.writeFileSync(pfad, original.split(m.suchen).join(m.ersetzen), "utf8");
  let bericht;
  try { bericht = laufen(); }
  finally { fs.writeFileSync(pfad, original, "utf8"); }

  const roteNamen = (bericht.fehler || []).map((f) => String(f.name || ""));
  const unbemerkt = m.erwarteRot.filter(
    (p) => !roteNamen.some((n) => n.indexOf(p) === 0));

  if (bericht.fehlgeschlagen === -1) {
    console.log("LUECKE  " + m.name + "  (Testlauf abgestuerzt)");
    luecken++;
    ergebnisse.push({ name: m.name, status: "absturz" });
  } else if (unbemerkt.length) {
    console.log("LUECKE  " + m.name +
      "  -> unbemerkt von: " + unbemerkt.join(", "));
    luecken++;
    ergebnisse.push({ name: m.name, status: "unbemerkt", unbemerkt });
  } else {
    console.log("bemerkt " + m.name +
      "  (" + bericht.fehlgeschlagen + " Tests rot)");
    ergebnisse.push({ name: m.name, status: "bemerkt",
      rot: bericht.fehlgeschlagen });
  }
}

const berichtOrdner = path.join(__dirname, "berichte");
if (!fs.existsSync(berichtOrdner)) fs.mkdirSync(berichtOrdner, { recursive: true });
fs.writeFileSync(path.join(berichtOrdner, "mutation.json"),
  JSON.stringify({ zeitpunkt: new Date().toISOString(),
    mutationen: MUTATIONEN.length, luecken, ergebnisse }, null, 2), "utf8");

console.log("\nErgebnis: " + (MUTATIONEN.length - luecken) + " von " +
  MUTATIONEN.length + " Mutationen wurden bemerkt.");
if (luecken) {
  console.log("ACHTUNG: " + luecken + " Reparatur(en) sind NICHT durch " +
    "einen wirksamen Test abgesichert.");
}
process.exit(luecken ? 1 : 0);
