// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-11-20T08:29:59.203Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus")?.typ === "mikro_aus");
pruefe("RT3-02 'MIKROFON AUS!!!' Grossschreibung und Ausrufezeichen", erkenneKommando("MIKROFON AUS!!!")?.typ === "mikro_aus");
pruefe("RT3-03 Zutat '2 Eier 3 Minuten' - Zahl im Schritttext bleibt unberuehrt bei Zutat mit Zahl im Namen", (() => { const ing = { qty: 2, unit: "", name: "Eier" }; const r = { ingredients: [ing], steps: [{ text: "Lege 2 Eier 3 Minuten in Wasser." }] }; const s = skaliereRezept(r, 1); return s.steps[0].text.includes("3 Minuten"); })());
pruefe("RT3-04 smartQty Liter-Menge 0 ergibt mindestens 0,25 Liter", smartQty({ qty: 0, unit: "Liter", name: "Wasser" }, 1) === "0,25 Liter Wasser");
pruefe("RT3-05 smartQty EL-Menge 0 ergibt mindestens 0,5 EL", smartQty({ qty: 0, unit: "EL", name: "Oel" }, 1) === "0,5 EL Oel");
pruefe("RT3-06 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert genau 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-07 'tschüss' -> app_ende (Umlaut im Befehl)", erkenneKommando("tschüss")?.typ === "app_ende");
pruefe("RT3-08 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
