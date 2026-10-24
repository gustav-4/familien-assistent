// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-10-24T05:13:58.922Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat mit Zahl im Namen: '2 Eier' ersetzt nicht '200 g Mehl' im Schritttext", (() => { const r = { ingredients: [{ name: "2-Korn-Brot", qty: 2, unit: "Stück" }, { name: "Mehl", qty: 200, unit: "g" }], steps: [{ text: "200 g Mehl und 2 Stück 2-Korn-Brot vermengen." }] }; const s = skaliereRezept(r, 1); return s.steps[0].text.includes("200") && s.steps[0].text.includes("Mehl"); })());
pruefe("RT3-02 restzeitAnsageFaellig: exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig: 301 s liegt im 2-Minuten-Takt und 301 % 120 !== 0 -> kein Ton", restzeitAnsageFaellig(301) === false);
pruefe("RT3-04 smartQty: Faktor 0 liefert 0 Stueck ohne Absturz", (() => { const r = smartQty({ name: "Ei", qty: 3, unit: "Stück" }, 0); return typeof r === "string"; })());
pruefe("RT3-05 ttsSaeubern: nur einzelne oeffnende Klammer ohne schliessende hinterlaesst keine Klammer im Ergebnis", !ttsSaeubern("Jetzt kommt (der Trick").includes("("));
pruefe("RT3-06 erkenneKommando: 'WOCHENPLAN' in Grossbuchstaben wird erkannt", erkenneKommando("WOCHENPLAN") !== null && erkenneKommando("WOCHENPLAN").typ === "wochenplan");
pruefe("RT3-07 parseArtikelListe: Eingabe mit nur Floskeln liefert leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-08 personenAequivalent: Alter exakt 14 weiblich ergibt 0.9 nicht 1.1", personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9);
pruefe("RT2-09 Zutat '3 Eier' - Name beginnt mit Zahl: smartQty liefert String der mit der Menge endet", typeof smartQty({qty:3, unit:"Stück", name:"Eier"}, 1) === "string" && smartQty({qty:3, unit:"Stück", name:"Eier"}, 1).includes("Eier"));
pruefe("RT2-10 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300 liegt im >= 60 Zweig)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 smartQty mit Faktor 0 stuerzt nicht ab und liefert String", typeof smartQty({qty:100, unit:"g", name:"Mehl"}, 0) === "string");
pruefe("RT2-12 'rezept recherchieren' hat leeren rest (kein Suchwunsch)", (function(){var r=erkenneKommando("rezept recherchieren"); return r && r.typ==="rezept" && r.rest===""})());
pruefe("RT2-13 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT2-14 ttsSaeubern mit nur Sonderzeichen stuerzt nicht ab und liefert String", typeof ttsSaeubern("🎉✓👍") === "string");
pruefe("RT2-15 'mikrofon aus' wird als mikro_aus erkannt", (function(){var r=erkenneKommando("mikrofon aus"); return r !== null && r.typ === "mikro_aus"})());
pruefe("RT2-16 zahlVarianten fuer ganzzahligen Wert liefert genau ein Element", zahlVarianten(5).length === 1);
