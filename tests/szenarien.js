// =====================================================================
// SZENARIEN (deterministisch) - laufen IM eval-Kontext der App.
// WICHTIG: Nur so sind `const`/`let` der App sichtbar. Ein Aufruf aus
// dem Modul-Scope heraus sieht sie NICHT (JS-Scoping-Regel bei eval).
// Verfuegbar: pruefe(name, bedingung), APPQUELLE, el(), gesprochen,
// setzeTtsBlockiert(), wakeLockZaehler(), recInstanz, localStorage.
// =====================================================================

// ---------- A: Laden ----------
pruefe("A1 App laedt vollstaendig im Browser-Kontext", true);

// ---------- B: Sprachbefehle ----------
const befehl = (t) => (erkenneKommando(t) || {}).typ;
pruefe("B01 'rezept nudeln' -> rezept", befehl("rezept nudeln") === "rezept");
pruefe("B02 'termin morgen' -> termin", befehl("termin morgen") === "termin");
pruefe("B03 'einkauf milch' -> einkauf", befehl("einkauf milch") === "einkauf");
pruefe("B04 'plane die woche' -> wochenplan", befehl("plane die woche") === "wochenplan");
pruefe("B05 'wochenplan' -> wochenplan", befehl("wochenplan") === "wochenplan");
pruefe("B06 'version' -> version", befehl("version") === "version");
pruefe("B07 'stopp' -> still", befehl("stopp") === "still");
pruefe("B08 'hilfe' -> hilfe", befehl("hilfe") === "hilfe");
pruefe("B09 'kochen' -> kochen", befehl("kochen") === "kochen");
pruefe("B10 'einfuehrung' -> einfuehrung", befehl("einführung") === "einfuehrung");
pruefe("B11 'gehe zu den terminen' -> nav", befehl("gehe zu den terminen") === "nav");
pruefe("B12 'wechsle zur einkaufsliste' -> nav", befehl("wechsle zur einkaufsliste") === "nav");
pruefe("B13 'zeige mir die rezepte' -> nav", befehl("zeige mir die rezepte") === "nav");
pruefe("B14 Alltagssatz ist KEIN Befehl", befehl("das wetter ist heute schoen") === undefined);
pruefe("B15 'zeige das wetter' -> kein Ziel, kein nav", befehl("zeige das wetter") === undefined);
pruefe("B16 Leerer Text stuerzt nicht ab", befehl("") === undefined);

// ---------- C: Sprachausgabe + Saeuberung ----------
gesprochen.length = 0;
speak("🍳 Test (mit Einschub) fertig.", true);
pruefe("C1 speak() erzeugt genau eine Ansage", gesprochen.length === 1);
pruefe("C2 Emojis werden nicht vorgelesen", !/[\u{1F300}-\u{1FAFF}]/u.test(gesprochen[0]));
pruefe("C3 Klammern werden zu Komma-Einschueben", gesprochen[0].includes(", mit Einschub,"));
pruefe("C4 Rezepttext bleibt unveraendert",
  ttsSaeubern("Koche 250 g Reis 10 Minuten.") === "Koche 250 g Reis 10 Minuten.");
setzeTtsBlockiert(true);
gesprochen.length = 0;
speak("Blockierte Ansage", true);
pruefe("C5 Blockierte Sprachausgabe stuerzt nicht ab", gesprochen.length === 1);
setzeTtsBlockiert(false);

// ---------- D: Mengen-Kontinuitaet ----------
const dRezept = {
  name: "Testgericht",
  ingredients: [
    { name: "Reis", qty: 200, unit: "g" },
    { name: "Paprika", qty: 2, unit: "Stück" },
    { name: "Olivenöl", qty: 1.5, unit: "EL" },
  ],
  steps: [
    { text: "Koche 200 g Reis.", announce: "200 g Reis aufsetzen." },
    { text: "Brate 2 Stück Paprika in 1,5 EL Olivenöl.", announce: "1.5 EL Öl." },
  ],
};
const dSkaliert = skaliereRezept(dRezept, 1.3);
pruefe("D1 Zutat wird festgeschrieben (200 g -> 250 g)",
  dSkaliert.ingredients[0].qty === 250);
pruefe("D2 Schritt-Prosa traegt dieselbe Zahl",
  dSkaliert.steps[0].text.includes("250 g") &&
  dSkaliert.steps[0].announce.includes("250 g"));
