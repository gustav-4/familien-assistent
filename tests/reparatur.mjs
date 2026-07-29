// =====================================================================
// REPARATUR (Tor 1)
// ---------------------------------------------------------------------
// Laesst das Code-Modell einen MINIMALEN Patch zu einem konkreten
// Befund erzeugen und wendet ihn an. Danach uebernehmen die harten
// Tests und das Red-Team - dieses Modul entscheidet nichts allein.
//
// Sicherheitsleitplanken (bewusst eng):
//  * Nur exakte Textersetzungen ("alt" muss GENAU EINMAL vorkommen).
//  * Nur erlaubte Dateien (App-Code, keine Workflows, keine Secrets).
//  * Keine Loeschung ganzer Bloecke: "neu" darf nicht leer sein.
//  * Schlaegt eine Ersetzung fehl, wird NICHTS geschrieben.
//
// Aufruf: node tests/reparatur.mjs --befund="RT1-03 ..." [--trocken]
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
const MODELL = process.env.REPARATUR_MODELL || "claude-sonnet-4-6";
const trocken = process.argv.includes("--trocken");
const befundArg = process.argv.find((a) => a.startsWith("--befund="));
const befund = befundArg ? befundArg.slice("--befund=".length) : "";

const ERLAUBTE_DATEIEN = [
  "index.html", "sw.js", "install.js",
  "netlify/functions/rezept.mjs", "netlify/functions/termine.mjs",
  "netlify/functions/wecker.mjs", "netlify/functions/wecker-cron.mjs",
  "netlify/functions/feedback.mjs", "netlify/functions/qa.mjs",
  "netlify/functions/push-anmelden.mjs", "netlify/functions/vapid.mjs",
  "netlify/functions/termin-parse.mjs",
];

function berichtLesen(datei) {
  const p = path.join(HIER, "berichte", datei);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return null; }
}

function funktionAusQuelle(quelle, name) {
  const treffer = new RegExp("(?:async\\s+)?function\\s+" + name + "\\s*\\(")
    .exec(quelle);
  if (!treffer) return null;
  let tiefe = 0;
  for (let k = quelle.indexOf("{", treffer.index); k < quelle.length; k++) {
    if (quelle[k] === "{") tiefe++;
    if (quelle[k] === "}") { tiefe--; if (!tiefe) return quelle.slice(treffer.index, k + 1); }
  }
  return null;
}

/** Baut einen knappen Kontext: nur die Funktionen, die im Befund
 *  namentlich auftauchen - nicht die ganze Datei (Kostendisziplin). */
function kontextBauen(befundtext) {
  const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
  const quelle = (html.match(/<script>([\s\S]*?)<\/script>/g) || [])
    .map((b) => b.slice(8, -9)).join("\n;\n");
  const namen = [...new Set((quelle.match(/function\s+([a-zA-Z_][\w]*)/g) || [])
    .map((m) => m.split(/\s+/)[1]))];
  const genannt = namen.filter((n) => befundtext.includes(n));
  const auswahl = (genannt.length ? genannt : namen.slice(0, 0))
    .map((n) => funktionAusQuelle(quelle, n)).filter(Boolean);
  return { quelle, auszug: auswahl.join("\n\n"), genannt };
}

async function frageCodeModell(befundtext, auszug, fehlerliste) {
  const anweisung = `Du bist Senior-Entwickler einer deutschen Familien-App
(eine grosse index.html mit zwei script-Bloecken, dazu Netlify-Funktionen).

BEFUND aus der automatischen Qualitaetssicherung:
${befundtext}

Fehlgeschlagene Pruefungen im Wortlaut:
${fehlerliste}

${auszug ? "Relevanter Code:\n" + auszug : "(Kein Code-Auszug verfuegbar - "
  + "arbeite streng nach dem Wortlaut der Pruefungen.)"}

Erzeuge eine MINIMALE Reparatur. Antworte AUSSCHLIESSLICH mit JSON,
ohne Markdown, in exakt dieser Form:
{
  "begruendung": "ein Satz, was falsch war",
  "aenderungen": [
    { "datei": "index.html", "alt": "exakter vorhandener Text",
      "neu": "ersetzter Text" }
  ]
}

Harte Regeln:
- "alt" muss WORTGENAU und GENAU EINMAL in der Datei vorkommen.
- "alt" moeglichst kurz halten (eine bis wenige Zeilen).
- "neu" darf nicht leer sein.
- Keine Aenderung an Tests, Workflows oder Konfigurationsdateien.
- Wenn du dir nicht sicher bist, gib "aenderungen": [] zurueck.`;

  const antwort = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELL, max_tokens: 3000, temperature: 0,
      messages: [{ role: "user", content: anweisung }],
    }),
  });
  if (!antwort.ok) {
    throw new Error("Modellaufruf fehlgeschlagen: HTTP " + antwort.status);
  }
  const daten = await antwort.json();
  const text = (daten.content || []).filter((c) => c.type === "text")
    .map((c) => c.text).join("\n");
  const anfang = text.indexOf("{");
  const ende = text.lastIndexOf("}");
  if (anfang < 0 || ende < 0) throw new Error("Keine JSON-Antwort erhalten");
  return JSON.parse(text.slice(anfang, ende + 1));
}

