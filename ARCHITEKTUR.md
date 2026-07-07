# ARCHITEKTUR – Familien-Assistent

Stand: FUSION8 (Juli 2026). Zweck: Systemwissen unabhängig von Personen
und Chat-Verläufen verfügbar machen.

## Stack
- **Frontend:** eine `index.html` (2 Script-Blöcke, teilen sich zur
  Laufzeit den globalen Scope), `sw.js` (Service Worker: Push +
  Installierbarkeit; `VERSION` pro Release hochzählen!), `install.js`,
  `manifest.json`. Version sichtbar: Konstante `APP_VERSION` in
  `index.html` (Footer + Sprachbefehl „Version").
- **Backend:** Netlify Functions (ESM, `netlify/functions/*.mjs`).
  Routen via `netlify.toml` (`/api/*`).
- **Datenbank:** Upstash Redis (Frankfurt/EU, REST-API). Enthält
  ausschließlich anonyme Gerätekennungen, Terminnummern, Weckzeiten,
  Push-Subscriptions, Tageszähler – niemals Klartexte
  (Zero-Knowledge; Klartexte nur im localStorage des Geräts).
- **KI:** Anthropic API in `rezept.mjs`; Modell via `LLM_MODEL`
  (Standard Haiku – Sonnet reißt Netlifys ~26-s-Funktionslimit).

## Umgebungsvariablen (Netlify)
`ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, optional `LLM_MODEL`,
`RECHERCHE_TAGESLIMIT` (Standard 5), VAPID-Schlüsselpaar für Push.

## Datenflüsse
1. **Recherche:** Frontend → `/api/rezept` (device, wunsch, Formen,
   Stile) → Tageskontingent (Redis INCR+EXPIRE, 429 bei Überschreiten;
   bei Redis-Störung ungebremst weiter) → Anthropic → Schema-Härtung →
   3 Rezepte. Frontend behandelt 429/5xx/Netz getrennt
   (`fehlermeldungRecherche`).
2. **Erinnerungen:** Termin lokal → anonyme Refs an `/api/wecker` →
   Cron (`wecker-cron`, 5-min-Raster) → Web-Push (inhaltsleeres
   Signal) → `sw.js` holt fällige Refs, zeigt lokale Klartexte;
   Fallback-Notification GARANTIERT (sonst drosselt der Browser).
3. **Sprache:** EIN globaler Controller (`GlobalVoice`) + Kommando-
   Router (`erkenneKommando`); Dialoge als reine Zustandsautomaten
   (`terminDialogNext`). Einkaufs-Modus pausiert den Controller
   (Mikrofon-Exklusivität). TTS-Wächter/Notaus gegen Browser-Blockade.

## Invarianten (nicht brechen)
- **Eine Wahrheit:** gearbeitet/deployt wird ausschließlich
  `Dokumente\familien_assistent_ARBEIT`; Altstände eindeutig benannt
  ins Archiv.
- **Live-Verifikation nur über den Deploy-Permalink** (Hauptdomain
  kann gecacht sein).
- API-Schlüssel existieren nur als Netlify-Umgebungsvariablen –
  niemals im Frontend.
- Jedes Release: `APP_VERSION` + `sw.js`-`VERSION` hochzählen;
  Runtime-Simulator (42 Szenarien) muss grün sein.
- Netlify-Funktionslimit ~26 s: keine langsamen Modelle/Retries ohne
  Zeitbudget.

## Bekannte Analyzer-Eigenheit
SonarCloud scopet die zwei Script-Blöcke getrennt → vereinzelte
False Positives (z. B. „familienStile nicht deklariert" – Deklaration
existiert im ersten Block).
