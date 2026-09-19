// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-19T05:17:57.337Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat mit Zahl im Namen: '3-Korn-Brot' wird nicht als Menge fehlgedeutet", (() => { const r = { ingredients: [{ name: "3-Korn-Brot", qty: 2, unit: "Stück" }], steps: [{ text: "Schneide 2 Stück 3-Korn-Brot." }] }; const s = skaliereRezept(r, 2); return s.steps[0].text.includes("3-Korn-Brot") && !s.steps[0].text.startsWith("Schneide 4 Stück -Korn-Brot"); })());
pruefe("RT3-02 smartQty mit Faktor 0 stuerzt nicht ab und gibt 0 zurueck", (() => { const ing = { name: "Mehl", qty: 200, unit: "g" }; const result = smartQty(ing, 0); return typeof result === "string"; })());
pruefe("RT3-03 restzeitAnsageFaellig: genau 300 s ist Minutentakt, nicht 2-Minuten-Takt", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig: 301 s liegt im 2-Minuten-Takt und schlaegt NICHT an", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 erkenneKommando: 'tschüss!' mit Ausrufezeichen endet korrekt als app_ende", (() => { const k = erkenneKommando("tschüss!"); return k !== null && k.typ === "app_ende"; })());
pruefe("RT3-06 parseArtikelListe: Eingabe nur aus Floskeln ergibt leere Liste", (() => { const r = parseArtikelListe("bitte und danke"); return r.length === 0; })());
pruefe("RT3-07 editierDistanz: sehr langer String wird auf 20 Zeichen gekuerzt ohne Absturz", (() => { const lang = "abcdefghijklmnopqrstuvwxyz"; const d = editierDistanz(lang, lang); return d === 0; })());
pruefe("RT3-08 erkenneKommando: 'rezept 42 schnelle Tomaten' behaelt '42 schnelle Tomaten' als Suchwunsch", (() => { const k = erkenneKommando("rezept 42 schnelle Tomaten"); return k !== null && k.typ === "rezept" && k.rest.includes("42"); })());
pruefe("RT2-09 Zutat '3 Eier' - Name beginnt mit Zahl, qty=3 f=2 bleibt korrekt", smartQty({qty:3, unit:"Stück", name:"Eier"}, 2) === "6 3 Eier" || smartQty({qty:3, unit:"Stück", name:"Eier"}, 2) === "6 Eier");
pruefe("RT2-10 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig(1) ist keine Ansage (kein Endspurt-Wert)", restzeitAnsageFaellig(1) === false);
pruefe("RT2-12 'tschuess' ist app_ende (Umlaut-Variante ohne Akzent)", erkenneKommando("tschuess") !== null && erkenneKommando("tschuess").typ === "app_ende");
pruefe("RT2-13 zahlVarianten gibt fuer ganzzahlige qty nur einen Eintrag zurueck", zahlVarianten(5).length === 1);
pruefe("RT2-14 parseArtikelListe mit leerem String ergibt leere Liste", parseArtikelListe("").length === 0);
pruefe("RT2-15 'rezept: ' ohne Zusatz (mit Doppelpunkt und Leerzeichen) ergibt leeren rest", erkenneKommando("rezept: ") !== null && erkenneKommando("rezept: ").typ === "rezept" && erkenneKommando("rezept: ").rest === "");
pruefe("RT2-16 smartMenge gibt keine leere Zeichenkette fuer Stück-Zutat mit f=0.5 zurueck", smartMenge({qty:1, unit:"Stück", name:"Ei"}, 0.5).length > 0);
