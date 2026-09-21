// Automatisch erzeugt vom Red-Team (claude-fable-5) am 2026-09-21T06:18:37.573Z
// NICHT von Hand pflegen - wird bei jedem Lauf ueberschrieben.
pruefe("RT3-01 'auf die liste milch' traegt den Artikel ein statt ihn in der Auffangregel zu verlieren", (function(){var k=erkenneKommando("auf die liste milch");return !!k && k.typ==="einkauf" && k.rest==="milch";})());
pruefe("RT3-02 Frage mit abgeschnittenem Fragezeichen ist KEIN Einkaufsbefehl (Guard prueft erst NACH dem Strippen)", erkenneKommando("Kaufen Kinder gerne Süßigkeiten?") === null);
pruefe("RT3-03 'Danke, das war's' mit Komma beendet die Kette", istKetteEnde("Danke, das war's") === true);
pruefe("RT3-04 Mehrere Floskeln hintereinander werden ALLE entfernt: 'bitte noch milch' -> 'milch'", JSON.stringify(parseArtikelListe("bitte noch milch")) === JSON.stringify(["milch"]));
pruefe("RT3-05 Geschlecht 'W' in Grossschreibung zaehlt wie 'w' (Frau, 30 -> 0.85)", personenAequivalent({alter: 30, geschlecht: "W"}) === 0.85);
pruefe("RT3-06 isoTag(montagVon(0)) ist auch in deutscher Zeitzone ein Montag (toISOString kippt lokal Mitternacht auf Sonntag)", new Date(isoTag(montagVon(0)) + "T12:00:00Z").getUTCDay() === 1);
