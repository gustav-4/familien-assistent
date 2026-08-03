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
    suchen: "  gvBackoffZuruecksetzen();\n  if (warAus) tonAktiv();",
    ersetzen: "  gvBackoffZuruecksetzen();\n  tonAktiv();",
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
  // --- Dauergepiepe (Neustartschleife) ---
  {
    name: "Backoff entfernt - Neustart wieder alle 300 ms",
    datei: "index.html",
    suchen: "        const maxStufe = GV_BACKOFF_MS.length - 1;\n        warten = GV_BACKOFF_MS[Math.min(gvBackoffStufe, maxStufe)];\n        gvBackoffStufe++;",
    ersetzen: "        warten = 300;",
    erwarteRot: ["N1", "N2"],
  },
  {
    name: "Backoff wird nie zurueckgesetzt (Mikro wird traege)",
    datei: "index.html",
    suchen: "function gvBackoffZuruecksetzen() { gvBackoffStufe = 0; }",
    ersetzen: "function gvBackoffZuruecksetzen() { /* nichts */ }",
    erwarteRot: ["N5", "N6"],
  },
  {
    name: "Neustart auch waehrend der Ansage",
    datei: "index.html",
    suchen: "      if (micMuted) { gvChipStand(); return; }",
    ersetzen: "      if (false) { gvChipStand(); return; }",
    erwarteRot: ["N7"],
  },
  // --- Zweistufige Recherche ---
  {
    name: "Recherche fordert wieder volle Rezepte an",
    datei: "index.html",
    suchen: '        modus: "kurz",           // Stufe 1: ohne Kochschritte (siehe startCooking)\n',
    ersetzen: "",
    erwarteRot: ["O5"],
  },
  {
    name: "Nachladen schickt Rohmengen statt skalierter Mengen",
    datei: "index.html",
    suchen: "        zutaten: (rezept.ingredients || []).map((i) => ({\n          name: i.name, qty: i.qty, unit: i.unit })),",
    ersetzen: "        zutaten: (rezept.rohZutaten || []).map((i) => ({\n          name: i.name, qty: i.qty, unit: i.unit })),",
    erwarteRot: ["O6"],
  },
  {
    name: "Zeitlimit des Servers wieder ueber der Plattformgrenze",
    datei: "netlify/functions/rezept.mjs",
    suchen: "    const timeout = setTimeout(() => ctrl.abort(), 8500);",
    ersetzen: "    const timeout = setTimeout(() => ctrl.abort(), 45000);",
    erwarteRot: [],
    servertest: "tests/server/ausschluss.test.mjs",
  },
  // --- Kochmodus: Mikrofon, Erinnerungen, Garprobe ---
  {
    name: "Kochmodus horcht nicht mehr dauerhaft",
    datei: "index.html",
    suchen: "      } else if (kochAn && !garpause) {\n        warten = 300;                       // dauerhaft aufnahmebereit",
    ersetzen: "      } else if (false) {\n        warten = 300;",
    erwarteRot: ["P1", "P3"],
  },
  {
    name: "Garpause entfernt - Systemton auch waehrend des Ofens",
    datei: "index.html",
    suchen: "      const garpause = kochAn && timerRest > 45;",
    ersetzen: "      const garpause = false;",
    erwarteRot: ["P2"],
  },
  {
    name: "Erinnerung wieder starr statt schrittproportional",
    datei: "index.html",
    suchen: "  const sek = reminderAbstandSek(selectedRecipe, stepIndex, reminderStufe);",
    ersetzen: "  const sek = REMINDER_STUFEN[Math.min(reminderStufe, REMINDER_STUFEN.length - 1)];",
    erwarteRot: ["P17", "P18"],
  },
  {
    name: "Erste Erinnerung wieder zu frueh (halbe statt drei viertel Dauer)",
    datei: "index.html",
    suchen: "  return Math.max(40, Math.round(schrittDauerSek(recipe, index) * 0.75));",
    ersetzen: "  return Math.max(40, Math.round(schrittDauerSek(recipe, index) * 0.5));",
    erwarteRot: ["P9"],
  },
  {
    name: "Folge-Erinnerungen wieder haeufiger als einmal pro Minute",
    datei: "index.html",
    suchen: "  if (stufe > 0) return [60, 90, 120][Math.min(stufe - 1, 2)];",
    ersetzen: "  if (stufe > 0) return [25, 25, 25][Math.min(stufe - 1, 2)];",
    erwarteRot: ["P11", "P12"],
  },
  {
    name: "Garprobe faellt weg - nur noch Countdown",
    datei: "index.html",
    suchen: "  return wieViel + \"Schau jetzt nach, ob es gar ist – lieber einmal zu \" +\n    \"früh probieren als verkochen lassen.\";",
    ersetzen: "  return wieViel;",
    erwarteRot: ["P14", "P15"],
  },
  {
    name: "Endspurt-Hinweis wieder erst bei 30 s",
    datei: "index.html",
    suchen: "  return rest === 20 || rest === 10;         // Endspurt: 20 s und 10 s",
    ersetzen: "  return rest === 30 || rest === 10;",
    erwarteRot: ["P16", "E1"],
  },
  // --- Eingabe-Modus ---
  {
    name: "Eingabe-Modus spricht die Frage wieder aus",
    datei: "index.html",
    suchen: "  tonBereit();\n  gvEingabeTimer = setTimeout(() => {",
    ersetzen: "  tonBereit();\n  speak(frage, true);\n  gvEingabeTimer = setTimeout(() => {",
    erwarteRot: ["Q2"],
  },
  {
    name: "Bereit-Banner wird nicht mehr angezeigt",
    datei: "index.html",
    suchen: "  gvBereitAnzeigen(frage || \"Sprich jetzt\");",
    ersetzen: "  /* Banner entfernt */",
    erwarteRot: ["Q3"],
  },
  {
    name: "Chip flackert im Eingabe-Modus wieder",
    datei: "index.html",
    suchen: "  if (GlobalVoice.dialog && GlobalVoice.dialog.frage) {\n    gvChip(\"🎙️ \" + GlobalVoice.dialog.frage, \"eingabe\");\n    return;\n  }",
    ersetzen: "",
    erwarteRot: ["Q5"],
  },
  {
    name: "Backoff-Pause auch waehrend der Eingabe",
    datei: "index.html",
    suchen: "      if (GlobalVoice.dialog) {\n        warten = 250;\n      } else if (kochAn && !garpause) {",
    ersetzen: "      if (false) {\n        warten = 250;\n      } else if (kochAn && !garpause) {",
    erwarteRot: ["Q6"],
  },
  {
    name: "Abbruchwort wird nicht mehr erkannt",
    datei: "index.html",
    suchen: "  return /^(?:abbrechen|abbruch|vergiss es|vergessen|nichts|doch nicht|egal|stopp|stop)$/.test(t);",
    ersetzen: "  return false;",
    erwarteRot: ["Q9", "Q10"],
  },
  // --- Serverseitige Zeitbudgets (Ursache des hartnaeckigen 504) ---
  {
    name: "Redis-Aufruf wieder ohne Zeitlimit",
    datei: "netlify/functions/rezept.mjs",
    suchen: "      signal: frist.signal,\n      headers: { Authorization: \"Bearer \" + token,",
    ersetzen: "      headers: { Authorization: \"Bearer \" + token,",
    erwarteRot: [],
    servertest: "tests/server/ausschluss.test.mjs",
  },
  {
    name: "Gesamtbudget gesprengt (Redis-Frist zu grosszuegig)",
    datei: "netlify/functions/rezept.mjs",
    suchen: "function mitFrist(ms) {",
    ersetzen: "function mitFrist(ms) {\n  ms = 3000;",
    erwarteRot: [],
    servertest: "tests/server/ausschluss.test.mjs",
  },
  {
    name: "Kurzmodus macht wieder einen zweiten KI-Anlauf",
    datei: "netlify/functions/rezept.mjs",
    suchen: "  if (!parsed && !params.kurz && Date.now() - startZeit < 4000) {",
    ersetzen: "  if (!parsed && Date.now() - startZeit < 4000) {",
    erwarteRot: [],
    servertest: "tests/server/ausschluss.test.mjs",
  },
  {
    name: "F-013: Befehle haben in der Einkaufs-Kette keinen Vorrang mehr",
    datei: "index.html",
    suchen: "  const befehl = erkenneKommando(text);\n  if (befehl && befehl.typ !== \"einkauf\") {",
    ersetzen: "  const befehl = null;\n  if (befehl) {",
    erwarteRot: ["F-013 Echter Befehl"],
  },
  {
    name: "F-013: Abbruchwort wird in der Kette nicht mehr erkannt",
    datei: "index.html",
    suchen: "  if (istKetteEnde(text) || istAbbruch(text)) {",
    ersetzen: "  if (istKetteEnde(text)) {",
    // Nur "abbrechen": "tschuess" faengt bereits istKetteEnde ab.
    // Von der Gegenprobe aufgedeckt - die urspruengliche Erwartung war
    // falsch, nicht die Reparatur.
    erwarteRot: ["F-013 'abbrechen'"],
  },
  {
    name: "F-009: Mehrzahl 'rezepte' wird nicht mehr erkannt",
    datei: "index.html",
    suchen: "  m = t.match(/^(?:rezept(?:e|en)?|rezeptsuche|rezeptrecherche|suche|recherchiere)(?:[:,]?\\s+(.+))?$/);",
    ersetzen: "  m = t.match(/^(?:rezept|suche|recherchiere)(?:[:,]?\\s+(.+))?$/);",
    erwarteRot: ["F-009 'rezepte' ist ein Befehl"],
  },
  {
    name: "F-009: Fuellverben gelten wieder als Suchwunsch",
    datei: "index.html",
    suchen: "    rest = rest.replace(",
    ersetzen: "    rest = String(rest).replace(/__nie__/,",
    erwarteRot: ["F-009 'rezept recherchieren' hat KEINEN Suchwunsch"],
  },
  {
    name: "F-011: Chip wird im Kochmodus wieder eingeblendet",
    datei: "index.html",
    suchen: "  c.className = (klasse || \"\") + (imKochen ? \" verborgen\" : \"\");",
    ersetzen: "  c.className = (klasse || \"\");",
    erwarteRot: ["F-011 Im Kochmodus ist der schwebende Chip"],
  },
  {
    name: "F-011: Bereit-Banner erscheint im Kochmodus wieder zusaetzlich",
    datei: "index.html",
    suchen: "  if (b && !imKochen) b.classList.add(\"sichtbar\");",
    ersetzen: "  if (b) b.classList.add(\"sichtbar\");",
    erwarteRot: ["F-011 Bereit-Banner erscheint im Kochmodus NICHT"],
  },
  {
    name: "F-012: Feedback-Knopf rutscht wieder unter den Mikrofon-Chip",
    datei: "index.html",
    suchen: 'style="position:fixed;right:14px;bottom:150px;z-index:901;width:54px;',
    ersetzen: 'style="position:fixed;right:14px;bottom:78px;z-index:40;width:54px;',
    erwarteRot: ["F-012 Feedback-Knopf und Mikrofon-Chip ueberlappen NICHT",
      "F-012 Der Feedback-Knopf ist nicht mehr niedriger gestapelt"],
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
  let bericht, servertestRot = false;
  try {
    bericht = laufen();
    if (m.servertest) {
      try {
        execFileSync("node", [path.join(WURZEL, m.servertest)],
          { cwd: WURZEL, stdio: "ignore" });
      } catch (e) { servertestRot = true; }
    }
  } finally { fs.writeFileSync(pfad, original, "utf8"); }

  if (m.servertest && !servertestRot) {
    console.log("LUECKE  " + m.name + "  -> Servertest bemerkt nichts");
    luecken++;
    ergebnisse.push({ name: m.name, status: "servertest-blind" });
    continue;
  }
  if (m.servertest && servertestRot && !m.erwarteRot.length) {
    console.log("bemerkt " + m.name + "  (Servertest rot)");
    ergebnisse.push({ name: m.name, status: "bemerkt", via: "servertest" });
    continue;
  }

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
