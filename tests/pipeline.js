// =====================================================================
// EVIDENZBASIERTE FAIL-FAST-PIPELINE
// ---------------------------------------------------------------------
// Warum es diese Datei gibt:
// Die bisherigen Regeln ("hoechst effizient", "absolut maximal hart")
// waren Anstrengungsbeschreibungen. Sie hatten keine Abbruchbedingung -
// man konnte sie erfuellen und trotzdem schlechte Arbeit abliefern.
// Und sie standen im Widerspruch zueinander: Wer schneller sein will,
// prueft weniger.
//
// AUFLOESUNG DES WIDERSPRUCHS - der Kern dieser Datei:
// Effizienz und Haerte wirken auf VERSCHIEDENE ACHSEN.
//   * HAERTE  bestimmt, WANN etwas abgenommen ist  -> Abnahmepunkt.
//   * EFFIZIENZ bestimmt, in WELCHER REIHENFOLGE und mit welchem
//     Umfang die Beweise beschafft werden          -> Wegoptimierung.
// Effizienz darf also den WEG zum Beweis kuerzen, niemals den BEWEIS.
// Wo beides kollidiert, gewinnt ausnahmslos die Haerte. Das ist keine
// Meinung mehr, sondern der Rueckgabewert dieses Programms.
//
// Aufruf:
//   node tests/pipeline.js              (voll, mit Zwischenspeicher)
//   node tests/pipeline.js --alles      (Zwischenspeicher ignorieren)
//   node tests/pipeline.js --seit=HEAD~1  (nur betroffene Stufen)
//
// Exit 0 = abgenommen. Exit 1 = NICHT abgenommen, Grund steht oben.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const WURZEL = path.resolve(__dirname, "..");
const CACHE_DATEI = path.join(__dirname, "berichte", "pipeline-cache.json");
const ARG = process.argv.slice(2).join(" ");
const ALLES = /--alles/.test(ARG);

// --------------------------------------------------------------------
// Werkzeug
// --------------------------------------------------------------------
function hashVon(dateien) {
  const h = crypto.createHash("sha256");
  for (const d of dateien.sort()) {
    const p = path.join(WURZEL, d);
    h.update(d);
    try { h.update(fs.readFileSync(p)); } catch (e) { h.update("fehlt"); }
  }
  return h.digest("hex").slice(0, 16);
}

function dateienUnter(ordner, endung) {
  const raus = [];
  const gehe = (rel) => {
    let eintraege;
    try { eintraege = fs.readdirSync(path.join(WURZEL, rel), { withFileTypes: true }); }
    catch (e) { return; }
    for (const e of eintraege) {
      const kind = rel ? rel + "/" + e.name : e.name;
      if (e.isDirectory()) { if (e.name !== "berichte") gehe(kind); }
      else if (!endung || kind.endsWith(endung)) raus.push(kind);
    }
  };
  gehe(ordner);
  return raus;
}

function lauf(befehl, argumente) {
  try {
    const aus = execFileSync(befehl, argumente,
      { cwd: WURZEL, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, aus };
  } catch (e) {
    return { ok: false,
      aus: String((e && e.stdout) || "") + String((e && e.stderr) || "") };
  }
}

function cacheLesen() {
  if (ALLES) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_DATEI, "utf8")); }
  catch (e) { return {}; }
}

function cacheSchreiben(c) {
  try {
    fs.mkdirSync(path.dirname(CACHE_DATEI), { recursive: true });
    fs.writeFileSync(CACHE_DATEI, JSON.stringify(c, null, 2), "utf8");
  } catch (e) {}
}

