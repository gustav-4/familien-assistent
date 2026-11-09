// =====================================================
// AKTIONS-VERTEILER (F-034)
// Knoepfe tragen keine Programmzeilen (onclick="...") mehr, sondern eine
// Beschriftung (data-on-click mit Funktionsname und Werten). Das erlaubt eine strenge
// Sicherheitsregel ohne 'unsafe-inline' fuer Skripte. Ausgefuehrt werden
// NUR Funktionen aus der festen Liste unten, mit einfachen Werten
// ('Text', Zahl, true/false, this, this.value) - nichts wird ausgewertet.
// =====================================================
const AKTIONEN_ERLAUBT = new Set([
  "addFavorite",
  "addMember",
  "addRoutine",
  "aktivierePush",
  "ausschlussSpeichern",
  "bonFotoGewaehlt",
  "buildShoppingList",
  "byeSchliessen",
  "confirmStep",
  "datenschutzToggle",
  "fbOeffnen",
  "fbSchliessen",
  "fbSenden",
  "fbSprechen",
  "goTab",
  "gvToggle",
  "klangGewaehlt",
  "lauschUmschalten",
  "leereEinkaufslisteKnopf",
  "loescheAlles",
  "obFertig",
  "obInstall",
  "obMikro",
  "obMitgliedHinzu",
  "obPush",
  "obWeiter",
  "obZurueck",
  "onboardingOeffnen",
  "prevStep",
  "readShoppingList",
  "rechercheRezept",
  "reminderOk",
  "repeatStep",
  "rezeptVoiceStart",
  "ruheKochGewaehlt",
  "saveTermin",
  "scanStarten",
  "setKochModus",
  "setTimeGroup",
  "sicherungDateiGewaehlt",
  "sicherungSpeichern",
  "sicherungWiederherstellen",
  "startCooking",
  "stimmeGewaehlt",
  "stimmeProbe",
  "syncEinladen",
  "syncTrennen",
  "syncVerbinden",
  "terminVoiceStart",
  "toggleStdRezepte",
  "updatePruefen",
  "vbVoiceAdd",
  "vbVoiceCheckoffToggle",
  "wocheWechseln",
  "wpPlanen",
  "zettelFotoGewaehlt"
]);
function aktionWert(roh, el, ev) {
  const t = roh.trim();
  if (t === "this") return el;
  if (t === "this.value") return el ? el.value : undefined;
  if (t === "event") return ev;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
  const m = t.match(/^'([^'\\]*)'$/) || t.match(/^"([^"\\]*)"$/);
  if (m) return m[1];
  throw new Error("Wert nicht erlaubt");
}
function fuehreAktionAus(text, el, ev, umgebung, erlaubt) {
  const umg = umgebung || globalThis;
  const liste = erlaubt || AKTIONEN_ERLAUBT;
  let anzahl = 0;
  String(text || "").split(";").forEach((teil) => {
    if (!teil.trim()) return;
    try {
      const m = teil.match(/^\s*([A-Za-z_$][\w$]*)\((.*)\)\s*$/);
      if (!m || !liste.has(m[1]) || typeof umg[m[1]] !== "function") return;
      const roh = m[2].trim();
      const args = roh === "" ? [] : roh.split(",").map((a) => aktionWert(a, el, ev));
      umg[m[1]](...args);
      anzahl++;
    } catch (e) { /* abgewiesen oder Fehler in der Aktion: Knopf bleibt ruhig */ }
  });
  return anzahl;
}
["click", "change", "input", "toggle"].forEach((art) => {
  // Erfassungsphase, weil "toggle" (Aufklappfeld) nicht nach oben weitergereicht wird.
  document.addEventListener(art, (ev) => {
    const el = ev.target && ev.target.closest
      ? ev.target.closest("[data-on-" + art + "]") : null;
    if (el) fuehreAktionAus(el.getAttribute("data-on-" + art), el, ev);
  }, true);
});
function byeSchliessen() {
  const o = document.getElementById("byeOverlay");
  if (o) o.classList.add("hidden");
  gvStart();
}
function datenschutzToggle(el) {
  if (el && el.open) datenschutzRendern();
}