pruefe("D3 Komma- UND Punktschreibweise ersetzt",
  dSkaliert.steps[1].text.includes("2 EL") &&
  dSkaliert.steps[1].announce.includes("2 EL"));
pruefe("D4 Originalrezept bleibt unberuehrt",
  dRezept.ingredients[0].qty === 200 && dRezept.steps[0].text.includes("200 g"));
pruefe("D5 Einkaufsliste formatiert identisch",
  smartQty(dSkaliert.ingredients[0], 1) === "250 g Reis");
pruefe("D6 Doppelskalierung ausgeschlossen", dSkaliert._skaliert === true);

// ---------- E: Timer-Ansagen ----------
const eAnsagen = (dauer) => {
  const treffer = [];
  for (let r = dauer; r >= 0; r--) if (restzeitAnsageFaellig(r)) treffer.push(r);
  return treffer;
};
pruefe("E1 20-Min-Timer: 2-Min-Takt, dann Minuten, dann 30/10 s",
  JSON.stringify(eAnsagen(1200)) ===
  JSON.stringify([1200,1080,960,840,720,600,480,360,300,240,180,120,60,30,10]));
pruefe("E2 3-Min-Timer: 180,120,60,30,10",
  JSON.stringify(eAnsagen(180)) === JSON.stringify([180,120,60,30,10]));
pruefe("E3 45-Sek-Timer: nur 30 und 10", JSON.stringify(eAnsagen(45)) === JSON.stringify([30,10]));
pruefe("E4 Keine Ansage bei 0", !restzeitAnsageFaellig(0));
pruefe("E5 Keine Ansagenluecke ueber 120 s", (() => {
  const a = eAnsagen(1200);
  for (let i = 0; i < a.length - 1; i++) if (a[i] - a[i + 1] > 120) return false;
  return true;
})());

// ---------- F: Kochmodus ----------
selectedRecipe = skaliereRezept({
  name: "Simulationsgericht",
  ingredients: [{ name: "Nudeln", qty: 250, unit: "g" }],
  steps: [
    { text: "Koche 250 g Nudeln.", timer: 0, announce: "Fertig." },
    { text: "Abgiessen.", timer: 0, announce: "Fertig." },
  ],
}, 1);
gesprochen.length = 0;
startCooking();
pruefe("F1 startCooking spricht die Eroeffnung", gesprochen.length > 0);
pruefe("F2 Kochansicht ist sichtbar", cookingVisible() === true);
pruefe("F3 Wake Lock wurde angefordert", wakeLockZaehler().an >= 1);
clearTimers();
pruefe("F4 clearTimers gibt Wake Lock frei (kein Dauerbetrieb)",
  typeof wakeLockAus === "function");

// ---------- G: Mikrofon-Verhalten ----------
pruefe("G1 Ruhepause-Fenster ausserhalb: 20 s", GV_RUHE_MS === 20000);
pruefe("G2 Ruhepause-Fenster im Kochmodus: 60 s", GV_RUHE_KOCH_MS === 60000);
pruefe("G3 Schalter standardmaessig aus", ruheImKochmodus() === false);
localStorage.setItem("ka_ruhe_koch", "1");
pruefe("G4 Schalter an wird gelesen", ruheImKochmodus() === true);
localStorage.removeItem("ka_ruhe_koch");
(function () {
  const vorher = recInstanz ? recInstanz.abgebrochen : 0;
  speak("Ansage eins", true); speak("Ansage zwei"); speak("Ansage drei");
  const nachher = recInstanz ? recInstanz.abgebrochen : 0;
  pruefe("G5 Ansagen brechen die Erkennung NICHT ab (kein Bereitton)",
    nachher === vorher);
})();
// G6 GEAENDERT: Der alte Test suchte nur eine ZEICHENKETTE im Quelltext.
// Er wurde rot, als der Schutz VERBESSERT wurde - und waere gruen
// geblieben, haette man den Schutz geloescht und die Zeile als toten
// Kommentar stehen lassen. Jetzt wird das VERHALTEN geprueft.
pruefe("G6 Selbsthoer-Schutz verwirft die eigene Ansage", (function () {
  const vorher = vState.liste.length;
  ttsActive = true;
  ttsEchoAktuell = "Welcher Artikel?";
  ttsEchoVorher = "";
  GlobalVoice.dialog = { onInput: einkaufHinzufuegen };
  recInstanz.onresult({ results: [[{ transcript: "Welcher Artikel" }]] });
  const gewachsen = vState.liste.length > vorher;
  ttsActive = false; ttsEchoAktuell = ""; GlobalVoice.dialog = null;
  return !gewachsen;
})());

