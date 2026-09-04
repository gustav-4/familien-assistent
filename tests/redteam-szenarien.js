// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-04T05:43:02.415Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutatname enthaelt Zahl: '2 EL Oel' – die '2' im Namen darf nicht als Mengenangabe ersetzt werden", (() => { const ing = { qty: 2, unit: "EL", name: "Oel" }; const r = { ingredients: [ing], steps: [{ text: "Nimm 2 EL Oel und 2 EL Essig.", announce: "" }] }; const s = skaliereRezept(r, 2); return s.steps[0].text.indexOf("Essig") !== -1 && !s.steps[0].text.startsWith("Nimm 4 EL Oel und 4 EL Essig"); })());
pruefe("RT3-02 smartQty mit Faktor 0 stuerzt nicht ab und gibt 0 zurueck", (() => { try { const res = smartQty({ qty: 200, unit: "g", name: "Mehl" }, 0); return typeof res === "string"; } catch(e) { return false; } })());
pruefe("RT3-03 'rezept 42' – Zahl als Suchwunsch bleibt erhalten", (() => { const k = erkenneKommando("rezept 42"); return k !== null && k.typ === "rezept" && k.rest === "42"; })());
pruefe("RT3-04 personenAequivalent mit Alter exakt 14 weiblich liefert 0.9", (() => { return personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9; })());
pruefe("RT3-05 restzeitAnsageFaellig(300) ist wahr – 300 s liegt in der Minutenzone", (() => { return restzeitAnsageFaellig(300) === true; })());
pruefe("RT3-06 'tschuess' beendet die App – Umlaut-freie Variante erkannt", (() => { const k = erkenneKommando("tschuess"); return k !== null && k.typ === "app_ende"; })());
pruefe("RT3-07 ttsSaeubern mit nur einer oeffnenden Klammer ohne Gegenstueck hinterlaesst keine Klammer im Ergebnis", (() => { const res = ttsSaeubern("Hallo (Welt"); return !res.includes("(") && !res.includes(")"); })());
pruefe("RT3-08 parseArtikelListe mit leerem String ergibt leere Liste", (() => { return parseArtikelListe("").length === 0; })());