// --------------------------------------------------------------------
// STUFE 0 - REPRODUKTIONSNACHWEIS (Sekunden)
// Ohne diese Stufe waeren alle folgenden wertlos: Sie beantwortet die
// Frage, ob ein gemeldeter Fehler ueberhaupt durch einen Test bewacht
// wird. Genau hier sind mir in dieser Sitzung die Fehler unterlaufen -
// ich habe repariert, ohne vorher zu reproduzieren.
// --------------------------------------------------------------------
function stufe0() {
  const register = JSON.parse(
    fs.readFileSync(path.join(__dirname, "fehlerregister.json"), "utf8"));
  const szenarien = fs.readFileSync(path.join(__dirname, "szenarien.js"), "utf8");
  const mutationen = fs.readFileSync(path.join(__dirname, "mutation.js"), "utf8");
  const serverTests = dateienUnter("tests/server")
    .map((d) => fs.readFileSync(path.join(WURZEL, d), "utf8")).join("\n");

  const maengel = [];
  for (const f of register.fehler) {
    if (!f.tests || !f.tests.length)
      maengel.push(f.id + ": kein Test hinterlegt");
    for (const t of f.tests || []) {
      const name = t.replace(/^Servertest:\s*/, "");
      const drin = szenarien.indexOf('"' + name) >= 0
        || szenarien.indexOf('pruefe("' + name) >= 0
        || serverTests.indexOf(name) >= 0;
      if (!drin) maengel.push(f.id + ': Test "' + t + '" existiert nicht');
    }
    if (!f.mutation) maengel.push(f.id + ": keine Mutation hinterlegt");
    else if (mutationen.indexOf(f.mutation) < 0)
      maengel.push(f.id + ': Mutation "' + f.mutation + '" existiert nicht');
  }
  return { ok: maengel.length === 0,
    text: maengel.length ? maengel.join("\n  ")
      : register.fehler.length + " gemeldete Fehler, alle mit Test und Mutation belegt" };
}

