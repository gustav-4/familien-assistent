// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-11-14T07:12:27.363Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus")?.typ === "mikro_aus");
pruefe("RT3-02 'zuhören stopp' -> mikro_aus", erkenneKommando("zuhören stopp")?.typ === "mikro_aus");
pruefe("RT3-03 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig(301) ist kein 2-Min-Takt (301 % 120 != 0)", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 smartQty Zutat 'Ei 2er-Pack' (Name mit Zahl) skaliert korrekt", smartQty({qty:1, unit:"Stück", name:"Ei 2er-Pack"}, 2) === "2 Ei 2er-Pack");
pruefe("RT3-06 zahlVarianten ohne Dezimalpunkt liefert nur ein Element", zahlVarianten(3).length === 1);
pruefe("RT3-07 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-08 editierDistanz identische Strings ergibt 0", editierDistanz("hallo", "hallo") === 0);
pruefe("RT3-01 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus") !== null && erkenneKommando("mikrofon aus").typ === "mikro_aus");
pruefe("RT3-02 'auf die liste' (ohne einkaufs) ist KEIN Befehl", erkenneKommando("auf die liste") === null);
pruefe("RT3-03 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig(301) ist kein 2-Minuten-Takt (301 % 120 != 0)", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 Zutatname enthaelt Zahl: '3 Korn Pfeffer' wird bei Faktor 1 nicht durch eigene Menge korrumpiert", (function(){ const ing = {qty: 3, unit: "Stück", name: "Korn Pfeffer"}; const r = skaliereRezept({ingredients:[ing], steps:[{text:"3 Korn Pfeffer zugeben", announce:""}]}, 1); return r.steps[0].text === "3 Korn Pfeffer zugeben"; })());
pruefe("RT3-06 personenAequivalent fuer Alter 64 (Grenzwert) weiblich ist 0.85", personenAequivalent({alter: 64, geschlecht: "w"}) === 0.85);
pruefe("RT3-07 ttsSaeubern mit fuehrendem Komma entfernt dieses", !ttsSaeubern(", Hallo Welt").startsWith(","));
pruefe("RT3-08 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
