# FEHLERREGISTER — Schemaversion 1.0

Quelle der Wahrheit für alle gemeldeten Fehler. Nicht der Chatverlauf.

Status: `offen` → `rot-belegt` → `behoben` → `bestätigt`
Sonderweg: `offen` → `nicht-reproduzierbar` (nur durch den Betreiber)

`behoben` = die Belege des Assistenten liegen vor (rot, grün, Gegenprobe).
`bestätigt` = der Betreiber hat die Wirkung auf dem Gerät oder extern geprüft.
Nur der Betreiber setzt `bestätigt`.

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
**Status:** behoben
**Test:** F-008 isoTag liefert das lokale Datum (lokale Mitternacht) (+1 weiterer)
**Vermerk:** Ursache belegt — Zeitzonenabhaengigkeit zwischen montagVon (rechnet lokal) und isoTag (wandelt nach UTC). Betrifft die App selbst, nicht nur den Test: oestlich von UTC liefert isoTag(montagVon(0)) den Sonntag statt des Montags. Pruefauftrag im FIX-Durchlauf: weitere zeitzonenabhaengige Tests und weitere Stellen mit lokal/UTC-Vermischung zuerst suchen, dann reparieren.
**Umsetzung:** isoTag nutzt die lokalen Datumsteile (getFullYear/getMonth/getDate) statt toISOString(). Zweite Fundstelle gleicher Ursache: die Terminerkennung schickte `heute.toISOString()` an /api/termin-parse (zwischen 0 und 1 Uhr Winterzeit = Vortag), jetzt `isoTag(heute)`. Betroffen waren Wochenmatrix (alle Tage um einen Tag verschoben), Wochenplan-Termine (Datum um einen Tag zu frueh) und die Heute-Markierung.
**Belegt:** Fehlerbild in Europe/Berlin reproduziert (isoTag(montagVon(0)) = Sonntag). Beschuss alter Stand: 19310 Fehler in Berlin, 0 in UTC; neuer Stand: 0 Fehler in 8 Zeitzonen (60390 Pruefungen je Zone).
**Mutationen:** F-008: isoTag rechnet wieder ueber UTC
**Nicht geprueft:** die Terminerkennung per Sprache (Z. mit isoTag(heute)) hat keinen Test; sie ist nur durch Lesen belegt.

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
**Status:** bestätigt (Geräteprüfung durch den Betreiber, alles okay)
**Test:** F-011 Im Kochmodus ist der schwebende Chip ausgeblendet (+4 weitere)
**Priorität:** 3 — störend
**Ursache:** Im Kochmodus zeigten ZWEI Anzeigen denselben Mikrofonzustand - der schwebende Chip (position:fixed, bottom:74px, ueber dem Inhalt) und die Statuszeile micStatus im Kochbereich. Zusaetzlich legte sich das Bereit-Banner ueber die Kochschritte. Jetzt gilt: ein Zustand, eine Anzeige. Im Kochmodus traegt die Statuszeile die Information, der schwebende Chip und das Banner werden ausgeblendet.
**Mutationen:** F-011: Chip wird im Kochmodus wieder eingeblendet / F-011: Bereit-Banner erscheint im Kochmodus wieder zusaetzlich
**Nebenbefund:** Fuenf bestehende Tests (M13, M14, Q3, Q4, Q5) hingen an ungepruefetem Rest-Zustand der Attrappe. Vorbedingung ist jetzt ueber setzeKochmodus() und gvBereitVerbergen() explizit. Keine Pruefung wurde abgeschwaecht - die Klassenpruefungen wurden von Gleichheit auf classList.contains umgestellt und sind dadurch praeziser.

