/*
 * Familien-Assistent – LOKALE KI-INFERENZ (Offline-Rezeptrecherche)
 * =================================================================
 * Rezeptrecherche (Stufe 1) und Kochschritte (Stufe 2) laufen
 * vollstaendig AUF DEM GERAET – WebGPU ueber WebLLM (@mlc-ai/web-llm
 * 0.2.87, Apache-2.0, unveraendert unter /vendor abgelegt, kein CDN).
 * Es werden KEINE Eingaben der Familie an einen Server geschickt –
 * weder Essenswuensche noch Allergien noch Familiendaten.
 *
 * Netzwerk wird nur gebraucht, um das Modell EINMALIG herunterzuladen
 * (oeffentliche Gewichte von Hugging Face, Rechenkern von GitHub, ohne
 * jeden Bezug zur Familie). Danach liegt es im Cache-Speicher des
 * Browsers und funktioniert auch im Flugmodus.
 *
 * MODELLWAHL: Standard ist Llama 3.2 3B Instruct (4-Bit, q4f16_1).
 * Bei RAM-/Grafikspeicher-Engpaessen faellt das Modul automatisch auf
 * Llama 3.2 1B zurueck – vorab (wenig Geraete-RAM, zu kleine GPU-Puffer)
 * UND nachtraeglich (Ladefehler "out of memory", verlorenes GPU-Geraet).
 *
 * SICHERHEITSPRINZIP (Defense in Depth, unveraendert): Die KI bekommt
 * Allergien und Ernaehrungsform als harte Regel in den Prompt – danach
 * prueft ein DETERMINISTISCHER Filter jedes Rezept gegen die feste
 * Zutatenliste und verwirft Verstoesse. Der Filter ist eine wortgleiche
 * Kopie des Server-Filters aus netlify/functions/rezept.mjs. Bei
 * Allergien hat niemals allein die KI das letzte Wort.
 *
 * Die 13 Codes decken alle 14 EU-Hauptallergene (LMIV Anhang II) ab:
 *   gluten, meerestiere (= Krebstiere + Weichtiere), ei, fisch, erdnuss,
 *   soja, laktose (Milch), nuesse (Schalenfruechte), sellerie, senf,
 *   sesam, sulfite, lupinen.
 *
 * Oeffentliche Schnittstelle: window.KiLokal (siehe ganz unten).
 */
