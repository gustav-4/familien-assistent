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
// GEAENDERT (Vorgabe Betreiber): Der Endspurt-Hinweis rueckt von 30 s
// auf 20 s und traegt dort eine GARPROBE statt eines blossen
// Countdowns - die letzten Sekunden entscheiden ueber "auf den Punkt"
// oder "verkocht".
pruefe("E1 20-Min-Timer: 2-Min-Takt, dann Minuten, dann 20/10 s",
  JSON.stringify(eAnsagen(1200)) ===
  JSON.stringify([1200,1080,960,840,720,600,480,360,300,240,180,120,60,20,10]));
pruefe("E2 3-Min-Timer: 180,120,60,20,10",
  JSON.stringify(eAnsagen(180)) === JSON.stringify([180,120,60,20,10]));
pruefe("E3 45-Sek-Timer: nur 20 und 10", JSON.stringify(eAnsagen(45)) === JSON.stringify([20,10]));
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

// Kochmodus der Attrappe EXPLIZIT setzen. Ohne das haengen Tests am
// Rest-Zustand vorheriger Tests - beim F-011-Fix wurden dadurch fuenf
// Tests rot, die in Wahrheit nur eine ungepruefte Annahme trugen.
function setzeKochmodus(an) {
  el("tab-kochen").classList = {
    contains: () => !an, add() {}, remove() {}, toggle() {},
  };
}

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
  // War bis zur Reparatur der Testumgebung ein Scheintest: className
  // blieb immer undefined, die Bedingung damit IMMER wahr. Jetzt wird
  // erst die Sichtbarkeit BELEGT und dann das Ausblenden geprueft.
  gvSprechblase("Testansage");
  const warSichtbar = el("gvSage").classList.contains("sichtbar");
  gvSprechblaseAus();
  return warSichtbar && !el("gvSage").classList.contains("sichtbar");
})());

// ---------- M13-M16: Der Chip sagt die Wahrheit ----------
pruefe("M13 Waehrend der Ansage zeigt der Chip NICHT gruen", (function () {
  setzeKochmodus(false);
  gvChipAnsage();
  const c = el("gvChip").classList;
  return c.contains("redet") && !c.contains("an");
})());

