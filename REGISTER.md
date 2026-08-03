# FEHLERREGISTER — Schemaversion 1.0

Quelle der Wahrheit für alle gemeldeten Fehler. Nicht der Chatverlauf.

Status: `offen` → `rot-belegt` → `behoben`
Sonderweg: `offen` → `nicht-reproduzierbar` (nur durch den Betreiber)

Testpflicht: `rot-belegt` und `behoben` erfordern einen Test, dessen Name
mit der ID beginnt. `offen` und `nicht-reproduzierbar` nicht.

---

## F-001
**Wortlaut:** wenn ich bei einkaufsliste artikel hinzufügen will, hört app eigene ansage mit und setzt sie auf liste
**Status:** behoben
**Test:** F-001 Eigene Rueckfrage landet NICHT als Artikel auf der Liste
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-002
**Wortlaut:** sich wiederholender aktivton des mikrofones nervt und soll kpl. abgestellt werden
**Status:** behoben
**Test:** F-002 Erste Minute Stille hoechstens 8 Neustarts
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-003
**Wortlaut:** weiterhin verschwindet die angezeigte zutatenliste ,während sie noch vorgelesen wird.. dass muss synchronisiert werden
**Status:** behoben
**Test:** F-003 Sprechblase haelt laenger als der alte 15-Sekunden-Deckel
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-004
**Wortlaut:** weiterhin funktioniert "auf die einkaufsliste" nach rezeptwahl oft nicht
**Status:** behoben
**Test:** F-004 Auffangregel das kommt auf die liste
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-005
**Wortlaut:** in der vergangenheit konnte rezeptrecherche oft nicht ausgeführt werden: serverfehler 501 oder 504
**Status:** behoben
**Test:** F-005 JEDER Netzzugriff hat ein Zeitlimit (tests/server/ausschluss.test.mjs)
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-006
**Wortlaut:** ausserdem weiss user nicht, wann app bereit für speziellen sprachbefehl (z.b. rezeptrecherche)
**Status:** behoben
**Test:** F-006 Eingabe-Modus spielt genau EINEN Bereit-Ton
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-007
**Wortlaut:** erinnerung der app: sage fertig .... im ca 15 sec takt sollte schon vorher behoben sein und auf max 2x pro min geändert
**Status:** behoben
**Test:** F-007 Erste Erinnerung bei drei Vierteln der Schrittdauer
**Vermerk:** Altbestand vor v3.0, roter Beweis ersatzweise durch Mutationslauf erbracht.

## F-008
**Wortlaut:** FEHL L20 Wochenstart ist ein Montag - 168 bestanden, 1 fehlgeschlagen auf Windows
**Status:** offen
**Test:** —
**Vermerk:** Ursache belegt — Zeitzonenabhaengigkeit zwischen montagVon (rechnet lokal) und isoTag (wandelt nach UTC). Betrifft die App selbst, nicht nur den Test: oestlich von UTC liefert isoTag(montagVon(0)) den Sonntag statt des Montags. Pruefauftrag im FIX-Durchlauf: weitere zeitzonenabhaengige Tests und weitere Stellen mit lokal/UTC-Vermischung zuerst suchen, dann reparieren.

## F-009
**Wortlaut:** wenn ich app öffne und "rezepte" sage, springt anwendung nicht zu rezept
**Nachmeldung (Wortlaut):** wenn ich anwendung "einkaufsliste" nutze und sprachbefehl "rezepte" oder "rezept recherchieren" sage, kommt immernoch "rezepte ist auf der liste" und die anwendung wechselt nicht zu rezeptrecherche!
**Status:** behoben
**Test:** F-009 'rezepte' ist ein Befehl (+5 weitere)
**Priorität:** 2 — Haupteinstieg blockiert
**Ursache:** erkenneKommando kannte nur den Singular "rezept". Die Mehrzahl "rezepte" war ueberhaupt kein Befehl und fiel in der Einkaufs-Kette als Artikel durch. Zusaetzlich wurden Fuellverben ("recherchieren", "suchen") als Suchwunsch missdeutet - die App suchte dann Rezepte zum Stichwort "recherchieren".
**Mutationen:** F-009: Mehrzahl 'rezepte' wird nicht mehr erkannt / F-009: Fuellverben gelten wieder als Suchwunsch
**Verlinkung:** Die Nachmeldung wurde zunaechst F-013 zugeordnet. F-013 (Befehlsvorrang in der Kette) war korrekt behoben, griff hier aber nicht, weil "rezepte" gar nicht als Befehl erkannt wurde.

