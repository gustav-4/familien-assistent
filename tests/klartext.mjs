// =====================================================================
// KLARTEXT-UEBERSETZER
// ---------------------------------------------------------------------
// Wandelt technische Testbefunde in Alltagsdeutsch um und haengt einen
// verstaendlichen Reparaturvorschlag an. Wird von melde.mjs aufgerufen,
// BEVOR der Bericht ans Handy geht.
//
// Zweistufig aus Kostengruenden:
//  1. Woerterbuch (kostenlos, sofort) fuer die bekannten Testgruppen.
//  2. Modellaufruf nur fuer das, was das Woerterbuch nicht kennt -
//     also im Wesentlichen die frei formulierten Red-Team-Faelle.
// Faellt Stufe 2 aus, bleibt der technische Text erhalten: lieber
// unschoen als gar keine Meldung.
// =====================================================================

/** Bekannte Testgruppen -> was ein Fehlschlag praktisch bedeutet. */
const WOERTERBUCH = [
  { muster: /^A\d/, bereich: "Grundlage",
    klartext: "Die App laesst sich nicht fehlerfrei starten.",
    folge: "Im schlimmsten Fall bleibt der Bildschirm leer." },
  { muster: /^B\d/, bereich: "Sprachbefehle",
    klartext: "Ein gesprochener Befehl wird nicht mehr richtig erkannt.",
    folge: "Die Familie sagt etwas - und nichts passiert." },
  { muster: /^C\d/, bereich: "Vorlesen",
    klartext: "Die Sprachausgabe verhaelt sich nicht wie vorgesehen.",
    folge: "Ansagen fehlen, brechen ab oder klingen falsch." },
  { muster: /^D\d/, bereich: "Mengen",
    klartext: "Die Mengenangaben stimmen zwischen Rezept, Einkaufsliste "
      + "und Kochanleitung nicht mehr ueberein.",
    folge: "Beim Kochen werden falsche Mengen genannt." },
  { muster: /^E\d/, bereich: "Timer",
    klartext: "Die Restzeit-Ansagen kommen zur falschen Zeit.",
    folge: "Entweder nervt die App oder sie meldet sich zu spaet." },
  { muster: /^F\d/, bereich: "Kochmodus",
    klartext: "Der Kochmodus startet nicht sauber.",
    folge: "Schrittfuehrung oder Bildschirm-Wachhalten faellt aus." },
  { muster: /^G\d/, bereich: "Mikrofon",
    klartext: "Das Mikrofon verhaelt sich beim Kochen nicht wie gewuenscht.",
    folge: "Entweder schlaeft es ein oder es piept staendig." },
  { muster: /^H\d/, bereich: "Erinnerungen",
    klartext: "Die Erinnerungs-Abstaende stimmen nicht.",
    folge: "Die App erinnert zu oft oder gar nicht." },
  { muster: /^I\d/, bereich: "Geraet und Sicherheit",
    klartext: "Die Geraetekennung wird nicht sicher erzeugt.",
    folge: "Betrifft die Zuordnung von Erinnerungen - Datenschutzthema." },
  { muster: /^J\d/, bereich: "Familien-Sync",
    klartext: "Die Verschluesselung des Familien-Sync arbeitet nicht "
      + "korrekt.",
    folge: "Geteilte Daten koennten unlesbar werden - kritisch." },
  { muster: /^K\d/, bereich: "Rechtliches",
    klartext: "Ein rechtlich noetiger Hinweis oder Link fehlt.",
    folge: "Abmahnrisiko - sollte zuegig behoben werden." },
  { muster: /^RT/, bereich: "Pruef-Modell",
    klartext: "Das unabhaengige Pruef-Modell hat eine Schwachstelle "
      + "vermutet.",
    folge: "Kann ein echter Fehler sein - oder eine falsche Annahme "
      + "des Pruefers." },
];

export function ausWoerterbuch(name) {
  const t = WOERTERBUCH.find((w) => w.muster.test(String(name).trim()));
  return t ? { bereich: t.bereich, klartext: t.klartext, folge: t.folge } : null;
}