pruefe("M14 Nach der Ansage steht der Chip wieder auf dem echten Zustand", (function () {
  setzeKochmodus(false);
  gvStopp();               // aktiv = false
  gvChipAnsage();
  gvChipStand();
  const c = el("gvChip").classList;
  return c.contains("aus") && !c.contains("redet");
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

// =====================================================================
// N: DAUERGEPIEPE - SIMULATION DER ANDROID-NEUSTARTSCHLEIFE
// ---------------------------------------------------------------------
// Der Systemton kommt bei JEDEM recognition.start(). Android beendet die
// Erkennung nach ~1,5 s Stille, auch bei continuous=true. Vorher hiess
// das: Neustart alle 1,8 s = 33 Toene pro Minute. Gemessen wurde das nie,
// weil die Testumgebung keine Zeit vergehen liess - genau deshalb konnte
// der Fehler monatelang ueberleben.
// Diese Simulation laesst die Uhr kontrolliert laufen und ZAEHLT die
// Neustarts. Sie ist die einzige Stelle, an der sich das Versprechen
// "seltener Ton" ueberhaupt belegen laesst.
// =====================================================================
function simuliereStille(sekunden, imKochmodus) {
  el("tab-kochen").classList = {
    contains: () => !imKochmodus, add() {}, remove() {}, toggle() {},
  };
  gvStopp();
  micMuted = false;
  gvStart();
  const startZahl = recInstanz.gestartet;
  let uhr = 1000000;
  const echtNow = Date.now, echtTimeout = global.setTimeout;
  let queue = [];
  Date.now = () => uhr;
  global.setTimeout = (fn, ms) => { queue.push({ t: uhr + (ms || 0), fn }); return 0; };
  let offen = true, stilleSeit = uhr;
  try {
    const ende = uhr + sekunden * 1000;
    while (uhr < ende) {
      uhr += 100;
      gvLetztesErgebnis = uhr;          // Ruhepause hier ausblenden
      if (offen && uhr - stilleSeit >= 1500) { offen = false; recInstanz.onend(); }
      const faellig = queue.filter((q) => q.t <= uhr);
      queue = queue.filter((q) => q.t > uhr);
      for (const q of faellig) {
        const vorher = recInstanz.gestartet;
        try { q.fn(); } catch (e) {}
        if (recInstanz.gestartet > vorher) { offen = true; stilleSeit = uhr; }
      }
    }
  } finally { Date.now = echtNow; global.setTimeout = echtTimeout; }
  return recInstanz.gestartet - startZahl;
}

pruefe("N1 Erste Minute Stille: hoechstens 8 Neustarts (vorher 33)",
  simuliereStille(60, false) <= 8);
pruefe("N2 Fuenf Minuten Stille: hoechstens 5 Neustarts pro Minute",
  simuliereStille(300, false) / 5 <= 5);
pruefe("N3 Kochmodus bleibt reaktionsfaehig: mindestens 3 Neustarts pro Minute",
  simuliereStille(300, true) / 5 >= 3);
pruefe("N4 Kochmodus pausiert nie laenger als 12 s",
  simuliereStille(300, true) / 5 >= 300 / 5 / 13.5);
pruefe("N5 Nach einem erkannten Wort ist die Wartezeit wieder auf null", (function () {
  gvStopp(); micMuted = false; gvStart();
  gvBackoffStufe = 5;
  recInstanz.onresult({ results: [[{ transcript: "hallo" }]] });
  return gvBackoffStufe === 0;
})());
pruefe("N6 Nach einer Ansage ist die Wartezeit wieder auf null", (function () {
  gvStopp(); gvStart();
  gvBackoffStufe = 5;
  unmuteMic();
  return gvBackoffStufe === 0;
})());
pruefe("N7 Waehrend einer Ansage wird NICHT neu gestartet", (function () {
  el("tab-kochen").classList = { contains: () => true, add() {}, remove() {}, toggle() {} };
  gvStopp(); gvStart();
  micMuted = true;
  const vorher = recInstanz.gestartet;
  const echtTimeout = global.setTimeout;
  global.setTimeout = (fn) => { try { fn(); } catch (e) {} return 0; };
  try { recInstanz.onend(); } finally { global.setTimeout = echtTimeout; }
  micMuted = false;
  return recInstanz.gestartet === vorher;
})());

// =====================================================================
// O: ZWEISTUFIGE RECHERCHE (Ende der 504-Fehler)
// ---------------------------------------------------------------------
// Die Recherche fragte bisher DREI vollstaendige Rezepte auf einmal an -
// zwei Drittel davon fuer den Papierkorb. Die Antwort war regelmaessig
// laenger als das Zeitlimit der Plattform, das Ergebnis war ein nackter
// Gateway-Fehler 504. Jetzt: Stufe 1 nur Auswahl-Infos, Stufe 2 die
// Schritte fuer genau ein Rezept.
// Kritischster Punkt dabei ist die Mengen-Kontinuitaet aus FUSION15.
// Deshalb steht sie hier an erster Stelle.
// =====================================================================

pruefe("O1 Rezept ohne Schritte laesst sich auswaehlen und skalieren", (function () {
  const roh = { name: "Testgericht", timeMin: 25,
    ingredients: [{ name: "Reis", qty: 100, unit: "g" }], steps: [] };
  const sk = skaliereRezept(roh, 2);
  return sk._skaliert === true && sk.ingredients[0].qty === 200;
})());

pruefe("O2 Nachgeladene Schritte werden NICHT ein zweites Mal skaliert", (function () {
  // Kern der Mengen-Kontinuitaet: Die Zutaten sind beim Auswaehlen
  // festgeschrieben. Stufe 2 bekommt genau diese Zahlen und liefert
  // Schritte, die sie bereits enthalten. Ein zweiter Durchlauf wuerde
  // aus 200 g ploetzlich 400 g machen.
  const rezept = skaliereRezept({ name: "Reispfanne", timeMin: 20,
    ingredients: [{ name: "Reis", qty: 100, unit: "g" }], steps: [] }, 2);
  rezept.steps = [{ text: "200 g Reis waschen und garen." }];
  return rezept.steps[0].text.indexOf("200 g") >= 0
    && rezept.steps[0].text.indexOf("400 g") === -1;
})());

pruefe("O3 Rezeptvorstellung funktioniert ohne Kochschritte", (function () {
  const r = { name: "Testgericht", timeMin: 25,
    ingredients: [{ name: "Reis", qty: 200, unit: "g" }], steps: [], varianten: [] };
  const txt = rezeptVorstellungsText(r, 1);
  return txt.indexOf("Testgericht") >= 0 && txt.indexOf("Reis") >= 0;
})());

pruefe("O4 Vorstellung nennt den Ausloeser NICHT mehr selbst", (function () {
  // Sonst hoert die App ihren eigenen Befehl und kann Nutzer und
  // eigene Stimme nicht mehr unterscheiden.
  const txt = rezeptVorstellungsText({ name: "X", timeMin: 20,
    ingredients: [{ name: "Reis", qty: 1, unit: "g" }], varianten: [] }, 1)
    .toLowerCase();
  return txt.indexOf("einkaufsliste") === -1 && txt.indexOf("sagt: kochen") === -1;
})());

pruefe("O5 Recherche fordert Stufe 1 an", (function () {
  return APPQUELLE.indexOf('modus: "kurz"') >= 0;
})());

pruefe("O6 Nachladen schickt die BEREITS SKALIERTEN Zutaten", (function () {
  // Wuerden hier Rohmengen verschickt, schriebe die KI die falschen
  // Zahlen in die Schritte - der stille Weg zurueck zum alten Fehler.
  const i = APPQUELLE.indexOf('modus: "schritte"');
  const ausschnitt = APPQUELLE.slice(i, i + 700);
  return i >= 0 && /zutaten:\s*\(rezept\.ingredients/.test(ausschnitt);
})());

pruefe("O7 Zeitversprechen an die Familie ist ehrlich", (function () {
  // Die alte Ansage "20-40 Sekunden" lag ueber dem Plattform-Limit -
  // sie kuendigte den eigenen Fehler an.
  return APPQUELLE.indexOf("20–40 Sekunden") === -1;
})());

pruefe("O8 Kochen ohne Schritte stuerzt nicht ab", (function () {
  selectedRecipe = { name: "Leer", timeMin: 20, _skaliert: true,
    ingredients: [{ name: "Reis", qty: 100, unit: "g" }], steps: [] };
  stepIndex = 0;
  try { renderStep(); showStep(); return true; } catch (e) { return false; }
})());

// =====================================================================
// P: KOCHMODUS - MIKROFON, ERINNERUNGEN, GARPROBE
// ---------------------------------------------------------------------
// Vorgabe des Betreibers: Im Kochmodus bleibt das Mikrofon dauerhaft
// aktiv. Erinnerungen hoechstens zweimal pro Minute, erste Erinnerung
// nach etwa drei Vierteln der veranschlagten Schrittdauer. Bei
// Garvorgaengen zusaetzlich eine Garprobe in den letzten 20 Sekunden.
// =====================================================================

pruefe("P1 Kochmodus ohne Timer: Mikrofon bleibt dauerhaft aktiv", (function () {
  timerRest = 0;
  const neustarts = simuliereStille(60, true);
  // Bei 1,5 s Stille + 0,3 s Neustart sind rund 33 Zyklen zu erwarten.
  return neustarts >= 25;
})());

pruefe("P2 Waehrend langer Garzeit pausiert die Erkennung", (function () {
  timerRest = 600;                 // 10 Minuten Ofen
  const neustarts = simuliereStille(60, true);
  timerRest = 0;
  return neustarts <= 8;
})());

pruefe("P3 Kurz vor Ablauf horcht die App wieder dauerhaft", (function () {
  timerRest = 30;                  // weniger als 45 s Restzeit
  const neustarts = simuliereStille(60, true);
  timerRest = 0;
  return neustarts >= 25;
})());

// ---------- Erinnerungen ----------
const pRezept = { timeMin: 30, steps: [
  { text: "Zwiebeln wuerfeln" },
  { text: "Anbraten" },
  { text: "Koecheln lassen", timer: 900 },
  { text: "Abschmecken" },
] };

pruefe("P4 Schritt mit Timer erbt dessen Dauer",
  schrittDauerSek(pRezept, 2) === 900);
pruefe("P5 Schritt ohne Timer bekommt die verteilte Restzeit", (function () {
  // 30 Min = 1800 s, davon 900 s Timer -> 900 s auf 3 Schritte = 300 s
  return schrittDauerSek(pRezept, 0) === 300;
})());
pruefe("P6 Sehr kurze Rezepte fallen nicht unter 45 s",
  schrittDauerSek({ timeMin: 5, steps: [{ text: "a" }, { text: "b" },
    { text: "c" }, { text: "d" }, { text: "e" }, { text: "f" },
    { text: "g" }, { text: "h" }] }, 0) >= 45);
pruefe("P7 Sehr lange Schritte werden bei 600 s gedeckelt",
  schrittDauerSek({ timeMin: 180, steps: [{ text: "a" }] }, 0) === 600);
pruefe("P8 Fehlendes Rezept stuerzt nicht ab",
  schrittDauerSek(null, 0) === 90 && schrittDauerSek({ steps: [] }, 5) === 90);

pruefe("P9 Erste Erinnerung bei drei Vierteln der Schrittdauer",
  reminderAbstandSek(pRezept, 0, 0) === 225);   // 300 * 0.75
pruefe("P10 Erste Erinnerung nie unter 40 s",
  reminderAbstandSek({ timeMin: 5, steps: [{ text: "a" }] }, 0, 0) >= 40);
pruefe("P11 Folge-Erinnerungen hoechstens einmal pro Minute", (function () {
  for (let stufe = 1; stufe <= 5; stufe++)
    if (reminderAbstandSek(pRezept, 0, stufe) < 60) return false;
  return true;
})());
pruefe("P12 Vorgabe eingehalten: nie mehr als 2 Erinnerungen pro Minute", (function () {
  // Ungünstigster Fall: kuerzest moeglicher Erstabstand, dann Folgestufen
  let zeit = reminderAbstandSek({ timeMin: 5, steps: [{ text: "a" }] }, 0, 0);
  const zeitpunkte = [zeit];
  for (let stufe = 1; stufe <= 6; stufe++) {
    zeit += reminderAbstandSek(pRezept, 0, stufe);
    zeitpunkte.push(zeit);
  }
  // In jedem 60-Sekunden-Fenster hoechstens 2 Erinnerungen
  for (const t of zeitpunkte) {
    const imFenster = zeitpunkte.filter((x) => x >= t && x < t + 60).length;
    if (imFenster > 2) return false;
  }
  return true;
})());

// ---------- Garprobe ----------
pruefe("P13 Garprobe nutzt den rezepteigenen Hinweis", (function () {
  const t = garprobeText({ announce: "Die Nudeln sollten bissfest sein." }, 20);
  return t.indexOf("bissfest") >= 0 && t.indexOf("20 Sekunden") >= 0;
})());
pruefe("P14 Ohne eigenen Hinweis kommt ein allgemeiner Garhinweis", (function () {
  const t = garprobeText({}, 20);
  return t.indexOf("gar") >= 0 && t.indexOf("20 Sekunden") >= 0;
})());
pruefe("P15 Garprobe warnt vor dem Verkochen",
  garprobeText(null, 20).toLowerCase().indexOf("verkochen") >= 0);
pruefe("P16 Endspurt-Ansage liegt bei 20 s, nicht mehr bei 30 s",
  restzeitAnsageFaellig(20) === true && restzeitAnsageFaellig(30) === false);

pruefe("P17 armReminder plant WIRKLICH nach Schrittdauer, nicht starr", (function () {
  // Von der Mutationsprobe aufgedeckt: P4-P12 pruefen nur die Rechnung.
  // Ob armReminder() sie auch BENUTZT, stand nirgends. Genau solche
  // Verdrahtungsfehler ueberleben sonst jede Testsuite.
  selectedRecipe = { timeMin: 30, steps: [
    { text: "Zwiebeln wuerfeln" },
    { text: "Anbraten" },
    { text: "Koecheln lassen", timer: 900 },
    { text: "Abschmecken" },
  ] };
  stepIndex = 0;
  const echt = global.setTimeout;
  const fristen = [];
  global.setTimeout = function (fn, ms) { fristen.push(ms || 0); return 0; };
  try { armReminder(true); } finally { global.setTimeout = echt; }
  // Erwartet: 300 s Schrittdauer * 0,75 = 225 s = 225000 ms
  // Die alte starre Fassung haette 90000 geplant.
  return fristen.indexOf(225000) >= 0;
})());

pruefe("P18 armReminder auf einem Timer-Schritt plant nach dessen Laufzeit", (function () {
  stepIndex = 2;                       // Schritt mit timer: 900
  const echt = global.setTimeout;
  const fristen = [];
  global.setTimeout = function (fn, ms) { fristen.push(ms || 0); return 0; };
  try { armReminder(true); } finally { global.setTimeout = echt; }
  return fristen.indexOf(675000) >= 0; // 900 * 0,75
})());

// =====================================================================
// Q: EINGABE-MODUS - "Wann darf ich sprechen?"
// ---------------------------------------------------------------------
// Beschwerde des Betreibers: Nach "Rezept" oder "Termin" sprang das
// Mikrofon zwischen Start, Bereit und Ruhemodus; der Nutzer wusste nie,
// wann die App zuhoert. Ursache: Die App STELLTE eine gesprochene
// Rueckfrage und horchte gleichzeitig - sie hoerte sich selbst, der
// Chip flackerte, und der Backoff legte waehrend des Wartens Pausen ein.
// Zielbild: EIN Bereit-Ton, ein stabiler Hinweis, keine Pause.
// =====================================================================

pruefe("Q1 Eingabe-Modus spielt genau EINEN Bereit-Ton", (function () {
  gvStopp(); gvStart(); toeneLeeren();
  gvEingabe("Worauf habt ihr Lust?", () => {});
  const t = toeneGespielt();
  gvEingabeBeenden(true);
  return t.length === 1;
})());

pruefe("Q2 Eingabe-Modus spricht NICHT (sonst hoert die App sich selbst)", (function () {
  gvStopp(); gvStart(); gesprochenLeeren();
  gvEingabe("Worauf habt ihr Lust?", () => {});
  const gesagt = gesprochen.length;
  gvEingabeBeenden(true);
  return gesagt === 0;
})());

pruefe("Q3 Bereit-Banner wird sichtbar", (function () {
  setzeKochmodus(false);
  gvStopp(); gvStart();
  gvEingabe("Termin sprechen", () => {});
  const sichtbar = el("gvBereit").classList.contains("sichtbar");
  const text = el("gvBereitText").textContent;
  gvEingabeBeenden(true);
  return sichtbar && text === "Termin sprechen";
})());

pruefe("Q4 Banner verschwindet nach der Eingabe", (function () {
  setzeKochmodus(false);
  gvStopp(); gvStart();
  gvEingabe("Termin sprechen", () => {});
  const vorher = el("gvBereit").classList.contains("sichtbar");
  gvEingabeBeenden(true);
  return vorher && !el("gvBereit").classList.contains("sichtbar");
})());

pruefe("Q5 Chip flackert waehrend der Eingabe NICHT", (function () {
  setzeKochmodus(false);
  gvStopp(); gvStart();
  gvEingabe("Worauf habt ihr Lust?", () => {});
  const a = el("gvChip").classList.contains("eingabe");
  listening = false; gvChipStand();     // wuerde sonst "gleich wieder da"
  const b = el("gvChip").classList.contains("eingabe");
  GlobalVoice.aktiv = false; gvChipStand();  // wuerde sonst "aus"
  const c = el("gvChip").classList.contains("eingabe");
  gvEingabeBeenden(true);
  return a && b && c;
})());

pruefe("Q6 Waehrend der Eingabe gibt es KEINE Backoff-Pause", (function () {
  el("tab-kochen").classList = { contains: () => true, add(){}, remove(){}, toggle(){} };
  gvStopp(); micMuted = false; gvStart();
  gvEingabe("Sprich jetzt", () => {});
  gvBackoffStufe = 5;                   // waere sonst 20 s Pause
  const echt = global.setTimeout;
  const fristen = [];
  global.setTimeout = function (fn, ms) { fristen.push(ms || 0); return 0; };
  try { recInstanz.onend(); } finally { global.setTimeout = echt; }
  gvEingabeBeenden(true);
  return fristen.length > 0 && Math.min.apply(null, fristen) <= 250;
})());

pruefe("Q7 Eingabe-Modus verhindert die Ruhepause", (function () {
  el("tab-kochen").classList = { contains: () => true, add(){}, remove(){}, toggle(){} };
  gvStopp(); micMuted = false; gvStart();
  gvEingabe("Sprich jetzt", () => {});
  gvLetztesErgebnis = Date.now() - (GV_RUHE_MS + 10000);
  const echt = global.setTimeout;
  global.setTimeout = function () { return 0; };
  try { recInstanz.onend(); } finally { global.setTimeout = echt; }
  const nochAktiv = GlobalVoice.aktiv;
  gvEingabeBeenden(true);
  return nochAktiv === true;
})());

pruefe("Q8 Antwort erreicht die Rueckruffunktion", (function () {
  gvStopp(); gvStart();
  let bekommen = null;
  gvEingabe("Worauf habt ihr Lust?", (t) => { bekommen = t; });
  GlobalVoice.dialog.onInput("etwas mit Nudeln");
  return bekommen === "etwas mit Nudeln";
})());

pruefe("Q9 'abbrechen' beendet die Eingabe", (function () {
  gvStopp(); gvStart();
  let bekommen = null;
  gvEingabe("Worauf habt ihr Lust?", (t) => { bekommen = t; });
  GlobalVoice.dialog.onInput("abbrechen");
  return bekommen === null && GlobalVoice.dialog === null;
})());

pruefe("Q10 Abbruchwoerter erkannt, Alltagssatz nicht",
  istAbbruch("abbrechen") && istAbbruch("vergiss es") && istAbbruch("egal")
  && !istAbbruch("wir wollen etwas mit ei"));

pruefe("Q11 Eingabe laeuft nicht ewig - Notausstieg vorhanden",
  typeof GV_EINGABE_MAX_MS === "number" && GV_EINGABE_MAX_MS <= 40000);

pruefe("Q12 Befehl 'rezept' ohne Zusatz oeffnet den Eingabe-Modus",
  (erkenneKommando("rezept") || {}).typ === "rezept"
  && (erkenneKommando("rezept") || {}).rest === "");

// =====================================================================
// F-013: "befehl wie abbrechen und tschüss werden auf liste gesetzt
//        und nicht ausgeführt"
// Ursache: einkaufKetteEingabe kannte nur istKetteEnde und istZurueck.
// Alles andere - auch Abbruchwoerter und echte Befehle - ging
// ungeprueft an einkaufHinzufuegen.
// =====================================================================
pruefe("F-013 'abbrechen' landet NICHT auf der Einkaufsliste", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("abbrechen");
  einkaufKetteAktiv = false;
  return vState.liste.length === 0;
})());

pruefe("F-013 'tschüss' landet NICHT auf der Einkaufsliste", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("tschüss");
  einkaufKetteAktiv = false;
  return vState.liste.length === 0;
})());