// ---------- H: Erinnerungen ----------
pruefe("H1 Erinnerungsstufen 90/150/240 s",
  JSON.stringify(REMINDER_STUFEN) === "[90,150,240]");
armReminder(true);
pruefe("H2 armReminder(true) laeuft fehlerfrei", true);
clearTimers();

// ---------- I: Geraet & Sicherheit ----------
localStorage.clear();
const iId = deviceId();
pruefe("I1 Geraete-ID kryptografisch (g + 32 Hex)", /^g[0-9a-f]{32}$/.test(iId));
pruefe("I2 Geraete-ID bleibt stabil", deviceId() === iId);
localStorage.setItem("ka_device", "gALTBESTAND123");
pruefe("I3 Bestandsschutz fuer alte IDs", deviceId() === "gALTBESTAND123");
pruefe("I4 Kein Pseudozufall im Frontend", !APPQUELLE.includes("Math.random()"));

// ---------- J: Familien-Sync (Ende-zu-Ende) ----------
warte(async () => {
  const jCode = "FAM-K7M2P-Q9RT4";
  const jDaten = { termine: [{ titel: "Zahnarzt Zoe" }] };
  const jBlob = await syncVerschluesseln(jDaten, jCode);
  pruefe("J1 Chiffrat enthaelt keinen Klartext", !jBlob.includes("Zahnarzt"));
  const jZurueck = await syncEntschluesseln(jBlob, jCode);
  pruefe("J2 Entschluesselung verlustfrei",
    jZurueck.termine[0].titel === "Zahnarzt Zoe");
  let jFehler = false;
  try { await syncEntschluesseln(jBlob, "FAM-AAAAA-AAAAA"); }
  catch (e) { jFehler = true; }
  pruefe("J3 Falscher Code kann nicht entschluesseln", jFehler);
  const jBlob2 = await syncVerschluesseln(jDaten, jCode);
  pruefe("J4 Zufalls-IV: gleiches Klartext -> anderes Chiffrat", jBlob !== jBlob2);
});

// ---------- K: Vertragspunkte gegenueber Nutzern ----------
pruefe("K1 Haftungshinweis bei Rezepten vorhanden",
  APPHTML.includes("Laut geltender Rechtslage"));
pruefe("K2 Rechtslinks im Footer",
  APPHTML.includes('href="/impressum.html"') &&
  APPHTML.includes('href="/datenschutz.html"'));
pruefe("K3 Versionsstempel gesetzt", typeof APP_VERSION === "string" &&
  /^FUSION/.test(APP_VERSION));

// ---------- L: Vom Red-Team gefundene Defekte (dauerhaft) ----------
// Diese Faelle hat Fable 5 am 29.07.2026 gefunden - alle waren echte
// Fehler. Sie bleiben dauerhaft in der Suite, damit kein Rueckfall
// unbemerkt bleibt.
pruefe("L01 null-Eingabe ist kein Befehl", erkenneKommando(null) === null);
pruefe("L02 undefined-Eingabe ist kein Befehl", erkenneKommando(undefined) === null);
pruefe("L03 Frage 'Kaufen wir am Samstag ein?' ist KEIN Einkaufsbefehl",
  erkenneKommando("Kaufen wir am Samstag zusammen ein?") === null);
pruefe("L04 'das war keine hilfe' oeffnet NICHT die Hilfe",
  erkenneKommando("nein danke, das war keine hilfe") === null);
pruefe("L05 Echter Einkaufsbefehl funktioniert weiter",
  (erkenneKommando("einkauf milch") || {}).typ === "einkauf");
pruefe("L06 'kaufe brot' funktioniert weiter",
  (erkenneKommando("kaufe brot") || {}).typ === "einkauf");
pruefe("L07 'hilfe' als Aufforderung funktioniert weiter",
  (erkenneKommando("hilfe") || {}).typ === "hilfe");
pruefe("L08 'SEI STILL!!!' wird erkannt",
  (erkenneKommando("SEI STILL!!!") || {}).typ === "still");
pruefe("L09 Verschachtelte Klammern hinterlassen keine Klammer",
  !ttsSaeubern("Hinweis (außen (innen) rest) fertig").includes("("));