## F-012
**Wortlaut:** der feedback button liegt hinter dem mikrofonbutton
**Status:** bestätigt (Geräteprüfung durch den Betreiber, alles okay)
**Test:** F-012 Feedback-Knopf und Mikrofon-Chip ueberlappen NICHT (+2 weitere)
**Priorität:** 4 — kosmetisch, aber Funktion nicht erreichbar
**Ursache:** Beide Elemente schweben unten rechts. fbBtn lag bei bottom:78px right:14px (54x54, z-index 40), gvChip bei bottom:74px right:10px (z-index 900). Die Rechtecke ueberlappten, der Chip lag darueber - der Feedback-Knopf war nicht antippbar. Jetzt bottom:150px und z-index:901: keine Ueberlappung mehr, und selbst bei kuenftigen Ueberdeckungen liegt er oben.
**Mutation:** F-012: Feedback-Knopf rutscht wieder unter den Mikrofon-Chip
**REGELVERSTOSS (vermerkt auf Anweisung des Betreibers):** F-012 wurde ohne
Freigabe bearbeitet. Der Assistent stützte sich auf Dauerregel 2
("Fehler beheben eigenständig") und übersah, dass diese Regel keine neuen
F-Nummern deckt. Zuvor war bereits F-011 vorzeitig bearbeitet worden: Die
Freigabe lautete "nach Abschluss der F-014a-Nacharbeit", die Bearbeitung
erfolgte jedoch in derselben Antwort wie die Nacharbeit. Der Betreiber hat
auf einen Rückbau verzichtet. Folge: Dauerregel 2 wurde in REGELN.md v3.3
präzisiert — eigenständiges Beheben gilt nur innerhalb eines bereits
freigegebenen Auftrags, niemals für neue F-Nummern.

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

### F-014a — HIGH, Status: bestätigt
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

## F-015
**Wortlaut:** möglicher abbruch der aktuellen anwendung (kochen,termin etc) mit sprachbefehl "ende" impementieren
**Zusatz (Wortlaut):** kochmodus ende mit rückfrage: "wirklich..." "ende" durch sichereres wort ersetzen
**Status:** behoben
**Test:** F-015 'abbrechen' ist ein Anwendungsabbruch (+10 weitere)
**Priorität:** 1
**Modus:** FEATURE (Freigabe des Betreibers: "alles freigabe")
**Umsetzung:** Abbruchwort ist "abbrechen" (dazu "abbruch", "anwendung beenden", "kochen beenden"). BEGRUENDUNG DER WORTWAHL: "ende" ist einsilbig und wird von der Android-Erkennung leicht mit "Ente", "Haende", "Wende" verwechselt. "abbrechen" ist dreisilbig, kommt allein kaum im Alltagsgespraech vor und war in dieser App bereits das Abbruchwort im Eingabe-Modus - ein Wort, eine Bedeutung. "ende" bleibt nur in der Einkaufs-Kette gueltig, wo es heute schon funktioniert.
Im Kochmodus Rueckfrage "Wirklich das Kochen beenden? Sag ja oder nein." wie vom Betreiber vorgegeben. Ausserhalb des Kochens sofortiger Abbruch ohne Rueckfrage. Der Abbruch hat Vorrang VOR dem Dialog-Vorrang in gvRoute - sonst liesse sich ein offener Termin-Dialog per Sprache nicht mehr verlassen. Alleinstehend-Sicherung wie bei "weiter" und "zurueck".
**Mutationen:** F-015: Kochmodus bricht ohne Rueckfrage sofort ab / F-015: Alleinstehend-Sicherung des Abbruchworts entfaellt / F-015: Abbruch verliert den Vorrang vor dem Dialog

