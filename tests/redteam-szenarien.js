// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-15T05:36:43.542Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat deren Name eine Zahl enthaelt wird nicht falsch ersetzt ('Typ 00 Mehl')", (() => { const r = { ingredients: [{ name: "Typ 00 Mehl", qty: 500, unit: "g" }], steps: [{ text: "500 g Typ 00 Mehl vermengen" }] }; const k = skaliereRezept(r, 2); return k.steps[0].text === "1000 g Typ 00 Mehl vermengen"; })());
pruefe("RT3-02 restzeitAnsageFaellig: exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig: 301 s liegt ueber 300, folgt 2-Minuten-Takt - 301 % 120 !== 0 also false", restzeitAnsageFaellig(301) === false);
pruefe("RT3-04 personenAequivalent: Alter exakt 18 weiblich ergibt 0.95 nicht 0.85", personenAequivalent({ alter: 18, geschlecht: "w" }) === 0.95);
pruefe("RT3-05 erkenneKommando: 'rezept, ' mit Komma und Leerzeichen danach liefert kein falsch befuelltes rest-Feld", (() => { const k = erkenneKommando("rezept, "); return k !== null && k.typ === "rezept" && k.rest === ""; })());
pruefe("RT3-06 ttsSaeubern: Eingabe mit nur Emojis ergibt leeren oder nur Leerzeichen-String, keinen Absturz", (() => { const r = ttsSaeubern("\u{1F600}\u{1F355}\u{1F4A5}"); return typeof r === "string"; })());
pruefe("RT3-07 erkenneKommando: 'liste vorlesen' mit fuehrendem Leerzeichen ist KEIN auf_liste-Befehl sondern liste-vorlesen", (() => { const k = erkenneKommando(" liste vorlesen"); return k !== null && k.typ === "liste" && k.aktion === "vorlesen"; })());
pruefe("RT3-08 smartQty: Liter-Einheit gibt nie 0 zurueck auch bei sehr kleinem Faktor (0.01)", (() => { const r = smartQty({ name: "Wasser", qty: 1, unit: "Liter" }, 0.01); return !r.startsWith("0 "); })());
pruefe("RT2-09 Zutatname mit Zahl: '2 Eier' – Zahl im Namen stoert skaliereRezept nicht", (() => { const r = { ingredients: [{ name: "Eier", qty: 2, unit: "Stück" }], steps: [{ text: "2 Stück Eier verquirlen" }] }; const k = skaliereRezept(r, 2); return k.steps[0].text.includes("4") && !k.steps[0].text.includes("2 Stück Eier"); })());
pruefe("RT2-10 restzeitAnsageFaellig: exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig: 299 s ist KEINE Ansage (weder 2-Min noch Minuten noch Endspurt)", restzeitAnsageFaellig(299) === false);
pruefe("RT2-12 smartQty Liter: 0 Liter wird nicht negativ (min 0.25)", (() => { const ing = { qty: 0.01, unit: "Liter", name: "Wasser" }; const r = smartQty(ing, 1); return r.startsWith("0,25"); })());
pruefe("RT2-13 parseArtikelListe: Eingabe nur aus Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT2-14 erkenneKommando: 'rezept 42 zutaten suchen' – Zahl im Rest kein Fuellwort", (() => { const k = erkenneKommando("rezept 42 zutaten suchen"); return k !== null && k.typ === "rezept" && k.rest !== ""; })());
pruefe("RT2-15 ttsSaeubern: fuenffach verschachtelte Klammern hinterlassen keine Klammer", (() => { const r = ttsSaeubern("a (b (c (d (e (f)))))"); return !r.includes("(") && !r.includes(")"); })());
pruefe("RT2-16 personenAequivalent: Alter exakt 14 weiblich ist 0.9, nicht 1.1", personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9);
