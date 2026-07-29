// =====================================================================
// RED-TEAM-TESTER (Modell: Fable 5)
// ---------------------------------------------------------------------
// Zweck: Ein UNABHAENGIGES Modell greift die Logik der App an und
// erfindet Testfaelle, auf die das bauende Modell nicht gekommen ist.
// Bewusste Rollentrennung: wer den Code schreibt, hat blinde Flecken
// genau dort, wo er beim Schreiben schon falsch gedacht hat.
//
// Aufruf:  node tests/redteam.mjs [--runden=1] [--budget=6]
// Voraussetzung: Umgebungsvariable ANTHROPIC_API_KEY
//
// Kostendisziplin: Es wird NICHT die ganze index.html verschickt
// (200 kB), sondern nur ein Auszug der reinen, deterministischen
// Funktionen - genau die, die sich ohne Browser testen lassen.
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..");
const MODELL = process.env.REDTEAM_MODELL || "claude-fable-5";
const RUNDEN = Number((process.argv.find((a) => a.startsWith("--runden=")) || "").split("=")[1] || 1);
const BERICHTE = path.join(HIER, "berichte");
if (!fs.existsSync(BERICHTE)) fs.mkdirSync(BERICHTE, { recursive: true });
const BUDGET = Number((process.argv.find((a) => a.startsWith("--budget=")) || "").split("=")[1] || 6);

// Diese Funktionen sind rein (kein DOM, keine Netzwerkzugriffe) und
// damit fuer erfundene Testfaelle geeignet.
const ZIELFUNKTIONEN = [
  "erkenneKommando", "istUeberspringen", "ttsSaeubern",
  "restzeitAnsageFaellig", "smartQty", "smartMenge", "zahlVarianten",
  "skaliereRezept", "dietPasses", "requiredDiets", "satisfiesDiet",
  "editierDistanz", "vbMatchScore", "parseArtikelListe",
  "montagVon", "isoTag", "personenAequivalent",
];

function funktionAusQuelle(quelle, name) {
  const muster = new RegExp("(?:async\\s+)?function\\s+" + name + "\\s*\\(");
  const treffer = muster.exec(quelle);
  if (!treffer) return null;
  let tiefe = 0;
  const start = treffer.index;
  for (let k = quelle.indexOf("{", start); k < quelle.length; k++) {
    if (quelle[k] === "{") tiefe++;
    if (quelle[k] === "}") {
      tiefe--;
      if (!tiefe) return quelle.slice(start, k + 1);
    }
  }
  return null;
}

function appQuelltext() {
  const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
  const bloecke = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  return bloecke.map((b) => b.slice(8, -9)).join("\n;\n");
}

async function frageRedTeam(auszug, bekannteNamen, rundenNr) {
  const anweisung = `Du bist Red-Team-Tester fuer eine deutsche Familien-App.
Deine Aufgabe: Finde Fehler, die dem Entwickler entgangen sind.

Hier sind reine Logikfunktionen der App (JavaScript):

${auszug}

Bereits abgedeckte Testfaelle (nicht wiederholen):
${bekannteNamen.join("\n")}

Erfinde ${BUDGET} NEUE, boesartige Testfaelle, die diese Funktionen
brechen koennten. Denke an: leere Eingaben, null/undefined, sehr grosse
Zahlen, Umlaute und Sonderzeichen, gemischte Gross-/Kleinschreibung,
Zahlen mit Komma und Punkt, Mehrfachanwendung derselben Funktion,
Grenzwerte (0, 1, exakt an der Schwelle), sprachliche Varianten
deutscher Alltagssaetze, Zutaten deren Name eine Zahl enthaelt.

WICHTIG - Ausgabeformat: Antworte AUSSCHLIESSLICH mit JavaScript-Code,
eine Zeile pro Testfall, in exakt diesem Format:
pruefe("RT${rundenNr}-01 Kurzbeschreibung", AUSDRUCK_DER_TRUE_SEIN_MUSS);

Regeln:
- Nur die oben gezeigten Funktionen verwenden, nichts erfinden.
- Jeder Ausdruck muss ohne Browser laufen (kein document, kein fetch).
- Kein Markdown, keine Backticks, keine Erklaerungen - nur die Zeilen.
- Wenn du glaubst, ein Verhalten sei falsch, schreibe den Testfall so,
  dass er das KORREKTE Verhalten fordert (er darf also fehlschlagen).`;

  const antwort = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELL,
      max_tokens: 2000,
      temperature: 1,
      messages: [{ role: "user", content: anweisung }],
    }),
  });
  if (!antwort.ok) {
    throw new Error("Red-Team-Aufruf fehlgeschlagen: HTTP " + antwort.status
      + " " + (await antwort.text()).slice(0, 200));
  }
  const daten = await antwort.json();
  return (daten.content || [])
    .filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