/** Prueft alle Aenderungen gegen die Leitplanken. Wirft bei Verstoss,
 *  BEVOR irgendetwas geschrieben wird. Exportiert, damit testbar. */
export function pruefeAenderungen(aenderungen, leseDatei) {
  const lies = leseDatei || ((d) => fs.readFileSync(path.join(WURZEL, d), "utf8"));
  const geplant = [];
  for (const a of aenderungen) {
    const datei = String((a && a.datei) || "");
    if (!ERLAUBTE_DATEIEN.includes(datei)) {
      throw new Error("Datei nicht erlaubt: " + datei);
    }
    const inhalt = lies(datei);
    const alt = String((a && a.alt) || "");
    const neu = String((a && a.neu) || "");
    if (!alt) throw new Error("Leeres Suchmuster in " + datei);
    if (!neu) throw new Error("Leerer Ersatztext in " + datei);
    const treffer = inhalt.split(alt).length - 1;
    if (treffer !== 1) {
      throw new Error("Suchmuster kommt " + treffer + "x vor (genau 1x "
        + "noetig) in " + datei);
    }
    geplant.push({ datei, p: path.join(WURZEL, datei), inhalt, alt, neu });
  }
  return geplant;
}

async function hauptlauf() {
  const lauf = berichtLesen("letzter-lauf.json");
  const rt = berichtLesen("redteam.json");
  const fehler = []
    .concat(lauf ? lauf.fehler || [] : [])
    .concat(rt ? rt.verdachtsfaelle || [] : [])
    .concat(rt ? rt.bestandsfehler || [] : []);
  const fehlerliste = fehler.map((f) => "- " + f.name +
    (f.fehlertext ? " [" + f.fehlertext + "]" : "")).join("\n") || "(keine)";

  if (!fehler.length && !befund) {
    console.log("Kein Befund vorhanden - nichts zu reparieren.");
    process.exit(0);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY fehlt - Reparatur nicht moeglich.");
    process.exit(1);
  }

  const { auszug, genannt } = kontextBauen(befund + "\n" + fehlerliste);
  console.log(`Reparatur (${MODELL}): ${genannt.length} Funktion(en) im `
    + `Kontext, ${fehler.length} Befund(e).`);

  const vorschlag = await frageCodeModell(befund || "(siehe Pruefungen)",
    auszug, fehlerliste);
  const aenderungen = Array.isArray(vorschlag.aenderungen)
    ? vorschlag.aenderungen : [];
  console.log("Begruendung: " + (vorschlag.begruendung || "-"));
  console.log("Vorgeschlagene Aenderungen: " + aenderungen.length);

  if (!aenderungen.length) {
    console.log("Modell schlaegt keine Aenderung vor - Abbruch ohne Fehler.");
    fs.writeFileSync(path.join(HIER, "berichte", "reparatur.json"),
      JSON.stringify({ zeitpunkt: new Date().toISOString(),
        begruendung: vorschlag.begruendung || "", aenderungen: [] }, null, 2));
    process.exit(0);
  }

  // --- Leitplanken pruefen, BEVOR irgendetwas geschrieben wird ---
  const geplant = pruefeAenderungen(aenderungen);

  if (trocken) {
    console.log("TROCKENLAUF - nichts geschrieben.");
    geplant.forEach((g) => console.log("  wuerde aendern: " + g.datei));
    process.exit(0);
  }

  for (const g of geplant) {
    fs.writeFileSync(g.p, g.inhalt.replace(g.alt, g.neu));
    console.log("  geaendert: " + g.datei);
  }
  fs.writeFileSync(path.join(HIER, "berichte", "reparatur.json"),
    JSON.stringify({ zeitpunkt: new Date().toISOString(), modell: MODELL,
      begruendung: vorschlag.begruendung || "",
      aenderungen: geplant.map((g) => ({ datei: g.datei,
        alt: g.alt.slice(0, 200), neu: g.neu.slice(0, 200) })) }, null, 2));
  console.log("Reparatur angewendet. Jetzt uebernehmen Tests und Red-Team.");
}

// Nur ausfuehren, wenn direkt gestartet (nicht beim Import im Test)
if (process.argv[1] && process.argv[1].endsWith("reparatur.mjs")) {
  hauptlauf().catch((e) => {
    console.error("Reparatur abgebrochen: " + (e && e.message));
    process.exit(1);
  });
}
