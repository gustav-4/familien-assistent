# ARBEITSREGELN — Version 3.1

Diese Regeln liegen als REGELN.md im Repository. Das Register liegt als
REGISTER.md im Repository. Diese Dateien sind die einzige Quelle der
Wahrheit — nicht der Chatverlauf.

## Sitzungsbeginn
Jede Sitzung beginnt damit, dass du REGELN.md und REGISTER.md liest und
die Versionszeile beider Dateien wörtlich zitierst. Vor diesem Ritual
findet keine Arbeit statt.

## Modi
Jede Antwort beginnt mit der Kopfzeile `MODUS: PLAN | FEATURE | FIX | FRAGE`.
Fehlt die Kopfzeile oder ist der Modus falsch gewählt, ist die Antwort
ungültig; ich antworte dann nur mit "MODUS?".

- **PLAN**: Vorschläge, Analysen, offene Entscheidungen. Keine Änderung
  an Dateien. Jedes Vorhaben, das eine Freigabe benötigt, wird als PLAN
  eingereicht. Erst nach Freigabe beginnt der FEATURE- oder FIX-Durchlauf.
- **FEATURE**: Neues Verhalten. Ausgabepflichten:
  (A) Roter Beweis VOR der Implementierung: fehlschlagender Test,
  wörtlich zitierte Ausgabe. Der Test muss aus dem richtigen Grund rot
  sein — die zitierte Fehlermeldung muss eine Assertion zeigen, die der
  Anforderung entspricht. Import-, Syntax- oder Sammelfehler zählen nicht.
  Ein Satz verknüpft die Fehlermeldung mit der Anforderung.
  (B) NACH der Implementierung: vollständiger Pipelinedurchlauf,
  Exit-Code jeder Stufe wörtlich zitiert.
- **FIX**: Genau EIN Registereintrag pro Fix (Ein-Fehler-Regel). Der Diff
  ist minimal; jede Datei außerhalb des minimalen Umfangs wird einzeln
  begründet oder das Vorhaben wird FEATURE. Nur im FIX-Modus darf ein
  Status auf `behoben` gesetzt werden, und nur mit Beweis nach Regel 0.
- **FRAGE**: Reine Fragen und Antworten. Auch hier gilt: keine Aussage
  über Systemzustand ohne Beleg.

## Regel 0 — Echte Ausführung
Jede Aussage über den Zustand des Systems ist durch wörtlich zitierte
Ausgabe belegt: exakter Befehl, Arbeitsverzeichnis, vollständige oder
relevante Ausgabe, Exit-Code. Paraphrasen und Zusammenfassungen von
Ausgaben sind verboten ("alle Tests grün" ohne Zitat zählt nicht).
Jeder Beleg muss mit einem einzigen kopierbaren Befehl von mir
reproduzierbar sein. Ich führe pro Sitzung mindestens eine Stichprobe
selbst aus. Weicht das Ergebnis ab, ist das ein schwerer Vorfall: Alle
in der Sitzung gesetzten Status fallen auf `offen` zurück.

Bei abweichendem Verhalten zwischen Umgebungen ist die Umgebung Teil
des Belegs: Betriebssystem, Zeitzone und Spracheinstellung werden
mitzitiert.

## Regel 1 — Beweis vor Behauptung
Rot vor grün. Kein Verhalten wird implementiert, bevor ein Test es
einfordert und sein Fehlschlag belegt ist.

## Regel 2 — Ein Schritt
Ein Schritt ist so groß, dass er mit einem einzigen `git revert`
rückgängig zu machen ist. Jeder Schritt endet mit einem Commit, dessen
Nachricht die zugehörige ID enthält. Der Commit-Hash wird in der
Antwort zitiert.

## Regel 3 — Rückbau statt Reparaturspirale
Ist die Pipeline nach einem Schritt rot und wird nicht innerhalb
desselben Schritts grün, wird der Schritt revertiert. Es gibt keinen
Fix des Fixes.

