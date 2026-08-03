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
**Status:** offen
**Test:** —
**Priorität:** 2 — Haupteinstieg blockiert

## F-010
**Wortlaut:** wenn termine falsch gesagt wurden o. nicht mehr aktuell sind soll eine funktion: sprachbefehl ... termin (z.b. papa donnerstag reiten) löschen integriert werden
**Status:** offen
**Test:** —
**Priorität:** 5 — neues Verhalten, Modus FEATURE

## F-011
**Wortlaut:** das mikrofonsignal überschneidet sich mit den jeweilig aktuellen anwendungen (z.b. kochen) und stört und verwirrt dort
**Status:** offen
**Test:** —
**Priorität:** 3 — störend

## F-012
**Wortlaut:** der feedback button liegt hinter dem mikrofonbutton
**Status:** offen
**Test:** —
**Priorität:** 4 — kosmetisch, aber Funktion nicht erreichbar

## F-013
**Wortlaut:** befehl wie abbrechen und tschüss werden auf liste gesetzt und nicht ausgeführt
**Status:** behoben
**Test:** F-013 'abbrechen' landet NICHT auf der Einkaufsliste (+4 weitere)
**Priorität:** 1 — nicht bedienbar
**Ursache:** einkaufKetteEingabe pruefte nur istKetteEnde und istZurueck; alles andere fiel ungeprueft an einkaufHinzufuegen durch. Jetzt hat die Befehlserkennung Vorrang.
**Mutationen:** F-013: Befehle haben in der Einkaufs-Kette keinen Vorrang mehr / F-013: Abbruchwort wird in der Kette nicht mehr erkannt
