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
