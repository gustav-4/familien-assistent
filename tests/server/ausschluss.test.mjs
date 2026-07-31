// =====================================================================
// SERVERTEST: Freitext-Ausschluss (rezept.mjs)
// ---------------------------------------------------------------------
// Der Ausschluss ist die ZWEITE Verteidigungslinie: Die KI bekommt die
// Begriffe als Regel, aber verlassen darf man sich darauf nicht. Diese
// Datei prueft die deterministische Gegenkontrolle im Server.
//
// Zusaetzlich - und das ist der wichtigere Teil - wird geprueft, ob die
// Synonymgruppen in index.html und in rezept.mjs noch UEBEREINSTIMMEN.
// Zwei gepflegte Kopien derselben Liste sind eine klassische Zeitbombe:
// Jemand ergaenzt "Wildschwein" nur vorne, und der Server laesst es
// weiterhin durch.
// =====================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, "..", "..");

let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));

// --- Reine Funktionen aus dem Servermodul herausloesen ---------------
function bloeckeAus(quelle, namen) {
  let raus = "";
  for (const name of namen) {
    const muster = new RegExp("(?:function|const)\\s+" + name + "\\b");
    const t = muster.exec(quelle);
    if (!t) throw new Error("Funktion/Konstante fehlt in rezept.mjs: " + name);
    let tiefe = 0, start = t.index, k = quelle.indexOf(
      quelle[t.index] === "c" ? "[" : "{", start);
    const auf = quelle[k], zu = auf === "[" ? "]" : "}";
    for (; k < quelle.length; k++) {
      if (quelle[k] === auf) tiefe++;
      else if (quelle[k] === zu) { tiefe--; if (!tiefe) break; }
    }
    raus += quelle.slice(start, k + 1) + ";\n";
  }
  return raus;
}

const serverQuelle = fs.readFileSync(
  path.join(WURZEL, "netlify/functions/rezept.mjs"), "utf8");
const appQuelle = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");

const teile = bloeckeAus(serverQuelle,
  ["AUSSCHLUSS_GRUPPEN", "normalize", "ausschlussErweitern", "verletztAusschluss"]);
const { AUSSCHLUSS_GRUPPEN, ausschlussErweitern, verletztAusschluss } =
  (0, eval)("(function(){" + teile +
    "return { AUSSCHLUSS_GRUPPEN, ausschlussErweitern, verletztAusschluss };})()");

// --- 1. Gleichstand der beiden Listen --------------------------------
function gruppenAus(text) {
  const start = text.indexOf("AUSSCHLUSS_GRUPPEN = [");
  if (start < 0) return null;
  let tiefe = 0, k = text.indexOf("[", start);
  const anfang = k;
  for (; k < text.length; k++) {
    if (text[k] === "[") tiefe++;
    else if (text[k] === "]") { tiefe--; if (!tiefe) break; }
  }
  return (0, eval)(text.slice(anfang, k + 1));
}

const appGruppen = gruppenAus(appQuelle);
p("Synonymgruppen in index.html gefunden", Array.isArray(appGruppen));
p("App und Server fuehren gleich viele Gruppen",
  appGruppen && appGruppen.length === AUSSCHLUSS_GRUPPEN.length);
p("App und Server fuehren identische Gruppen",
  JSON.stringify(appGruppen) === JSON.stringify(AUSSCHLUSS_GRUPPEN));

// --- 2. Erweiterung ---------------------------------------------------
p("'schwein' zieht Speck mit", ausschlussErweitern(["schwein"]).includes("speck"));
p("'schwein' zieht Salami mit", ausschlussErweitern(["schwein"]).includes("salami"));
p("'schwein' zieht Gelatine mit", ausschlussErweitern(["schwein"]).includes("gelatine"));
p("'alkohol' zieht Rotwein mit", ausschlussErweitern(["alkohol"]).includes("rotwein"));
p("Grossschreibung stoert nicht", ausschlussErweitern(["Schwein"]).includes("speck"));
p("Unbekannter Begriff bleibt wirksam",
  ausschlussErweitern(["quitte"]).includes("quitte"));
p("Leere Eingabe ergibt leere Liste", ausschlussErweitern([]).length === 0);
p("Einzelbuchstabe wird verworfen", ausschlussErweitern(["a"]).length === 0);

// --- 3. Rezeptpruefung ------------------------------------------------
const rezeptMitSpeck = { name: "Pasta Carbonara",
  ingredients: [{ name: "Pancetta" }, { name: "Eier" }], steps: [] };