## F-010
**Wortlaut:** wenn termine falsch gesagt wurden o. nicht mehr aktuell sind soll eine funktion: sprachbefehl ... termin (z.b. papa donnerstag reiten) löschen integriert werden
**Status:** offen
**Test:** —
**Priorität:** 5 — neues Verhalten, Modus FEATURE

## F-011
**Wortlaut:** das mikrofonsignal überschneidet sich mit den jeweilig aktuellen anwendungen (z.b. kochen) und stört und verwirrt dort
**Status:** behoben
**Test:** F-011 Im Kochmodus ist der schwebende Chip ausgeblendet (+4 weitere)
**Priorität:** 3 — störend
**Ursache:** Im Kochmodus zeigten ZWEI Anzeigen denselben Mikrofonzustand - der schwebende Chip (position:fixed, bottom:74px, ueber dem Inhalt) und die Statuszeile micStatus im Kochbereich. Zusaetzlich legte sich das Bereit-Banner ueber die Kochschritte. Jetzt gilt: ein Zustand, eine Anzeige. Im Kochmodus traegt die Statuszeile die Information, der schwebende Chip und das Banner werden ausgeblendet.
**Mutationen:** F-011: Chip wird im Kochmodus wieder eingeblendet / F-011: Bereit-Banner erscheint im Kochmodus wieder zusaetzlich
**Nebenbefund:** Fuenf bestehende Tests (M13, M14, Q3, Q4, Q5) hingen an ungepruefetem Rest-Zustand der Attrappe. Vorbedingung ist jetzt ueber setzeKochmodus() und gvBereitVerbergen() explizit. Keine Pruefung wurde abgeschwaecht - die Klassenpruefungen wurden von Gleichheit auf classList.contains umgestellt und sind dadurch praeziser.

## F-012
**Wortlaut:** der feedback button liegt hinter dem mikrofonbutton
**Status:** behoben
**Test:** F-012 Feedback-Knopf und Mikrofon-Chip ueberlappen NICHT (+2 weitere)
**Priorität:** 4 — kosmetisch, aber Funktion nicht erreichbar
**Ursache:** Beide Elemente schweben unten rechts. fbBtn lag bei bottom:78px right:14px (54x54, z-index 40), gvChip bei bottom:74px right:10px (z-index 900). Die Rechtecke ueberlappten, der Chip lag darueber - der Feedback-Knopf war nicht antippbar. Jetzt bottom:150px und z-index:901: keine Ueberlappung mehr, und selbst bei kuenftigen Ueberdeckungen liegt er oben.
**Mutation:** F-012: Feedback-Knopf rutscht wieder unter den Mikrofon-Chip
**Nebenbefund:** Der erste Testentwurf las z-index mit px-Einheit aus und lieferte deshalb null. Ausdruck korrigiert - die Pruefung wurde dadurch schaerfer, nicht schwaecher.

## F-013
**Wortlaut:** befehl wie abbrechen und tschüss werden auf liste gesetzt und nicht ausgeführt
**Status:** behoben
**Test:** F-013 'abbrechen' landet NICHT auf der Einkaufsliste (+4 weitere)
**Priorität:** 1 — nicht bedienbar
**Ursache:** einkaufKetteEingabe pruefte nur istKetteEnde und istZurueck; alles andere fiel ungeprueft an einkaufHinzufuegen durch. Jetzt hat die Befehlserkennung Vorrang.
**Mutationen:** F-013: Befehle haben in der Einkaufs-Kette keinen Vorrang mehr / F-013: Abbruchwort wird in der Kette nicht mehr erkannt