(function () {
"use strict";

const WEBLLM_URL = "/vendor/web-llm-0.2.87/web-llm.js";
const WORKER_URL = "/ki-worker.js";

const MODELLE = {
  gross: { f16: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
           f32: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
           name: "Llama 3.2 (3B, 4-Bit)", groesse: "ca. 1,8 GB" },
  klein: { f16: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
           f32: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
           name: "Llama 3.2 (1B, 4-Bit)", groesse: "ca. 0,7 GB" },
};
// Unter dieser Geraete-RAM-Angabe (navigator.deviceMemory, in GB) wird
// direkt das 1B-Modell gewaehlt: das 3B-Modell belegt allein ~2,3 GB.
const MIN_RAM_GB_GROSS = 6;
// Mindestgroesse eines einzelnen GPU-Puffers fuer das 3B-Modell.
const MIN_PUFFER_GROSS = 1024 * 1024 * 1024;
// Merker: Ist das 3B-Modell hier schon einmal am Speicher gescheitert,
// wird es nicht bei jedem Start erneut versucht.
const LS_KLEIN = "ka_ki_klein";
// Nach dieser Ruhezeit wird das Modell aus dem Grafikspeicher entladen
// (bleibt im Cache) – schont Akku und Arbeitsspeicher.
const LEERLAUF_MS = 10 * 60 * 1000;
const ZEITLIMIT_MS = 4 * 60 * 1000;

// =====================================================================
// BEGIN KOPIE netlify/functions/rezept.mjs (Vokabulare, Allergen-/
// Ernaehrungs-/Ausschluss-Filter, Prompts, Schema-Haertung).
// WORTGLEICH – Aenderungen am Server hier 1:1 nachziehen.
// =====================================================================
// ---- Erlaubte Vokabulare (muessen mit dem Frontend uebereinstimmen) ----
const ALLERGEN_CODES = ["gluten","laktose","nuesse","ei","erdnuss","soja",
  "fisch","meerestiere","sellerie","senf","sesam","lupinen","sulfite"];
const DIET_CODES = ["vegan","vegetarisch","pescetarisch","lowcarb"];

// ---- Stichwoerter fuer den deterministischen Allergen-Sicherheitsfilter ----
// Bewusst grosszuegig (lieber ein Rezept zu viel verwerfen als zu wenig).
const ALLERGEN_KEYWORDS = {
  gluten: ["weizen","dinkel","roggen","gerste","mehl","brot","toast","nudel",
    "pasta","spaghetti","couscous","bulgur","grieß","griess","paniermehl",
    "semmelbrösel","semmelbroesel","panko","bier","seitan","knödel","knoedel",
    "tortilla","wrap","cracker","keks","croûton","crouton"],
  laktose: ["milch","sahne","butter","käse","kaese","joghurt","quark",
    "frischkäse","frischkaese","schmand","crème fraîche","creme fraiche",
    "mozzarella","parmesan","feta","mascarpone","ricotta","kondensmilch",
    "molke","buttermilch","rahm","ghee"],
  nuesse: ["mandel","haselnuss","walnuss","cashew","pistazie","pekan",
    "macadamia","paranuss","marzipan","nougat","nuss","nüsse","nuesse"],
  ei: ["ei","eier","eigelb","eiweiß","eiweiss","mayonnaise","mayo"],
  erdnuss: ["erdnuss","erdnüsse","erdnuesse","erdnussbutter","erdnussöl",
    "erdnussoel"],
  soja: ["soja","tofu","sojasauce","sojasoße","edamame","tempeh","miso",
    "sojamilch","sojajoghurt"],
  fisch: ["fisch","lachs","thunfisch","kabeljau","seelachs","forelle","hering",
    "sardelle","sardine","anchovis","makrele","scholle","pangasius",
    "fischsauce","fischsoße","worcester"],
  meerestiere: ["garnele","shrimp","scampi","muschel","krabbe","hummer",
    "tintenfisch","calamari","krebs","languste","auster","jakobsmuschel",
    "meeresfrüchte","meeresfruechte"],
  sellerie: ["sellerie","selleriesalz","staudensellerie","knollensellerie"],
  senf: ["senf","dijon","senfkörner","senfkoerner"],
  sesam: ["sesam","tahin","tahini","gomasio"],
  lupinen: ["lupine","lupinen","lupinenmehl"],
  sulfite: ["sulfit","trockenobst","trockenfrüchte","trockenfruechte",
    "rosinen","aprikosen getrocknet"],
};

// ---- Stichwoerter fuer den Ernaehrungs-Sicherheitsfilter ----
const FLEISCH_KEYWORDS = ["fleisch","hähnchen","haehnchen","huhn","hühn","huehn",
  "pute","truthahn","rind","schwein","hack","faschiertes","speck","schinken",
  "wurst","salami","bacon","lamm","ente","gans","kalb","leber","geflügel",
  "gefluegel","chorizo","cabanossi","kassler","gyros","döner","doener",
  "frikadelle","bolognese","leberkäse","leberkaese"];
const FISCH_SEAFOOD_KEYWORDS = [...ALLERGEN_KEYWORDS.fisch,
  ...ALLERGEN_KEYWORDS.meerestiere];
const TIERPRODUKT_KEYWORDS = [...FLEISCH_KEYWORDS, ...FISCH_SEAFOOD_KEYWORDS,
  ...ALLERGEN_KEYWORDS.laktose, ...ALLERGEN_KEYWORDS.ei,
  "honig","gelatine","gelantine","sahne","speisequark"];

// "...frei"-Negationen, damit "Sojasauce glutenfrei" nicht als Gluten zaehlt.
const NEGATION = {
  gluten: ["glutenfrei","ohne gluten"],
  laktose: ["laktosefrei","ohne laktose","pflanzlich","vegan"],
};

function normalize(s) {
  return String(s || "").toLowerCase();
}

// Prueft, ob ein Zutaten-Text ein Stichwort enthaelt (mit Negationsschutz).
function trifftStichwort(text, keywords, negationen) {
  const t = normalize(text);
  if (negationen && negationen.some((n) => t.includes(n))) return false;
  return keywords.some((kw) => t.includes(normalize(kw)));
}

// Verstoesst ein Rezept gegen eine der ausgeschlossenen Allergengruppen?
function verletztAllergen(recipe, ausgeschlossen) {
  const zutaten = (recipe.ingredients || []).map((i) => i && i.name);
  for (const code of ausgeschlossen) {
    const kws = ALLERGEN_KEYWORDS[code];
    if (!kws) continue;
    if (zutaten.some((name) => trifftStichwort(name, kws, NEGATION[code])))
      return code;
  }
  return null;
}

// Verstoesst ein Rezept gegen eine geforderte Ernaehrungsform?
function verletztDiet(recipe, ernaehrungsformen) {
  const zutaten = (recipe.ingredients || []).map((i) => i && i.name);
  const hat = (kws) => zutaten.some((name) => trifftStichwort(name, kws));
  for (const diet of ernaehrungsformen) {
    if (diet === "vegan" && hat(TIERPRODUKT_KEYWORDS)) return "vegan";
    if (diet === "vegetarisch" &&
        hat([...FLEISCH_KEYWORDS, ...FISCH_SEAFOOD_KEYWORDS]))
      return "vegetarisch";
    if (diet === "pescetarisch" && hat(FLEISCH_KEYWORDS)) return "pescetarisch";
    // lowcarb laesst sich nicht zuverlaessig per Zutatennamen pruefen ->
    // hier vertrauen wir der KI-Vorgabe im Prompt.
  }
  return null;
}

// ---- Freitext-Ausschluss (Vorlieben/Religion/Verzicht) ----
// Zweite Verteidigungslinie wie bei den Allergenen: Die KI bekommt die
// Begriffe als harte Regel UND der Server verwirft danach jedes Rezept,
// das sie trotzdem enthaelt. Die Gruppen MUESSEN mit
// AUSSCHLUSS_GRUPPEN in index.html uebereinstimmen.
const AUSSCHLUSS_GRUPPEN = [
  ["schwein","schweinefleisch","schweinefilet","schweinelende","speck",
   "bacon","schinken","salami","kassler","kasseler","chorizo","cabanossi",
   "leberk\u00e4se","leberkaese","bratwurst","mettwurst","mett","wiener",
   "frankfurter","schweineschmalz","pancetta","guanciale","prosciutto",
   "serranoschinken","gelatine","gelantine"],
  ["rind","rindfleisch","beef","steak","roastbeef","tafelspitz","ochse"],
  ["lamm","lammfleisch","hammel","lammkeule","lammfilet"],
  ["alkohol","wein","rotwein","wei\u00dfwein","weisswein","bier","rum","cognac",
   "lik\u00f6r","likoer","sherry","portwein","wodka","whisky","whiskey",
   "calvados","marsala","weinbrand","amaretto","prosecco","sekt"],
  ["zwiebel","zwiebeln","schalotte","schalotten","fr\u00fchlingszwiebel",
   "fruehlingszwiebel","lauchzwiebel","zwiebelpulver"],
  ["knoblauch","knofi","knoblauchzehe","knoblauchpulver"],
  ["pilz","pilze","champignon","champignons","pfifferling","steinpilz",
   "shiitake","austernpilz","egerling"],
  ["koriander","cilantro","koriandergr\u00fcn","koriandergruen"],
  ["scharf","chili","chilli","peperoni","cayenne","sambal","harissa",
   "tabasco","jalapeno","jalape\u00f1o","chiliflocken"],
  ["innereien","leber","niere","nieren","herz","zunge","kutteln","bries"],
  ["kokos","kokosmilch","kokosnuss","kokosraspel","kokos\u00f6l","kokosoel"],
  ["rosine","rosinen","sultanine","sultaninen","korinthen"],
  ["oliven","olive","olivenpaste","tapenade"],
];

function ausschlussErweitern(begriffe) {
  const raus = new Set();
  for (const b of begriffe || []) {
    const w = normalize(b).trim();
    if (w.length < 2) continue;
    raus.add(w);
    for (const gruppe of AUSSCHLUSS_GRUPPEN) {
      if (gruppe.some((g) => g === w || w.includes(g) || g.includes(w)))
        gruppe.forEach((g) => raus.add(g));
    }
  }
  return [...raus];
}

// Zutaten UND Schritttexte pruefen - eine Zutat kann in der Anleitung
// stehen, ohne in der Zutatenliste aufzutauchen.
function verletztAusschluss(recipe, begriffe) {
  if (!begriffe || !begriffe.length) return null;
  const woerter = ausschlussErweitern(begriffe);
  const felder = [];
  (recipe.ingredients || []).forEach((i) => felder.push(String((i && i.name) || "")));
  (recipe.steps || []).forEach((s) => felder.push(String((s && s.text) || "")));
  felder.push(String(recipe.name || ""));
  const text = normalize(felder.join(" | "));
  for (const w of woerter) if (text.includes(w)) return w;
  return null;
}

// ---- Eingaben defensiv saeubern ----
function saubereListe(arr, erlaubt) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(normalize).filter((x) => erlaubt.includes(x)))];
}

