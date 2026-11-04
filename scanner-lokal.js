/*
 * Familien-Assistent – LOKALE SCANNER (Kassenbon & Schulzettel)
 * ============================================================
 * Texterkennung (OCR) vollstaendig AUF DEM GERAET mit Tesseract.js 7
 * (Apache-2.0). Bibliothek, Rechenkern (WebAssembly) und deutsche
 * Sprachdaten liegen unveraendert unter /vendor/tesseract-7.0.0 und
 * werden von der eigenen Domain geladen – kein CDN, kein Server.
 * Fotos verlassen das Geraet nie; sie werden nicht gespeichert.
 *
 *   ScannerLokal.erkenne(datei, { art: "bon"|"zettel", onFortschritt })
 *       -> Promise<string>  (erkannter Text)
 *   ScannerLokal.bonArtikel(text)
 *       -> [{ id, menge, zeilen: [...] }]  (Zuordnung zu VERBRAUCH-IDs)
 *
 * bonArtikel ist pur & testbar (Browser: window.ScannerLokal,
 * Node: module.exports).
 */
(function (wurzel) {
"use strict";

const BASIS = "/vendor/tesseract-7.0.0";
const MAX_KANTE = 2200;          // px – genug fuer Bon-Schrift, schont RAM
const LEERLAUF_MS = 2 * 60 * 1000;

// ---------------------------------------------------------------------
// Kassenbon -> Verbrauchsartikel
// ---------------------------------------------------------------------
// Reihenfolge = Vorrang: spezifische Muster zuerst ("Butterkaese" ist
// Kaese, nicht Butter; "Toastbrot" ist Toast, nicht Brot; Spuelmaschinen-
// Tabs sind kein Spuelmittel). Pro Bonzeile zaehlt nur der erste Treffer.
// Bons kuerzen stark ("TOIL.PAP.", "H-MILCH 1,5%") und OCR verliert
// Umlaute – deshalb wird vorher normalisiert (ae/oe/ue/ss, ohne Punkte).
const W = "(?:^|[^a-z])";        // Wortanfang
const E = "(?:$|[^a-z])";        // Wortende
const BON_REGELN = [
  ["spuelmaschinentabs", [/spuelmasch|geschirrreinig|geschirrspuel|\bsomat\b|\bfinish\b|spuelmaschinentab|\btabs?\b/]],
  ["spuelmittel", [/spuelmittel|handspuel|\bpril\b|\bfairy\b|spueli/]],
  ["klopapier", [/toilettenp|toil ?pap|klopapier|wc ?papier|\bhakle\b|toilettenpapier/]],
  ["kuechenrolle", [/kuechenroll|kuechentuch|kuechentuech|haushaltsroll|zewa wisch/]],
  ["feuchttuecher", [/feuchtt(uch|uech)|feucht ?tuecher|baby ?tuecher|pflegetuech/]],
  ["taschentuecher", [/taschent(uch|uech)|\btempo\b|papiertasch/]],
  ["windeln", [/windel|pampers|\bbabylove\b/]],
  ["damenhygiene", [/\bbinden?\b|tampon|slipeinlag|\balways\b|\bo ?b\b/]],
  ["duschgel", [/duschgel|duschcreme|duschbad|\bdusche\b/]],
  ["shampoo", [/shampoo|shampo|haarwasch/]],
  ["seife", [/fluessigseif|handseif|cremeseif|\bseife\b/]],
  ["zahnpasta", [/zahnpasta|zahncreme|zahnc\b|\bblend ?a ?med\b|\belmex\b|\bodol\b/]],
  ["zahnbuersten", [/zahnbuerst|zahnb\b/]],
  ["deo", [/\bdeo\b|deodorant|deospray|deoroller|antitranspir/]],
  ["waschmittel", [/waschmittel|vollwaschm|colorwaschm|\bwaschm\b|waschpulver|waschgel|\bpersil\b|\bariel\b|\bweisser riese\b/]],
  ["allzweck", [/allzweck|universalreinig|\bmeister proper\b|badreinig|glasreinig/]],
  ["muellbeutel", [/muellbeut|muellsa?e?ck|abfallbeut|abfallsa?e?ck/]],
  ["kaese", [new RegExp(W + "(?:butter|schnitt|reibe|hart|weich|frisch|berg)?k(?:ae|a)se" + E),
             /gouda|emmentaler|edamer|tilsiter|leerdammer|bergkaese|mozzarella|parmesan|cheddar|\bfeta\b/]],
  ["butter", [new RegExp(W + "(?:suessrahm|sauerrahm|marken|irische|bio|land|alm)?butter" + E),
              /kerrygold|\blurpak\b/]],
  ["milch", [new RegExp(W + "(?:h ?|voll|frisch|fettarme ?|landmilch|bio ?|weide|alpen)?milch" + E),
             /vollmilch|frischmilch|\bh-?milch\b|haltbare milch|weidemilch|landmilch/]],
  ["joghurt", [/jogh?urt|yoghurt|\bjog\b|skyr/]],
  ["eier", [new RegExp(W + "(?:bio|freiland|boden|land|frische)?(?:eier)" + E), /\beier\b|\d+er eier|eier \d+/]],
  ["toast", [/toast/]],
  ["brot", [new RegExp(W + "[a-z]*brot" + E), /\blaib\b|\bkrustenbr|\bvollkornbr|\bbauernbr|\bmischbr/]],
  ["muesli", [/muesli|musli|flocken|cornflakes|granola|\bporridge\b/]],
  ["nudeln", [/nudel|spaghetti|penne|fusilli|farfalle|makkaroni|maccheroni|tagliatelle|rigatoni|spirelli|lasagne|\bpasta\b/]],
  ["reis", [new RegExp(W + "(?:basmati|jasmin|langkorn|milch|parboiled|vollkorn|natur|risotto)?reis" + E)]],
  ["mehl", [new RegExp(W + "(?:weizen|dinkel|roggen|vollkorn|type ?\\d+ ?)?mehl" + E)]],
  ["zucker", [new RegExp(W + "(?:puder|roh|rohr|brauner |kristall|vanille|fein|haushalts)?zucker" + E)]],
  ["kaffee", [new RegExp(W + "(?:bohnen|filter|roest|crema|bio)?kaffee(?!filter|sahne|weisser)" + E),
              /espresso|caffe crema|kaffeebohnen|kaffeepads|kapseln/]],
  ["oel", [/(?:sonnenblumen|raps|oliven|speise|brat|distel|keim)oel|\boel\b|\boil\b/]],
];
// Zeilen, die nie Artikel sind (Summen, Zahlungsarten, Kopf- und Fusszeilen).
const BON_IGNORIEREN = /\b(summe|zwischensumme|total|gesamt|mwst|ust|netto|brutto|steuer|bar|ec[- ]?karte|kreditkarte|girocard|visa|mastercard|rueckgeld|gegeben|pfand|leergut|rabatt|coupon|bonus|payback|kasse|bon[- ]?nr|beleg|filiale|tel|www|danke|oeffnungszeiten|uid|tse|terminal|trace|datum|uhrzeit)\b/;

function bonNormalisieren(zeile) {
  return String(zeile || "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[.]/g, " ").replace(/[^a-z0-9%,\- ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

/** Stueckzahl aus "2 x 1,19" / "2 St" / "3*" (gleiche oder Folgezeile). */
function mengeVon(zeile, folge) {
  const m = zeile.match(/(?:^|\s)(\d{1,2})\s?(?:x|\*|st|stk|stueck)(?:\s|$)/) ||
            (folge && /^\s*(\d{1,2})\s?(?:x|\*|st|stk)\s/.test(folge)
              ? folge.match(/^\s*(\d{1,2})/) : null);
  const n = m ? parseInt(m[1], 10) : 1;
  return n >= 1 && n <= 20 ? n : 1;
}

function bonArtikel(text) {
  const zeilen = String(text || "").split(/\r?\n/).map(bonNormalisieren).filter(Boolean);
  const treffer = new Map();
  zeilen.forEach((z, i) => {
    if (z.length < 3 || BON_IGNORIEREN.test(z)) return;
    // Mindestens ein Buchstabenwort mit 3 Zeichen (keine reinen Preiszeilen)
    if (!/[a-z]{3}/.test(z)) return;
    for (const [id, muster] of BON_REGELN) {
      if (muster.some((re) => re.test(z))) {
        const menge = mengeVon(z, zeilen[i + 1]);
        const alt = treffer.get(id) || { id, menge: 0, zeilen: [] };
        alt.menge = Math.min(alt.menge + menge, 20);
        alt.zeilen.push(z);
        treffer.set(id, alt);
        break;
      }
    }
  });
  return [...treffer.values()];
}

// ---------------------------------------------------------------------
// OCR mit Tesseract.js (nur Browser)
// ---------------------------------------------------------------------
let libVersprechen = null;
let workerVersprechen = null;
let leerlaufTimer = null;
let fortschrittZiel = null;
let warteschlange = Promise.resolve();

function ladeSkript(src) {
  return new Promise((ok, fehl) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => ok(); s.onerror = () => fehl(new Error("Skript fehlt: " + src));
    document.head.appendChild(s);
  });
}
function lib() {
  if (!libVersprechen) libVersprechen = (window.Tesseract
    ? Promise.resolve() : ladeSkript(BASIS + "/tesseract.min.js"))
    .then(() => window.Tesseract)
    .catch((e) => { libVersprechen = null; throw e; });
  return libVersprechen;
}
function worker() {
  if (!workerVersprechen) workerVersprechen = lib().then((T) =>
    T.createWorker("deu", 1 /* OEM.LSTM_ONLY */, {
      workerPath: BASIS + "/worker.min.js",
      corePath: BASIS + "/core",
      langPath: BASIS + "/lang",
      gzip: true,
      workerBlobURL: false,
      logger: (m) => {
        if (typeof fortschrittZiel !== "function" || !m) return;
        try { fortschrittZiel(String(m.status || ""), Number(m.progress) || 0); } catch (e) {}
      },
    })).catch((e) => { workerVersprechen = null; throw e; });
  return workerVersprechen;
}
function leerlauf() {
  clearTimeout(leerlaufTimer);
  leerlaufTimer = setTimeout(() => {
    const w = workerVersprechen;
    workerVersprechen = null;
    if (w) w.then((x) => x.terminate()).catch(() => {});
  }, LEERLAUF_MS);
}

/** Foto verkleinern, in Graustufen wandeln und Kontrast anheben. */
async function vorbereiten(datei) {
  let bild;
  try { bild = await createImageBitmap(datei, { imageOrientation: "from-image" }); }
  catch (e) { bild = await createImageBitmap(datei); }
  const f = Math.min(1, MAX_KANTE / Math.max(bild.width, bild.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bild.width * f);
  c.height = Math.round(bild.height * f);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bild, 0, 0, c.width, c.height);
  if (bild.close) bild.close();
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    // leichte Kontrastspreizung um die Mitte – hilft bei Thermopapier
    const k = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
    p[i] = p[i + 1] = p[i + 2] = k;
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

/**
 * Text aus einem Foto erkennen. art "bon": Bonzeilen als ein Block;
 * art "zettel": automatische Seitenaufteilung (Absaetze, Spalten).
 */
function erkenne(datei, opt) {
  const o = opt || {};
  const auftrag = warteschlange.then(async () => {
    if (!datei) throw new Error("Kein Foto");
    fortschrittZiel = o.onFortschritt || null;
    try {
      const [w, bild] = await Promise.all([worker(), vorbereiten(datei)]);
      await w.setParameters({
        tessedit_pageseg_mode: o.art === "bon" ? "6" : "3",
        preserve_interword_spaces: "1",
      });
      const r = await w.recognize(bild);
      return String((r && r.data && r.data.text) || "");
    } finally {
      fortschrittZiel = null;
      leerlauf();
    }
  });
  warteschlange = auftrag.catch(() => {});
  return auftrag;
}

const api = Object.freeze({ erkenne, bonArtikel, bonNormalisieren });
if (typeof module === "object" && module.exports) module.exports = api;
if (wurzel) wurzel.ScannerLokal = api;
})(typeof window !== "undefined" ? window : null);