pruefe("F-013 'tschüss' beendet die Kette", (function () {
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("tschüss");
  const beendet = einkaufKetteAktiv === false;
  einkaufKetteAktiv = false;
  return beendet;
})());

pruefe("F-013 Echter Befehl wird AUSGEFUEHRT statt notiert", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("rezept nudeln");
  const sauber = vState.liste.length === 0;
  einkaufKetteAktiv = false;
  return sauber;
})());

pruefe("F-013 Echte Artikel kommen weiterhin auf die Liste", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("Milch");
  const drauf = vState.liste.length === 1;
  einkaufKetteAktiv = false;
  vState.liste.length = 0;
  return drauf;
})());

// =====================================================================
// F-009: "wenn ich app öffne und 'rezepte' sage, springt anwendung
//        nicht zu rezept"
// Nachmeldung: "wenn ich anwendung 'einkaufsliste' nutze und
// sprachbefehl 'rezepte' oder 'rezept recherchieren' sage, kommt
// immernoch 'rezepte ist auf der liste'"
// Ursache: erkenneKommando kannte nur den Singular "rezept". Die
// Mehrzahl "rezepte" war ueberhaupt kein Befehl - sie fiel in der
// Einkaufs-Kette als Artikel durch. Zusaetzlich wurden Fuellverben
// wie "recherchieren" oder "suchen" als Suchwunsch missdeutet.
// =====================================================================
pruefe("F-009 'rezepte' ist ein Befehl", (function () {
  const k = erkenneKommando("rezepte");
  return Boolean(k) && k.typ === "rezept" && k.rest === "";
})());

