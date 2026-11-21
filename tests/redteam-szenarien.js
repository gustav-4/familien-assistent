// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-11-21T07:52:49.713Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat mit Zahl im Namen ('4-Käse') wird bei Faktor 2 nicht durch Rezeptmenge korrumpiert", (() => { const ing = { name: "4-Käse-Mischung", qty: 100, unit: "g" }; const r = { ingredients: [ing], steps: [{ text: "100 g 4-Käse-Mischung verteilen", announce: "" }] }; const s = skaliereRezept(r, 2); return !s.steps[0].text.includes("4-Käse") || s.steps[0].text.includes("200"); })());
pruefe("RT3-02 smartQty mit Faktor 0 stuerzt nicht ab und liefert String", typeof smartQty({ name: "Mehl", qty: 200, unit: "g" }, 0) === "string");
pruefe("RT3-03 restzeitAnsageFaellig Grenzwert exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig 301 s ist KEIN 2-Minuten-Takt (301 % 120 !== 0) und KEIN 1-Minuten-Takt", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 ttsSaeubern mit fuehrendem Komma liefert keinen Satz der mit Komma beginnt", !ttsSaeubern(", Hallo Welt").startsWith(","));
pruefe("RT3-06 erkenneKommando 'mikrofon stopp' erkennt mikro_aus", erkenneKommando("mikrofon stopp") !== null && erkenneKommando("mikrofon stopp").typ === "mikro_aus");
pruefe("RT3-07 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-08 smartMenge Einheit leer gibt nur die Zahl zurueck ohne den Namen", (() => { const ing = { name: "Eier", qty: 2, unit: "" }; const r = smartMenge(ing, 3); return !r.includes("Eier") && r.includes("6"); })());
pruefe("RT2-09 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus")?.typ === "mikro_aus");
pruefe("RT2-10 'tschüss' -> app_ende (Umlaut)", erkenneKommando("tschüss")?.typ === "app_ende");
pruefe("RT2-11 Zutat '10 Korn Pfeffer' - Zahl im Namen wird nicht durch skalierte Menge 1 g ersetzt", (() => { const r = { ingredients: [{ qty: 1, unit: "g", name: "10 Korn Pfeffer" }], steps: [{ text: "Streue 1 g 10 Korn Pfeffer hinzu." }] }; const s = skaliereRezept(r, 2); return s.steps[0].text.includes("10 Korn"); })());
pruefe("RT2-12 restzeitAnsageFaellig(300) -> true (Schwelle 300 s ist Minutenansage)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-13 restzeitAnsageFaellig(301) -> false (301 liegt im 2-Min-Takt, kein Vielfaches von 120)", restzeitAnsageFaellig(301) === false);
pruefe("RT2-14 smartQty Liter-Menge 0 ergibt mindestens 0.25 Liter (kein Nullwert)", (() => { const r = smartQty({ qty: 0, unit: "Liter", name: "Wasser" }, 1); return r.startsWith("0,25"); })());
pruefe("RT2-15 parseArtikelListe leere Zeichenkette ergibt leere Liste", parseArtikelListe("").length === 0);
pruefe("RT2-16 personenAequivalent fuer Alter 14 Maedchen ist 0.9, nicht 1.1", personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9);
