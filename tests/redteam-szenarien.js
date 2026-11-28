// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-11-28T08:36:12.432Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus")?.typ === "mikro_aus");
pruefe("RT3-02 'zuhören stopp' -> mikro_aus", erkenneKommando("zuhören stopp")?.typ === "mikro_aus");
pruefe("RT3-03 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert genau 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-04 restzeitAnsageFaellig(301) folgt dem 2-Min-Takt (301 % 120 != 0 -> false)", restzeitAnsageFaellig(301) === false);
pruefe("RT3-05 Zutat deren Name eine Zahl enthaelt ('Sauce 57') wird nicht durch fremde '5' ersetzt", (() => { const ing = { qty: 5, unit: "EL", name: "Sauce 57" }; const r = { ingredients: [ing], steps: [{ text: "Gib 5 EL Sauce 57 dazu.", announce: "" }] }; const kopie = skaliereRezept(r, 1); return kopie.steps[0].text === "Gib 5 EL Sauce 57 dazu."; })());
pruefe("RT3-06 smartQty mit Faktor 0 stuerzt nicht ab und liefert einen String", (() => { try { const r = smartQty({ qty: 100, unit: "g", name: "Mehl" }, 0); return typeof r === "string"; } catch(e) { return false; } })());
pruefe("RT3-07 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-08 'tschüss' -> app_ende (Umlaut-Grossschreibung gemischt)", erkenneKommando("Tschüss!")?.typ === "app_ende");
pruefe("RT2-09 'mikrofon aus' -> mikro_aus", erkenneKommando("mikrofon aus")?.typ === "mikro_aus");
pruefe("RT2-10 'tschüss' -> app_ende (Umlaut Großschreibung)", erkenneKommando("TSCHÜSS")?.typ === "app_ende");
pruefe("RT2-11 restzeitAnsageFaellig(300) ist Minutenansage (Grenzwert exakt 300)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-12 restzeitAnsageFaellig(301) folgt dem 2-Minuten-Takt (301 % 120 !== 0 -> false)", restzeitAnsageFaellig(301) === false);
pruefe("RT2-13 'rezept 2 für 4 personen' hat keinen Suchwunsch (Zahl im Rest nach Floskel-Bereinigung)", erkenneKommando("rezept suchen")?.rest === "");
pruefe("RT2-14 smartQty: Zutat deren Name eine Zahl enthaelt ('Pfeffer 5 Koerner') skaliert nur die qty-Zahl im Text", (() => { const ing = { qty: 5, unit: "g", name: "Pfeffer 5 Koerner" }; return smartQty(ing, 1).startsWith("5"); })());
pruefe("RT2-15 ttsSaeubern: fuehrender Komma nach Ersetzung wird entfernt", ttsSaeubern("(Einschub) Rest").startsWith(",") === false);
pruefe("RT2-16 personenAequivalent: Alter exakt 64 zaehlt als Erwachsen, nicht Senior (w)", personenAequivalent({ alter: 64, geschlecht: "w" }) === 0.85);