## Regel 4 — Keine Abschwächung
Prüfungen werden niemals abgeschwächt, um grün zu werden. Als
Abschwächung gilt insbesondere: Löschen oder Überspringen von Tests
(skip, only, flaky-Markierung), Lockern von Assertions, Verlängern von
Timeouts, Ändern von Test-Globs oder Pipelinekonfiguration, Ausschluss
von Dateien, Reduzieren von Fixtures oder Testdaten. Mechanische
Absicherung: Stufe 0 führt einen Testzähler; sinkt die Anzahl der Tests
ohne freigegebenen Registereintrag, ist die Pipeline rot.

## Regel 5 — Abnahmeinfrastruktur
Zur Abnahmeinfrastruktur gehören: das Testverzeichnis, die
Pipelinekonfiguration, mutation.js, die Stufe-0-Skripte, REGELN.md und
REGISTER.md. Jede Änderung daran erfordert VORHER meine FREIGABE und
den vollständigen Diff. Nach Änderungen an Tests oder mutation.js ist
zu belegen, dass die Mutationen weiterhin die zuständigen Tests rot
machen.

## Regel 6 — Register
REGISTER.md führt jeden Fehler mit: ID (F-XXX), Wortlaut im Original
(unverändert), Status, Verweis auf den Regressionstest. Der Testname
trägt die ID als Präfix.

Status und Übergänge:
- `offen` → `rot-belegt` → `behoben` (nur in dieser Reihenfolge)
- `offen` → `nicht-reproduzierbar` (nur durch mich, nach dokumentiertem
  Reproduktionsversuch mit Befehlen und Ausgaben im Register)

Die Testpflicht ist statusabhängig: `rot-belegt` und `behoben` erfordern
einen existierenden Test mit ID-Präfix; `offen` und
`nicht-reproduzierbar` nicht. Stufe 0 prüft: Schemaversion, gültige
Status, Testexistenz je nach Status, Testzähler.

## Freigabe
Als Freigabe zählt ausschließlich das wörtliche Wort FREIGABE von mir,
zusammen mit dem benannten Umfang. Nichts anderes — keine Rückfrage,
keine Zustimmung im Nebensatz — darf als Freigabe interpretiert werden.

## Abschnitt "Nicht belegt"
Jede Antwort in den Modi PLAN, FEATURE und FIX endet mit dem Abschnitt
"Nicht belegt". Er enthält ausschließlich Behauptungen, für die in
derselben Antwort kein Beleg nach Regel 0 vorliegt. Herkunftsangaben
und belegte Aussagen gehören nicht hinein. Gibt es nichts, steht dort:
"Nicht belegt: keine."

## Pipeline
Stufe 0 (Registervalidierung, Schemaversion, Testexistenz, Testzähler)
→ Tests → Mutationslauf (bei jeder Änderung an der
Abnahmeinfrastruktur, sonst periodisch). Jede Stufe wird mit Exit-Code
zitiert.

## Dauerregeln (v3.1)

Diese drei Regeln gelten in jeder Sitzung ohne Rückfrage.

**DAUERREGEL 1 — Beleg-Form**
Als Beweis gilt ausschließlich Block A (deine Linux-Umgebung).
Windows-Belege entfallen ersatzlos und dauerhaft. Frage nie wieder nach
der Belegform.

**DAUERREGEL 2 — Freigaben**
Eine ausdrückliche FREIGABE brauchst du nur noch in zwei Fällen:
(a) Änderungen an Dateien unter `.github/workflows/`,
(b) Aufnahme neuer Fremd-Bausteine/Abhängigkeiten.
Alle anderen Arbeiten — Dateien anlegen, Fehler beheben, Tests schreiben
— führst du eigenständig aus. Rot vor grün genügt als Nachweis.
SHA-256-Prüfsummen und Patch-Vorlagen vor Freigabe entfallen.

**DAUERREGEL 3 — Reihenfolge**
Neue Fehlermeldungen nimmst du ins REGISTER auf, priorisierst sie selbst
nach Dringlichkeit für die Familie (nicht bedienbar > Haupteinstieg
blockiert > störend > kosmetisch) und arbeitest sie in dieser Reihenfolge
ab, ein Fehler pro Schritt. Nur bei neuem Verhalten (FEATURE) fragst du
vor der Umsetzung.

Dauerregel 2 hat Vorrang vor der Freigabepflicht in Regel 5, soweit es
nicht um `.github/workflows/` oder neue Fremd-Bausteine geht.
