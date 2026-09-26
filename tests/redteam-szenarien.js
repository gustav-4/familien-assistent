// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-26T05:43:44.762Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat mit Zahl im Namen: '2 Eier' ersetzt nicht '200 g Mehl' im Schritt", (() => { const ing = { name: "2 Eier", qty: 2, unit: "Stück" }; const result = smartQty(ing, 1); return !result.includes("200"); })());
pruefe("RT3-02 restzeitAnsageFaellig: Grenzwert exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig: 301 s liegt im 2-Minuten-Takt, 301 % 120 !== 0 -> false", restzeitAnsageFaellig(301) === false);
pruefe("RT3-04 parseArtikelListe: Nur-Floskel-Eingabe 'bitte und danke' ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-05 smartQty: Sehr grosse Skalierung (Faktor 1000) stuerzt nicht ab und liefert eine Zeichenkette", typeof smartQty({ name: "Mehl", qty: 100, unit: "g" }, 1000) === "string");
pruefe("RT3-06 erkenneKommando: 'tschüss und auf wiedersehen' ist KEIN app_ende-Befehl (kein exakter Treffer)", (() => { const r = erkenneKommando("tschüss und auf wiedersehen"); return r === null || r.typ !== "app_ende"; })());
pruefe("RT3-07 ttsSaeubern: Nur-Klammer-Eingabe '((()))' stuerzt nicht ab und liefert leere oder bereinigte Zeichenkette", (() => { const r = ttsSaeubern("((()))"); return typeof r === "string" && !r.includes("(") && !r.includes(")"); })());
pruefe("RT3-08 personenAequivalent: Alter exakt 14 weiblich gibt 0.9, nicht 1.1", personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9);
pruefe("RT2-09 Zutat deren Name eine Zahl enthaelt: '3 g Omega-3' wird nicht durch '3' aus Schritt ersetzt wenn Einheit fehlt", (() => { const ing = { qty: 3, unit: "g", name: "Omega-3-Fettsäuren" }; const r = { ingredients: [ing], steps: [{ text: "Gib 3 g Omega-3-Fettsäuren hinzu.", announce: "" }] }; const k = skaliereRezept(r, 2); return k.steps[0].text.includes("6 g Omega-3-Fettsäuren") && !k.steps[0].text.startsWith("6"); })());
pruefe("RT2-10 restzeitAnsageFaellig: Grenzwert exakt 300 s ist Minutenansage (rest%60===0)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig: 299 s faellt in den 1-5-Min-Bereich und 299%60 != 0 also false", restzeitAnsageFaellig(299) === false);
pruefe("RT2-12 smartQty mit Faktor 0 stuerzt nicht ab und liefert einen String", (() => { const ing = { qty: 200, unit: "g", name: "Mehl" }; const r = smartQty(ing, 0); return typeof r === "string"; })());
pruefe("RT2-13 zahlVarianten einer ganzen Zahl liefert genau ein Element", zahlVarianten(5).length === 1);
pruefe("RT2-14 parseArtikelListe mit nur Floskeln liefert leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT2-15 erkenneKommando: 'tschüss' (Umlaut) wird als app_ende erkannt", erkenneKommando("tschüss") !== null && erkenneKommando("tschüss").typ === "app_ende");
pruefe("RT2-16 erkenneKommando: Satz 'hilf mir doch mal kurz bitte' oeffnet Hilfe, da er mit 'hilf mir' beginnt", (() => { const k = erkenneKommando("hilf mir doch mal kurz bitte"); return k !== null && k.typ === "hilfe"; })());