// ZWEISTUFIGE RECHERCHE (FUSION26, behebt den chronischen 504):
// Stufe 1 liefert NUR Auswahl-Informationen - Name, Zeit, Zutaten. Das
// ist alles, was die Familie zum Entscheiden, Vorlesen und Einkaufen
// braucht, und es ist in wenigen Sekunden geschrieben.
// Stufe 2 holt die Kochschritte fuer GENAU EIN gewaehltes Rezept.
// Vorher wurden 3 vollstaendige Rezepte auf einmal erzeugt - zwei
// Drittel davon fuer den Papierkorb, und die Antwort war regelmaessig
// laenger als das Zeitlimit der Plattform. Nichts wird gekuerzt: die
// Schritte duerfen jetzt sogar ausfuehrlicher sein.
function buildStepPrompt(p) {
  const zutaten = (p.zutaten || [])
    .map((z) => `${z.qty} ${z.unit} ${z.name}`).join(", ");
  return `Du bist ein erfahrener Familienkoch. Schreibe die \
Zubereitungsschritte fuer dieses Gericht:

GERICHT: "${p.gericht}"
ZUBEREITUNGSZEIT: etwa ${p.minuten} Minuten
ZUTATEN (exakt diese Mengen, bereits auf die Familie gerechnet – \
verwende GENAU diese Zahlen in den Schritten, rechne nichts um):
${zutaten}

REGELN:
- Nur diese Zutaten verwenden, keine weiteren erfinden.
- 5 bis 10 Schritte, ganze Saetze, freundlich, fuer Sprachausgabe.
- Bei Wartezeiten "timer" in Sekunden setzen und in "announce" \
beschreiben, was danach fertig sein soll (mit Garprobe).

AUSGABEFORMAT: Antworte AUSSCHLIESSLICH mit gueltigem JSON, ohne \
Markdown, ohne Kommentar:
{"steps":[{"text":"..."},{"text":"...","timer":600,"announce":"..."}]}`;
}

