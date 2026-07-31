// netlify/functions/rezept.mjs
// Serverseitige KI-Rezeptrecherche fuer den Familien-Assistenten (ESM-Variante).
// Liefert exakt das vom Frontend erwartete Schema:
//   { success, recipes:[{ name,timeMin,allergens,diet,varianten,stile,
//                          tags,ingredients:[{name,qty,unit}],
//                          steps:[{text,timer?,announce?}] }] }
//
// SICHERHEITSPRINZIP (Defense in Depth):
// Die KI bekommt Allergien & Ernaehrungsform als harte Regel in den Prompt.
// ZUSAETZLICH prueft der Server jedes Rezept deterministisch gegen
// Zutaten-Stichwortlisten und verwirft Verstoesse. Bei Allergien darf
// niemals allein die KI das letzte Wort haben.

// v10.3: Haiku als Standard. Grund (bewiesen per HTTP 504):
// Netlify bricht synchrone Funktionen nach ~26-30 s ab; Sonnet
// braucht fuer 3 ausfuehrliche Rezepte laenger und lief ins
// Gateway-Timeout. Haiku schafft das Fenster zuverlaessig.
// Wer Sonnet-Qualitaet will: LLM_MODEL setzen UND auf eine
// Hintergrund-Architektur wechseln (Ausbaustufe, auf Wunsch).
// KOSTEN-DECKEL (Phase 0): Tageskontingent pro Geraet. Schuetzt
// vor unbegrenzten API-Kosten. Ohne Upstash-Zugangsdaten oder bei
// Redis-Stoerung laeuft die Recherche ungebremst weiter
// (Verfuegbarkeit schlaegt Sperre).
const TAGESLIMIT = Number(process.env.RECHERCHE_TAGESLIMIT || 5);

async function pruefeTageskontingent(device) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !device) return { erlaubt: true };
  try {
    const heute = new Date().toISOString().slice(0, 10);
    const key = `rl:rezept:${device}:${heute}`;
    const resp = await fetch(url + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + token,
        "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, "93600", "NX"]]),
    });
    if (!resp.ok) return { erlaubt: true };
    const data = await resp.json();
    const anzahl = Number(data && data[0] && data[0].result);
    if (Number.isFinite(anzahl) && anzahl > TAGESLIMIT) {
      return { erlaubt: false, anzahl };
    }
    return { erlaubt: true, anzahl };
  } catch (e) {
    console.error("Kontingent-Pruefung fehlgeschlagen", e);
    return { erlaubt: true };
  }
}

const MODEL = process.env.LLM_MODEL || "claude-haiku-4-5-20251001";
import crypto from "node:crypto";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/** Muss identisch zu termine.mjs bleiben (Plus-Kanal-Hash). */
function kanalVonCode(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!/^FAM-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(c)) return null;
  return crypto.createHash("sha256").update("ka1|" + c)
    .digest("hex").slice(0, 32);
}

async function redisEinzel(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + token,
        "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });
    if (!r.ok) return null;
    return (await r.json()).result;
  } catch (e) { return null; }
}

/** Genereller Modellaufruf mit Zeitbudget (fuer den Wochenplan). */
async function rufeModell(apiKey, prompt, headers) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 20000);
  try {
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 6000,
        temperature: 0.8,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      console.error("Wochenplan-LLM-Fehler", resp.status);
      return { httpFehler: { statusCode: 502, headers,
        body: JSON.stringify({ success: false,
          error: "Die Wochenplanung ist gerade nicht erreichbar. " +
            "Bitte gleich nochmal versuchen." }) } };
    }
    const data = await resp.json();
    return { text: (data.content || [])
      .filter((c) => c.type === "text").map((c) => c.text).join("\n") };
  } catch (e) {
    clearTimeout(timeout);
    return { httpFehler: { statusCode: 504, headers,
      body: JSON.stringify({ success: false,
        error: "Die Wochenplanung hat zu lange gebraucht. " +
          "Bitte nochmal versuchen." }) } };
  }
}