function saeubereCode(roh) {
  return roh
    .replace(/```[a-z]*/gi, "")
    .split("\n")
    .map((z) => z.trim())
    .filter((z) => z.startsWith("pruefe(") && z.endsWith(";"))
    .join("\n");
}

(async () => {
  const trocken = process.argv.includes("--trocken");
  if (!process.env.ANTHROPIC_API_KEY && !trocken) {
    console.error("ANTHROPIC_API_KEY fehlt - Red-Team uebersprungen.");
    process.exit(0);
  }
  const quelle = appQuelltext();
  const teile = ZIELFUNKTIONEN
    .map((n) => funktionAusQuelle(quelle, n))
    .filter(Boolean);
  const auszug = teile.join("\n\n");
  console.log(`Red-Team (${MODELL}): ${teile.length} Funktionen, `
    + `${Math.round(auszug.length / 1000)} kB Auszug, ${RUNDEN} Runde(n).`);

  const bekannt = fs.readFileSync(path.join(HIER, "szenarien.js"), "utf8")
    .match(/pruefe\("([^"]+)"/g) || [];

  if (trocken) {
    console.log("TROCKENLAUF - kein API-Aufruf. Auszug-Vorschau:");
    console.log(auszug.slice(0, 400) + "\n...");
    console.log("Bereits abgedeckte Testfaelle: " + bekannt.length);
    process.exit(0);
  }

  let alleZeilen = [];
  for (let r = 1; r <= RUNDEN; r++) {
    const roh = await frageRedTeam(auszug, bekannt.map((b) => b.slice(8, -1)), r);
    const code = saeubereCode(roh);
    const anzahl = code ? code.split("\n").length : 0;
    console.log(`  Runde ${r}: ${anzahl} Testfaelle erhalten.`);
    if (code) alleZeilen.push(code);
  }

  const datei = path.join(HIER, "redteam-szenarien.js");
  const inhalt = "// Automatisch erzeugt vom Red-Team (" + MODELL + ") am "
    + new Date().toISOString() + "\n// NICHT von Hand pflegen - wird "
    + "bei jedem Lauf ueberschrieben.\n" + alleZeilen.join("\n") + "\n";
  fs.writeFileSync(datei, inhalt);

  if (!alleZeilen.length) {
    console.log("Keine verwertbaren Testfaelle - Lauf beendet.");
    process.exit(0);
  }

  // Ausfuehren im echten Testlaeufer
  let ausgabe = "";
  let fehlgeschlagen = false;
  try {
    ausgabe = execFileSync("node",
      [path.join(HIER, "run.js"), "--json", "--extra=" + datei],
      { encoding: "utf8", cwd: WURZEL });
  } catch (e) {
    ausgabe = String(e.stdout || "");
    fehlgeschlagen = true;
  }

  let bericht = null;
  try { bericht = JSON.parse(ausgabe); } catch (e) { /* unten behandelt */ }
  if (!bericht) {
    console.error("Testlauf lieferte keinen lesbaren Bericht.");
    process.exit(1);
  }

  const rtFehler = bericht.fehler.filter((f) => f.name.startsWith("RT"));
  const eigeneFehler = bericht.fehler.filter((f) => !f.name.startsWith("RT"));

  const zusammenfassung = {
    zeitpunkt: new Date().toISOString(),
    modell: MODELL,
    erzeugteTestfaelle: alleZeilen.join("\n").split("\n").length,
    bestanden: bericht.bestanden,
    verdachtsfaelle: rtFehler,
    bestandsfehler: eigeneFehler,
  };
  fs.writeFileSync(path.join(BERICHTE, "redteam.json"),
    JSON.stringify(zusammenfassung, null, 2));

  console.log(`\nRed-Team-Ergebnis: ${bericht.bestanden} bestanden, `
    + `${rtFehler.length} Verdachtsfaelle, ${eigeneFehler.length} `
    + `Bestandsfehler.`);
  for (const f of rtFehler) console.log("  VERDACHT: " + f.name);
  for (const f of eigeneFehler) console.log("  BESTAND:  " + f.name);

  // Bestandsfehler sind immer ernst. Verdachtsfaelle koennen auch
  // falsche Annahmen des Red-Teams sein -> Bericht, kein harter Abbruch.
  process.exit(eigeneFehler.length ? 1 : 0);
})();