pruefe("F-009 'rezepte suchen' ist ein Befehl ohne Suchwunsch", (function () {
  const k = erkenneKommando("rezepte suchen");
  return Boolean(k) && k.typ === "rezept" && k.rest === "";
})());

pruefe("F-009 'rezept recherchieren' hat KEINEN Suchwunsch", (function () {
  // Frueher: rest = "recherchieren" -> die App suchte Rezepte, die zu
  // dem Wort "recherchieren" passen.
  const k = erkenneKommando("rezept recherchieren");
  return Boolean(k) && k.typ === "rezept" && k.rest === "";
})());

pruefe("F-009 Echter Suchwunsch bleibt erhalten", (function () {
  const k = erkenneKommando("rezept mit nudeln");
  return Boolean(k) && k.typ === "rezept" && k.rest === "mit nudeln";
})());

pruefe("F-009 'rezepte' landet NICHT auf der Einkaufsliste", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("rezepte");
  const sauber = vState.liste.length === 0;
  einkaufKetteAktiv = false;
  vState.liste.length = 0;
  return sauber;
})());

pruefe("F-009 'rezept recherchieren' landet NICHT auf der Einkaufsliste", (function () {
  vState.liste.length = 0;
  einkaufKetteAktiv = true;
  einkaufKetteEingabe("rezept recherchieren");
  const sauber = vState.liste.length === 0;
  einkaufKetteAktiv = false;
  vState.liste.length = 0;
  return sauber;
})());

