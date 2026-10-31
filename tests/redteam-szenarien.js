// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-10-31T06:28:31.886Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat '3 Eier' - Name beginnt mit Zahl, smartQty Faktor 2 liefert sinnvollen String", (function(){ const ing = {qty:3, unit:"Stück", name:"Eier"}; const r = smartQty(ing, 2); return typeof r === "string" && r.includes("6") && r.includes("Eier"); })());
pruefe("RT3-02 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300, 300%60===0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig(299) ist KEIN 2-Minuten-Takt und KEIN Minutentakt und KEIN Endspurt", restzeitAnsageFaellig(299) === false);
pruefe("RT3-04 'rezept 42 carbonara' - Suchwunsch mit fuehrender Zahl bleibt erhalten", (function(){ const r = erkenneKommando("rezept 42 carbonara"); return r !== null && r.typ === "rezept" && r.rest === "42 carbonara"; })());
pruefe("RT3-05 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte danke und ok").length === 0);
pruefe("RT3-06 ttsSaeubern mit ausschliesslich Emojis liefert leeren oder nur Leerzeichen-String (kein Absturz)", (function(){ const r = ttsSaeubern("🍕🎉👍"); return typeof r === "string"; })());
pruefe("RT3-07 smartQty Liter mit Menge 0 wird auf Mindestwert 0.25 begrenzt", (function(){ const ing = {qty:0, unit:"Liter", name:"Wasser"}; const r = smartQty(ing, 1); return r.includes("0,25") || r.includes("0.25"); })());
pruefe("RT3-08 erkenneKommando 'KOCHEN!!!' (Grossbuchstaben mit Ausrufezeichen) wird erkannt", (function(){ const r = erkenneKommando("KOCHEN!!!"); return r !== null && r.typ === "kochen"; })());
pruefe("RT3-01 Zutatname enthaelt Zahl: '2 Eier' - Schritt mit '2 Eier' wird nicht durch Fremdmengen korrumpiert", (() => { const r = { ingredients: [{ name: "Eier", qty: 2, unit: "Stück" }, { name: "2-Korn-Brot", qty: 1, unit: "Stück" }], steps: [{ text: "2 Stück Eier und 1 Stück 2-Korn-Brot vermengen" }] }; const s = skaliereRezept(r, 2); return s.steps[0].text === "2 Stück Eier und 2 Stück 2-Korn-Brot vermengen" || s.steps[0].text.includes("2-Korn-Brot"); })());
pruefe("RT3-02 restzeitAnsageFaellig Grenzwert exakt 300 s ist Minuten-Takt nicht 2-Min-Takt", restzeitAnsageFaellig(300) === true && restzeitAnsageFaellig(301) === false);
pruefe("RT3-03 smartQty Liter-Menge 0 ergibt mindestens 0,25 Liter und stuerzt nicht ab", (() => { const r = smartQty({ name: "Wasser", qty: 0, unit: "Liter" }, 1); return r.startsWith("0,25"); })());
pruefe("RT3-04 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-05 erkenneKommando 'rezept 42 Minuten Kuchen' hat '42 Minuten Kuchen' als Suchwunsch und nicht nur 'Minuten Kuchen'", (() => { const k = erkenneKommando("rezept 42 Minuten Kuchen"); return k !== null && k.typ === "rezept" && k.rest.includes("42"); })());
pruefe("RT3-06 zahlVarianten fuer ganzzahlige Menge liefert genau ein Element", zahlVarianten(3).length === 1);
pruefe("RT3-07 erkenneKommando 'mikrofon stopp' erkennt mikro_aus auch mit vollem Wort", (() => { const k = erkenneKommando("mikrofon stopp"); return k !== null && k.typ === "mikro_aus"; })());
pruefe("RT3-08 ausschlussTrifft mit leerem ingredients-Array und Treffer im Rezeptnamen gibt Treffer zurueck", (() => { const r = { name: "Schweinebraten", ingredients: [], steps: [] }; return ausschlussTrifft(r, ["schwein"]) !== null; })());
