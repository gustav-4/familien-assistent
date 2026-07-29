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

const lauf = lies("letzter-lauf.json");
const rt = lies("redteam.json");
const heilung = lies("heilung.json");
const reparatur = lies("reparatur.json");

const bericht = {
  version: (lauf && lauf.version) || "unbekannt",
  anlass: arg("anlass", "lauf"),
  gesamt: (lauf && lauf.gesamt) || 0,
  bestanden: (lauf && lauf.bestanden) || 0,
  fehlgeschlagen: (lauf && lauf.fehlgeschlagen) || 0,
  fehler: (lauf && lauf.fehler) || [],
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
    fehlertext: "Tests: " + arg("tests", "?") + " · Red-Team: " + arg("rt", "?"),
  }]);
}

if (!process.env.QA_TOKEN) {
  console.error("QA_TOKEN fehlt - Meldung uebersprungen.");
  process.exit(0);
}

const antwort = await fetch(ZIEL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ qa_token: process.env.QA_TOKEN, bericht }),
});
const text = await antwort.text();
console.log("Meldung an " + ZIEL + ": HTTP " + antwort.status + " " + text.slice(0, 200));
process.exit(antwort.ok ? 0 : 1);