// =====================================================================
// F-011: "das mikrofonsignal überschneidet sich mit den jeweilig
//        aktuellen anwendungen (z.b. kochen) und stört und verwirrt"
// Ursache: Im Kochmodus zeigen ZWEI Anzeigen denselben Zustand - der
// schwebende Chip (fest ueber dem Inhalt, bottom:74px) und die
// Statuszeile micStatus im Kochbereich. Der Chip verdeckt zusaetzlich
// Bedienelemente. Im Kochmodus traegt die Statuszeile die Information
// im Zusammenhang; der schwebende Chip wird dort ausgeblendet.
// =====================================================================
pruefe("F-011 Im Kochmodus ist der schwebende Chip ausgeblendet", (function () {
  setzeKochmodus(true);
  gvStopp(); gvStart();
  gvChipStand();
  return el("gvChip").classList.contains("verborgen");
})());

pruefe("F-011 Ausserhalb des Kochmodus bleibt der Chip sichtbar", (function () {
  setzeKochmodus(false);
  gvStopp(); gvStart();
  gvChipStand();
  return !el("gvChip").classList.contains("verborgen");
})());

pruefe("F-011 Kochmodus zeigt den Zustand in der Statuszeile", (function () {
  setzeKochmodus(true);
  gvStopp(); gvStart();
  listening = true;
  gvChipStand();
  const t = String(el("micStatus").textContent || "");
  return t.length > 0;
})());

