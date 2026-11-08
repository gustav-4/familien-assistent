/*
 * Familien-Assistent – REGELBASIERTER TERMIN-PARSER (ohne KI, offline)
 * ===================================================================
 * Zerlegt Freitext (gesprochen oder per Kamera vom Schulzettel gelesen)
 * deterministisch in Terminobjekte – ohne Server, ohne KI, ohne Netz.
 *
 *   TerminRegel.parse(text, heuteIso, mitglieder)
 *       -> ein Rohtermin { titel, person, verantwortlich, datum, zeit,
 *          dauer_min, wegzeit_min, kategorie, _datumExplizit, _zeitExplizit }
 *   TerminRegel.pruefen(roh)
 *       -> { success, termin } bzw. { success:false, error }
 *          (gleiche Pruefschicht wie frueher netlify/functions/termin-parse)
 *   TerminRegel.ausDokument(text, heuteIso, mitglieder)
 *       -> Liste gepruefter Termine aus einem ganzen Zettel (OCR-Text)
 *   TerminRegel.ueberlastung(neu, termine, routinen)
 *       -> Liste von Warnungen (zu viele Termine / zu volle Tage)
 *
 * Pur & testbar: keine DOM-Zugriffe. Laeuft im Browser (window.TerminRegel)
 * und unter Node (module.exports).
 */
