// =====================================================================
// MELDUNG ANS HANDY
// Schickt den zuletzt erzeugten Bericht an /api/qa. Der Briefkasten
// legt ihn ab und weckt das Betreiber-Handy - aber nur, wenn es etwas
// zu entscheiden gibt (gruene Laeufe erzeugen keine Meldung).
//
// Aufruf: node tests/melde.mjs --anlass=nacht|reparatur
//                              [--tests=success|failure] [--rt=...]
// Braucht: QA_TOKEN (GitHub-Secret) und die oeffentliche App-Adresse.
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verstaendlichMachen } from "./klartext.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ZIEL = (process.env.QA_ZIEL || "https://familienassistent.net") + "/api/qa";
const arg = (name, standard) => {
  const t = process.argv.find((a) => a.startsWith("--" + name + "="));
  return t ? t.split("=").slice(1).join("=") : standard;
};

function lies(datei) {
  const p = path.join(HIER, "berichte", datei);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; }
}

export async function melden(argumente) {
const lauf = lies("letzter-lauf.json");
const rt = lies("redteam.json");
const heilung = lies("heilung.json");
const reparatur = lies("reparatur.json");

/** Version IMMER direkt aus der App lesen - unabhaengig davon, ob der
 *  Testbericht sie enthaelt. Robuster als jede Zwischenstation. */
function versionAusApp() {
  try {
    const html = fs.readFileSync(path.join(HIER, "..", "index.html"), "utf8");
    return (html.match(/APP_VERSION = "([^"]+)"/) || [])[1] || "";
  } catch (e) { return ""; }
}

// Red-Team-Faelle stehen bereits in den Verdachtsfaellen. Ohne diesen
// Filter erscheint derselbe Befund zweimal: als Fehler UND als Verdacht.
function ohneRedTeam(liste) {
  return (Array.isArray(liste) ? liste : [])
    .filter((f) => !/^RT/.test(String(f && f.name)));
}

const bericht = {
  version: versionAusApp() || (lauf && lauf.version) || "unbekannt",
  anlass: arg("anlass", "lauf"),
  gesamt: (lauf && lauf.gesamt) || 0,
  bestanden: (lauf && lauf.bestanden) || 0,
  fehlgeschlagen: (lauf && lauf.fehlgeschlagen) || 0,
  fehler: ohneRedTeam(lauf && lauf.fehler),
  verdachtsfaelle: (rt && rt.verdachtsfaelle) || [],
  selbstheilung: (heilung && heilung.protokoll) || [],
  lauf: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
      + `/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "",
};

// Ergebnis einer Reparatur ergaenzen, damit das Postfach sie erklaert
if (reparatur && reparatur.begruendung) {
  bericht.fehler = bericht.fehler.concat([{
    name: "Reparatur angewendet: " + reparatur.begruendung,
    fehlertext: "Tests: " + arg("tests", "?") + " Â· Red-Team: " + arg("rt", "?"),
  }]);
}

// Technische Befunde in Alltagsdeutsch uebersetzen (Woerterbuch +
// optional Modell). Schlaegt das fehl, geht der Bericht trotzdem raus.
try { await verstaendlichMachen(bericht); }
catch (e) { console.error("Klartext uebersprungen: " + e.message); }

if (!process.env.QA_TOKEN) {
  console.error("QA_TOKEN fehlt - Meldung uebersprungen.");
  return { uebersprungen: true, bericht };
}

const antwort = await fetch(ZIEL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ qa_token: process.env.QA_TOKEN, bericht }),
});
const text = await antwort.text();
console.log("Meldung an " + ZIEL + ": HTTP " + antwort.status + " "
  + text.slice(0, 200));
return { ok: antwort.ok, status: antwort.status, bericht };
}

// Nur ausfuehren, wenn direkt gestartet (nicht beim Import im Test)
if (process.argv[1] && process.argv[1].endsWith("melde.mjs")) {
  melden().then((e) => process.exit(e && e.ok === false ? 1 : 0))
    .catch((e) => { console.error("Meldung fehlgeschlagen: " + e.message);
      process.exit(1); });
}