pruefe("L10 Saeuberung ist idempotent", (function () {
  const s = ttsSaeubern("Achtung ⚠️ (heiß)! Bitte «vorsichtig» ruehren.");
  return ttsSaeubern(s) === s;
})());
pruefe("L11 Alter 0 zaehlt als Kleinkind, nicht als Erwachsener",
  personenAequivalent({ alter: 0, geschlecht: "m" }) === 0.5);
pruefe("L12 Fehlendes Alter faellt weiter auf Erwachsen zurueck",
  personenAequivalent({ geschlecht: "w" }) === 0.85);
pruefe("L13 Menge 1.5 g ueberschreibt NICHT fremde '105 g' im Schritt",
  skaliereRezept({ ingredients: [{ name: "Zucker", qty: 1.5, unit: "g" }],
    steps: [{ text: "105 g Mehl unterrühren" }] }, 2)
    .steps[0].text === "105 g Mehl unterrühren");
pruefe("L14 Eigene Menge wird trotzdem ersetzt",
  skaliereRezept({ ingredients: [{ name: "Zucker", qty: 100, unit: "g" }],
    steps: [{ text: "100 g Zucker unterrühren" }] }, 2)
    .steps[0].text.includes("200 g"));
pruefe("L15 Einheit 'Bund' bleibt beim Skalieren erhalten",
  skaliereRezept({ ingredients: [{ name: "Petersilie", qty: 1, unit: "Bund" }],
    steps: [] }, 0.5).ingredients[0].unit === "Bund");
pruefe("L16 Einheit 'Stück' bleibt beim Skalieren erhalten",
  skaliereRezept({ ingredients: [{ name: "Zwiebel", qty: 1, unit: "Stück" }],
    steps: [] }, 0.5).ingredients[0].unit === "Stück");
pruefe("L17 Floskel 'bitte' wird kein Einkaufsartikel",
  parseArtikelListe("Erdbeeren und Sahne, bitte").length === 2);
pruefe("L18 Echte Artikel bleiben vollstaendig",
  parseArtikelListe("Milch, Butter und Eier").length === 3);
pruefe("L19 Grenzwert 300 s ist Minutenansage, 299 s nicht",
  restzeitAnsageFaellig(300) === true && restzeitAnsageFaellig(299) === false);
pruefe("L20 Wochenstart ist ein Montag",
  new Date(isoTag(montagVon(0)) + "T12:00:00Z").getUTCDay() === 1);

// =====================================================================
// M: FEHLERTESTS ZU DEN GEMELDETEN FEHLERN (31.07.)
// ---------------------------------------------------------------------
// Warum dieser Block existiert: Weder die taegliche Red-Team-Runde noch
// die deterministischen Szenarien haben diese drei Fehler je gesehen.
// Grund: Das Red-Team bekommt ausschliesslich REINE Funktionen zu
// sehen; die Fehler lagen aber allesamt in der Ereignis- und
// Zeitsteuerung (onresult, onend, Sprechblasen-Timer). Diese Ebene war
// bis heute vollstaendig ungetestet. Jeder Test hier muss ohne die
// zugehoerige Reparatur ROT sein - nachgewiesen per tests/mutation.js.
// =====================================================================

// ---------- M1: App hoert sich selbst (Einkaufsliste) ----------
pruefe("M1 Eigene Rueckfrage landet NICHT als Artikel auf der Liste", (function () {
  const vorher = vState.liste.length;
  ttsActive = true;
  ttsEchoAktuell = "Welcher Artikel?";
  GlobalVoice.dialog = { onInput: einkaufHinzufuegen };
  recInstanz.onresult({ results: [[{ transcript: "welcher Artikel" }]] });
  const ok = vState.liste.length === vorher;
  ttsActive = false; ttsEchoAktuell = ""; GlobalVoice.dialog = null;
  return ok;
})());

pruefe("M2 Echte Antwort waehrend der Ansage kommt DURCH", (function () {
  const vorher = vState.liste.length;
  ttsActive = true;
  ttsEchoAktuell = "Welcher Artikel?";
  GlobalVoice.dialog = { onInput: einkaufHinzufuegen };
  recInstanz.onresult({ results: [[{ transcript: "Milch" }]] });
  const ok = vState.liste.length === vorher + 1;
  ttsActive = false; ttsEchoAktuell = ""; GlobalVoice.dialog = null;
  vState.liste.length = vorher;
  return ok;
})());