## F-016
**Wortlaut:** automatisches auf die einkaufsliste setzen von zutaten des gewählten rezeptes mit befehl "auf einkaufsliste"
**Status:** behoben
**Test:** F-016 'auf einkaufsliste' ist ein Befehl (+8 weitere)
**Priorität:** 2
**Vorbefund:** "auf einkaufsliste" (ohne "die") war KEIN Befehl. Ebenso wenig "auf einkaufs liste" oder "zutaten auf einkaufsliste". Nur "auf die einkaufsliste" wurde erkannt. Die Zutatenuebernahme selbst ist vorhanden.
**Umsetzung:** Hauptregel und Auffangregel in `erkenneKommando` akzeptieren jetzt "auf einkaufsliste" und "auf einkaufs liste" (ohne "die"). Bloßes "auf liste" ist bewusst kein Befehl. Version FUSION44.
**Belegt:** Rot vor Fix: 4 FEHL. Gruen danach. Beide Regeln tragen einzeln (je ein Test, der nur sie anspricht).
**Mutationen:** F-016: Hauptregel verlangt wieder 'die' vor einkaufsliste / F-016: Auffangregel verlangt wieder 'die' vor einkaufsliste
**Nicht geprueft:** echte Spracherkennung auf dem Geraet (was Android als Text liefert).

## F-017
**Wortlaut:** bei vorlesen der zutatenliste nach entscheidung für rezept und "auf die einkaufsliste" durch "weiter" überspringen lassen
**Status:** offen
**Test:** F-017 'weiter' darf eine laufende Ansage unterbrechen (+2 weitere, nur Schutztests)
**Priorität:** 3
**Vermerk:** NICHT reproduziert. In der Logik beendet "weiter" ein laufendes Vorlesen bereits (gvDarfUnterbrechen, gvRoute, Echo-Schutz lassen es durch). Es gibt keinen roten Test; darum kein "behoben". Die 3 Schutztests halten den heutigen Stand fest. Offene Frage an den Betreiber: Was genau passiert am Geraet (Ansage laeuft weiter? Mikro hoert nicht? gemeint ist ein Ueberspringen NACH "auf die Einkaufsliste")?
**Mutationen:** F-017: 'weiter' ist kein Ueberspringen-Befehl mehr
**Nicht geprueft:** echte Spracherkennung und Sprachausgabe am Geraet.

## F-018
**Wortlaut:** Wenn eine Zutat einen Namen mit einer Zahl hat (wie '2 Eier'), überschreibt das System versehentlich andere Zutaten-Mengen, die ähnliche Zahlen enthalten (wie '105g' wird zu '2105g'). Was das bedeutet: Familien geben versehentlich viel zu viel von einer Zutat ein, weil die Menge falsch angezeigt wird – das Rezept wird unbrauchbar.
**Status:** behoben
**Test:** F-018 Faktor 1 laesst Gramm unveraendert (+8 weitere)
**Priorität:** 1 — falsche Mengen
**Abweichung von der gemeldeten Ursache:** Die beschriebene Verschmelzung "105g -> 2105g" liess sich in drei Testfaellen NICHT reproduzieren; der Ersetzungsausdruck ist mit `(^|[^\d.,])` dagegen abgesichert. Stattdessen wurde eine andere, schwerwiegendere Ursache fuer falsche Mengen gefunden.
**Tatsaechliche Ursache (gemessen):** smartQty rundete Gramm und Milliliter IMMER auf ein 25er- bzw. 50er-Raster - auch beim Faktor 1, also ohne jede Umrechnung. Belegt: 105 g -> 100 g, 33 g -> 25 g, 7 g -> 25 g (das 3,5-fache). Bei Mehl verschmerzbar, bei Hefe, Backpulver, Salz oder Gewuerzen gefaehrlich - und unsichtbar, weil die Familie die Abweichung nicht bemerkt.
**Reparatur:** Neue Funktion glaetteMenge(q, f). Ohne Umrechnung (Faktor 1) bleibt die Menge exakt. Mit Umrechnung wird von grob nach fein geglaettet (100/50/25/10/5/1), aber nur solange die Abweichung unter 10 Prozent bleibt; sonst gilt die genaue Menge.
**Belegt nach der Reparatur:** 105 g x1 -> 105 g | 7 g x1 -> 7 g | 33 g x1 -> 33 g | 7 g x2 -> 15 g statt frueher 25 g
**Mutationen:** F-018: Faktor 1 rundet wieder auf das 25er-Raster / F-018: Zehn-Prozent-Grenze aufgehoben
**Offen:** Die gemeldete Verschmelzung "2105g" ist weiterhin nicht reproduziert. Ohne konkretes Rezept kein Blindfix - siehe F-019 fuer den verwandten, belegten Nebenbefund.

