// Klartext-Uebersetzer: Woerterbuch, Ausfallsicherheit, Modellpfad
import { ausWoerterbuch, ueberschrift, verstaendlichMachen } from "../klartext.mjs";
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));

// --- Woerterbuch ---
p("Sprachbefehl-Gruppe erkannt",
  ausWoerterbuch("B01 'rezept nudeln' -> rezept").bereich === "Sprachbefehle");
p("Mengen-Gruppe erkannt",
  ausWoerterbuch("D2 Schritt-Prosa").bereich === "Mengen");
p("Red-Team-Fall erkannt",
  ausWoerterbuch("RT1-03 Umlaut").bereich === "Pruef-Modell");
p("Unbekannter Name -> null", ausWoerterbuch("XY99 irgendwas") === null);
p("Klartext ist deutsch und ohne Fachwort",
  !/function|null|undefined|regex/i.test(ausWoerterbuch("C1 speak").klartext));

// --- Ueberschrift ---
p("Gruen -> beruhigende Ueberschrift",
  /Alles in Ordnung/.test(ueberschrift({ fehler: [], verdachtsfaelle: [] })));
p("Einzahl korrekt",
  ueberschrift({ fehler: [{}], verdachtsfaelle: [] }) === "1 echter Fehler gefunden.");
p("Mehrzahl + Verdacht korrekt",
  ueberschrift({ fehler: [{}, {}], verdachtsfaelle: [{}] })
  === "2 echte Fehler und 1 Verdachtsfall gefunden.");

// --- Ohne API-Schluessel: Woerterbuch greift trotzdem ---
delete process.env.ANTHROPIC_API_KEY;
const b1 = await verstaendlichMachen({
  fehler: [{ name: "D1 Zutat wird festgeschrieben" }],
  verdachtsfaelle: [{ name: "RT1-01 Grenzfall" }] });
p("Ohne Schluessel: Klartext aus Woerterbuch",
  b1.fehler[0].klartext.includes("Mengenangaben"));
p("Ohne Schluessel: ehrlicher Hinweis gesetzt",
  /Kurzerklaerung/.test(b1.klartextHinweis));
p("Ueberschrift ergaenzt", b1.ueberschrift.includes("1 echter Fehler"));

// --- Modellpfad (Attrappe) ---
process.env.ANTHROPIC_API_KEY = "test";
globalThis.fetch = async () => ({ ok: true, json: async () => ({
  content: [{ type: "text", text: JSON.stringify({ erklaerungen: [
    { nr: 1, klartext: "Die Einkaufsliste zeigt falsche Mengen.",
      auswirkung: "Familien kaufen zu wenig ein.",
      vorschlag: "Die Umrechnung an einer Stelle zusammenfuehren.",
      dringlichkeit: "hoch" }] }) }] }) });
const b2 = await verstaendlichMachen({
  fehler: [{ name: "D1 Zutat" }], verdachtsfaelle: [] });
p("Modell liefert Klartext", b2.fehler[0].klartext.includes("falsche Mengen"));
p("Modell liefert Vorschlag", b2.fehler[0].vorschlag.includes("zusammenfuehren"));
p("Dringlichkeit uebernommen", b2.fehler[0].dringlichkeit === "hoch");

// --- Modellausfall: Bericht geht trotzdem raus ---
globalThis.fetch = async () => { throw new Error("Netz weg"); };
const b3 = await verstaendlichMachen({
  fehler: [{ name: "E1 Timer" }], verdachtsfaelle: [] });
p("Modellausfall: Woerterbuch-Klartext bleibt",
  b3.fehler[0].klartext.includes("Restzeit"));
p("Modellausfall: ehrlicher Hinweis",
  /nicht verfuegbar/.test(b3.klartextHinweis));

console.log(`\nKlartext: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