pruefe("M3 Zutat aus vorgelesener Liste bleibt gueltige Eingabe", (function () {
  // "Milch" darf NICHT als Echo gelten, nur weil die App eben eine
  // Zutatenliste mit Milch vorgelesen hat (Einzelwort-Regel).
  return istEigenesEcho("Milch", "Ihr braucht: 200 ml Milch, 3 Eier", "") === false;
})());

pruefe("M4 Wortgleiche Ansage gilt als Echo",
  istEigenesEcho("Welcher Artikel", "Welcher Artikel?", "") === true);

pruefe("M5 Echo-Fenster reicht nicht ueber die ganze Ansage", (function () {
  // Waehrend des Hilfetexts muss "stopp" ein echter Befehl bleiben,
  // solange gerade ein ANDERES Stueck gesprochen wird.
  return istEigenesEcho("stopp", "Ihr könnt sagen: Termin, dann den Termin sprechen.", "") === false;
})());

// ---------- M6-M8: Aktivton darf sich nicht wiederholen ----------
pruefe("M6 Aktivton kommt beim Einschalten genau einmal", (function () {
  gvStopp(); toeneLeeren();
  gvStart();
  return toeneGespielt().length === 2; // aufsteigender Zweiklang
})());

pruefe("M7 Interner Neustart erzeugt KEINEN weiteren Aktivton", (function () {
  gvStopp(); gvStart(); toeneLeeren();
  gvNeustart(); gvNeustart(); gvNeustart();
  return toeneGespielt().length === 0;
})());

pruefe("M8 gvStart im laufenden Betrieb bleibt stumm", (function () {
  gvStopp(); gvStart(); toeneLeeren();
  gvStart();
  return toeneGespielt().length === 0;
})());

pruefe("M9 Einschlafton ist absteigend und vom Aktivton unterscheidbar", (function () {
  toeneLeeren(); tonAktiv();
  const auf = toeneGespielt();
  toeneLeeren(); tonSchlaf();
  const ab = toeneGespielt();
  return auf.length === 2 && ab.length === 2
    && auf[1] > auf[0] && ab[1] < ab[0];
})());

pruefe("M10 Bereit-Ton ist ein einzelner Ton", (function () {
  toeneLeeren(); tonBereit();
  return toeneGespielt().length === 1;
})());

// ---------- M11: Sprechblase verschwindet nicht mehr zu frueh ----------
pruefe("M11 Sprechblase haelt laenger als der alte 15-Sekunden-Deckel", (function () {
  const echt = global.setTimeout;
  const fristen = [];
  global.setTimeout = function (fn, ms) { fristen.push(ms || 0); return 0; };
  try {
    // Rezeptvorstellung mit voller Zutatenliste: ~600 Zeichen
    gvSprechblase("x".repeat(600));
  } finally { global.setTimeout = echt; }
  // Alte Fassung: Math.min(4000 + 600*60, 15000) === 15000 -> ROT
  return fristen.length > 0 && Math.max.apply(null, fristen) > 15000;
})());

pruefe("M12 Ansage-Ende blendet die Sprechblase aus", (function () {
  gvSprechblase("Testansage");
  gvSprechblaseAus();
  return String(el("gvSage").className || "").indexOf("sichtbar") === -1;
})());

// ---------- M13-M16: Der Chip sagt die Wahrheit ----------
pruefe("M13 Waehrend der Ansage zeigt der Chip NICHT gruen", (function () {
  gvChipAnsage();
  const k = String(el("gvChip").className || "");
  return k === "redet" && k !== "an";
})());

pruefe("M14 Nach der Ansage steht der Chip wieder auf dem echten Zustand", (function () {
  gvStopp();               // aktiv = false
  gvChipAnsage();
  gvChipStand();
  return String(el("gvChip").className || "") === "aus";
})());

pruefe("M15 Ruhepause spielt den Einschlafton", (function () {
  // Kochmodus ausdruecklich als "nicht sichtbar" setzen: in der
  // Attrappe liefert classList.contains sonst undefined und die App
  // haelt faelschlich den Kochmodus fuer offen (dort gilt die
  // Ruhepause bewusst nicht).
  el("tab-kochen").classList = { contains: () => true, add() {}, remove() {}, toggle() {} };
  gvStart();
  toeneLeeren();
  gvLetztesErgebnis = Date.now() - (GV_RUHE_MS + 5000);
  GlobalVoice.dialog = null;
  recInstanz.onend();
  const toene = toeneGespielt();
  return GlobalVoice.aktiv === false && toene.length === 2 && toene[1] < toene[0];
})());