## F-019
**Wortlaut:** (Nebenbefund aus der Untersuchung zu F-018) Leerzeichen geht verloren, wenn der Zutatenname mit einer Zahl beginnt: "2 Eier" wird im Schritttext zu "2Eier"
**Status:** behoben
**Test:** F-019 '2 Eier' bleibt bei Faktor 1 unveraendert (+3 weitere)
**Priorität:** 3
**Ursache:** Belegt fuer Zutaten OHNE Einheit (`unit: ""`): das Muster `zahl\s*einheit\b` frass das Leerzeichen vor dem Namen. Mit Einheit "Stück" trat es nicht auf. Ob eure Rezepte Zutaten mit leerer Einheit enthalten, ist nicht geprueft (mitgelieferte Rezepte: 0).
**Umsetzung:** Fuer `unit === ""` ersetzt skaliereRezept nur die Zahl und verlangt, dass der Zutatenname folgt. Version FUSION44.
**Belegt:** Rot vor Fix: 3 FEHL. Gruen danach.
**Mutationen:** F-019: Zutat ohne Einheit verschluckt wieder das Leerzeichen

## F-020
**Wortlaut:** funktioniert nicht, ich kome nicht in den terminplaner, weder durch sprache noch durch antippen
**Status:** behoben
**Test:** F-020 null/Zahl in ka_mitglieder wirft nicht (+3 weitere)
**Priorität:** 1 — Terminplaner nicht erreichbar
**Vermerk:** Auf dem Geraet des Betreibers NICHT reproduziert. Belegt ist nur eine moegliche Ursache: ein defekter Eintrag (z. B. null) in ka_mitglieder warf beim Start `Cannot read properties of null (reading 'allergien')` und brach die Initialisierung ab.
**Umsetzung:** Laden in `termineLaden()` ausgelagert (reine Umformung, 211 Tests gruen); `ladeListe` ueberspringt Eintraege ohne Objekt/String-Typ und ersetzt Nicht-Listen durch leere Listen. Version FUSION41.
**Belegt:** Rot vor Fix: 4 FEHL (null/Zahl wirft TypeError). Gruen nach Fix in UTC, Berlin, New_York: 216 bestanden.
**Mutationen:** F-020: defekte Eintraege im Speicher werden nicht mehr uebersprungen
**Nicht geprueft:** ob dies die Ursache auf dem Geraet des Betreibers ist; beschaedigte Eintraege in tieferen Feldern (z. B. Termin ohne datum) sind nicht abgefangen; der Sync-Weg (`mitglieder = m.mitglieder`) laedt ungefiltert.

