// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-10-17T05:13:17.663Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutatname '2 Eier' - Zahl im Namen wird nicht mit Mengenzahl verwechselt", (() => { const r = { ingredients: [{ name: "2 Eier", qty: 4, unit: "Stück" }], steps: [{ text: "Nehmt 4 Stück 2 Eier und verrührt sie." }] }; const k = skaliereRezept(r, 2); return k.steps[0].text.includes("8") && !k.steps[0].text.startsWith("Nehmt 42"); })());
pruefe("RT3-02 smartQty mit Faktor 0 stuerzt nicht ab und gibt 0 zurueck", (() => { const ing = { qty: 200, unit: "g", name: "Mehl" }; const result = smartQty(ing, 0); return typeof result === "string" && result.includes("0"); })());
pruefe("RT3-03 restzeitAnsageFaellig bei exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig bei 301 s folgt dem 2-Minuten-Takt nicht dem 1-Minuten-Takt", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte danke und ok").length === 0);
pruefe("RT3-06 erkenneKommando 'tschüss tschüss' ist KEIN app_ende (Doppelwort)", (erkenneKommando("tschüss tschüss") === null || erkenneKommando("tschüss tschüss")?.typ !== "app_ende"));
pruefe("RT3-07 editierDistanz mit leeren Strings gibt 0 zurueck", editierDistanz("", "") === 0);
pruefe("RT3-08 montagVon(0) liefert immer einen Montag (getDay() nach Umrechnung ist 1)", (() => { const d = montagVon(0); return ((d.getDay() + 6) % 7) === 0; })());
pruefe("RT2-09 Zutat '3 Eier' - Name beginnt mit Ziffer, smartQty rundet nicht falsch", smartQty({ qty: 3, unit: "Stück", name: "Eier" }, 1) === "3 Eier");
pruefe("RT2-10 restzeitAnsageFaellig: Schwellwert 300 s ist KEINE 2-Minuten-Ansage mehr (Grenzwert exakt 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig: 299 s mit 299 % 60 != 0 -> kein Tick", restzeitAnsageFaellig(299) === false);
pruefe("RT2-12 parseArtikelListe: Eingabe nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT2-13 erkenneKommando: 'rezept 42 kürbisSuppe' liefert rest '42 kürbisSuppe'", erkenneKommando("rezept 42 kürbisSuppe") !== null && erkenneKommando("rezept 42 kürbisSuppe").rest === "42 kürbisSuppe");
pruefe("RT2-14 editierDistanz: identische leere Strings ergeben 0", editierDistanz("", "") === 0);
pruefe("RT2-15 smartQty: sehr grosse Faktorzahl (1000) fuer Stueck rundet auf ohne Absturz", typeof smartQty({ qty: 1, unit: "Stück", name: "Ei" }, 1000) === "string");
pruefe("RT2-16 erkenneKommando: 'KOCHEN!!!' wird als Kochbefehl erkannt (Grossbuchstaben + Ausrufezeichen)", erkenneKommando("KOCHEN!!!") !== null && erkenneKommando("KOCHEN!!!").typ === "kochen");
