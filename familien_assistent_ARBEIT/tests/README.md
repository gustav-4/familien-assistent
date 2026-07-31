# Test-Architektur (selbstheilend, mit Red-Team)

## Rollenverteilung
| Rolle | Wer | Aufgabe |
|---|---|---|
| **Code-Modell** | Claude (Bau-Chat) | schreibt App-Code und deterministische Szenarien |
| **Red-Team** | **Fable 5** (`claude-fable-5`) | greift die Logik unabhaengig an, erfindet Testfaelle, auf die der Erbauer nicht kommt |
| **Freigabe** | Betreiber (Mensch) | entscheidet ueber jeden App-Code-Fix |

Begruendung der Trennung: Wer den Code schreibt, hat blinde Flecken
genau dort, wo er beim Schreiben falsch gedacht hat. Ein fremdes Modell
ohne diese Vorpraegung findet andere Fehler.

## Was "selbstheilend" hier bedeutet – und was nicht
**Automatisch repariert wird nur die Testinfrastruktur:**
1. Fehlende Browser-Attrappen (`tests/lib/browser.js`) werden zur
   Laufzeit ueberbrueckt, protokolliert und dauerhaft nachgetragen.
2. Zeilennummern in `ARBEITSGRUNDLAGE.md` werden aus dem Code neu gesetzt.

**Niemals automatisch geaendert wird App-Code.** Echte Defekte landen als
Bericht und Pull Request beim Betreiber. Eine Live-App, die Familien
nutzen, darf kein Modell ungefragt umschreiben.

## Befehle
```
node tests/run.js                 # alle Szenarien (Sekunden, kostenlos)
node tests/run.js --json          # maschinenlesbarer Bericht
node tests/heilung.js --trocken   # zeigt, was geheilt wuerde
node tests/heilung.js             # heilt Testinfrastruktur + Systemkarte
node tests/redteam.mjs --trocken  # Auszug pruefen, ohne API-Kosten
node tests/redteam.mjs --runden=2 --budget=8   # echter Red-Team-Lauf
```

## Automatik (GitHub Actions, `.github/workflows/qa.yml`)
* **Jeder Commit auf `main`** → Syntaxpruefung + alle Szenarien.
  Rotes Kreuz am Commit = etwas ist kaputt.
* **Jede Nacht 03:00** → zusaetzlich Red-Team-Lauf, danach
  Selbstheilung, danach Pull Request mit Befunden.
* **Von Hand:** Reiter *Actions* → *Qualitaetssicherung* →
  *Run workflow* (Haken bei „Red-Team erzwingen").

### Einmalige Einrichtung
Im Repo unter **Settings → Secrets and variables → Actions →
New repository secret** anlegen:
* Name: `ANTHROPIC_API_KEY`
* Wert: der API-Schluessel (derselbe wie in Netlify)

Ohne dieses Secret laufen die deterministischen Szenarien weiter –
nur das Red-Team ueberspringt sich selbst.

## Dateien
| Datei | Zweck |
|---|---|
| `lib/browser.js` | Browser-Attrappe mit Auffangnetz (Proxy) |
| `szenarien.js` | deterministische Faelle (A–K), laufen im eval-Kontext der App |
| `run.js` | Testlaeufer, erzeugt `berichte/letzter-lauf.json` |
| `redteam.mjs` | Fable-5-Angriffslauf, erzeugt `redteam-szenarien.js` + `berichte/redteam.json` |
| `heilung.js` | Selbstheilung Stufe 1 |
| `berichte/` | Ergebnisse (werden ueberschrieben) |

## Warum die Szenarien im eval-Kontext laufen
Die App besteht aus zwei `<script>`-Bloecken, die sich zur Laufzeit
einen globalen Bereich teilen. `const`/`let` daraus sind von aussen
**nicht** sichtbar. Deshalb wird der Testcode an den App-Code
angehaengt und gemeinsam ausgefuehrt – so sieht der Test exakt das,
was der Browser sieht.