(function (wurzel) {
"use strict";

const WOCHENTAGE = ["sonntag", "montag", "dienstag", "mittwoch",
  "donnerstag", "freitag", "samstag"];
const MONATE = { januar: 1, jan: 1, "jänner": 1, jaenner: 1, februar: 2,
  feb: 2, "märz": 3, maerz: 3, "mär": 3, mrz: 3, april: 4, apr: 4, mai: 5,
  juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9,
  sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11,
  dezember: 12, dez: 12 };
const MONATS_RE = Object.keys(MONATE).sort((a, b) => b.length - a.length)
  .join("|");
const ZAHLWORT = { null: 0, ein: 1, eins: 1, eine: 1, einer: 1, zwei: 2,
  drei: 3, vier: 4, "fünf": 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8,
  neun: 9, zehn: 10, elf: 11, "zwölf": 12, zwoelf: 12, dreizehn: 13,
  vierzehn: 14, "fünfzehn": 15, fuenfzehn: 15, sechzehn: 16, siebzehn: 17,
  achtzehn: 18, neunzehn: 19, zwanzig: 20, "dreißig": 30, dreissig: 30,
  vierzig: 40, "fünfundvierzig": 45, fuenfundvierzig: 45, sechzig: 60,
  neunzig: 90 };
const KATEGORIEN = { rot: "rot", orange: "orange", gelb: "gelb",
  "grün": "gruen", gruen: "gruen" };
const VERANTWORTLICH_VERBEN =
  "bringt|fährt|faehrt|holt|begleitet|übernimmt|uebernimmt|geht mit";
// Typische Schul-/Kita-Anlaesse: werden bevorzugt als Titel erkannt.
const ANLAESSE = ["elternabend", "elternsprechtag", "elterngespräch",
  "elterngespraech", "sprechtag", "sprechstunde", "wandertag", "ausflug",
  "klassenfahrt", "schulfest", "sommerfest", "herbstfest", "laternenfest",
  "weihnachtsfeier", "sportfest", "bundesjugendspiele", "projekttag",
  "projektwoche", "schulfotograf", "fototermin", "theater",
  "theaterbesuch", "museumsbesuch", "konzert", "aufführung", "auffuehrung",
  "einschulung", "zeugnisausgabe", "zeugnis", "schwimmunterricht",
  "schwimmen", "klassenarbeit", "schulaufgabe", "test", "impfung",
  "schuluntersuchung", "zahnarzt", "kinderarzt", "info-abend",
  "infoabend", "tag der offenen tür", "tag der offenen tuer",
  "unterrichtsfrei", "studientag", "pädagogischer tag",
  "paedagogischer tag", "flohmarkt", "basar", "kuchenverkauf",
  "laufwettbewerb", "spendenlauf", "lesenacht", "übernachtung",
  "uebernachtung", "kita-fest", "kitafest", "eingewöhnung", "elterncafé",
  "elterncafe", "probe", "training", "turnier", "geburtstag"];
const FUELLWOERTER = new Set(["am", "um", "uhr", "für", "fuer", "mit",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "termin", "bitte", "trag", "trage", "nächsten", "naechsten", "kommenden",
  "diesen", "nächste", "naechste", "kommende", "diese", "dieser", "heute",
  "morgen", "übermorgen", "uebermorgen", "früh", "frueh", "morgens",
  "vormittags", "vormittag", "mittags", "mittag", "nachmittags",
  "nachmittag", "abends", "abend", "nachts", "dauert", "dauer", "lang",
  "stunde", "stunden", "minuten", "min", "std", "halb", "viertel", "nach",
  "vor", "dreiviertel", "kategorie", "farbe", "und", "zum", "zur", "beim",
  "bei", "von", "bis", "ist", "hat", "wegzeit", "fahrzeit", "anfahrt",
  "weg", "dringend", "wichtig", "sehr", "hin", "ich", "wir", "muss",
  "müssen", "muessen", "hab", "habe", "haben", "gibt", "es", "anderthalb",
  "eineinhalb", "halbe", "ca", "ca.", "etwa", "statt", "findet",
  "stattfindet", "beginn", "beginnt", "ab", "liebe", "eltern", "sehr",
  "geehrte", "herzlich", "herzliche", "einladung", "wir", "laden",
  "ein", "sie", "euch", "ihr", "ihre", "eure", "in", "im", "auf", "an",
  "aus", "unser", "unsere", "unserem", "unseren", "unserer", "treffpunkt",
  "datum", "zeit", "uhrzeit", "ort", "wann", "wo", "was", "klasse",
  "schule", "kita", "kindergarten", "rot", "orange", "gelb", "grün", "gruen",
  "alle", "familie", "bringt", "fährt", "faehrt", "holt", "begleitet",
  "übernimmt", "uebernimmt", "geht"]);

function pad2(n) { return String(n).padStart(2, "0"); }
function isoLokal(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function zahlVon(wort) {
  const w = String(wort || "").toLowerCase();
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  return Object.prototype.hasOwnProperty.call(ZAHLWORT, w) ? ZAHLWORT[w] : null;
}
function basisDatum(heuteIso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(heuteIso || ""))
    ? new Date(heuteIso + "T12:00:00") : new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}
function regexEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** Datum aus Tag/Monat/Jahr; ohne Jahr: naechstes Vorkommen ab heute. */
function datumVon(tag, monat, jahrText, heute) {
  let jahr = jahrText ? parseInt(jahrText, 10) : heute.getFullYear();
  if (jahr < 100) jahr += 2000;
  const d = new Date(jahr, monat - 1, tag, 12);
  if (isNaN(d.getTime()) || d.getDate() !== tag || d.getMonth() !== monat - 1)
    return null;
  if (!jahrText && d < heute) d.setFullYear(d.getFullYear() + 1);
  return d;
}

/** OCR-Typische Lesefehler in Zahlen glaetten ("l9:3O" -> "19:30"). */
function ocrGlaetten(text) {
  return String(text || "")
    .replace(/(?<=\d)[oO](?=\d|\b)/g, "0")
    .replace(/(?<=\b|\d)[lI|](?=\d)/g, "1")
    .replace(/(\d)\s*[.:]\s*(\d{2})\s*h\b/gi, "$1:$2 uhr")
    .replace(/[–—]/g, "-");
}

/** Einen einzelnen Termin aus Freitext erkennen. */
function parse(text, heuteIso, mitglieder) {
  const roh = ocrGlaetten(String(text || "").slice(0, 600));
  const t = roh.toLowerCase()
    .replace(/[,;!?„“"()]/g, " ").replace(/\s+/g, " ").trim();
  const heute = basisDatum(heuteIso);
  const verbraucht = [];
  const nimm = (m) => { if (m) verbraucht.push(m[0]); return m; };
  let datum = null;
  let datumExplizit = false;
  let m;

  // --- Datum: 12.11.(2026) | 12. November (2026) | relative Angaben ---
  if ((m = t.match(/\b(\d{1,2})\.\s?(\d{1,2})\.(?:\s?(\d{4}|\d{2})(?!\d|:|\.\d))?/)) ||
      (m = t.match(/\b(\d{1,2})\.(\d{1,2})\b(?![.:]\d)/))) {
    const d = datumVon(parseInt(m[1], 10), parseInt(m[2], 10), m[3], heute);
    if (d) { datum = d; datumExplizit = true; verbraucht.push(m[0]); }
  }
  if (!datum && (m = t.match(new RegExp("\\b(\\d{1,2})\\.?\\s*(" + MONATS_RE +
      ")\\.?(?:\\s+(\\d{4}))?\\b")))) {
    const d = datumVon(parseInt(m[1], 10), MONATE[m[2]], m[3], heute);
    if (d) { datum = d; datumExplizit = true; verbraucht.push(m[0]); }
  }
  if (!datum && nimm(t.match(/\b(?:übermorgen|uebermorgen)\b/))) {
    datum = new Date(heute); datum.setDate(datum.getDate() + 2); datumExplizit = true;
  } else if (!datum && nimm(t.match(/\bmorgen\b(?!s)/))) {
    datum = new Date(heute); datum.setDate(datum.getDate() + 1); datumExplizit = true;
  } else if (!datum && nimm(t.match(/\bheute\b/))) {
    datum = new Date(heute); datumExplizit = true;
  }
  // Wochentag: allein bestimmt er das Datum; steht er neben einem
  // expliziten Datum ("Dienstag, 12.11."), wird er nur verbraucht.
  m = t.match(new RegExp("\\b(?:(n(?:ä|ae)chste[nrsm]?|kommende[nrsm]?|" +
    "diese[nrsm]?)\\s+)?(?:am\\s+)?(" + WOCHENTAGE.join("|") + ")s?\\b"));
  if (m) {
    verbraucht.push(m[0]);
    if (!datum) {
      const ziel = WOCHENTAGE.indexOf(m[2]);
      let diff = (ziel - heute.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // "Montag" am Montag = naechste Woche
      if (m[1] && /^n/.test(m[1]) && diff < 2) diff += 7;
      datum = new Date(heute); datum.setDate(datum.getDate() + diff);
      datumExplizit = true;
    }
  }
  if (!datum && (m = t.match(/\bin\s+(\S+)\s+(tag|tagen|woche|wochen)\b/))) {
    const n = zahlVon(m[1]);
    if (n != null) {
      datum = new Date(heute);
      datum.setDate(datum.getDate() + n * (/^woche/.test(m[2]) ? 7 : 1));
      datumExplizit = true;
      verbraucht.push(m[0]);
    }
  }

  // --- Uhrzeit --- (im Text OHNE die bereits erkannten Datumsangaben,
  // sonst wuerde "12.11." als 12:11 Uhr gelesen)
  let tz = " " + t + " ";
  verbraucht.forEach((v) => { tz = tz.split(v).join(" "); });
  let std = null; let min = 0; let vieldeutig = false;
  if ((m = nimm(tz.match(/\b(\d{1,2})[:.](\d{2})\s*(?:uhr)?(?:\s*-\s*\d{1,2}[:.]\d{2}\s*(?:uhr)?)?/)))) {
    std = parseInt(m[1], 10); min = parseInt(m[2], 10);
    // "19:30 - 21:00 Uhr" -> Dauer aus der Spanne
    const spanne = m[0].match(/-\s*(\d{1,2})[:.](\d{2})/);
    if (spanne) {
      const ende = parseInt(spanne[1], 10) * 60 + parseInt(spanne[2], 10);
      const diff = ende - (std * 60 + min);
      if (diff > 0) verbraucht.push("__dauer:" + diff);
    }
  } else if ((m = tz.match(/\b(\S+)\s+uhr(?:\s+(\S+))?/)) && zahlVon(m[1]) != null) {
    std = zahlVon(m[1]);
    const nachMin = m[2] != null ? zahlVon(m[2]) : null;
    if (nachMin != null && nachMin < 60) { min = nachMin; verbraucht.push(m[0]); }
    else verbraucht.push(m[1] + " uhr");
  } else if ((m = nimm(tz.match(/\bhalb\s+(\S+)\b/))) && zahlVon(m[1]) != null) {
    std = zahlVon(m[1]) - 1; min = 30; vieldeutig = true;
  } else if ((m = nimm(tz.match(/\bdreiviertel\s+(\S+)\b/))) && zahlVon(m[1]) != null) {
    std = zahlVon(m[1]) - 1; min = 45; vieldeutig = true;
  } else if ((m = nimm(tz.match(/\bviertel\s+nach\s+(\S+)\b/))) && zahlVon(m[1]) != null) {
    std = zahlVon(m[1]); min = 15; vieldeutig = true;
  } else if ((m = nimm(tz.match(/\bviertel\s+vor\s+(\S+)\b/))) && zahlVon(m[1]) != null) {
    std = zahlVon(m[1]) - 1; min = 45; vieldeutig = true;
  } else if ((m = tz.match(/\b(?:um|ab|gegen)\s+(\S+)\b/)) && zahlVon(m[1]) != null &&
             zahlVon(m[1]) <= 24) {
    verbraucht.push(m[0]);
    std = zahlVon(m[1]); vieldeutig = true;
  }
  let zeitExplizit = false;
  if (std != null) {
    zeitExplizit = true;
    if (std < 0) std += 12;
    if (/\b(nachmittags?|abends?|nachts)\b/.test(t) && std < 12) std += 12;
    else if (/\b(früh|frueh|morgens|vormittags?)\b/.test(t)) { /* bleibt */ }
    else if (/\bmittags?\b/.test(t) && std < 4) std += 12;
    // Alltagsregel (wie bisher): "halb drei" = 14:30, "um vier" = 16:00
    else if (vieldeutig && std >= 1 && std <= 7) std += 12;
    if (std > 23 || min > 59) { std = null; zeitExplizit = false; }
  }
  const zeit = std == null ? "" : pad2(std) + ":" + pad2(min);

  // Ohne Datum, aber mit Uhrzeit: heute, falls noch nicht vorbei, sonst morgen.
  if (!datum && zeit) {
    datum = new Date(heute);
    const jetzt = new Date();
    if (isoLokal(datum) === isoLokal(jetzt) &&
        std * 60 + min <= jetzt.getHours() * 60 + jetzt.getMinutes())
      datum.setDate(datum.getDate() + 1);
  }

  // --- Wegzeit (vor der Dauer, damit "Fahrzeit 20 Minuten" nicht als
  //     Dauer gelesen wird) ---
  let wegzeit = 0;
  if ((m = t.match(/\b(?:wegzeit|fahrzeit|anfahrt|weg)\s+(?:von\s+|ca\.?\s+|etwa\s+)?(\S+)\s+(minuten|min)\b/)) &&
      zahlVon(m[1]) != null) {
    wegzeit = zahlVon(m[1]); verbraucht.push(m[0]);
  }
  const tOhneWeg = m && wegzeit ? t.replace(m[0], " ") : t;

  // --- Dauer ---
  let dauer = 60;
  const spanneEintrag = verbraucht.find((v) => v.startsWith("__dauer:"));
  if (spanneEintrag) dauer = parseInt(spanneEintrag.slice(8), 10);
  else if ((m = nimm(tOhneWeg.match(/\b(anderthalb|eineinhalb)\s+stunden?\b/)))) dauer = 90;
  else if ((m = nimm(tOhneWeg.match(/\b(?:eine\s+)?halbe\s+stunde\b/)))) dauer = 30;
  else if ((m = nimm(tOhneWeg.match(/\b(\S+)\s+(stunden?|std)\b/))) && zahlVon(m[1]) != null)
    dauer = zahlVon(m[1]) * 60;
  else if ((m = nimm(tOhneWeg.match(/\b(\S+)\s+(minuten|min)\b/))) && zahlVon(m[1]) != null)
    dauer = zahlVon(m[1]);

  // --- Farbe ---
  let kategorie = "orange";
  if ((m = nimm(t.match(/\b(rot|orange|gelb|grün|gruen)\b/)))) kategorie = KATEGORIEN[m[1]];
  else if (/\b(dringend|sehr wichtig)\b/.test(t)) kategorie = "rot";
  else if (/\b(locker|me-time|freiwillig)\b/.test(t)) kategorie = "gruen";

  // --- Person & Verantwortlich ---
  const namen = (Array.isArray(mitglieder) ? mitglieder : [])
    .map((n) => String(n || "").trim()).filter(Boolean);
  let person = "";
  let verantwortlich = "";
  namen.forEach((n) => {
    const nl = regexEscape(n.toLowerCase());
    if (new RegExp("(?:^|\\s)" + nl + "\\s+(?:" + VERANTWORTLICH_VERBEN + ")\\b").test(t)) {
      if (!verantwortlich) verantwortlich = n;
    } else if (new RegExp("(?:^|\\s)" + nl + "(?=\\s|$)").test(t)) {
      if (!person) person = n;
    }
  });
  if (!person && (m = roh.match(/\b(?:für|fuer)\s+([A-ZÄÖÜ][\wäöüß-]{1,29})/)) &&
      !FUELLWOERTER.has(m[1].toLowerCase()))
    person = m[1];
  if (!person && /\b(familie|alle)\b/.test(t)) person = "Familie";

  // --- Titel: bekannter Anlass, sonst was nach Abzug uebrig bleibt ---
  let titel = "";
  const anlass = ANLAESSE.find((a) => new RegExp("(?:^|[^a-zäöüß])" +
    regexEscape(a) + "(?:$|[^a-zäöüß])").test(t));
  if (anlass) {
    titel = anlass;
  } else {
    let rest = " " + t.replace(/(?<!\d):|:(?!\d)/g, " ") + " ";
    verbraucht.filter((v) => !v.startsWith("__"))
      .sort((a, b) => b.length - a.length)
      .forEach((v) => { rest = rest.split(v).join(" "); });
    const nameSet = new Set(namen.map((n) => n.toLowerCase()));
    const woerter = rest.split(" ").filter((w) => w && !FUELLWOERTER.has(w) &&
      !/^[\d.:/-]+$/.test(w) && zahlVon(w) == null && !WOCHENTAGE.includes(w) &&
      !MONATE[w] && !nameSet.has(w) && w.length > 1 &&
      !(person && w === person.toLowerCase()));
    titel = woerter.slice(0, 5).join(" ");
  }
  titel = titel ? titel.charAt(0).toUpperCase() + titel.slice(1) : "";

  return {
    titel, person, verantwortlich,
    datum: datum ? isoLokal(datum) : "",
    zeit, dauer_min: dauer, wegzeit_min: wegzeit, kategorie,
    _datumExplizit: datumExplizit, _zeitExplizit: zeitExplizit,
  };
}

/** Pruefschicht (wie frueher die Server-Pruefschicht von termin-parse). */
function pruefen(t) {
  if (!t || typeof t.titel !== "string" || !t.titel.trim())
    return { success: false, error: "Termin nicht verstanden - bitte nochmal sagen" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t.datum || "")))
    return { success: false, error: "Datum nicht verstanden - bitte mit Tag wiederholen" };
  if (!/^\d{2}:\d{2}$/.test(String(t.zeit || "")))
    return { success: false, error: "Uhrzeit nicht verstanden - bitte mit Uhrzeit wiederholen" };
  const termin = {
    titel: String(t.titel).trim().slice(0, 60),
    person: String(t.person || "Familie").slice(0, 30) || "Familie",
    verantwortlich: String(t.verantwortlich || "").slice(0, 30),
    datum: String(t.datum),
    zeit: String(t.zeit),
    dauer_min: Math.min(Math.max(Math.round(Number(t.dauer_min) || 60), 5), 720),
    wegzeit_min: Math.min(Math.max(Math.round(Number(t.wegzeit_min) || 0), 0), 240),
    kategorie: ["rot", "orange", "gelb", "gruen"].includes(t.kategorie)
      ? t.kategorie : "orange",
  };
  const dt = new Date(termin.datum + "T" + termin.zeit);
  if (isNaN(dt.getTime())) return { success: false, error: "Datum unklar" };
  return { success: true, termin };
}

const DATUM_HINWEIS = new RegExp("\\b\\d{1,2}\\.\\s?\\d{1,2}\\.|\\b\\d{1,2}\\.?\\s*(?:" +
  MONATS_RE + ")\\b|\\b(?:" + WOCHENTAGE.join("|") + ")s?\\b|\\b(?:heute|morgen|übermorgen|uebermorgen)\\b", "i");
// Nur echte Uhrzeiten: "19:00" oder "... Uhr" ("17.11." ist ein Datum!)
const ZEIT_HINWEIS = /\b\d{1,2}:\d{2}\b|\buhr\b/i;

/**
 * Ganzen Zettel (OCR-Text) in Termine zerlegen. Jede Zeile mit einer
 * Datumsangabe wird ein Kandidat; steht die Uhrzeit in der Folgezeile
 * ("Datum: ... / Uhrzeit: ..."), wird sie dazugenommen. Fehlt in der
 * Zeile ein Anlass, gilt die Ueberschrift des Zettels als Titel.
 */
function ausDokument(text, heuteIso, mitglieder) {
  const zeilen = ocrGlaetten(String(text || "").slice(0, 8000))
    .split(/\r?\n/).map((z) => z.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!zeilen.length) return [];
  const gesamt = zeilen.join(" ").toLowerCase();
  const dokAnlass = ANLAESSE.find((a) => gesamt.includes(a));
  // Ueberschrift: erste kurze Zeile ohne Datum/Zeit mit Buchstaben.
  const ueberschrift = zeilen.find((z) => z.length >= 4 && z.length <= 60 &&
    /[a-zäöüß]{3}/i.test(z) && !DATUM_HINWEIS.test(z) && !ZEIT_HINWEIS.test(z) &&
    !/^(liebe|sehr geehrte|hallo)\b/i.test(z));

  const ergebnis = [];
  const gesehen = new Set();
  for (let i = 0; i < zeilen.length; i++) {
    if (!DATUM_HINWEIS.test(zeilen[i])) continue;
    let abschnitt = zeilen[i];
    if (!ZEIT_HINWEIS.test(abschnitt)) {
      const nach = zeilen[i + 1];
      if (nach && ZEIT_HINWEIS.test(nach) && !DATUM_HINWEIS.test(nach)) abschnitt += " " + nach;
    }
    const roh = parse(abschnitt, heuteIso, mitglieder);
    if (!roh._datumExplizit) continue;
    // Uhrzeit fehlt auf dem Zettel: Ganztag-Schaetzung 08:00, damit der
    // Termin ueberhaupt erscheint – die Familie prueft vor dem Eintragen.
    if (!roh.zeit) { roh.zeit = "08:00"; roh._zeitGeschaetzt = true; }
    const zeileHatAnlass = ANLAESSE.some((a) => abschnitt.toLowerCase().includes(a));
    if (!zeileHatAnlass) {
      const kurz = roh.titel && roh.titel.split(" ").length <= 4 ? roh.titel : "";
      const basis = dokAnlass
        ? dokAnlass.charAt(0).toUpperCase() + dokAnlass.slice(1)
        : (ueberschrift || "");
      roh.titel = basis && kurz && basis.toLowerCase() !== kurz.toLowerCase()
        ? basis + " – " + kurz : (basis || kurz || "Schultermin");
    }
    const p = pruefen(roh);
    if (!p.success) continue;
    const schluessel = p.termin.datum + "|" + p.termin.zeit;
    if (gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    p.termin.zeitGeschaetzt = Boolean(roh._zeitGeschaetzt);
    p.termin.quelle = abschnitt.slice(0, 160);
    ergebnis.push(p.termin);
  }
  return ergebnis.slice(0, 12);
}

// ---------------------------------------------------------------------
// Ueberlastungs-Check: zu viele Termine bzw. zu wenig Luft am selben Tag
// ---------------------------------------------------------------------
const MAX_TERMINE_PRO_TAG = 3;
const MAX_BELEGT_MIN = 6 * 60;
const MIN_PUFFER_MIN = 15;

function minutenVon(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * neu: Termin im App-Format ({ datum, zeit, dauerMin, wegzeitMin, person,
 * verantwortlich }). Liefert Warnungen (leere Liste = alles im Rahmen).
 * Echte Ueberschneidungen meldet weiterhin findeKollisionen() der App.
 */
function ueberlastung(neu, termine, routinen) {
  const warnungen = [];
  if (!neu || !neu.datum) return warnungen;
  const beteiligt = [neu.person, neu.verantwortlich].filter(Boolean);
  const wt = (new Date(neu.datum + "T12:00").getDay() + 6) % 7;
  beteiligt.forEach((p) => {
    const betrifft = (t) => [t.person, t.verantwortlich].includes(p) ||
      t.person === "Familie" || p === "Familie";
    const tag = (termine || []).filter((t) => t.id !== neu.id &&
      t.datum === neu.datum && betrifft(t)).concat([neu]);
    const fenster = tag.map((t) => {
      const start = minutenVon(t.zeit) - (Number(t.wegzeitMin) || 0);
      return { t, von: start, bis: minutenVon(t.zeit) + (Number(t.dauerMin) || 60) };
    }).sort((a, b) => a.von - b.von);
    let belegt = fenster.reduce((s, f) => s + (f.bis - f.von), 0);
    (routinen || []).forEach((r) => {
      if (r.person === p && Array.isArray(r.tage) && r.tage.includes(wt))
        belegt += Math.max(0, minutenVon(r.bis) - minutenVon(r.von));
    });
    const wer = p === "Familie" ? "die Familie" : p;
    if (tag.length > MAX_TERMINE_PRO_TAG)
      warnungen.push(`${tag.length} Termine an einem Tag für ${wer}`);
    if (belegt > MAX_BELEGT_MIN)
      warnungen.push(`${wer} ist an diesem Tag schon ${Math.round(belegt / 6) / 10} ` +
        "Std. verplant (inkl. Wegzeiten und Routinen)");
    for (let i = 1; i < fenster.length; i++) {
      const luft = fenster[i].von - fenster[i - 1].bis;
      if (luft >= 0 && luft < MIN_PUFFER_MIN &&
          (fenster[i].t === neu || fenster[i - 1].t === neu)) {
        const anderer = fenster[i].t === neu ? fenster[i - 1].t : fenster[i].t;
        warnungen.push(`Nur ${luft} Min. Luft zu „${anderer.titel}“ (${anderer.zeit})`);
      }
    }
  });
  return [...new Set(warnungen)];
}

const api = Object.freeze({ parse, pruefen, ausDokument, ueberlastung,
  ocrGlaetten, MAX_TERMINE_PRO_TAG, MAX_BELEGT_MIN });
if (typeof module === "object" && module.exports) module.exports = api;
if (wurzel) wurzel.TerminRegel = api;
})(typeof window !== "undefined" ? window : null);
