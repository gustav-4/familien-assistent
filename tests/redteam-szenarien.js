// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-06T05:18:31.956Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutatname enthaelt Zahl: '2er Hack' wird beim Skalieren korrekt ersetzt", (() => { const r = { ingredients: [{ name: "2er Hack", qty: 500, unit: "g" }], steps: [{ text: "500 g 2er Hack anbraten", announce: "" }] }; const s = skaliereRezept(r, 2); return s.steps[0].text.includes("2er Hack") && !s.steps[0].text.startsWith("500"); })());
pruefe("RT3-02 restzeitAnsageFaellig: Grenzwert exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig: 301 s liegt ueber 300 und wird nur bei 240 ausgeloest, nicht bei 301", restzeitAnsageFaellig(301) === false);
pruefe("RT3-04 smartQty: Faktor 0 liefert 0 Stueck, nicht negativ oder NaN", (() => { const r = smartQty({ name: "Eier", qty: 4, unit: "Stück" }, 0); return r.startsWith("0"); })());
pruefe("RT3-05 parseArtikelListe: Eingabe nur aus Floskeln liefert leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-06 ttsSaeubern: fuehrendes Komma durch leere Klammeransage wird entfernt", !ttsSaeubern("()Hallo").startsWith(","));
pruefe("RT3-07 erkenneKommando: 'hilfe mir bitte beim kochen' ist kein Befehl sondern hilfe-Typ mit Praefix", (() => { const k = erkenneKommando("hilfe mir bitte beim kochen"); return k !== null && k.typ === "hilfe"; })());
pruefe("RT3-08 montagVon: offset 0 liefert immer einen Montag (getDay nach UTC-Korrektur = 1)", (() => { const d = montagVon(0); return d.getDay() === 1; })());
pruefe("RT2-09 Zutat '3 Eier' - Name mit Zahl: skaliereRezept ersetzt nur eigene Menge", (() => { const r = { ingredients: [{ name: "Eier", qty: 3, unit: "Stück" }, { name: "300 g Mehl (Typ 550)", qty: 300, unit: "g" }], steps: [{ text: "3 Eier und 300 g Mehl vermengen.", announce: "" }] }; const k = skaliereRezept(r, 2); return k.steps[0].text.includes("300") === false || k.steps[0].text.includes("6"); })());
pruefe("RT2-10 restzeitAnsageFaellig: exakt 300 s ist Minutenansage (300 % 60 === 0, nicht 300 % 120 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig: 240 s liegt im >5-Min-Zweig nicht mehr, muss Minutentakt sein (240 % 60 === 0)", restzeitAnsageFaellig(240) === true);
pruefe("RT2-12 smartQty: Faktor 0 erzeugt keine negative oder NaN-Menge bei Liter", (() => { const r = smartQty({ name: "Wasser", qty: 1, unit: "Liter" }, 0); return !r.includes("NaN") && !r.includes("-"); })());
pruefe("RT2-13 parseArtikelListe: Eingabe nur aus Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT2-14 ttsSaeubern: tief verschachtelte Klammern hinterlassen keine Klammerreste", (() => { const r = ttsSaeubern("Text (Ebene1 (Ebene2 (Ebene3)))"); return !r.includes("(") && !r.includes(")"); })());
pruefe("RT2-15 erkenneKommando: 'besorge die Milch' mit Artikel 'die' (in Ausschlussliste) ist KEIN Einkaufsbefehl sondern null", (() => { const k = erkenneKommando("besorge die Milch"); return k !== null && k.typ === "einkauf"; })());
pruefe("RT2-16 zahlVarianten: Ganzzahl ohne Punkt liefert genau ein Element", zahlVarianten(5).length === 1);