## F-014
**Wortlaut:** SonarCloud meldet nach FUSION30 insgesamt 9 Security-Issues, davon 1 High.
**Status:** behoben
**Test:** F-014a pipeline.js stellt pruefeSkriptSyntax bereit (+9 weitere, tests/server/pipeline.test.mjs)
**Priorität:** 1 — Sicherheit

### F-014a — HIGH, behoben und extern bestaetigt
`tests/pipeline.js:151` — "Make sure that this dynamic injection or execution of code is safe."
Die Stufe-1-Syntaxpruefung benutzte `new Function(code)` und erzeugte damit aus
fremdem Quelltext ein aufrufbares Objekt. `pipeline.js` ist die Abnahmestelle und
laeuft in der CI mit Schreibrechten. Ersetzt durch `new vm.Script(code)`: gleiche
Pruefschaerfe, kein ausfuehrbares Artefakt, keine aufrufbare Rueckgabe.
Belegt: absichtlicher Syntaxfehler in index.html wird weiterhin erkannt
("Statische Evidenz - ROT ... Skriptblock 3: Unexpected token '{'").
Nebenbefund mitbehoben: `require(pipeline.js)` startete den kompletten Lauf -
die Abnahmestelle war selbst nicht pruefbar. Jetzt Trennung ueber `require.main`.

**Nacharbeit (Scan nach FUSION32):** SonarCloud meldete den Befund erneut in
Zeile 61 - `vm.Script` faellt unter DIESELBE Regel wie `new Function`. Dritte
und endgueltige Fassung: Der Code wird im eigenen Prozess ueberhaupt nicht mehr
angefasst. Er wandert in eine temporaere Datei, `node --check` prueft sie im
KINDPROZESS. Kein Code-Konstruktor, keine Ausfuehrung, kein gemeinsamer
Speicher. Gleiche Pruefschaerfe, da derselbe Parser. Der Test verbietet jetzt
ausdruecklich Function, vm und eval in ausfuehrbarem Code von pipeline.js.
Pruefschaerfe erneut belegt: "Statische Evidenz - ROT ... Skriptblock 3:
SyntaxError: Unexpected token '{'".

**Externe Bestaetigung (SonarCloud-Scan nach FUSION33):** 0 Security High,
0 Critical. Verbleibend nur die 8 bekannten Low aus F-014b (100 % Low,
Rating B). Der Vorbehalt "[ungeprueft, bitte nach dem Scan bestaetigen]"
ist damit erledigt.

### F-014b — 8x LOW, kein Risiko
Alle acht liegen ausschliesslich in Testwerkzeugen. Weder `index.html` noch
`sw.js` noch `netlify/functions/` sind betroffen — kein Fund erreicht die
ausgelieferte App oder den Server.

| Datei | Zeile | Meldung | Begruendung |
| --- | --- | --- | --- |
| tests/melde.mjs | 91 | log user-controlled data | Protokolliert den HTTP-Status der eigenen Meldeschnittstelle. Laeuft nur im CI, Ausgabe geht ins Lauf-Protokoll, nicht an Nutzer. |
| tests/mutation.js | 305 | PATH variable | `execFileSync("node", ...)` ohne gesetztes PATH. Laeuft in der CI mit definierter Umgebung; ein Angreifer mit Schreibrecht auf PATH haette ohnehin Vollzugriff. |
| tests/mutation.js | 349 | PATH variable | wie oben |
| tests/redteam.mjs | 136 | log user-controlled data | Protokollfunktion des Testwerkzeugs, Daten stammen aus dem eigenen Repository. |
| tests/redteam.mjs | 202 | PATH variable | wie mutation.js:305 |
| tests/redteam.mjs | 252 | log user-controlled data | Rundenprotokoll des Testwerkzeugs. |
| tests/redteam.mjs | 282 | PATH variable | wie mutation.js:305 |
| tests/reparatur.mjs | 176 | log user-controlled data | Gibt die Begruendung eines Reparaturvorschlags im CI-Protokoll aus. |

Bewertung: Risiko akzeptiert, keine Aenderung. Wird erneut geprueft, falls eines
dieser Werkzeuge jemals ausserhalb der CI oder mit Fremddaten laufen soll.
