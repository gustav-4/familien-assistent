// =====================================================================
// SELBSTHEILUNG
// ---------------------------------------------------------------------
// Repariert automatisch, was gefahrlos automatisch reparierbar ist:
//   (1) Attrappen-Luecken: DOM-Eigenschaften, die die App nutzt, die
//       aber in tests/lib/browser.js fehlten -> dauerhaft eintragen.
//   (2) Zeilennummern in ARBEITSGRUNDLAGE.md -> aus dem Code neu setzen.
// Alles andere (echte Code-Defekte) wird NICHT automatisch geaendert -
// eine Live-App fuer Familien darf kein Modell ungefragt umschreiben.
//
// Aufruf:  node tests/heilung.js [--trocken]
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");

const HIER = __dirname;
const WURZEL = path.resolve(HIER, "..");
const trocken = process.argv.includes("--trocken");
const BERICHTE = path.join(HIER, "berichte");
if (!fs.existsSync(BERICHTE)) fs.mkdirSync(BERICHTE, { recursive: true });
const protokoll = [];

// ---------- (1) Attrappen-Luecken schliessen ----------
function attrappenHeilen() {
  const berichtDatei = path.join(HIER, "berichte", "letzter-lauf.json");
  if (!fs.existsSync(berichtDatei)) return;
  const bericht = JSON.parse(fs.readFileSync(berichtDatei, "utf8"));
  const luecken = (bericht.selbstheilung
    && bericht.selbstheilung.geschlosseneAttrappenLuecken) || [];
  const namen = luecken
    .filter((l) => l.startsWith("dom-eigenschaft:"))
    .map((l) => l.split(":")[1]);
  if (!namen.length) return;

  const datei = path.join(HIER, "lib", "browser.js");
  let quelle = fs.readFileSync(datei, "utf8");
  const neue = namen.filter((n) => !new RegExp("\\b" + n + "\\b").test(quelle));
  if (!neue.length) return;

  const anker = "    closest() { return null; },";
  const eintrag = neue
    .map((n) => `    ${n}: undefined, // automatisch ergaenzt (Selbstheilung)`)
    .join("\n");
  quelle = quelle.replace(anker, anker + "\n" + eintrag);
  if (!trocken) fs.writeFileSync(datei, quelle);
  protokoll.push(`Attrappe erweitert um: ${neue.join(", ")}`);
}

// ---------- (2) Systemkarte synchronisieren ----------
function karteHeilen() {
  const karte = path.join(WURZEL, "ARBEITSGRUNDLAGE.md");
  if (!fs.existsSync(karte)) return;
  let doc = fs.readFileSync(karte, "utf8");
  const zeilen = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8").split("\n");
  const serverDateien = {};
  const fnOrdner = path.join(WURZEL, "netlify", "functions");
  if (fs.existsSync(fnOrdner)) {
    for (const f of fs.readdirSync(fnOrdner)) {
      serverDateien[f] = fs.readFileSync(path.join(fnOrdner, f), "utf8").split("\n");
    }
  }
  const fundstelle = (name) => {
    const muster = new RegExp(
      "(?:async\\s+)?(?:function|const|let)\\s+" + name + "\\b");
    for (let i = 0; i < zeilen.length; i++) if (muster.test(zeilen[i])) return i + 1;
    for (const zl of Object.values(serverDateien)) {
      for (let i = 0; i < zl.length; i++) if (muster.test(zl[i])) return i + 1;
    }
    return null;
  };
  let geaendert = 0;
  doc = doc.replace(/`([a-zA-Z_][a-zA-Z0-9_]*)`(\d{3,4})/g, (treffer, name, alt) => {
    const neu = fundstelle(name);
    if (neu === null) return treffer;
    if (String(neu) !== alt) geaendert++;
    return "`" + name + "`" + neu;
  });
  // Versionsstempel der Karte nachziehen
  const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
  const version = (html.match(/APP_VERSION = "([^"]+)"/) || [])[1];
  if (version) {
    doc = doc.replace(/# ARBEITSGRUNDLAGE – Familien-Assistent \S+/,
      "# ARBEITSGRUNDLAGE – Familien-Assistent " + version);
    doc = doc.replace(/Stand: \S+ \/ sw `[^`]+`/,
      "Stand: " + version + " / sw `app-" + version.toLowerCase() + "`");
  }
  if (!trocken) fs.writeFileSync(karte, doc);
  if (geaendert) protokoll.push(`Systemkarte: ${geaendert} Zeilennummern aktualisiert`);
}

attrappenHeilen();
karteHeilen();

if (!protokoll.length) {
  console.log("Selbstheilung: nichts zu tun.");
} else {
  console.log("Selbstheilung" + (trocken ? " (Trockenlauf)" : "") + ":");
  protokoll.forEach((p) => console.log("  - " + p));
}
fs.writeFileSync(path.join(BERICHTE, "heilung.json"),
  JSON.stringify({ zeitpunkt: new Date().toISOString(), trocken, protokoll },
    null, 2));