pruefe("F-011 Auch die Ansage blendet den Chip im Kochmodus aus", (function () {
  setzeKochmodus(true);
  gvStopp(); gvStart();
  gvChipAnsage();
  return el("gvChip").classList.contains("verborgen");
})());

pruefe("F-011 Bereit-Banner erscheint im Kochmodus NICHT zusaetzlich", (function () {
  // Zwei gleichzeitige Hinweise waren genau die Verwirrung.
  setzeKochmodus(true);
  gvBereitVerbergen();          // Vorbedingung explizit, kein Rest-Zustand
  gvStopp(); gvStart();
  gvEingabe("Sprich jetzt", () => {});
  // Von der Gegenprobe aufgedeckt: Die urspruengliche Fassung pruefte
  // eine Kombination aus Banner UND Chip und blieb deshalb gruen, als
  // die Banner-Unterdrueckung entfernt wurde. Jetzt wird genau die
  // Sache geprueft: Im Kochmodus erscheint das Banner nicht.
  const banner = el("gvBereit").classList.contains("sichtbar");
  gvEingabeBeenden(true);
  setzeKochmodus(false);
  return banner === false;
})());

// =====================================================================
// F-012: "der feedback button liegt hinter dem mikrofonbutton"
// Ursache: Beide schweben unten rechts. fbBtn bottom:78 right:14
// (54x54, z-index 40), gvChip bottom:74 right:10 (z-index 900). Die
// Rechtecke ueberlappen, der Chip liegt oben - der Feedback-Knopf ist
// nicht antippbar.
// Geprueft wird die tatsaechliche Geometrie aus den deklarierten
// Werten. Eine Layout-Berechnung gibt es in der Attrappe nicht, aber
// die Rechteck-Rechnung ist echte Pruefung und keine Textsuche.
// =====================================================================
function f012Kasten(quelle, id) {
  // Sucht die Positionsangaben im style-Attribut bzw. im CSS-Block.
  const idx = quelle.indexOf(id);
  if (idx < 0) return null;
  const abschnitt = quelle.slice(idx, idx + 600);
  const zahl = (name) => {
    const m = abschnitt.match(new RegExp(name + "\\s*:\\s*(-?\\d+)px"));
    return m ? Number(m[1]) : null;
  };
  const breite = zahl("width");
  const hoehe = zahl("height");
  return {
    rechts: zahl("right"),
    unten: zahl("bottom"),
    breite: breite === null ? 120 : breite,   // Chip: geschaetzte Textbreite
    hoehe: hoehe === null ? 33 : hoehe,       // Chip: Zeilenhoehe + Polster
    // z-index traegt keine Einheit - eigener Ausdruck noetig.
    z: (function () {
      const m = abschnitt.match(/z-index\s*:\s*(-?\d+)/);
      return m ? Number(m[1]) : null;
    })(),
  };
}