// --------------------------------------------------------------------
// STUFE 1 - STATISCHE EVIDENZ (Sekunden)
// Formale Fehler ohne einen einzigen Testlauf. Billigste Stufe zuerst.
// --------------------------------------------------------------------
function stufe1() {
  const fehler = [];

  // 1a. Syntax aller ausfuehrbaren Dateien
  for (const d of ["sw.js", "install.js"].concat(
    dateienUnter("netlify/functions", ".mjs"),
    dateienUnter("tests", ".js"), dateienUnter("tests", ".mjs"))) {
    const r = lauf("node", ["--check", d]);
    if (!r.ok) fehler.push("Syntaxfehler in " + d + "\n" + r.aus.slice(0, 300));
  }

  // 1b. index.html: eingebettete JavaScript-Bloecke pruefen.
  // Nur echte Skripte - JSON-LD und externe Verweise gehoeren nicht dazu.
  const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
  html.split("<script").slice(1).forEach((roh, i) => {
    const kopfEnde = roh.indexOf(">");
    const kopf = roh.slice(0, kopfEnde);
    if (/\bsrc\s*=/.test(kopf)) return;                 // externe Datei
    if (/type\s*=\s*["'][^"']*json/i.test(kopf)) return; // JSON-LD
    const code = roh.slice(kopfEnde + 1, roh.indexOf("</script>"));
    if (!code || code.trim().length < 50) return;
    try { new Function(code); }
    catch (e) { fehler.push("Syntaxfehler in index.html, Skriptblock " +
      (i + 1) + ": " + e.message); }
  });

  // 1c. Hausregeln, die kein Test abdeckt
  if (html.indexOf("Math.random()") >= 0)
    fehler.push("Math.random() im Frontend - Ergebnisse waeren nicht reproduzierbar");
  if (/localStorage/.test(html) === false)
    fehler.push("localStorage fehlt - Familiendaten wuerden nicht ueberleben");

  // 1d. Doppelt gepflegte Listen muessen uebereinstimmen
  const server = fs.readFileSync(
    path.join(WURZEL, "netlify/functions/rezept.mjs"), "utf8");
  // Textvergleich genuegt NICHT: Die Serverdatei schreibt Umlaute als
  // \uXXXX. Beide Listen werden deshalb ausgewertet und inhaltlich
  // verglichen - sonst meldet das Tor einen Fehler, den es nicht gibt,
  // und wird nach dem dritten Fehlalarm ignoriert.
  const gruppen = (t) => {
    const i = t.indexOf("AUSSCHLUSS_GRUPPEN = [");
    if (i < 0) return null;
    let tiefe = 0, k = t.indexOf("[", i);
    const a = k;
    for (; k < t.length; k++) {
      if (t[k] === "[") tiefe++;
      else if (t[k] === "]") { tiefe--; if (!tiefe) break; }
    }
    try { return JSON.stringify((0, eval)(t.slice(a, k + 1))); }
    catch (e) { return "unlesbar:" + e.message; }
  };
  const gA = gruppen(html), gB = gruppen(server);
  if (gA === null || gB === null)
    fehler.push("AUSSCHLUSS_GRUPPEN nicht gefunden");
  else if (gA !== gB)
    fehler.push("AUSSCHLUSS_GRUPPEN in index.html und rezept.mjs weichen " +
      "inhaltlich ab - der Server laesst dann durch, was die App sperrt");

  // 1e. Zeitbudget der Serverfunktion (reine Arithmetik, kein Testlauf)
  const fristen = (server.match(/ctrl\.abort\(\),\s*(\d+)\)/g) || [])
    .map((t) => Number(t.match(/(\d+)/)[1]));
  const redis = Number((server.match(/mitFrist\((\d+)\)/) || [])[1] || 0);
  const budget = 2 * redis + Math.max.apply(null, fristen.concat([0]));
  if (!fristen.length) fehler.push("Kein KI-Aufruf hat eine Notbremse");
  else if (budget >= 10000)
    fehler.push("Zeitbudget " + (budget / 1000).toFixed(1) +
      " s erreicht die Plattformgrenze von 10 s");

  // 1f. Versionsstempel muessen zusammenpassen
  const swV = (fs.readFileSync(path.join(WURZEL, "sw.js"), "utf8")
    .match(/app-fusion(\d+)/) || [])[1];
  const appV = (html.match(/APP_VERSION = "FUSION(\d+)"/) || [])[1];
  if (!swV || !appV || swV !== appV)
    fehler.push("Version in sw.js (" + swV + ") und index.html (" + appV +
      ") stimmen nicht ueberein - das Update erreicht die Familie nicht");

  return { ok: fehler.length === 0,
    text: fehler.length ? fehler.join("\n  ")
      : "Syntax, Hausregeln, Listengleichstand, Zeitbudget und Version in Ordnung" };
}

// --------------------------------------------------------------------
// STUFE 2 - DETERMINISTISCHE ISOLATION (< 1 Minute)
// --------------------------------------------------------------------
function stufe2() {
  const r = lauf("node", ["tests/run.js"]);
  const z = (r.aus.match(/Ergebnis: (\d+) bestanden, (\d+) fehlgeschlagen/) || []);
  return { ok: r.ok,
    text: r.ok ? z[1] + " Szenarien gruen"
      : (r.aus.match(/ {2}FEHL .*/g) || ["unbekannt"]).join("\n  ") };
}

function stufe2b() {
  const dateien = dateienUnter("tests/server", ".test.mjs");
  const rot = [];
  for (const d of dateien) {
    const r = lauf("node", [d]);
    if (!r.ok) rot.push(d + "\n  " +
      (r.aus.match(/ {2}FEHL .*/g) || []).join("\n  "));
  }
  return { ok: rot.length === 0,
    text: rot.length ? rot.join("\n  ") : dateien.length + " Servertestdateien gruen" };
}

// --------------------------------------------------------------------
// STUFE 3 - DYNAMISCHE HAERTE (Minuten)
// Teuer, deshalb ZULETZT. Hier wird bewiesen, dass die Tests aus
// Stufe 2 ueberhaupt etwas taugen: Jede Reparatur wird zerstoert, und
// die zustaendigen Tests MUESSEN rot werden.
// --------------------------------------------------------------------
function stufe3() {
  const r = lauf("node", ["tests/mutation.js"]);
  const z = (r.aus.match(/Ergebnis: (\d+) von (\d+) Mutationen wurden bemerkt/) || []);
  return { ok: r.ok,
    text: r.ok ? z[0] : (r.aus.match(/LUECKE.*/g) || ["unbekannt"]).join("\n  ") };
}

// --------------------------------------------------------------------
// Ablaufsteuerung: Test Impact Analysis + Zwischenspeicher
// --------------------------------------------------------------------
const STUFEN = [
  { nr: 0, name: "Reproduktionsnachweis", fn: stufe0,
    quellen: () => ["tests/fehlerregister.json", "tests/szenarien.js",
      "tests/mutation.js"].concat(dateienUnter("tests/server", ".test.mjs")) },
  { nr: 1, name: "Statische Evidenz", fn: stufe1,
    quellen: () => ["index.html", "sw.js", "install.js"]
      .concat(dateienUnter("netlify/functions", ".mjs"))
      .concat(dateienUnter("tests", ".js")) },
  { nr: 2, name: "Deterministische Isolation (App)", fn: stufe2,
    quellen: () => ["index.html", "tests/szenarien.js", "tests/run.js",
      "tests/lib/browser.js"] },
  { nr: 2, name: "Deterministische Isolation (Server)", fn: stufe2b,
    quellen: () => dateienUnter("netlify/functions", ".mjs")
      .concat(dateienUnter("tests/server", ".test.mjs"))
      .concat(["index.html"]) },
  { nr: 3, name: "Dynamische Haerte (Mutationsprobe)", fn: stufe3,
    quellen: () => ["index.html", "tests/mutation.js", "tests/szenarien.js",
      "tests/lib/browser.js"]
      .concat(dateienUnter("netlify/functions", ".mjs"))
      .concat(dateienUnter("tests/server", ".test.mjs")) },
];

const cache = cacheLesen();
const neu = {};
let abgebrochen = null;
const beginn = Date.now();

console.log("Fail-Fast-Pipeline - Abbruch bei der ersten roten Stufe\n");

for (const s of STUFEN) {
  const schluessel = "s" + s.nr + ":" + s.name;
  const hash = hashVon(s.quellen());
  const t0 = Date.now();

  if (cache[schluessel] && cache[schluessel].hash === hash
      && cache[schluessel].ok) {
    console.log("  [" + s.nr + "] " + s.name + " - uebersprungen " +
      "(unveraendert seit letztem gruenen Lauf)");
    neu[schluessel] = cache[schluessel];
    continue;
  }

  const r = s.fn();
  const dauer = ((Date.now() - t0) / 1000).toFixed(1) + " s";
  neu[schluessel] = { hash, ok: r.ok };

  if (r.ok) {
    console.log("  [" + s.nr + "] " + s.name + " - GRUEN (" + dauer + ")");
    console.log("        " + r.text);
  } else {
    console.log("  [" + s.nr + "] " + s.name + " - ROT (" + dauer + ")");
    console.log("        " + r.text);
    abgebrochen = s;
    break;
  }
}

cacheSchreiben(neu);
const gesamt = ((Date.now() - beginn) / 1000).toFixed(1);

if (abgebrochen) {
  console.log("\nNICHT ABGENOMMEN. Stufe " + abgebrochen.nr + " (" +
    abgebrochen.name + ") ist rot.");
  console.log("Alle spaeteren Stufen wurden NICHT ausgefuehrt - erst die " +
    "Ursache beheben.");
  console.log("Laufzeit bis zum Abbruch: " + gesamt + " s");
  process.exit(1);
}

console.log("\nABGENOMMEN. Alle Stufen gruen. Laufzeit: " + gesamt + " s");
process.exit(0);