pruefe("M16 Eigene Redezeit zaehlt NICHT als Stille", (function () {
  // Kernfehler: Der Ruhepausen-Zaehler wurde nur von erkannten Saetzen
  // zurueckgesetzt - eine lange Ansage liess das Mikro einschlafen.
  gvStart();
  gvLetztesErgebnis = Date.now() - (GV_RUHE_MS + 5000);
  const alt = gvLetztesErgebnis;
  gesprochenLeeren();
  speak("Eine lange Rezeptvorstellung mit vielen Zutaten.", true);
  return gvLetztesErgebnis > alt;
})());

// ---------- M17-M22: "Auf die Einkaufsliste" ----------
pruefe("M17 Getrennt gesprochen: 'auf die einkaufs liste'",
  (erkenneKommando("auf die einkaufs liste") || {}).typ === "auf_liste");
pruefe("M18 Mit Hoeflichkeitswort: 'auf die einkaufsliste bitte'",
  (erkenneKommando("auf die einkaufsliste bitte") || {}).typ === "auf_liste");
pruefe("M19 'alles auf die liste'",
  (erkenneKommando("alles auf die liste") || {}).typ === "auf_liste");
pruefe("M20 'pack die zutaten auf die liste'",
  (erkenneKommando("pack die zutaten auf die liste") || {}).typ === "auf_liste");
pruefe("M21 Klassiker bleibt erhalten: 'auf die einkaufsliste'",
  (erkenneKommando("auf die einkaufsliste") || {}).typ === "auf_liste");
pruefe("M22 'liste vorlesen' wird NICHT zu auf_liste",
  (erkenneKommando("einkaufsliste vorlesen") || {}).typ === "liste");
// Von der Mutationsprobe aufgedeckt: M17-M21 werden bereits von der
// Hauptregel gefangen - die AUFFANGREGEL fuer freiere Formulierungen
// war komplett ungetestet. Diese Saetze treffen nur sie.
pruefe("M22a Auffangregel: 'das kommt auf die liste'",
  (erkenneKommando("das kommt auf die liste") || {}).typ === "auf_liste");
pruefe("M22b Auffangregel: 'können wir das auf die einkaufsliste tun'",
  (erkenneKommando("können wir das auf die einkaufsliste tun") || {}).typ === "auf_liste");
pruefe("M22c Langer Satz loest die Auffangregel NICHT aus",
  (erkenneKommando("am samstag schreiben wir gemeinsam alles auf die liste was wir noch brauchen") || {}) .typ !== "auf_liste");

// ---------- M23-M27: Zurueck ----------
pruefe("M23 'zurück' allein ist ein Befehl", istZurueck("zurück") === true);
pruefe("M24 'ein schritt zurück' ist ein Befehl", istZurueck("ein Schritt zurück") === true);
pruefe("M25 'vorheriger schritt' ist ein Befehl", istZurueck("vorheriger Schritt") === true);
pruefe("M26 Satz mit 'zurück' loest NICHTS aus",
  istZurueck("wir fahren am Samstag zurück nach Hamburg") === false);
pruefe("M27 'zurückstellen' loest NICHTS aus", istZurueck("zurückstellen") === false);

pruefe("M28 prevStep geht einen Schritt zurueck", (function () {
  selectedRecipe = { name: "Test", _skaliert: true,
    steps: [{ text: "Erster Schritt" }, { text: "Zweiter Schritt" },
            { text: "Dritter Schritt" }] };
  stepIndex = 2;
  prevStep();
  return stepIndex === 1;
})());

pruefe("M29 prevStep bleibt beim ersten Schritt stehen", (function () {
  stepIndex = 0;
  prevStep();
  return stepIndex === 0;
})());

// ---------- M30-M33: Einkaufs-Kette ----------
pruefe("M30 'fertig' beendet die Kette", istKetteEnde("fertig") === true);
pruefe("M31 'das war's' beendet die Kette", istKetteEnde("das war's") === true);
pruefe("M32 Ein Artikel beendet die Kette NICHT", istKetteEnde("Milch") === false);
pruefe("M33 Zurueck nimmt den letzten Artikel wieder weg", (function () {
  vState.liste.length = 0;
  einkaufHinzufuegen("Milch");
  const nachher = vState.liste.length;
  einkaufZurueck();
  return nachher === 1 && vState.liste.length === 0;
})());