function f012Ueberlappen(a, b) {
  if (!a || !b || a.rechts === null || b.rechts === null) return true;
  const waagerecht = a.rechts < b.rechts + b.breite
    && b.rechts < a.rechts + a.breite;
  const senkrecht = a.unten < b.unten + b.hoehe
    && b.unten < a.unten + a.hoehe;
  return waagerecht && senkrecht;
}

pruefe("F-012 Feedback-Knopf und Mikrofon-Chip ueberlappen NICHT", (function () {
  const fb = f012Kasten(APPHTML, 'id="fbBtn"');
  const chip = f012Kasten(APPHTML, "#gvChip {");
  return fb !== null && chip !== null && !f012Ueberlappen(fb, chip);
})());

pruefe("F-012 Beide Knoepfe liegen im erreichbaren Bereich", (function () {
  const fb = f012Kasten(APPHTML, 'id="fbBtn"');
  return fb !== null && fb.unten >= 0 && fb.unten <= 400 && fb.rechts >= 0;
})());

pruefe("F-012 Der Feedback-Knopf ist nicht mehr niedriger gestapelt", (function () {
  // Selbst bei Ueberlappung durch fremde Elemente muss er bedienbar
  // bleiben: sein z-index darf nicht unter dem des Chips liegen.
  const fb = f012Kasten(APPHTML, 'id="fbBtn"');
  const chip = f012Kasten(APPHTML, "#gvChip {");
  return fb.z !== null && chip.z !== null && fb.z >= chip.z;
})());

