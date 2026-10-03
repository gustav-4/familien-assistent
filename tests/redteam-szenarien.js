// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-10-03T05:56:27.324Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 Zutat mit Zahl im Namen: '2 Eier' ersetzt nicht '12 Eier' im Schritt", (() => { const r = { ingredients: [{ name: "Eier", qty: 2, unit: "Stück" }], steps: [{ text: "Nehmt 12 Eier und verrührt sie." }] }; const s = skaliereRezept(r, 1); return s.steps[0].text.includes("12"); })());
pruefe("RT3-02 restzeitAnsageFaellig: exakt 300 s ist Minutenansage (300 % 60 === 0)", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig: 121 s liegt ueber 120er-Raster, keine Ansage", restzeitAnsageFaellig(121) === false);
pruefe("RT3-04 smartQty: Faktor 0 erzeugt keine negative oder NaN-Menge fuer Liter", (() => { const r = smartQty({ name: "Wasser", qty: 0.5, unit: "Liter" }, 0); return !r.includes("NaN") && !r.includes("-"); })());
pruefe("RT3-05 parseArtikelListe: Eingabe nur aus Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke").length === 0);
pruefe("RT3-06 erkenneKommando: 'rezept 42 Tomaten Auflauf' hat 'rest' ohne Floskel", (() => { const k = erkenneKommando("rezept 42 Tomaten Auflauf"); return k !== null && k.typ === "rezept" && k.rest === "42 Tomaten Auflauf"; })());
pruefe("RT3-07 ttsSaeubern: Verschachtelung mit leerem inneren Klammerpaar hinterlaesst keine Klammern", (() => { const r = ttsSaeubern("Hinweis (Tipp () hier)"); return !r.includes("(") && !r.includes(")"); })());
pruefe("RT3-08 personenAequivalent: Alter exakt 14 weiblich gibt 0.9, nicht 1.1", personenAequivalent({ alter: 14, geschlecht: "w" }) === 0.9);
pruefe("RT3-01 Zutat deren Name eine Zahl enthaelt wird nicht falsch ersetzt", (() => { const ing = { name: "Omega-3-Öl", qty: 3, unit: "EL" }; const r = { ingredients: [ing], steps: [{ text: "Gib 3 EL Omega-3-Öl dazu.", announce: "" }] }; const s = skaliereRezept(r, 2); return s.steps[0].text.includes("Omega-3") && !s.steps[0].text.startsWith("Gib 6 EL 6 EL"); })());
pruefe("RT3-02 restzeitAnsageFaellig Grenzwert exakt 300 s ist Minutenansage", restzeitAnsageFaellig(300) === true);
pruefe("RT3-03 restzeitAnsageFaellig 299 s ist KEIN 2-Minuten-Takt aber auch keine Minutenansage", restzeitAnsageFaellig(299) === false);
pruefe("RT3-04 smartQty Faktor 0 stuerzt nicht ab und liefert 0 oder sinnvollen Wert", (() => { try { const r = smartQty({ qty: 200, unit: "g", name: "Mehl" }, 0); return typeof r === "string"; } catch(e) { return false; } })());
pruefe("RT3-05 parseArtikelListe mit nur Floskeln ergibt leere Liste", parseArtikelListe("bitte und danke und ok").length === 0);
pruefe("RT3-06 erkenneKommando 'rezept 42 kekse' hat Suchwunsch '42 kekse'", (() => { const k = erkenneKommando("rezept 42 kekse"); return k !== null && k.typ === "rezept" && k.rest === "42 kekse"; })());
pruefe("RT3-07 ttsSaeubern mit nur Sonderzeichen und Emojis stuerzt nicht ab und gibt String zurueck", (() => { const r = ttsSaeubern("🍕🎉✓▪"); return typeof r === "string"; })());
pruefe("RT3-08 montagVon mit sehr grossem Offset stuerzt nicht ab und liefert einen Montag", (() => { try { const d = montagVon(9999); return d.getDay() === 1; } catch(e) { return false; } })());