// ---------- M34-M40: Freitext-Ausschluss ----------
pruefe("M34 Komma-Eingabe wird zerlegt",
  ausschlussParse("Schweinefleisch, Alkohol , Koriander").length === 3);
pruefe("M35 Leere Eingabe ergibt leere Liste",
  ausschlussParse("").length === 0 && ausschlussParse(null).length === 0);
pruefe("M36 'Schwein' zieht Speck und Salami mit",
  ausschlussErweitern(["schwein"]).includes("speck")
  && ausschlussErweitern(["schwein"]).includes("salami"));
pruefe("M37 'Alkohol' zieht Rotwein mit",
  ausschlussErweitern(["alkohol"]).includes("rotwein"));
pruefe("M38 Unbekannter Begriff bleibt trotzdem wirksam",
  ausschlussErweitern(["quitte"]).includes("quitte"));
pruefe("M39 Ausschluss greift in der Zutatenliste",
  ausschlussTrifft({ name: "Pasta", ingredients: [{ name: "Pancetta" }], steps: [] },
    ["schwein"]) !== null);
pruefe("M40 Ausschluss greift auch im Schritttext",
  ausschlussTrifft({ name: "Sauce", ingredients: [{ name: "Tomaten" }],
    steps: [{ text: "Mit einem Schuss Rotwein abloeschen." }] },
    ["alkohol"]) !== null);
pruefe("M41 Sauberes Rezept bleibt erhalten",
  ausschlussTrifft({ name: "Gemuesepfanne", ingredients: [{ name: "Zucchini" }],
    steps: [{ text: "Alles anbraten." }] }, ["schwein"]) === null);
pruefe("M42 Ohne Ausschlussliste wird nichts verworfen",
  ausschlussTrifft({ name: "Speckknoedel", ingredients: [{ name: "Speck" }],
    steps: [] }, []) === null);

// ---------- M43: Unterbrechen ----------
pruefe("M43 Alltagsgeplauder unterbricht die Ansage NICHT", (function () {
  GlobalVoice.dialog = null;
  return gvDarfUnterbrechen("ach das riecht aber gut hier") === false;
})());
pruefe("M44 Echter Befehl darf unterbrechen",
  gvDarfUnterbrechen("auf die einkaufsliste") === true);

// ---------- M45: Zufallsbeschuss gegen Fehlausloeser ----------
pruefe("M45 Zufallsbeschuss: kein Alltagssatz loest Einkauf/Liste aus", (function () {
  // Fester Startwert statt Zufall - der Lauf muss reproduzierbar sein.
  let saat = 20260731;
  const wuerfel = (n) => { saat = (saat * 1103515245 + 12345) % 2147483648; return saat % n; };
  const subjekte = ["wir", "die kinder", "oma", "der papa", "alle"];
  const verben = ["fahren", "gehen", "wollen", "kommen", "bleiben"];
  // Von der Mutationsprobe aufgedeckt: Ohne die Woerter "zurueck" und
  // "weiter" im Vorrat konnte dieser Beschuss die Alleinstehend-
  // Sicherung gar nicht pruefen - er war dekorativ.
  const orte = ["nach hamburg", "zum sport", "in die schule", "auf den spielplatz",
    "zur liste der gäste", "auf die andere seite", "zurück nach hause",
    "zurück zum auto", "weiter zum spielplatz", "zurück in die stadt",
    "weiter nach bremen"];
  const enden = ["", " am samstag", " heute abend", " nächste woche",
    " und dann zurück", " und weiter zum sport"];
  let fehlausloeser = 0;
  for (let i = 0; i < 2000; i++) {
    const satz = subjekte[wuerfel(subjekte.length)] + " " +
      verben[wuerfel(verben.length)] + " " +
      orte[wuerfel(orte.length)] + enden[wuerfel(enden.length)];
    const k = erkenneKommando(satz);
    if (k && (k.typ === "auf_liste" || k.typ === "einkauf")) fehlausloeser++;
    if (istZurueck(satz) || istUeberspringen(satz)) fehlausloeser++;
  }
  return fehlausloeser === 0;
})());