/** Baut die Kurzfassung, die im Postfach ganz oben steht. */
export function ueberschrift(bericht) {
  const echte = (bericht.fehler || []).length;
  const verdacht = (bericht.verdachtsfaelle || []).length;
  if (!echte && !verdacht) {
    return "Alles in Ordnung - die App verhaelt sich wie vorgesehen.";
  }
  const teile = [];
  if (echte) {
    teile.push(echte === 1 ? "1 echter Fehler" : echte + " echte Fehler");
  }
  if (verdacht) {
    teile.push(verdacht === 1 ? "1 Verdachtsfall"
      : verdacht + " Verdachtsfaelle");
  }
  return teile.join(" und ") + " gefunden.";
}

/** Fragt das Modell nach Klartext + Reparaturvorschlag. */
async function frageModell(faelle, modell) {
  const liste = faelle.map((f, i) => (i + 1) + ". " + f.name
    + (f.fehlertext ? " [" + f.fehlertext + "]" : "")).join("\n");
  const anweisung = `Du erklaerst technische Testbefunde einer deutschen
Familien-App an einen Nicht-Programmierer (den Betreiber).

Befunde:
${liste}

Antworte AUSSCHLIESSLICH mit JSON, ohne Markdown:
{"erklaerungen":[
  {"nr":1,
   "klartext":"Was ist kaputt? Ein Satz, Alltagssprache, kein Fachwort.",
   "auswirkung":"Was merkt eine Familie davon? Ein kurzer Satz.",
   "vorschlag":"Was sollte getan werden? Ein Satz, konkret.",
   "dringlichkeit":"hoch|mittel|niedrig"}
]}

Regeln:
- Deutsch, hoefliche Alltagssprache, keine englischen Fachbegriffe.
- Keine Code-Schnipsel, keine Funktionsnamen in der Erklaerung.
- Wenn ein Befund harmlos wirkt, sage das ehrlich und setze
  dringlichkeit auf "niedrig".`;

  const antwort = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modell, max_tokens: 1500, temperature: 0,
      messages: [{ role: "user", content: anweisung }],
    }),
  });
  if (!antwort.ok) throw new Error("HTTP " + antwort.status);
  const daten = await antwort.json();
  const text = (daten.content || []).filter((c) => c.type === "text")
    .map((c) => c.text).join("\n");
  const a = text.indexOf("{"), e = text.lastIndexOf("}");
  if (a < 0 || e < 0) throw new Error("Keine JSON-Antwort");
  return JSON.parse(text.slice(a, e + 1)).erklaerungen || [];
}

/**
 * Reichert alle Befunde eines Berichts um Klartext an.
 * Arbeitet auch ohne API-Schluessel weiter (dann nur Woerterbuch).
 */
export async function verstaendlichMachen(bericht, optionen) {
  const modell = (optionen && optionen.modell)
    || process.env.KLARTEXT_MODELL || "claude-haiku-4-5-20251001";
  const alle = [].concat(bericht.fehler || [], bericht.verdachtsfaelle || []);
  if (!alle.length) {
    bericht.ueberschrift = ueberschrift(bericht);
    return bericht;
  }

  // Stufe 1: Woerterbuch
  alle.forEach((f) => {
    const w = ausWoerterbuch(f.name);
    if (w) {
      f.bereich = w.bereich;
      f.klartext = w.klartext;
      f.auswirkung = w.folge;
    }
  });

  // Stufe 2: Modell (nur wenn Schluessel vorhanden)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const erklaerungen = await frageModell(alle, modell);
      erklaerungen.forEach((e) => {
        const ziel = alle[Number(e.nr) - 1];
        if (!ziel) return;
        if (e.klartext) ziel.klartext = String(e.klartext).slice(0, 300);
        if (e.auswirkung) ziel.auswirkung = String(e.auswirkung).slice(0, 300);
        if (e.vorschlag) ziel.vorschlag = String(e.vorschlag).slice(0, 300);
        if (e.dringlichkeit) {
          ziel.dringlichkeit = ["hoch", "mittel", "niedrig"]
            .includes(String(e.dringlichkeit)) ? e.dringlichkeit : "mittel";
        }
      });
    } catch (err) {
      bericht.klartextHinweis = "Automatische Erklaerung nicht verfuegbar ("
        + String(err.message).slice(0, 60) + ") - technische Fassung unten.";
    }
  } else {
    bericht.klartextHinweis = "Ohne Modellzugang nur Kurzerklaerung.";
  }

  bericht.ueberschrift = ueberschrift(bericht);
  return bericht;
}
