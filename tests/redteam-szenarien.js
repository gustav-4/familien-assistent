// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-10-10T06:33:44.090Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat deren Name eine Zahl enthaelt wird nicht doppelt ersetzt", (() => { const ing = { qty: 3, unit: "g", name: "Omega-3-Fettsäuren" }; const r = { ingredients: [ing], steps: [{ text: "Gib 3 g Omega-3-Fettsäuren hinzu", announce: "" }] }; const sk = skaliereRezept(r, 2); return sk.steps[0].text.includes("6") && !sk.steps[0].text.includes("3 g Omega-3"); })());
pruefe("RT3-02 restzeitAnsageFaellig Grenzwert 300 s ist Minutenansage aber 301 s nicht", restzeitAnsageFaellig(301) === false && restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig genau 60 s ist faellig", restzeitAnsageFaellig(60) === true);
pruefe("RT3-04 restzeitAnsageFaellig 0 s ist NICHT faellig", restzeitAnsageFaellig(0) === false);
pruefe("RT3-05 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-06 erkenneKommando 'tschüss' mit Grossbuchstaben und Satzzeichen wird erkannt", erkenneKommando("TSCHÜSS!") !== null && erkenneKommando("TSCHÜSS!").typ === "app_ende");
pruefe("RT3-07 smartMenge gibt leere Mengenangabe zurueck wenn Einheit Stueck und Faktor 0.5 eine ganze Zahl ergibt", (() => { const ing = { qty: 2, unit: "Stück", name: "Eier" }; const result = smartMenge(ing, 0.5); return result === "1"; })());
pruefe("RT3-08 editierDistanz mit identischen leeren Strings ist 0", editierDistanz("", "") === 0);
pruefe("RT2-09 Zutat '10 Eier' - Zahl im Namen loest keine Fremdersetzung aus", (() => { const r = { ingredients: [{ name: "Eier", qty: 10, unit: "Stück" }, { name: "Mehl", qty: 200, unit: "g" }], steps: [{ text: "Vermengt 200 g Mehl mit 10 Eiern.", announce: "" }] }; const s = skaliereRezept(r, 1); return s.steps[0].text === "Vermengt 200 g Mehl mit 10 Eiern."; })());
pruefe("RT2-10 restzeitAnsageFaellig(300) liefert true (Grenzwert exakt 300 s ist Minutenansage)", restzeitAnsageFaellig(300) === true);
pruefe("RT2-11 restzeitAnsageFaellig(0) liefert false (kein Ansage-Trigger bei 0)", restzeitAnsageFaellig(0) === false);
pruefe("RT2-12 smartQty mit Faktor 0 stuerzt nicht ab und liefert einen String", (() => { const r = smartQty({ name: "Salz", qty: 5, unit: "g" }, 0); return typeof r === "string"; })());
pruefe("RT2-13 'Was kannst du alles?' ist ein Hilfe-Befehl (Fragezeichen am Ende)", erkenneKommando("Was kannst du alles?") !== null && erkenneKommando("Was kannst du alles?").typ === "hilfe");
pruefe("RT2-14 'Rezept:' ohne Suchwunsch (nur Doppelpunkt) liefert rezept mit leerem rest", (() => { const k = erkenneKommando("Rezept:"); return k !== null && k.typ === "rezept" && k.rest === ""; })());
pruefe("RT2-15 parseArtikelListe mit sehr langem Eintrag schneidet bei 50 Zeichen ab", (() => { const liste = parseArtikelListe("a".repeat(80)); return liste.length > 0 && liste[0].length <= 50; })());
pruefe("RT2-16 ttsSaeubern mit ausschliesslich Emojis liefert nicht-leeren Trim oder leeren String ohne Absturz", (() => { const r = ttsSaeubern("🍕🎉🥦"); return typeof r === "string"; })());
