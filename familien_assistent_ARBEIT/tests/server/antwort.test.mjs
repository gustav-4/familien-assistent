import { textAusAntwort } from "../redteam.mjs";
let ok = 0, fail = 0;
const p = (n, c) => c ? (ok++, console.log("  OK   " + n))
                      : (fail++, console.log("  FEHL " + n));
const still = () => {};
p("Normale Textantwort", textAusAntwort({ content: [
  { type: "text", text: 'pruefe("A", 1);' }] }, still).includes("pruefe"));
p("Denk-Bloecke werden mitgenommen, wenn sie Text tragen",
  textAusAntwort({ content: [
    { type: "thinking", text: "ueberlege" },
    { type: "text", text: 'pruefe("B", 2);' }] }, still).includes("pruefe"));
p("Unbekannter Blocktyp mit text-Feld zaehlt",
  textAusAntwort({ content: [
    { type: "irgendwas_neues", text: 'pruefe("C", 3);' }] }, still)
    .includes("pruefe"));
p("Leere Antwort -> leerer Text",
  textAusAntwort({ content: [], stop_reason: "end_turn" }, still) === "");
let notiert = [];
textAusAntwort({ content: [{ type: "thinking" }], stop_reason: "max_tokens",
  usage: { output_tokens: 8000 } }, (s) => notiert.push(s));
p("Diagnose nennt stop_reason und Blocktypen",
  notiert.join(" ").includes("max_tokens") && notiert.join(" ").includes("thinking"));
p("Diagnose nennt die Ursache im Klartext",
  notiert.join(" ").includes("Token-Budget aufgebraucht"));
p("Kaputte Antwort stuerzt nicht ab", textAusAntwort(null, still) === "");
console.log(`\nAntwort-Auswertung: ${ok} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