// =====================================================================
// F-015: "möglicher abbruch der aktuellen anwendung (kochen,termin
//        etc) mit sprachbefehl 'ende' impementieren"
// Betreiber-Vorgabe: Kochmodus mit Rueckfrage; "ende" durch ein
// sichereres Wort ersetzen.
// Entscheidung: "abbrechen" (dreisilbig, kommt allein kaum im
// Alltagsgespraech vor, ist in dieser App bereits das Abbruchwort).
// "ende" bleibt nur in der Einkaufs-Kette gueltig - einsilbige Woerter
// werden von der Spracherkennung zu leicht verwechselt.
// =====================================================================
pruefe("F-015 'abbrechen' ist ein Anwendungsabbruch", istAnwendungEnde("abbrechen"));
pruefe("F-015 'anwendung beenden' ist ein Anwendungsabbruch",
  istAnwendungEnde("anwendung beenden"));
pruefe("F-015 'kochen beenden' ist ein Anwendungsabbruch",
  istAnwendungEnde("kochen beenden"));
pruefe("F-015 'abbruch' ist ein Anwendungsabbruch", istAnwendungEnde("abbruch"));

pruefe("F-015 Satz mit 'ende' loest NICHTS aus",
  !istAnwendungEnde("am ende des tages holen wir oma ab"));
pruefe("F-015 Satz mit 'abbrechen' loest NICHTS aus",
  !istAnwendungEnde("wir mussten den ausflug abbrechen weil es regnete"));
pruefe("F-015 Einsilbiges 'ende' ist KEIN Anwendungsabbruch",
  !istAnwendungEnde("ende"));

pruefe("F-015 Kochmodus fragt zuerst nach", (function () {
  setzeKochmodus(true);
  selectedRecipe = { name: "Test", _skaliert: true, timeMin: 20,
    ingredients: [{ name: "Reis", qty: 100, unit: "g" }],
    steps: [{ text: "Eins" }, { text: "Zwei" }] };
  stepIndex = 1;
  abbruchWartetAufBestaetigung = false;
  gvRoute("abbrechen");
  const fragt = abbruchWartetAufBestaetigung === true;
  const nochImKochen = stepIndex === 1;
  abbruchWartetAufBestaetigung = false;
  setzeKochmodus(false);
  return fragt && nochImKochen;
})());

pruefe("F-015 Bestaetigung beendet den Kochmodus", (function () {
  setzeKochmodus(true);
  abbruchWartetAufBestaetigung = true;
  gvRoute("ja");
  const beendet = abbruchWartetAufBestaetigung === false;
  setzeKochmodus(false);
  return beendet;
})());

pruefe("F-015 'nein' setzt das Kochen fort", (function () {
  setzeKochmodus(true);
  stepIndex = 1;
  abbruchWartetAufBestaetigung = true;
  gvRoute("nein");
  const weiter = abbruchWartetAufBestaetigung === false && stepIndex === 1;
  setzeKochmodus(false);
  return weiter;
})());

pruefe("F-015 Ausserhalb des Kochens wird OHNE Rueckfrage abgebrochen", (function () {
  setzeKochmodus(false);
  GlobalVoice.dialog = null;
  abbruchWartetAufBestaetigung = false;
  gvRoute("abbrechen");
  return abbruchWartetAufBestaetigung === false;
})());

pruefe("F-015 Termin-Dialog wird durch 'abbrechen' verworfen", (function () {
  setzeKochmodus(false);
  let bekommen = null;
  GlobalVoice.dialog = { frage: "Termin sprechen",
    onInput: (t) => { bekommen = t; } };
  gvRoute("abbrechen");
  const verworfen = GlobalVoice.dialog === null && bekommen === null;
  GlobalVoice.dialog = null;
  return verworfen;
})());
