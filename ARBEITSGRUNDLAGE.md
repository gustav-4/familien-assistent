# ARBEITSGRUNDLAGE – Familien-Assistent FUSION19

Maschinell aus dem Code extrahiert (nicht aus Erinnerung). Zweck: Bei
jeder künftigen Reparatur sofort wissen, WAS wo liegt, ohne zu suchen.
Stand: FUSION19 / sw `app-fusion19`, index.html 4.806 Zeilen,
199.155 Bytes, BOM entfernt, alle 25 Textdateien valides UTF-8.

---

## 1. Dateien (27 Stück, Repo-Root = App-Root = Deploy-Root)

| Datei | Bytes | Zeilen | Rolle |
|---|---|---|---|
| index.html | 199.155 | 4.806 | **Die App** (2 Script-Blöcke, gemeinsamer globaler Scope) |
| sw.js | 4.559 | 125 | Service Worker: Push, Cache, Digest-Notification |
| install.js | 5.255 | 120 | Installations-Banner (PWA) |
| manifest.json | 656 | 15 | PWA-Manifest |
| netlify.toml | 929 | 45 | Routen `/api/*`, Cron-Schedule |
| plus.html | 5.909 | 122 | **Kaufseite** `/plus` (Founder 29 €) |
| feedback-admin.html | 6.748 | 166 | **Betreiber-Postfach** (Token, Löschen, Plus-Codes) |
| impressum.html | 2.128 | 60 | § 5 DDG (Einzelunternehmen A. Hoffmann) |
| datenschutz.html | 5.980 | 125 | 10 Abschnitte inkl. §4a E2E-Sync |
| ARCHITEKTUR.md | 2.917 | 57 | Stack/Invarianten (Kurzfassung) |
| ARBEITSGRUNDLAGE.md | – | – | **dieses Dokument** |
| netlify/functions/*.mjs | | | 8 Server-Funktionen (siehe §5) |
| icon-192/512.png, apple-touch-icon.png, icon.svg | | | Icons |
| robots.txt, sitemap.xml, llms.txt | | | SEO |
| STARTPAKET_STUFE3.md, START_ASSISTENT.bat | | | Altlast, unbenutzt |

---

## 2. Frontend-Funktionen nach Domäne (Zeile @ FUSION15B)

**Sprachausgabe / Stimme**
`ttsSaeubern`1408 (Emoji+Klammer-Filter) · `speakChunks`1425 ·
`speak`1587 (zentraler Eingang; Reihenfolge: Sprechblase original →
säubern → Stimme/Klangfarbe → Chunks) · `gvSprechblase`1444 ·
`stimmenLaden`1473 · `stimmeAktuelle`1549 · `stimmenAuswahlFuellen`1556 ·
`stimmeGewaehlt`1575 · `stimmeProbe`1581 · `klangAktuell`1521 ·
`klangGewaehlt`1526 · `klangAuswahlFuellen`1533 ·
`muteMic`1383 / `unmuteMic`1392 (Mikro-Exklusivität, 12-s-Notaus)

**Spracherkennung / Router**
`GlobalVoice`1691 · `gvStart`1719 · `gvStopp`1788 · `gvToggle`1795 ·
`gvNeustart`1714 · `gvAutoStart`1817 · `gvChip`1700 ·
`erkenneKommando`1850 (**alle Befehle**, siehe §4) ·
`istUeberspringen`1845 · `gvRoute`1908 (Ausführung) · `gvOneShot`2520 ·
`initRecognition`2534 · `GV_RUHE_MS`1697 (20 s Stille → Pause)

**Rezepte / Kochen**
`RECIPES`903 (Standard-Rezepte) · `dietPasses`1308 / `requiredDiets`1282 /
`satisfiesDiet`1297 (Ernährungsform-Logik) · `styleScore`1326 ·
`renderRecipes`2769 · `selectedIntolerances`2695 · `setTimeGroup`2708 ·
`rechercheRezept`3182 (KI-Aufruf + 429/504-Behandlung) ·
`fehlermeldungRecherche`2730 · `rezeptVorstellen`2755 /
`rezeptVorstellungsText`2743 · `startCooking`3012 · `showStep`3061 /
`renderStep`3047 · `zutatenImSchritt`3031 · `startTimer`3086 ·
`confirmStep`3133 · `repeatStep`3155 · `armReminder`3118 ·
`flashStep`3295 · `clearTimers`3303 · Favoriten: `loadFavs`2618,
`saveFavs`2624, `addFavorite`2629, `renderFavoriten`2648

**Mengen-Kontinuität (FUSION15, kritisch)**
`portionFactor`3620 → `skaliereRezept`2885 schreibt das Rezept **einmal
bei der Auswahl** fest (inkl. Zahlen in Schritt-Prosa via
`smartMenge`2870 + `zahlVarianten`2876) → alle Anzeigen rechnen danach
mit Faktor 1 (Wächter `_skaliert`). Formatierung überall:
`smartQty`2911 (Rundung: g/ml 25er bzw. 50er ab 500; Liter .25;
EL/TL .5; Stück ganzzahlig).

**Einkauf / Verbrauch**
`buildShoppingList`2944 · `readShoppingList`2971 ·
`leereEinkaufsliste`2990 (+Knopf/Voice-Varianten 2926/2929) ·
`parseArtikelListe`1891 · `einkaufHinzufuegen`1897 ·
`VERBRAUCH`4494 · `vState`4561 · `vbSave`4593 · `renderVerbrauch`4642 ·
`vbRate`4563 · `vbReichtNochTage`4588 · `vbGekauft`4615 ·
Einkaufs-Modus: `vbVoiceCheckoffStart`4822 / `vbVoiceCheckoffStop`4870 / `vbVoiceCheckoffToggle`4884,
`vbVoiceHandle`4794, `vbMatchScore`4766

**Familie / Termine**
`mitglieder`3329 · `addMember`3628 · `renderMembers`3648 ·
`personenAequivalent`3603 · `summePE`3615 ·
`termine`3331 · `tLoad`3336 · `tSaveAll`3340 (**+ syncGeplant**) ·
`formularTermin`4127 · `saveTermin`4146 · `findeKollisionen`4092 ·
`terminDialogNext`3847 (Zustandsautomat) · `startTerminDialog`4017 ·
`parseServer`4022 · `findeMitglied`3794 / `findeMitgliedImSatz`3821 ·
`editierDistanz`3782 · `renderMatrix`4223 · `wocheWechseln`4210 ·
`montagVon`4214 / `isoTag`4221 · `renderTerminListe`4295 ·
`checkErinnerungen`4337 · `zeigeErinnerung`4359 · `reminderOk`4387 ·
`routinen`3330 · `addRoutine`4178 · `renderRoutinen`4192

**Wochenplan (Plus)**
`wpPlanen`2002 · `wpLaeuft`2001 → POST `/api/rezept` mit
`modus:"wochenplan"` → Termine 18:00 in angezeigter Woche +
konsolidierte Liste über `smartQty`

**Familien-Sync (Plus, E2E)**
`syncCode`2116 · `syncSchluessel`2123 (PBKDF2 150k, Salt
`ka-familien-sync-v1`) · `syncVerschluesseln`2140 /
`syncEntschluesseln`2147 (AES-GCM, IV zufällig, Format `iv.ct` b64) ·
`syncDaten`2156 (termine/routinen/mitglieder/verbrauch) ·
`syncUebernehmen`2159 · `syncGeplant`2178 (2,5 s Debounce) ·
`syncSenden`2183 · `syncAbholen`2204 (Poll 60 s + visibilitychange) ·
`syncVerbinden`2239 · `syncEinladen`2282 + `syncEinladungsLink`2278
(Code im **URL-Fragment** `#sync=`, nie in Server-Logs) ·
`syncTrennen`2298 · `syncAnzeige`2221

**Onboarding**
`OB_FLAG`2339 · `OB_SCHRITTE`2340 · `OB_SAG`2347 · `obZeige`2375
(liest **Volltext** der Seite) · `obWeiter`2414 / `obZurueck`2419 ·
`obFertig`2422 (**startet Mikrofon → Berechtigungsdialog**) ·
`obMitgliedHinzu`2450 · `obMikro`2469 · `obPush`2480 · `obInstall`2492 ·
`onboardingOeffnen`2405

**Gerät / Infrastruktur**
`deviceId`3349 (crypto.getRandomValues, g+32 Hex; Museums-Fallback
djb2, **kein Math.random**) · `idbOpen`3376 / `idbSet`3384 ·
`weckerPlan`3393 · `serverSync`3416 · `aktivierePush`3436 ·
`pruefePushAbo`3482 · `b64ToUint8`3431 · `goTab`2541 ·
`aktiverTab`3537 · `appBeenden`2323 · `loescheAlles`3585 (DSGVO) ·
Feedback: `fbOeffnen`3541 / `fbSprechen`3548 / `fbSenden`3558

---

## 3. Zustand & Speicher

**localStorage-Schlüssel:** `ka_device` · `ka_mitglieder` ·
`ka_termine` · `ka_routinen` · `ka_verbrauch` · `ka_favoriten` ·
`ka_stile` · `ka_stimme` · `ka_klang` · `ka_sync_code` ·
`ka_sync_stand` (+ OB_FLAG-Marker, `ka_admin_token` nur im Postfach)
**IndexedDB:** DB `ka`, Store `kv` (Push-/Wecker-Hilfsdaten)
**Globale Variablen:** siehe §2; die zentralen sind `mitglieder`,
`termine`, `routinen`, `vState`, `selectedRecipe`, `familienStile`,
`syncCode`, `GlobalVoice`.

**Tabs:** `rezepte` · `kochen` · `einkauf` · `termine` · `familie`

---

## 4. Sprachbefehle (Stand FUSION15B, `erkenneKommando`1850)

| Befehl (Regex-Kern) | Typ |
|---|---|
| stopp / stop / sei still / ruhe / leise | `still` |
| version / app-version | `version` |
| plane die woche / wochenplan / erstelle mir einen wochenplan | `wochenplan` |
| einführung / anleitung / tour / einrichtung | `einfuehrung` |
| mikro(fon) aus / zuhören stopp | `mikro_aus` |
| app beenden / schließen / tschüss | `app_ende` |
| hilfe / was kannst du | `hilfe` |
| kochen / koch starten / los kochen | `kochen` |
| (setze die zutaten) auf die liste | `auf_liste` |
| liste vorlesen / liste leeren | `liste` |
| rezept … / suche … / recherchiere … | `rezept` |
| termin … / neuer termin … | `termin` |
| einkauf … / kaufe … / besorge … | `einkauf` |
| gehe/wechsle/zeige/öffne <Tab> | `nav` |
| „weiter"/„überspringen" | kontextsensitiv (`istUeberspringen`1845) |

---

## 5. Server (Netlify Functions, ESM)

| Route | Datei | Methoden / Zweck |
|---|---|---|
| `/api/rezept` | rezept.mjs (658 Z) | POST Recherche (Tageslimit 5, Plus hebt auf) · POST `modus:"wochenplan"` (Free 1/Monat) |
| `/api/termine` | termine.mjs (173 Z) | GET/POST Alt-API pro Gerät · **GET/POST `code=FAM-…`** (E2E-Sync, 402 ohne Plus, 5-Geräte-Limit) · POST `plus_freischalten` (Admin) |
| `/api/wecker` | wecker.mjs (147 Z) | GET fällige Refs **+ `digest`** (GETDEL) · POST Plan/Löschen |
| `/api/push-anmelden` | push-anmelden.mjs | POST Subscription |
| `/api/vapid` | vapid.mjs | GET Public Key · `ensureVapid` |
| `/api/feedback` | feedback.mjs (97 Z) | POST Feedback · **GET `?token=`** Postfach · POST Löschen (einzeln/alle) |
| `/api/termin-parse` | termin-parse.mjs | POST Termin-Freitext → Struktur |
| (Cron) | wecker-cron.mjs (198 Z) | Erinnerungs-Push · `digestFaellig`98 (Mo+Do, 18-Uhr-Stunde Berlin) · `feedbackDigest`125 |

**Wichtige Serverfunktionen:** `pruefeTageskontingent`26 (INCR+EXPIRE,
ausfallsicher) · `kanalVonCode`58/45 (**identisch in rezept.mjs und
termine.mjs halten!** sha256("ka1|"+CODE), 32 Hex) · `rufeModell`82
(20-s-Budget) · `wochenplanPrompt`121 · `normalizePlanItem`161 ·
`verletztAllergen`247 / `verletztDiet`259 (**deterministischer
Sicherheitsfilter nach der KI**) · `buildPrompt`280 ·
`normalizeRecipe`368 · `faelligeRefs`/`anzeigeRefs` (wecker.mjs)

**Redis-Schlüssel (Upstash, Frankfurt):** `familie:<device>`
(Alt-API pro Gerät, termine.mjs) · `wecker:<device>` ·
`sub:<device>` · `feedback` (Liste, max 1000) · `digest:cursor` ·
`digest:gesendet:<datum>` · `ff:digest:<device>` ·
`rl:rezept:<device>:<datum>` · `wpfrei:<device>:<monat>` ·
`plus:<kanal>` · `sync:<kanal>` · `syncgeraete:<kanal>` · `vapid`

**Env-Variablen:** `ANTHROPIC_API_KEY` · `UPSTASH_REDIS_REST_URL` ·
`UPSTASH_REDIS_REST_TOKEN` · `ADMIN_TOKEN` · `OWNER_DEVICE` ·
`LLM_MODEL` (Standard Haiku) · `RECHERCHE_TAGESLIMIT` (5) ·
`VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_PEM`

---

## 6. Invarianten (bei jeder Reparatur einhalten)

1. **Eine Wahrheit:** nur `Dokumente\familien_assistent_ARBEIT`;
   Altstände benannt ins Archiv.
2. **Commit = Deploy = Sonar-Analyse** (Netlify an GitHub gekoppelt,
   Repo-Root = App-Root). Drop-Deploys abgeschafft.
3. **Live-Verifikation nur via Deploy-Permalink** (Hauptdomain cached).
4. Jedes Release: `APP_VERSION` **und** `sw.js`-`VERSION` hochzählen.
5. Kein `Math.random` im Frontend (Sonar S2245, deviceId-Härtung).
6. Kein BOM in Dateien (Sonar-Encoding-Warnung).
7. Netlify-Funktionslimit ~26 s → keine langsamen Modelle/Retries.
8. API-Schlüssel nur als Netlify-Env, nie im Frontend.
9. Server sieht **nie** Klartext-Familiendaten (Zero-Knowledge/E2E).
10. Nutzertexte: weiche Haftungsformulierung („Laut geltender
    Rechtslage weisen wir dennoch darauf hin…"), nie „keine Garantie".
11. Edits **zeilenbasiert mit benannten Ankern** (`finde()`), nie
    substring-Ersetzung über mehrzeilige Listenelemente
    (Waisen-Zeilen-Bug FUSION10).

---

## 7. Bekannte Eigenheiten / Fallen

- **Analyzer-Scope:** SonarCloud wertet die 2 Script-Blöcke getrennt →
  False Positives „x nicht deklariert" (termine/routinen/mitglieder/
  familienStile). Als FP markiert, Deklarationen Z. 3240–3242 / 1267.
- **TTS erst nach 1. Touch:** Browser-Gesetz; Onboarding spricht daher
  erst ab Nutzer-Geste, `obFertig` nutzt genau diese Geste fürs Mikro.
- **System-Bereitton:** entsteht bei JEDEM Neustart der
  Spracherkennung. Deshalb NIE `recognition.abort()` zum Stummschalten
  benutzen – der Selbsthör-Schutz liegt als Softwaresperre in
  `onresult` (`ttsActive` + `ttsCooldownUntil` 800 ms). Schalter
  `ka_ruhe_koch` erlaubt zusätzlich die Ruhepause im Kochmodus
  (`GV_RUHE_KOCH_MS` 60 s).
- **Android-Chrome liefert nur 1 deutsche Stimme** → Klangfarben
  (pitch/rate) sind der Vielfalt-Ersatz.
- **`u.rate` darf nur EINMAL gesetzt werden** (Preset gewinnt).
- Doppelte Skalierung verhindern: `_skaliert`-Wächter beachten.
- 402 = Plus fehlt (Sync/Wochenplan), 429 = Tageslimit, 413 = Blob
  zu groß, 403 = Geräte-Limit.

---

## 8. Testinfrastruktur (jetzt IM REPO – reset-sicher)

**Alles liegt unter `tests/` und laeuft ohne Sandbox:**
| Datei | Zweck |
|---|---|
| `tests/lib/browser.js` | Browser-Attrappe mit Proxy-Auffangnetz; unbekannte DOM-Eigenschaften stuerzen nicht ab, sondern werden protokolliert |
| `tests/szenarien.js` | 56 deterministische Faelle (A–K), laufen IM eval-Kontext der App |
| `tests/run.js` | Laeufer; `--json`, `--extra=DATEI`; Bericht in `tests/berichte/` |
| `tests/redteam.mjs` | **Fable 5** greift 17 reine Logikfunktionen an (9 kB Auszug statt 200 kB → kostenschonend); `--trocken` ohne API |
| `tests/heilung.js` | Selbstheilung Stufe 1: Attrappen-Luecken + Zeilennummern der Systemkarte |
| `.github/workflows/qa.yml` | Commit → Szenarien; naechtlich 03:00 → Red-Team + Selbstheilung + Pull Request |

**Rollentrennung:** Claude = Code-Modell · Fable 5 = Red-Team ·
Mensch = Freigabe. **App-Code wird NIE automatisch geaendert** – nur
Testinfrastruktur heilt sich selbst.

### QA-Postfach aufs Handy (Freigabe per Knopf)
| Baustein | Datei | Zweck |
|---|---|---|
| Briefkasten | `netlify/functions/qa.mjs` | POST (QA_TOKEN) nimmt Bericht an · GET (ADMIN_TOKEN) liefert ihn · POST `freigabe` startet Workflow per repository_dispatch |
| Postfach | `qa-admin.html` | Ampel, Befunde in Alltagssprache, **zwei Knoepfe**: „Reparatur beauftragen" (Tor 1) und „Live schalten" (Tor 2) |
| Meldung | `tests/melde.mjs` | schickt Bericht an `/api/qa` (nur bei Auffaelligkeiten) |
| Push | `wecker-cron.mjs::qaMeldung` → `wecker.mjs` GET `qa` → `sw.js` Tag `ka-qa` | weckt das Handy, Klick oeffnet `/qa-admin.html` |
| Klartext | `tests/klartext.mjs` | uebersetzt technische Befunde in Alltagsdeutsch + Reparaturvorschlag + Dringlichkeit; Stufe 1 Woerterbuch (kostenlos), Stufe 2 Modell (Haiku); faellt Stufe 2 aus, bleibt Stufe 1 |
| Reparatur | `tests/reparatur.mjs` | Code-Modell erzeugt minimalen Patch; **Leitplanken**: nur erlaubte Dateien, Suchmuster genau 1x, kein leerer Ersatz, ein Verstoss kippt das ganze Paket |
| Ablauf | `.github/workflows/reparatur.yml` | `qa-reparatur` → patchen, testen, Red-Team, Pull Request · `qa-live` → Merge nach main → Netlify deployt |

**Ablauf in einem Satz:** Nachts testet die Automatik → bei Befund
kommt ein Push aufs Handy → ein Klick startet Reparatur samt
Gegenpruefung → zweiter Klick schaltet live. Dazwischen passiert alles
ohne Handgriff, aber **nie ohne die beiden Klicks**.

**Einmalig einzurichten:**
* GitHub → Settings → Secrets and variables → Actions:
  `ANTHROPIC_API_KEY`, `QA_TOKEN` (frei erfunden, 24 Zeichen)
* Netlify → Environment variables: `QA_TOKEN` (**gleicher Wert**),
  `GITHUB_TOKEN` (Personal Access Token mit Rechten auf das Repo),
  optional `GITHUB_REPO`
* Ohne diese Werte laufen die deterministischen Szenarien weiter,
  Red-Team und Freigabe-Knoepfe ueberspringen sich folgenlos.

### Historie (nicht mehr noetig)

Verloren gehen bei Sandbox-Reset: `/tmp/harness3.js` + `/tmp/tests3.js`
(47 Szenarien A–K; **Tests laufen IM eval-Kontext**, sonst sind
`const`/`let` der App unsichtbar; DOM-Stubs inkl. `options`,
`wakeLock`, globals `elemente/gesprochen/ttsBlockiert/recInstanz`), `/tmp/test_sync.mjs`
(9), `/tmp/test_limit.mjs` (4), `/tmp/test_digest.mjs` (13, echtes
P-256-Paar, Date.now-Mock, Redis-Router), `/tmp/test_kontingent.mjs`
(5), `/tmp/test_wochenplan.mjs` (6), `/tmp/test_loeschen.mjs` (6).
**Pflichtablauf nach jedem Edit:** Script-Blöcke extrahieren →
`node --check` → betroffene Suiten → zip.

---

## 9. Offene Punkte (Stand jetzt)

- FUSION17 **noch nicht ausgerollt** (kumulativ: Klangfarben,
  TTS-Säuberung, Mikro nach Einführung, BOM-Fix, Wake Lock,
  gestaffelte Timer-Ansagen, Mikro wach im Kochmodus, progressive
  Erinnerung, Navigations-Regex mit Artikeln, **Bereitton-Reduktion**).
  FUSION16 ist live (Deploy main@388d29c).
- Postfach: verifiziert (6 Einträge, API liefert korrekt).
- „go A11y": ~40 Label-/Tastatur-Fixes (einziger Sonar-Punkt mit
  echtem Produktwert).
- Gewerbeanmeldung → Händlerbund → `agb.html` + `widerruf.html` +
  PayPal-Direktkauf auf `/plus`.
- Testfamilien-Rekrutierung (Ziel ≥30 % Woche-4-Retention).