function wochenplanPrompt(p) {
  const allergTxt = p.unvertraeglichkeiten.length
    ? p.unvertraeglichkeiten.join(", ") : "keine";
  const dietTxt = p.ernaehrungsformen.length
    ? p.ernaehrungsformen.join(", ") : "keine Einschränkung";
  const stilTxt = p.stile.length ? p.stile.join(", ") : "keine besondere";
  return `Du bist ein erfahrener Familienkoch. Plane GENAU 7 \
unterschiedliche, alltagstaugliche ABENDESSEN fuer eine Familienwoche \
(Montag bis Sonntag), abwechslungsreich ueber die Woche.

HARTE REGELN (NICHT VERHANDELBAR – Verstoss = Gericht unbrauchbar):
- AUSGESCHLOSSENE ALLERGENE: ${allergTxt}. Verwende KEINE Zutat, die \
dieses Allergen enthaelt – auch keine versteckten Quellen (z.B. \
Sellerie in Bruehe, Gluten in Sojasauce, Laktose in Butter/Sahne/Kaese).
- ERNAEHRUNGSFORM (fuer ALLE 7 Gerichte zwingend): ${dietTxt}. \
vegetarisch = kein Fleisch und kein Fisch/Meerestier. \
pescetarisch = kein Fleisch (Fisch erlaubt). \
vegan = keine Tierprodukte. \
lowcarb = keine Nudeln/Reis/Kartoffeln/Brot als Hauptbeilage.

WEICHE PRAEFERENZ: Stil ${stilTxt}.
ZEITRAHMEN je Gericht: ${p.minuten_min} bis ${p.minuten_max} Minuten.

AUSGABEFORMAT: Antworte AUSSCHLIESSLICH mit gueltigem JSON, ohne \
Markdown, ohne Kommentar:
{
  "plan": [
    {
      "name": "Name des Gerichts",
      "timeMin": 30,
      "ingredients": [
        { "name": "Zutat", "qty": 200, "unit": "g" }
      ]
    }
  ]
}
Mengen fuer 2 Erwachsene + 2 Kinder. Einheiten nur: g, kg, ml, l, \
EL, TL, Stueck, Prise, Dose, Bund.`;
}

function normalizePlanItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim().slice(0, 80);
  if (!name) return null;
  let timeMin = Number.parseInt(raw.timeMin, 10);
  if (!Number.isFinite(timeMin) || timeMin < 5 || timeMin > 180) timeMin = 30;
  const zutaten = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .map((z) => {
      const zName = String((z && z.name) || "").trim().slice(0, 60);
      const qty = Number(z && z.qty);
      const unit = String((z && z.unit) || "").trim().slice(0, 12);
      if (!zName || !Number.isFinite(qty) || qty <= 0 || qty > 5000)
        return null;
      return { name: zName, qty, unit };
    }).filter(Boolean).slice(0, 15);
  if (!zutaten.length) return null;
  return { name, timeMin, ingredients: zutaten };
}

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
      "steps": [
        {"text":"Anweisung in ganzen Saetzen, freundlich, fuer Sprachausgabe geeignet"},
        {"text":"Schritt mit Wartezeit","timer":600,"announce":"Was nach der Zeit fertig/gar sein soll – mit Garprobe"}
      ]
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
function normalizeRecipe(raw) {
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
  if (!steps.length) return null;

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

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS")
    return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers,
      body: JSON.stringify({ success: false, error: "Methode nicht erlaubt." }) };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return { statusCode: 500, headers, body: JSON.stringify({ success: false,
      error: "Server nicht konfiguriert (API-Schlüssel fehlt)." }) };

  // ---- Eingabe parsen & saeubern ----
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false,
      error: "Ungültige Anfrage." }) };
  }

  // Plus-Status (Familien-Code) VOR allen Kontingenten aufloesen
  const device = String((body && body.device) || "").slice(0, 64);
  const kanal = kanalVonCode(body && body.code);
  const plusOk = kanal
    ? Boolean(await redisEinzel(["GET", "plus:" + kanal])) : false;

  // ===== WOCHENPLAN-AUTOMATIK (Plus-Kernfeature) =====
  if (body && body.modus === "wochenplan") {
    if (!plusOk) {
      // Kostprobe fuer Free: 1 Plan pro Monat und Geraet
      const monat = new Date().toISOString().slice(0, 7);
      const frei = await redisEinzel(["SET",
        "wpfrei:" + device + ":" + monat, "1", "NX", "EX", "2764800"]);
      if (frei !== "OK") {
        return { statusCode: 402, headers, body: JSON.stringify({
          success: false, limit: "monat",
          error: "Euer kostenloser Wochenplan diesen Monat ist " +
            "aufgebraucht. Mit Familien-Plus (29 €/Jahr, " +
            "Founder-Angebot) plant ihr unbegrenzt – kurze E-Mail an " +
            "info@gustav-4.de genügt." }) };
      }
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({
      success: false, error: "Server nicht konfiguriert." }) };
    const p = {
      unvertraeglichkeiten: saubereListe(body.unvertraeglichkeiten,
        ALLERGEN_CODES),
      ernaehrungsformen: saubereListe(body.ernaehrungsformen, DIET_CODES),
      stile: (Array.isArray(body.stile) ? body.stile : [])
        .map((s) => String(s).slice(0, 20)).slice(0, 6),
      minuten_min: Math.min(120, Math.max(5,
        Number.parseInt(body.minuten_min, 10) || 15)),
      minuten_max: Math.min(180, Math.max(10,
        Number.parseInt(body.minuten_max, 10) || 60)),
    };
    const antwortKI = await rufeModell(apiKey, wochenplanPrompt(p), headers);
    if (antwortKI.httpFehler) return antwortKI.httpFehler;
    const json = extractJson(antwortKI.text);
    const roh = json && Array.isArray(json.plan) ? json.plan : [];
    // Schema haerten + deterministischer Sicherheitsfilter (wie Rezepte)
    const plan = roh.map(normalizePlanItem).filter(Boolean)
      .filter((g) => !verletztAllergen(g, p.unvertraeglichkeiten))
      .filter((g) => !verletztDiet(g, p.ernaehrungsformen))
      .slice(0, 7);
    if (plan.length < 5) {
      return { statusCode: 502, headers, body: JSON.stringify({
        success: false, error: "Die Wochenplanung hat kein sicheres " +
          "Ergebnis geliefert. Bitte gleich nochmal versuchen." }) };
    }
    return { statusCode: 200, headers,
      body: JSON.stringify({ success: true, plan }) };
  }

  // Tageskontingent VOR dem teuren KI-Aufruf pruefen (Plus: aufgehoben)
  const kontingent = plusOk ? { erlaubt: true }
    : await pruefeTageskontingent(device);
  if (!kontingent.erlaubt) {
    return { statusCode: 429, headers, body: JSON.stringify({
      success: false, limit: true,
      error: "Euer Tageskontingent von " + TAGESLIMIT + " KI-Recherchen " +
        "ist erreicht – morgen gibt es frische Ideen! (Der Deckel " +
        "schützt die App vor Missbrauch.)" }) };
  }


  let minMin = parseInt(body.minuten_min, 10);
  let minMax = parseInt(body.minuten_max, 10);
  if (!Number.isFinite(minMin) || minMin < 0) minMin = 0;
  if (!Number.isFinite(minMax) || minMax <= 0) minMax = 999;
  if (minMin > minMax) { const t = minMin; minMin = minMax; minMax = t; }

  const params = {
    wunsch: String(body.wunsch || "").trim().slice(0, 200),
    unvertraeglichkeiten: saubereListe(body.unvertraeglichkeiten, ALLERGEN_CODES),
    ernaehrungsformen: saubereListe(body.ernaehrungsformen, DIET_CODES),
    stile: Array.isArray(body.stile)
      ? body.stile.map(normalize).slice(0, 9) : [],
    minuten_min: minMin,
    minuten_max: minMax,
    vermeide: Array.isArray(body.vermeide)
      ? body.vermeide.map((x) => String(x).slice(0, 80)).slice(0, 15) : [],
    ausschluss: Array.isArray(body.ausschluss)
      ? body.ausschluss.map((x) => normalize(x).trim().slice(0, 40))
        .filter((x) => x.length > 1).slice(0, 15) : [],
  };

  // ---- KI-Aufruf mit Timeout (FUSION v10: als Funktion, fuer Retry) ----
  async function frageKI(zusatz) {
    const ctrl = new AbortController();
    // BUGFIX: 45 s war laenger als das Netlify-Limit (~26 s) - die
    // eigene Notbremse konnte nie greifen, der Nutzer bekam statt der
    // freundlichen Meldung den nackten Gateway-Fehler 504.
    const timeout = setTimeout(() => ctrl.abort(), 20000);
    try {
      const resp = await fetch(ANTHROPIC_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8000,
          temperature: 0.8,
          messages: [{ role: "user",
            content: buildPrompt(params) + (zusatz || "") }],
        }),
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        console.error("LLM-Fehler", resp.status, detail.slice(0, 300));
        return { httpFehler: { statusCode: 502, headers,
          body: JSON.stringify({ success: false,
            error: "Die Rezept-Recherche ist gerade nicht erreichbar. " +
              "Bitte gleich nochmal versuchen." }) } };
      }
      const data = await resp.json();
      return { text: (data.content || [])
        .filter((c) => c.type === "text").map((c) => c.text).join("\n") };
    } catch (e) {
      clearTimeout(timeout);
      const abbruch = e && e.name === "AbortError";
      console.error("Recherche-Ausnahme", e);
      return { httpFehler: { statusCode: 504, headers,
        body: JSON.stringify({ success: false,
          error: abbruch
            ? "Die Recherche hat zu lange gedauert. Bitte nochmal versuchen."
            : "Unerwarteter Fehler bei der Recherche." }) } };
    }
  }

  const startZeit = Date.now();
  let versuch = await frageKI("");
  if (versuch.httpFehler) return versuch.httpFehler;
  let parsed = extractJson(versuch.text);
  // Einmal automatisch nachfassen, wenn die Antwort kein verwertbares
  // JSON war - aber NUR, wenn noch Zeitbudget vor dem Netlify-Limit
  // (~26 s) bleibt; sonst wuerde der Retry selbst den 504 ausloesen.
  if (!parsed && Date.now() - startZeit < 8000) {
    versuch = await frageKI("\n\nERINNERUNG: Antworte AUSSCHLIESSLICH " +
      "mit dem geforderten JSON-Objekt. Kein Markdown, keine Backticks, " +
      "kein Text davor oder danach.");
    if (versuch.httpFehler) return versuch.httpFehler;
    parsed = extractJson(versuch.text);
  }

  // ---- Parsen & normalisieren ----
  const rohListe = parsed && Array.isArray(parsed.recipes)
    ? parsed.recipes
    : (parsed && parsed.name ? [parsed] : []);
  if (!rohListe.length)
    return { statusCode: 502, headers, body: JSON.stringify({ success: false,
      error: "Die Antwort konnte nicht ausgewertet werden. Bitte nochmal " +
        "versuchen." }) };

  // ---- DETERMINISTISCHER SICHERHEITSFILTER (das Herzstueck) ----
  const sicher = [];
  let verworfenAllergen = 0;
  let verworfenDiet = 0;
  let verworfenAusschluss = 0;

  for (const roh of rohListe) {
    const rec = normalizeRecipe(roh);
    if (!rec) continue;

    // 1. Allergie ist NICHT verhandelbar – KI-Ausgabe gegenpruefen.
    const allergenTreffer = verletztAllergen(rec, params.unvertraeglichkeiten);
    if (allergenTreffer) {
      console.warn("Verworfen (Allergen " + allergenTreffer + "): " + rec.name);
      verworfenAllergen++;
      continue;
    }
    // 2. Ernaehrungsform ebenfalls gegenpruefen.
    const dietTreffer = verletztDiet(rec, params.ernaehrungsformen);
    if (dietTreffer) {
      console.warn("Verworfen (Diet " + dietTreffer + "): " + rec.name);
      verworfenDiet++;
      continue;
    }
    // 2b. Freitext-Ausschluss der Familie - ebenfalls nicht der KI
    //     ueberlassen, sondern hier gegengeprueft.
    const ausTreffer = verletztAusschluss(rec, params.ausschluss);
    if (ausTreffer) {
      console.warn("Verworfen (Ausschluss " + ausTreffer + "): " + rec.name);
      verworfenAusschluss++;
      continue;
    }

    // 3. Konsistenz: deklarierte allergens duerfen die ausgeschlossenen
    //    nicht enthalten (defensiv bereinigen statt nur vertrauen).
    rec.allergens = rec.allergens.filter(
      (a) => !params.unvertraeglichkeiten.includes(a));
    // 4. diet-Feld absichern: geforderte Formen ergaenzen, falls die KI
    //    sie vergessen hat (Rezept hat den Filter ja bestanden).
    for (const d of params.ernaehrungsformen)
      if (!rec.diet.includes(d)) rec.diet.push(d);

    sicher.push(rec);
  }

  if (!sicher.length)
    return { statusCode: 200, headers, body: JSON.stringify({ success: false,
      error: "Es konnten keine Rezepte gefunden werden, die alle " +
        "Unverträglichkeiten, die Ernährungsform und eure " +
        "ausgeschlossenen Zutaten sicher erfüllen. " +
        "Bitte formuliere deinen Wunsch etwas anders." }) };

  return { statusCode: 200, headers, body: JSON.stringify({
    success: true,
    recipes: sicher.slice(0, 3),
    meta: { angefragt: rohListe.length, geliefert: sicher.length,
      verworfenAllergen, verworfenDiet, verworfenAusschluss },
  }) };
};