function buildPrompt(p) {
  const allergTxt = p.unvertraeglichkeiten.length
    ? p.unvertraeglichkeiten.join(", ")
    : "keine";
  const dietTxt = p.ernaehrungsformen.length
    ? p.ernaehrungsformen.join(", ")
    : "keine Einschränkung";
  const stilTxt = p.stile.length ? p.stile.join(", ") : "keine besondere";
  const ausschlussTxt = p.ausschluss.length
    ? `\n- VERBOTENE ZUTATEN (Wunsch der Familie, ebenfalls nicht \
verhandelbar): ${p.ausschluss.join(", ")}. Verwende diese Zutaten NICHT \
und auch keine Erzeugnisse daraus (z.B. "kein Schwein" schliesst Speck, \
Schinken, Salami, Wurst und Gelatine mit ein).`
    : "";
  const vermeideTxt = p.vermeide.length
    ? `\n- Schlage NICHT erneut vor (schon gezeigt): ${p.vermeide.join(", ")}.`
    : "";

  return `Du bist ein erfahrener Familienkoch und entwickelst Rezepte fuer \
einen Kochassistenten. Erstelle GENAU 3 unterschiedliche, alltagstaugliche \
Rezepte fuer eine Familie.

WUNSCH DER FAMILIE: "${p.wunsch || "etwas Schnelles, Gesundes fuer die ganze Familie"}"

HARTE REGELN (NICHT VERHANDELBAR – Verstoss = Rezept unbrauchbar):
- AUSGESCHLOSSENE ALLERGENE: ${allergTxt}. Verwende KEINE Zutat, die dieses \
Allergen enthaelt – auch keine versteckten Quellen (z.B. Sellerie steckt in \
vielen Bruehen, Gluten in Sojasauce, Laktose in Butter/Sahne/Kaese). Im \
Zweifel die Zutat weglassen oder durch eine sichere Alternative ersetzen.
- ERNAEHRUNGSFORM (fuer ALLE Rezepte zwingend): ${dietTxt}. \
vegetarisch = kein Fleisch und kein Fisch/Meerestier. \
pescetarisch = kein Fleisch (Fisch erlaubt). \
vegan = keine Tierprodukte (kein Fleisch, Fisch, Ei, Milch, Honig, Gelatine). \
lowcarb = wenig Kohlenhydrate (keine Nudeln/Reis/Kartoffeln/Brot als Hauptbeilage).

WEICHE PRAEFERENZ (wenn moeglich beruecksichtigen): Stil ${stilTxt}.
ZEITRAHMEN: Zubereitung zwischen ${p.minuten_min} und ${p.minuten_max} Minuten.${ausschlussTxt}${vermeideTxt}

${p.kurz ? `WICHTIG: Das Feld "steps" bleibt in dieser Anfrage LEER (\`[]\`). \
Die Zubereitungsschritte werden spaeter getrennt angefragt.
SCHREIBE KNAPP – die Antwort muss in wenigen Sekunden fertig sein:
- hoechstens 12 Zutaten je Rezept
- hoechstens 1 Eintrag unter "varianten", Text maximal 12 Woerter
- hoechstens 2 Eintraege unter "tags", je ein einzelnes Wort
- keine Erklaerungen, keine Fliesstexte ausserhalb der Felder
` : ""}
AUSGABEFORMAT: Antworte AUSSCHLIESSLICH mit gueltigem JSON, ohne Markdown, \
ohne Kommentar, in dieser Struktur:
{
  "recipes": [
    {
      "name": "Name des Gerichts",
      "timeMin": 30,
      "allergens": ["nur Codes aus: ${ALLERGEN_CODES.join("|")} – ENTHALTENE Allergene, niemals die ausgeschlossenen"],
      "diet": ["zutreffende Codes aus: ${DIET_CODES.join("|")} – vegan immer zusammen mit vegetarisch und pescetarisch angeben"],
      "varianten": [{"macht":"vegan|vegetarisch|pescetarisch|lowcarb","text":"kurzer Hinweis zur Anpassung"}],
      "stile": ["passende Codes aus: pflanzenbetont|highprotein|gesund|nachhaltig|fermentiert|cleanlabel|international|mealprep|budget"],
      "tags": ["2-3 kurze deutsche Schlagworte, z.B. glutenfrei, kinderliebling"],
      "ingredients": [{"name":"Zutat","qty":500,"unit":"g|ml|Liter|Stück|EL|TL|Bund"}],
      "steps": ${p.kurz ? "[]" : `[
        {"text":"Anweisung in ganzen Saetzen, freundlich, fuer Sprachausgabe geeignet"},
        {"text":"Schritt mit Wartezeit","timer":600,"announce":"Was nach der Zeit fertig/gar sein soll – mit Garprobe"}
      ]`}
    }
  ]
}

KINDERTAUGLICHKEIT: nicht scharf, bekannte Komponenten; wo sinnvoll ein \
kurzer Hinweis, wie Kinder mithelfen koennen.

WICHTIG fuer die Schritte:
- Jeder Schritt nennt seine Mengen KONKRET im Text \
(z.B. "Gib 500 g Moehren und 2 EL Oel in den Topf").
- PFLICHT: JEDER Schritt mit Wartezeit ab 1 Minute (kochen, braten, \
backen, ziehen lassen) bekommt "timer" (Sekunden, ganzzahlig) UND \
"announce". Ein Hauptgericht ohne einen einzigen Timer ist FALSCH.
- "announce" beschreibt nach jedem Timer, woran man erkennt dass es fertig \
ist (z.B. "Die Moehren sollten jetzt weich sein – mit der Gabel pruefen"). \
Bei Fleisch/Fisch IMMER auf vollstaendige Garung hinweisen (Durchgaren, \
kein rosa Fleisch, klarer Saft).
- Mengen fuer 2 Erwachsene + 2 Kinder.
- "allergens" listet die im Rezept ENTHALTENEN Allergene (fuer die Anzeige) – \
es darf KEINES der ausgeschlossenen enthalten sein.`;
}

// ---- robustes JSON-Parsing aus der Modellantwort ----
function extractJson(text) {
  if (!text) return null;
  let t = text.trim();
  // Code-Fences entfernen
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

// ---- Rezept normalisieren & validieren (Schema haerten) ----
function normalizeRecipe(raw, ohneSchritte) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim().slice(0, 80);
  if (!name) return null;

  let timeMin = parseInt(raw.timeMin, 10);
  if (!Number.isFinite(timeMin) || timeMin <= 0) timeMin = 30;
  timeMin = Math.min(Math.max(timeMin, 5), 240);

  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .map((i) => {
      if (!i || !i.name) return null;
      let qty = Number(i.qty);
      if (!Number.isFinite(qty) || qty <= 0) qty = 1;
      return {
        name: String(i.name).trim().slice(0, 80),
        qty: Math.round(qty * 100) / 100,
        unit: String(i.unit || "Stück").trim().slice(0, 12),
      };
    })
    .filter(Boolean);
  if (!ingredients.length) return null;

  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((s) => {
      if (!s || !s.text) return null;
      const step = { text: String(s.text).trim().slice(0, 600) };
      const timer = parseInt(s.timer, 10);
      if (Number.isFinite(timer) && timer > 0)
        step.timer = Math.min(timer, 7200);
      if (s.announce) step.announce = String(s.announce).trim().slice(0, 400);
      return step;
    })
    .filter(Boolean);
  if (!steps.length && !ohneSchritte) return null;

  const varianten = (Array.isArray(raw.varianten) ? raw.varianten : [])
    .map((v) => {
      if (!v || !DIET_CODES.includes(normalize(v.macht))) return null;
      return {
        macht: normalize(v.macht),
        text: String(v.text || "").trim().slice(0, 160),
      };
    })
    .filter((v) => v && v.text);

  return {
    name,
    timeMin,
    allergens: saubereListe(raw.allergens, ALLERGEN_CODES),
    diet: saubereListe(raw.diet, DIET_CODES),
    varianten,
    stile: Array.isArray(raw.stile)
      ? raw.stile.map(normalize).slice(0, 6)
      : [],
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((t) => String(t).trim().slice(0, 30)).slice(0, 4)
      : [],
    ingredients,
    steps,
  };
}

// =====================================================================
// END KOPIE rezept.mjs
// =====================================================================

// ---------------------------------------------------------------------
// Zustand der lokalen KI
// ---------------------------------------------------------------------
const zustand = {
  phase: "aus",        // aus | laedt | bereit | fehler | nicht-unterstuetzt
  fortschritt: 0,      // 0..1 beim Laden
  text: "",
  modell: "",
  stufe: "",           // gross | klein
};
const beobachter = new Set();
let engine = null;
let engineWorker = null;
let ladeVersprechen = null;
let libVersprechen = null;
let faehigkeitVersprechen = null;
let warteschlange = Promise.resolve();
let leerlaufTimer = null;

function melde(teil) {
  Object.assign(zustand, teil);
  const kopie = Object.assign({}, zustand);
  beobachter.forEach((fn) => { try { fn(kopie); } catch (e) {} });
}

function lib() {
  if (!libVersprechen) libVersprechen = import(WEBLLM_URL);
  return libVersprechen;
}

function kleinGemerkt() {
  try { return localStorage.getItem(LS_KLEIN) === "1"; } catch (e) { return false; }
}
function kleinMerken() {
  try { localStorage.setItem(LS_KLEIN, "1"); } catch (e) {}
}

/** Sieht ein Fehler nach Speichermangel aus? (pur & testbar) */
function istSpeicherFehler(e) {
  const t = String((e && (e.message || e.name)) || e || "").toLowerCase();
  return /out of memory|outofmemory|oom|memory|allocation|allocate|device (was )?lost|devicelost|buffer size|maxbuffersize|maxstoragebuffer|exceeds|too large|quota/.test(t);
}

/**
 * Vorab-Entscheidung gross/klein (pur & testbar).
 * ram: navigator.deviceMemory in GB (oder undefined, z. B. Safari)
 * puffer: adapter.limits.maxBufferSize in Byte (oder undefined)
 */
function waehleStufe(ram, puffer, gemerkt) {
  if (gemerkt) return "klein";
  if (Number.isFinite(ram) && ram < MIN_RAM_GB_GROSS) return "klein";
  if (Number.isFinite(puffer) && puffer < MIN_PUFFER_GROSS) return "klein";
  return "gross";
}

/** Kann dieses Geraet ueberhaupt lokal rechnen? (WebGPU-Pruefung) */
function faehigkeit() {
  if (faehigkeitVersprechen) return faehigkeitVersprechen;
  faehigkeitVersprechen = (async () => {
    if (typeof navigator === "undefined" || !navigator.gpu)
      return { ok: false, grund: "Dieser Browser unterstützt noch kein " +
        "WebGPU. Aktuelle Versionen von Chrome, Edge und Safari können " +
        "die lokale KI ausführen." };
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return { ok: false, grund: "Auf diesem Gerät wurde " +
        "keine passende Grafikeinheit für die lokale KI gefunden." };
      const f16 = Boolean(adapter.features && adapter.features.has("shader-f16"));
      const puffer = adapter.limits ? Number(adapter.limits.maxBufferSize) : undefined;
      const ram = Number(navigator.deviceMemory);
      return { ok: true, f16, ram, puffer };
    } catch (e) {
      return { ok: false, grund: "WebGPU ist auf diesem Gerät gesperrt." };
    }
  })();
  return faehigkeitVersprechen;
}

function modellId(stufe, f16) {
  return MODELLE[stufe][f16 ? "f16" : "f32"];
}

/** Reihenfolge der Ladeversuche: zuerst die passende Stufe, dann 1B. */
async function kandidaten() {
  const f = await faehigkeit();
  if (!f.ok) return [];
  const start = waehleStufe(f.ram, f.puffer, kleinGemerkt());
  return start === "gross" ? ["gross", "klein"] : ["klein"];
}

/** Liegt bereits ein verwendbares Modell im Cache? */
async function imCache() {
  const f = await faehigkeit();
  if (!f.ok) return false;
  try {
    const w = await lib();
    for (const stufe of await kandidaten())
      if (await w.hasModelInCache(modellId(stufe, f.f16))) return true;
  } catch (e) {}
  return false;
}

function entladen() {
  const alt = engine;
  const altWorker = engineWorker;
  engine = null;
  engineWorker = null;
  ladeVersprechen = null;
  if (alt) warteschlange = warteschlange
    .then(() => alt.unload()).catch(() => {})
    .then(() => { try { altWorker && altWorker.terminate(); } catch (e) {} });
}

function leerlaufNeuStarten() {
  clearTimeout(leerlaufTimer);
  leerlaufTimer = setTimeout(() => {
    if (!engine) return;
    entladen();
    melde({ phase: "aus", text: "Lokale KI ruht (bleibt gespeichert)." });
  }, LEERLAUF_MS);
}

async function ladeStufe(w, stufe, f16) {
  const id = modellId(stufe, f16);
  melde({ phase: "laedt", fortschritt: 0, modell: id, stufe,
    text: MODELLE[stufe].name + " wird vorbereitet …" });
  const worker = new Worker(WORKER_URL, { type: "module" });
  try {
    const e = await w.CreateWebWorkerMLCEngine(worker, id, {
      initProgressCallback: (p) => melde({ phase: "laedt",
        fortschritt: Number(p && p.progress) || 0,
        text: String((p && p.text) || "") }),
    });
    return { e, worker };
  } catch (err) {
    try { worker.terminate(); } catch (x) {}
    throw err;
  }
}

/** Modell herunterladen (falls noetig) und in den Grafikspeicher laden. */
function laden() {
  if (engine) return Promise.resolve(engine);
  if (ladeVersprechen) return ladeVersprechen;
  ladeVersprechen = (async () => {
    const f = await faehigkeit();
    if (!f.ok) {
      melde({ phase: "nicht-unterstuetzt", text: f.grund });
      throw new Error(f.grund);
    }
    // Grosser Download: Browser bitten, den Speicher nicht zu raeumen.
    try { if (navigator.storage && navigator.storage.persist)
      await navigator.storage.persist(); } catch (e) {}
    const w = await lib();
    const reihe = await kandidaten();
    let letzterFehler = null;
    for (let i = 0; i < reihe.length; i++) {
      const stufe = reihe[i];
      try {
        const r = await ladeStufe(w, stufe, f.f16);
        engine = r.e;
        engineWorker = r.worker;
        melde({ phase: "bereit", fortschritt: 1, stufe,
          modell: modellId(stufe, f.f16),
          text: MODELLE[stufe].name + " läuft lokal auf diesem Gerät." });
        leerlaufNeuStarten();
        return engine;
      } catch (e) {
        letzterFehler = e;
        // Nur bei SPEICHERMANGEL auf 1B ausweichen. Andere Fehler (z. B.
        // Download abgebrochen) wuerden beim kleinen Modell genauso
        // auftreten – dann ehrlich melden statt still herabzustufen.
        if (stufe === "gross" && istSpeicherFehler(e)) {
          kleinMerken();
          melde({ text: "Zu wenig Speicher für das 3B-Modell – " +
            "weiche auf das kleinere 1B-Modell aus …" });
          continue;
        }
        break;
      }
    }
    engine = null;
    ladeVersprechen = null;
    melde({ phase: "fehler", text: "Die lokale KI konnte nicht geladen " +
      "werden: " + String((letzterFehler && letzterFehler.message) ||
        letzterFehler).slice(0, 160) });
    throw letzterFehler || new Error("Laden fehlgeschlagen");
  })();
  return ladeVersprechen;
}

/** Alle lokalen Modelle vollstaendig vom Geraet entfernen. */
async function loeschen() {
  const f = await faehigkeit();
  entladen();
  if (f.ok) {
    try {
      const w = await lib();
      for (const stufe of ["gross", "klein"])
        for (const v of [true, false])
          await w.deleteModelAllInfoInCache(modellId(stufe, v)).catch(() => {});
    } catch (e) {}
  }
  try { localStorage.removeItem(LS_KLEIN); } catch (e) {}
  melde({ phase: "aus", fortschritt: 0, modell: "", stufe: "",
    text: "Modell vom Gerät entfernt." });
}

async function einmalGenerieren(prompt, o) {
  const e = await laden();
  leerlaufNeuStarten();
  const anfrage = {
    messages: [{ role: "user", content: prompt }],
    temperature: o.temperature == null ? 0.7 : o.temperature,
    max_tokens: o.maxTokens || 1200,
    stream: true,
  };
  let zeitUeberschritten = false;
  const notbremse = setTimeout(() => {
    zeitUeberschritten = true;
    try { e.interruptGenerate(); } catch (x) {}
  }, o.zeitlimitMs || ZEITLIMIT_MS);
  try {
    let stream;
    try {
      stream = await e.chat.completions.create(Object.assign({},
        anfrage, { response_format: { type: "json_object" } }));
    } catch (jsonModusFehler) {
      if (istSpeicherFehler(jsonModusFehler)) throw jsonModusFehler;
      stream = await e.chat.completions.create(anfrage);
    }
    let text = "";
    for await (const stueck of stream) {
      const d = stueck && stueck.choices && stueck.choices[0] &&
        stueck.choices[0].delta && stueck.choices[0].delta.content;
      if (d) {
        text += d;
        if (typeof o.onFortschritt === "function") {
          try { o.onFortschritt(text.length); } catch (x) {}
        }
      }
    }
    return { text, zeitUeberschritten };
  } finally {
    clearTimeout(notbremse);
    leerlaufNeuStarten();
  }
}

/**
 * Ein Generierungsauftrag. Auftraege laufen streng nacheinander (die
 * Engine schreibt nur eine Antwort gleichzeitig). Laeuft das 3B-Modell
 * WAEHREND der Antwort in einen Speicherengpass, wird einmalig auf 1B
 * gewechselt und der Auftrag wiederholt.
 */
function generiere(prompt, opt) {
  const o = opt || {};
  const auftrag = warteschlange.then(async () => {
    try {
      return await einmalGenerieren(prompt, o);
    } catch (e) {
      if (zustand.stufe === "gross" && istSpeicherFehler(e)) {
        kleinMerken();
        entladen();
        await warteschlange;
        melde({ text: "Zu wenig Speicher – wechsle auf das 1B-Modell …" });
        return await einmalGenerieren(prompt, o);
      }
      throw e;
    }
  });
  // Ein Fehler darf die Warteschlange nicht dauerhaft blockieren.
  warteschlange = auftrag.catch(() => {});
  return auftrag;
}

// ---------------------------------------------------------------------
// REZEPTE – gleiche Eingaben und gleiches Antwortschema wie /api/rezept
// ---------------------------------------------------------------------
function kurzParameter(body) {
  let minMin = parseInt(body.minuten_min, 10);
  let minMax = parseInt(body.minuten_max, 10);
  if (!Number.isFinite(minMin) || minMin < 0) minMin = 0;
  if (!Number.isFinite(minMax) || minMax <= 0) minMax = 999;
  if (minMin > minMax) { const t = minMin; minMin = minMax; minMax = t; }
  return {
    wunsch: String(body.wunsch || "").trim().slice(0, 200),
    unvertraeglichkeiten: saubereListe(body.unvertraeglichkeiten, ALLERGEN_CODES),
    ernaehrungsformen: saubereListe(body.ernaehrungsformen, DIET_CODES),
    stile: Array.isArray(body.stile) ? body.stile.map(normalize).slice(0, 9) : [],
    minuten_min: minMin,
    minuten_max: minMax,
    vermeide: Array.isArray(body.vermeide)
      ? body.vermeide.map((x) => String(x).slice(0, 80)).slice(0, 15) : [],
    ausschluss: Array.isArray(body.ausschluss)
      ? body.ausschluss.map((x) => normalize(x).trim().slice(0, 40))
        .filter((x) => x.length > 1).slice(0, 15) : [],
    kurz: true,
  };
}

/**
 * DETERMINISTISCHER SICHERHEITSFILTER – exakt die Reihenfolge und die
 * Regeln des Servers (rezept.mjs, Abschnitt "das Herzstueck"):
 *   1. Allergen-Treffer in der Zutatenliste  -> verwerfen
 *   2. Ernaehrungsform-Verstoss              -> verwerfen
 *   3. Freitext-Ausschluss (Zutaten, Schritte, Name) -> verwerfen
 *   4. deklarierte Allergene bereinigen, geforderte Diets ergaenzen
 * Pur & ohne KI – damit separat pruefbar.
 */
function filtereRezepte(rohListe, params, ohneSchritte) {
  const sicher = [];
  const meta = { angefragt: rohListe.length, verworfenAllergen: 0,
    verworfenDiet: 0, verworfenAusschluss: 0 };
  for (const roh of rohListe) {
    const rec = normalizeRecipe(roh, ohneSchritte);
    if (!rec) continue;
    if (verletztAllergen(rec, params.unvertraeglichkeiten)) {
      meta.verworfenAllergen++; continue;
    }
    if (verletztDiet(rec, params.ernaehrungsformen)) {
      meta.verworfenDiet++; continue;
    }
    if (verletztAusschluss(rec, params.ausschluss)) {
      meta.verworfenAusschluss++; continue;
    }
    rec.allergens = rec.allergens.filter(
      (a) => !params.unvertraeglichkeiten.includes(a));
    for (const d of params.ernaehrungsformen)
      if (!rec.diet.includes(d)) rec.diet.push(d);
    sicher.push(rec);
  }
  meta.geliefert = sicher.length;
  return { sicher, meta };
}

async function rezeptKurz(body, opt) {
  const params = kurzParameter(body || {});
  const fort = opt && opt.onFortschritt;
  let antwort = await generiere(buildPrompt(params),
    { temperature: 0.8, maxTokens: 1700, onFortschritt: fort });
  let parsed = extractJson(antwort.text);
  if (!parsed && !antwort.zeitUeberschritten) {
    // Lokal gibt es kein Plattform-Zeitlimit: EIN Nachfassen ist erlaubt.
    antwort = await generiere(buildPrompt(params) + "\n\nERINNERUNG: " +
      "Antworte AUSSCHLIESSLICH mit dem geforderten JSON-Objekt. Kein " +
      "Markdown, keine Backticks, kein Text davor oder danach.",
      { temperature: 0.6, maxTokens: 1700, onFortschritt: fort });
    parsed = extractJson(antwort.text);
  }
  const rohListe = parsed && Array.isArray(parsed.recipes)
    ? parsed.recipes : (parsed && parsed.name ? [parsed] : []);
  if (!rohListe.length)
    return { success: false, error: antwort.zeitUeberschritten
      ? "Die lokale KI hat zu lange gebraucht. Bitte nochmal versuchen."
      : "Die Antwort der lokalen KI konnte nicht ausgewertet werden. " +
        "Bitte nochmal versuchen." };

  const { sicher, meta } = filtereRezepte(rohListe, params, true);
  if (!sicher.length)
    return { success: false, error: "Es konnten keine Rezepte gefunden " +
      "werden, die alle Unverträglichkeiten, die Ernährungsform und eure " +
      "ausgeschlossenen Zutaten sicher erfüllen. Bitte formuliere deinen " +
      "Wunsch etwas anders." };
  return { success: true, recipes: sicher.slice(0, 3), meta, lokal: true };
}

async function rezeptSchritte(body, opt) {
  const b = body || {};
  const gericht = String(b.gericht || "").trim().slice(0, 120);
  const zutaten = (Array.isArray(b.zutaten) ? b.zutaten : [])
    .map((z) => ({
      name: String((z && z.name) || "").trim().slice(0, 80),
      qty: Number(z && z.qty) || 0,
      unit: String((z && z.unit) || "").trim().slice(0, 12),
    }))
    .filter((z) => z.name && z.qty > 0)
    .slice(0, 25);
  if (!gericht || !zutaten.length)
    return { success: false, error: "Unvollständige Anfrage." };
  const minuten = Math.min(240, Math.max(5, Number.parseInt(b.minuten, 10) || 30));
  const ausschluss = Array.isArray(b.ausschluss)
    ? b.ausschluss.map((x) => normalize(x).trim().slice(0, 40))
      .filter((x) => x.length > 1).slice(0, 15) : [];

  const antwort = await generiere(buildStepPrompt({ gericht, zutaten, minuten }),
    { temperature: 0.6, maxTokens: 1500, onFortschritt: opt && opt.onFortschritt });
  const json = extractJson(antwort.text);
  const rohSteps = json && Array.isArray(json.steps) ? json.steps : [];
  const steps = rohSteps.map((st) => {
    if (!st || !st.text) return null;
    const schritt = { text: String(st.text).trim().slice(0, 600) };
    const timer = parseInt(st.timer, 10);
    if (Number.isFinite(timer) && timer > 0) schritt.timer = Math.min(timer, 7200);
    if (st.announce) schritt.announce = String(st.announce).trim().slice(0, 400);
    return schritt;
  }).filter(Boolean).slice(0, 20);
  if (!steps.length)
    return { success: false, error: "Die Kochschritte konnten nicht " +
      "erstellt werden. Bitte nochmal versuchen." };
  // Sicherheitsnetz wie auf dem Server: Auch die Schritte duerfen keinen
  // ausgeschlossenen Begriff enthalten.
  const treffer = verletztAusschluss({ name: gericht, ingredients: [], steps },
    ausschluss);
  if (treffer)
    return { success: false, error: "Die Anleitung enthielt eine " +
      "ausgeschlossene Zutat (" + treffer + "). Bitte ein anderes Rezept wählen." };
  return { success: true, steps, lokal: true };
}

/**
 * Einstieg fuer die App. Antwortet im Schema der bisherigen Server-API.
 * Zusaetzliche Codes: "kein-webgpu" (Geraet kann es nicht) und
 * "kein-modell" (Download noch nicht erfolgt und nicht erlaubt).
 */
async function rezept(body, opt) {
  const f = await faehigkeit();
  if (!f.ok) return { success: false, code: "kein-webgpu", error: f.grund };
  if (!engine && !(await imCache()) && !(opt && opt.downloadErlaubt)) {
    const st = (await kandidaten())[0] || "klein";
    return { success: false, code: "kein-modell",
      error: "Für die Offline-Recherche muss das KI-Modell einmalig auf " +
        "dieses Gerät geladen werden (" + MODELLE[st].groesse + ")." };
  }
  try {
    if (body && body.modus === "schritte") return await rezeptSchritte(body, opt);
    return await rezeptKurz(body, opt);
  } catch (e) {
    return { success: false, code: "fehler", error: "Die lokale KI ist " +
      "gerade ausgefallen: " + String((e && e.message) || e).slice(0, 140) };
  }
}

// ---------------------------------------------------------------------
// Oeffentliche Schnittstelle
// ---------------------------------------------------------------------
window.KiLokal = Object.freeze({
  MODELLE,
  faehigkeit,
  imCache,
  laden,
  loeschen,
  rezept,
  status: () => Object.assign({}, zustand),
  beobachten: (fn) => { beobachter.add(fn); return () => beobachter.delete(fn); },
  // Pure Bausteine (fuer Tests und Gegenproben, ohne KI):
  _intern: Object.freeze({ filtereRezepte, kurzParameter, waehleStufe,
    istSpeicherFehler, verletztAllergen, verletztDiet, verletztAusschluss,
    ALLERGEN_CODES, ALLERGEN_KEYWORDS }),
});
})();