const rezeptMitWeinImSchritt = { name: "Tomatensauce",
  ingredients: [{ name: "Tomaten" }],
  steps: [{ text: "Mit einem Schuss Rotwein abloeschen." }] };
const rezeptSauber = { name: "Gemuesepfanne",
  ingredients: [{ name: "Zucchini" }, { name: "Paprika" }],
  steps: [{ text: "Alles anbraten." }] };

p("Verstoss in der Zutatenliste wird gefunden",
  verletztAusschluss(rezeptMitSpeck, ["schwein"]) !== null);
p("Verstoss im Schritttext wird gefunden",
  verletztAusschluss(rezeptMitWeinImSchritt, ["alkohol"]) !== null);
p("Verstoss im Rezeptnamen wird gefunden",
  verletztAusschluss({ name: "Schweinebraten", ingredients: [], steps: [] },
    ["schwein"]) !== null);
p("Sauberes Rezept bleibt erhalten",
  verletztAusschluss(rezeptSauber, ["schwein", "alkohol"]) === null);
p("Ohne Ausschlussliste wird nichts verworfen",
  verletztAusschluss(rezeptMitSpeck, []) === null);
p("Fehlende Felder stuerzen nicht ab",
  verletztAusschluss({ name: "X" }, ["schwein"]) === null);

// --- 4. Zeitlimit: eigene Notbremse muss VOR Netlify greifen ----------
const timeoutTreffer = serverQuelle.match(/ctrl\.abort\(\),\s*(\d+)\)/g) || [];
const werte = timeoutTreffer.map((t) => Number(t.match(/(\d+)/)[1]));
// AUDIT 2: 20 s waren immer noch zu grosszuegig - synchrone Netlify-
// Funktionen brechen je nach Tarif schon nach 10 s ab. Jeder KI-Aufruf
// muss unter 10 s bleiben, damit die eigene Notbremse zuerst greift.
p("Kein KI-Aufruf wartet laenger als 9 s",
  werte.length > 0 && werte.every((w) => w <= 9000));
p("Alle KI-Aufrufe haben eine Notbremse", werte.length >= 2);
p("Retry-Fenster passt ins 9-Sekunden-Budget",
  /Date\.now\(\) - startZeit < 4000/.test(serverQuelle));
p("Stufe 1 (kurz) begrenzt die Schreibmenge",
  /params\.kurz \? 2500 : 8000/.test(serverQuelle));
p("Stufe 2 (schritte) existiert als eigener Zweig",
  /body\.modus === "schritte"/.test(serverQuelle));
p("Stufe 2 prueft die Schritte gegen den Ausschluss",
  /verletztAusschluss\(\{ name: gericht/.test(serverQuelle));

// --- 5. Jeder Netzzugriff braucht ein Zeitlimit -------------------
// AUDIT 3: Die beiden Redis-Aufrufe liefen ohne Frist. Haengt Upstash,
// haengt die Funktion bis zum Gateway-Timeout - ein 504 ohne Meldung,
// noch bevor die KI gefragt wurde.
// Jeder fetch-Aufruf muss innerhalb der naechsten Zeilen ein signal
// mitgeben. Blosses Zaehlen genuegt NICHT: Faellt eine Frist weg, bleibt
// die Summe durch die uebrigen Aufrufe zufaellig gross genug.
const fetchStellen = [];
let suchAb = 0;
for (;;) {
  const i = serverQuelle.indexOf("await fetch(", suchAb);
  if (i < 0) break;
  fetchStellen.push(serverQuelle.slice(i, i + 260));
  suchAb = i + 12;
}
const ohneFrist = fetchStellen.filter(
  (block) => !/signal:\s*(?:ctrl|frist)\.signal/.test(block));
p("JEDER Netzzugriff hat ein Zeitlimit (" +
  (fetchStellen.length - ohneFrist.length) + " von " + fetchStellen.length + ")",
  fetchStellen.length >= 4 && ohneFrist.length === 0);
p("Redis-Frist ist kurz genug", /mitFrist\(1500\)/.test(serverQuelle));
p("Eigener Abbruch ist von einem Gateway-Fehler unterscheidbar",
  /statusCode: abbruch \? 503 : 502/.test(serverQuelle)
  && /quelle: "app"/.test(serverQuelle));

console.log("\nAusschluss-Servertest: " + ok + " bestanden, " + fail + " fehlgeschlagen");
process.exit(fail ? 1 : 0);