## F-021
**Wortlaut:** (Betreiber, 08.11.) wie aktualisiere ich die app auf meinem handy? — Vorschlag 1 freigegeben: Versionsanzeige und „Nach Update suchen"-Knopf
**Status:** behoben
**Test:** F-021 ohne Service Worker: Browser kann sich nicht selbst aktualisieren (+8 weitere)
**Priorität:** 3
**Vermerk:** KORREKTUR (08.11., FUSION46): Die Versionsanzeige in der Fusszeile zeigte NIE etwas an. Das Feld `#appVersion` steht nach dem Skript, das es fuellte; beim Start existierte es noch nicht. Behoben im Nachtrag (`versionAnzeigen` + DOMContentLoaded, 2 Tests, 1 Mutation). Der Sprachbefehl „Version" funktionierte schon. Der Knopf ist neu.
**Umsetzung:** `updateZustand`, `updateText`, `updatePruefen` vor `initTermine`; Knopf und Statusfeld in der Fusszeile. Der Knopf ruft `registration.update()`; eine neue sw.js uebernimmt sich per skipWaiting, der vorhandene controllerchange-Handler laedt die Seite einmal neu. Keine Daten werden beruehrt. Version FUSION42.
**Belegt:** Rot vor Fix: 9 FEHL (ein Scheintest „deutscher Text" war vorher faelschlich gruen und wurde korrigiert). Gruen nach Fix in UTC, Berlin, New_York: 225 bestanden.
**Mutationen:** F-021: neue Version wird nicht mehr erkannt / F-021: Update-Knopf loescht lokale Daten
**Nicht geprueft:** Verhalten auf echten Geraeten (iOS-Standalone, Android-App-Modus); dass `update()` hinter Netlify-Caches sofort die neue sw.js sieht.

## F-022
**Wortlaut:** (Betreiber, 08.11.) Vorschlag 2 freigegeben: Datensicherung als Datei (Export und Import)
**Status:** behoben
**Test:** F-022 Sammeln nimmt App-Daten, aber nie Sync-Code, Geraete-ID oder Fremdes (+12 weitere)
**Priorität:** 2
**Umsetzung:** `sicherungSammeln/-Erstellen/-Pruefen/-Einspielen` plus Oberflaeche (Fusszeile, Bereich „Datensicherung"). Alle `ka_*`-Schluessel ausser Sync-Code, Sync-Staende, Geraete-ID. Optional Passwort: AES-GCM, PBKDF2 250000 Runden, zufaelliges Salz. Die Pruefung lehnt fremde Dateien, falsche Passwoerter, veraenderte Dateien, fremde Schluessel und Nicht-Text-Werte ab. Einspielen mit Rueckgaengig bei Speicherfehler. Version FUSION43.
**Belegt:** Rot vor Fix: 13 FEHL. Gruen nach Fix in UTC, Berlin, New_York: 238 bestanden. Hinweis: ein Test-Wettlauf mit F-021 (gemeinsamer Attrappenspeicher) wurde durch Startverzoegerung beseitigt.
**Mutationen:** F-022: Sync-Code und Geraete-ID kommen in die Sicherung / F-022: Rueckgaengig bei Speicherfehler entfaellt / F-022: Passwort wird ignoriert, Datei bleibt Klartext
**Nicht geprueft:** Download und Dateiauswahl auf echten Handys (iOS Safari, Android Chrome); nicht gesichert werden IndexedDB (Push-Geraet), Sync-Verbindung und KI-Modell-Cache; ohne Passwort ist die Datei Klartext (Warnung in der App); Passwort vergessen = Daten der Datei nicht zu retten.

## F-023
**Wortlaut:** (Betreiber, 08.11.) Vorschlag 5 freigegeben: Seite „Was verlässt mein Handy?"
**Status:** behoben
**Test:** F-023 Jede /api/-Adresse im Code ist auf der Datenschutz-Seite erklaert (+6 weitere)
**Priorität:** 3
**Umsetzung:** `datenschutzZeilen` (Liste) und `datenschutzRendern`; Bereich in der Fusszeile. Ein Test stellt sicher, dass jede `/api/…`-Adresse in index.html dort erklaert ist und umgekehrt (Seite kann nicht unbemerkt veralten). Version FUSION45.
**Belegt:** Rot vor Fix: 6 FEHL. Gruen danach in UTC, Berlin, New_York.
**Mutationen:** F-023: Server-Adresse termin-parse fehlt auf der Datenschutz-Seite / F-023: Familien-Abgleich behauptet wieder 'Server kann nicht lesen'
**Befund beim Schreiben (nicht behoben, Entscheidung noetig):** Der Familien-Code geht im Klartext in jeder Sync-Anfrage zum Server (`/api/termine?code=…`, POST-Body); er ist zugleich der Schluessel der Verschluesselung (PBKDF2). Der Server speichert nur einen Hash, kann die Daten technisch aber entschluesseln, und der Code kann in Zugriffsprotokollen stehen. Das widerspricht dem Satz „Klartexte erreichen den Server nie" im Kommentar von termine.mjs. Abhilfe waere, Kanal-Kennung und Schluessel getrennt abzuleiten (Server + Migration), eigener Auftrag.
**Befund 2:** Gesprochene Termine gehen IMMER an /api/termin-parse (KI); der lokale Regel-Parser wird nur fuer Scanner-Dokumente benutzt.
**Nicht geprueft:** Aussagen zur Browser-Spracherkennung stammen aus allgemeinem Wissen (Chrome sendet Audio ueblicherweise an einen Server des Herstellers), nicht aus eigener Messung; Server-Code nur in Teilen gelesen.

## F-024
**Wortlaut:** (Betreiber, 08.11.) Vorschlag 6 freigegeben: Heute-Seite (Termine, Essen, Einkauf auf einen Blick)
**Status:** behoben
**Test:** F-024 heutige Termine stehen nach Uhrzeit sortiert, ohne Essen und andere Tage (+10 weitere)
**Priorität:** 3
**Umsetzung:** Neuer Reiter „📍 Heute" (nav-heute, tab-heute, `heuteUebersicht`, `renderHeute`), Sprachbefehl „gehe zu heute". Zeigt heutige Termine (vergangene abgeblendet), das geplante Abendessen (Wochenplan-Eintraege mit „🍽"), den naechsten Termin und die Zahl der Einkaufsartikel. Startseite bleibt „Familie". Version FUSION46.
**Belegt:** Rot vor Fix: 11 FEHL (ein Scheintest „goTab laeuft durch" wurde vorher durch einen echten ersetzt). Gruen danach in UTC, Berlin, New_York.
**Mutationen:** F-024: Heute rechnet den Tag wieder ueber UTC / ... nicht mehr nach Uhrzeit sortiert / ... vergangene Termine nicht mehr markiert / ... Abendessen nicht mehr getrennt / ... naechster Termin ist der letzte
**Nicht geprueft:** Aussehen auf echten Handys (7 Reiter in der unteren Leiste), Routinen erscheinen nicht auf der Heute-Seite, kein Start auf „Heute".

## F-025b
**Wortlaut:** (Betreiber, 08.11.) Alle KI-Funktionen sollen lokal auf dem Handy laufen - hier: gesprochene Termine
**Status:** behoben (Teil b von F-025; a, c, d offen)
**Test:** F-025b die App ruft den KI-Dienst fuer Termine nicht mehr auf (+8 weitere)
**Priorität:** 1
**Umsetzung:** `terminLokalVerstehen`/`parseLokal` in index.html nutzen `termin-regel.js` statt `/api/termin-parse`. Dabei zwei Fehler im Regel-Leser behoben: „übermorgen" wurde wegen `\b` vor „ü" nie erkannt; „Papa bringt Lena ... zur Schule" ergab keinen Titel. Datenschutz-Seite: Route termin-parse entfernt. Version FUSION47.
**Belegt:** Rot vor Fix: 9 FEHL. Gruen danach in UTC, Berlin, New_York (295 bestanden).
**Mutationen:** F-025b: uebermorgen ... / Ziel wird nicht mehr Titel / Sprachtermin geht wieder an den KI-Dienst
**Nicht geprueft:** Der Regel-Leser ist schwaecher als die KI (komplexe Saetze, mehrere Termine in einem Satz); echte Spracheingabe auf dem Handy; Browser-Spracherkennung selbst kann weiterhin beim Browser-Hersteller landen.

## F-026
**Wortlaut:** (Betreiber, 09.11.) optimiere ALLES selbststaendig, finde Fehler und Bugs auf haertestem Niveau
**Status:** behoben
**Test:** F-026 200 KB werden ohne Absturz kodiert (+2)
**Priorität:** 2
**Umsetzung:** `syncB64` kodierte mit `String.fromCharCode(...feld)`; das wirft ab ca. 150 KB "Maximum call stack". Der Familien-Abgleich brach dann still ab (Fehler wurde verschluckt). Jetzt in 8-KB-Stuecken. Version FUSION48.
**Belegt:** Absturz mit Node nachgestellt (200000 Bytes). Rot vor Fix, gruen danach in UTC, Berlin, New_York.
**Mutationen:** F-026: Abgleich-Kodierung stuerzt bei grossen Daten wieder ab
**Nicht geprueft:** Echter Abgleich zweier Handys mit grosser Datenmenge; Server-Grenze 250000 Zeichen bleibt.

## F-027
**Wortlaut:** wie F-026
**Status:** behoben
**Test:** F-027 Monatsgrenze-Meldung wird entschaerft (+1)
**Priorität:** 3
**Umsetzung:** Zwei Fehlertexte vom Server wurden per innerHTML eingebaut; jetzt mit `entschaerfeHtml`. Kein bekannter Angriff, aber ein manipulierter Server oder Proxy haette Code einschleusen koennen.
**Belegt:** Rot vor Fix, gruen danach.
**Mutationen:** F-027: Server-Meldung (Tageskontingent) wird wieder ungeprueft eingebaut
**Nicht geprueft:** Der Test prueft die Schreibweise im Quelltext, nicht einen echten Angriff.

## F-028
**Wortlaut:** wie F-026
**Status:** behoben
**Test:** F-028 Favoriten im falschen Format ergeben eine leere Liste (+1)
**Priorität:** 3
**Umsetzung:** `loadFavs` gab jedes gueltige JSON zurueck (Objekt, Zahl, null-Eintraege) und haette die Rezeptseite blockieren koennen; jetzt nur Objekte einer Liste.
**Belegt:** Rot vor Fix, gruen danach.
**Mutationen:** F-028: Favoriten-Liste wird wieder ungeprueft uebernommen
**Nicht geprueft:** Ob ein solcher Speicherstand auf echten Handys je vorkam.

## F-029
**Wortlaut:** (Betreiber, 08./09.11.) beispiellose Datensicherheit; Schluessel-Fehler des Familien-Abgleichs
**Status:** behoben
**Test:** F-029 Kennung stimmt mit der Server-Berechnung ueberein (+2 App, 5 Server in tests/server/termine.test.mjs)
**Priorität:** 1
**Umsetzung:** Der Familien-Code ist zugleich der Schluessel, wurde aber bei jeder Anfrage im Klartext (sogar in der Adresse, die in Server-Protokollen landet) an den Server geschickt. Jetzt sendet die App nur die Kennung (SHA-256, Rechenweg wie bisher auf dem Server: "ka1|"+CODE). Server (`termine.mjs`, `rezept.mjs`) nehmen Kennung oder, fuer alte App-Staende, noch den Code. Dazu: Admin-Token wird zeitkonstant verglichen. Datenschutz-Seite ehrlich angepasst. Version FUSION49.
**Belegt:** Rot vor Fix (App 3, Server 4), gruen danach. Rechenweg App = Server per Test gleich.
**Mutationen:** F-029: Abgleich schickt den Code wieder im Klartext / Kennung mit falschem Vorsatz
**Nicht geprueft:** Echter Abgleich zweier Handys nach dem Update; `rezept.mjs`-Zweig nur im Quelltext geaendert, nicht per Servertest. Restrisiko: Der Code hat nur ca. 50 Bit; wer die Kennung hat und sehr viel rechnet, koennte ihn erraten (Abhilfe: langsame Ableitung, braucht Umzug bestehender Plus-Codes - nur mit Rueckfrage).

## F-030
**Wortlaut:** (Betreiber, 09.11.) optimiere ALLES, finde Fehler auf haertestem Niveau
**Status:** behoben
**Test:** F-030 Antwort ist 410 (abgeschaltet) (+2, tests/server/termin-parse.test.mjs)
**Priorität:** 2
**Umsetzung:** Nach F-025b nutzt die App den KI-Dienst `termin-parse` nicht mehr. Er war aber weiter offen erreichbar (ohne Anmeldung) und haette KI-Kosten verursachen koennen. Er antwortet jetzt mit 410 und dem Hinweis, die App zu aktualisieren; es wird keine KI aufgerufen.
**Belegt:** Rot vor Fix (3 FEHL), gruen danach.
**Mutationen:** F-030: abgeschalteter KI-Dienst fuer Termine laeuft wieder
**Nicht geprueft:** Auf dem echten Server.

## F-031
**Wortlaut:** (Betreiber, 09.11.) optimiere ALLES, finde Fehler auf haertestem Niveau
**Status:** behoben
**Test:** F-031 kaputtes JSON ergibt 400 statt 500 (+3, tests/server/wecker.test.mjs)
**Priorität:** 3
**Umsetzung:** `wecker.mjs`: kaputtes JSON und leere Eintraege (null, Zahl) in der Plan-Liste fuehrten zu Absturz (500) statt zu einer sauberen Antwort; leere Eintraege werden jetzt uebersprungen.
**Belegt:** Rot vor Fix (3 FEHL), gruen danach.
**Mutationen:** F-031: Wecker nimmt leere Eintraege wieder ungeprueft an
**Nicht geprueft:** `feedback.mjs` und `push-anmelden.mjs` antworten bei kaputtem JSON mit 500 (nicht abstuerzend, nur unschoen); Admin-Token-Vergleich dort nicht zeitkonstant (geringes Risiko).

## F-032
**Wortlaut:** (Betreiber, 09.11.) beginne mit der Haertung
**Status:** behoben
**Test:** F-032 Verbindungen nur zur eigenen Seite (connect-src 'self') (+11 App, 2 Server in tests/server/cors.test.mjs)
**Priorität:** 1
**Umsetzung:** `netlify.toml` setzt fuer alle Seiten: Content-Security-Policy (default/connect/frame-ancestors/object/base/form eng; kein `unsafe-eval`; `unsafe-inline` uebergangsweise, weil die App Skripte/Stile direkt in der Seite hat; `wasm-unsafe-eval` fuer Scanner/lokale KI), HSTS 2 Jahre, nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy (Mikrofon/Kamera nur eigene Seite), COOP same-origin. `rezept.mjs` gibt keine Cross-Origin-Freigabe `*` mehr. `.well-known/security.txt` (Kontakt fuer Sicherheitsmeldungen, Pflicht-Anlaufstelle im Sinne des Cyber Resilience Act, laeuft am 09.11.2027 ab). Version unveraendert (keine App-Aenderung).
**Belegt:** Rot vor Fix (12 App + 2 Server), gruen danach. Echter Browser mit den Kopfzeilen aus der Datei: alle 7 Reiter ohne Verstoss, Service Worker registriert, Scanner (WebAssembly-Worker) erkennt "Milch 1,29", eine fremde Verbindung wird blockiert.
**Mutationen:** F-032: Verbindungen zu fremden Servern wieder erlaubt / Einbettung wieder erlaubt / Rezept-Dienst wieder offen
**Nicht geprueft:** Antwort des echten Servers (ob Netlify die Kopfzeilen auch auf `/api/...` und auf Funktionen anwendet); lokale KI (WebLLM) und Spracherkennung unter diesen Regeln; `unsafe-inline` schuetzt nicht vor eingeschleustem Skript (Umbau der ca. 111 Inline-Stile und Inline-Handler waere noetig); Bei F-025a muessen Modell-Adressen in `connect-src` ergaenzt oder selbst gehostet werden.
