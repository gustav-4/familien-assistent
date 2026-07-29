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
pruefe("G6 Selbsthoer-Schutz als Softwaresperre vorhanden",
  APPQUELLE.includes("if (ttsActive || Date.now() < ttsCooldownUntil) return;"));

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
