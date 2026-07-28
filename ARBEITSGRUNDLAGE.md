# ARBEITSGRUNDLAGE – Familien-Assistent FUSION16

Maschinell aus dem Code extrahiert (nicht aus Erinnerung). Zweck: Bei
jeder künftigen Reparatur sofort wissen, WAS wo liegt, ohne zu suchen.
Stand: FUSION16 / sw `app-fusion16`, index.html 4.806 Zeilen,
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
`ttsSaeubern`1366 (Emoji+Klammer-Filter) · `speakChunks`1383 ·
`speak`1521 (zentraler Eingang; Reihenfolge: Sprechblase original →
säubern → Stimme/Klangfarbe → Chunks) · `gvSprechblase`1402 ·
`stimmenLaden`1431 · `stimmeAktuelle`1483 · `stimmenAuswahlFuellen`1490 ·
`stimmeGewaehlt`1509 · `stimmeProbe`1515 · `klangAktuell`1455 ·
`klangGewaehlt`1460 · `klangAuswahlFuellen`1467 ·
`muteMic`1343 / `unmuteMic`1350 (Mikro-Exklusivität, 12-s-Notaus)

**Spracherkennung / Router**
`GlobalVoice`1625 · `gvStart`1653 · `gvStopp`1717 · `gvToggle`1724 ·
`gvNeustart`1648 · `gvAutoStart`1746 · `gvChip`1634 ·
`erkenneKommando`1779 (**alle Befehle**, siehe §4) ·
`istUeberspringen`1774 · `gvRoute`1835 (Ausführung) · `gvOneShot`2447 ·
`initRecognition`2461 · `GV_RUHE_MS`1631 (20 s Stille → Pause)

**Rezepte / Kochen**
`RECIPES`892 (Standard-Rezepte) · `dietPasses`1297 / `requiredDiets`1271 /
`satisfiesDiet`1286 (Ernährungsform-Logik) · `styleScore`1315 ·
`renderRecipes`2696 · `selectedIntolerances`2622 · `setTimeGroup`2635 ·
`rechercheRezept`3094 (KI-Aufruf + 429/504-Behandlung) ·
`fehlermeldungRecherche`2657 · `rezeptVorstellen`2682 /
`rezeptVorstellungsText`2670 · `startCooking`2939 · `showStep`2987 /
`renderStep`2973 · `zutatenImSchritt`2957 · `startTimer`3004 ·
`confirmStep`3045 · `repeatStep`3067 · `armReminder`3034 ·
`flashStep`3207 · `clearTimers`3215 · Favoriten: `loadFavs`2545,
`saveFavs`2551, `addFavorite`2556, `renderFavoriten`2575

**Mengen-Kontinuität (FUSION15, kritisch)**
`portionFactor`3531 → `skaliereRezept`2812 schreibt das Rezept **einmal
bei der Auswahl** fest (inkl. Zahlen in Schritt-Prosa via
`smartMenge`2797 + `zahlVarianten`2803) → alle Anzeigen rechnen danach
mit Faktor 1 (Wächter `_skaliert`). Formatierung überall:
`smartQty`2838 (Rundung: g/ml 25er bzw. 50er ab 500; Liter .25;
EL/TL .5; Stück ganzzahlig).

**Einkauf / Verbrauch**
`buildShoppingList`2871 · `readShoppingList`2898 ·
`leereEinkaufsliste`2917 (+Knopf/Voice-Varianten 2926/2929) ·
`parseArtikelListe`1818 · `einkaufHinzufuegen`1824 ·
`VERBRAUCH`4405 · `vState`4472 · `vbSave`4504 · `renderVerbrauch`4553 ·
`vbRate`4474 · `vbReichtNochTage`4499 · `vbGekauft`4526 ·
Einkaufs-Modus: `vbVoiceCheckoffStart`4733 / `vbVoiceCheckoffStop`4781 / `vbVoiceCheckoffToggle`4795,
`vbVoiceHandle`4705, `vbMatchScore`4677

**Familie / Termine**
`mitglieder`3240 · `addMember`3539 · `renderMembers`3559 ·
`personenAequivalent`3514 · `summePE`3526 ·
`termine`3242 · `tLoad`3247 · `tSaveAll`3251 (**+ syncGeplant**) ·
`formularTermin`4038 · `saveTermin`4057 · `findeKollisionen`4003 ·
`terminDialogNext`3758 (Zustandsautomat) · `startTerminDialog`3928 ·
`parseServer`3933 · `findeMitglied`3705 / `findeMitgliedImSatz`3732 ·
`editierDistanz`3693 · `renderMatrix`4134 · `wocheWechseln`4121 ·
`montagVon`4125 / `isoTag`4132 · `renderTerminListe`4206 ·
`checkErinnerungen`4248 · `zeigeErinnerung`4270 · `reminderOk`4298 ·
`routinen`3241 · `addRoutine`4089 · `renderRoutinen`4103

**Wochenplan (Plus)**
`wpPlanen`1929 · `wpLaeuft`1928 → POST `/api/rezept` mit
`modus:"wochenplan"` → Termine 18:00 in angezeigter Woche +
konsolidierte Liste über `smartQty`

**Familien-Sync (Plus, E2E)**
`syncCode`2043 · `syncSchluessel`2050 (PBKDF2 150k, Salt
`ka-familien-sync-v1`) · `syncVerschluesseln`2067 /
`syncEntschluesseln`2074 (AES-GCM, IV zufällig, Format `iv.ct` b64) ·
`syncDaten`2083 (termine/routinen/mitglieder/verbrauch) ·
`syncUebernehmen`2086 · `syncGeplant`2105 (2,5 s Debounce) ·
`syncSenden`2110 · `syncAbholen`2131 (Poll 60 s + visibilitychange) ·
`syncVerbinden`2166 · `syncEinladen`2209 + `syncEinladungsLink`2205
(Code im **URL-Fragment** `#sync=`, nie in Server-Logs) ·
`syncTrennen`2225 · `syncAnzeige`2148

**Onboarding**
`OB_FLAG`2266 · `OB_SCHRITTE`2267 · `OB_SAG`2274 · `obZeige`2302
(liest **Volltext** der Seite) · `obWeiter`2341 / `obZurueck`2346 ·
`obFertig`2349 (**startet Mikrofon → Berechtigungsdialog**) ·
`obMitgliedHinzu`2377 · `obMikro`2396 · `obPush`2407 · `obInstall`2419 ·
`onboardingOeffnen`2332

**Gerät / Infrastruktur**
`deviceId`3260 (crypto.getRandomValues, g+32 Hex; Museums-Fallback
djb2, **kein Math.random**) · `idbOpen`3287 / `idbSet`3295 ·
`weckerPlan`3304 · `serverSync`3327 · `aktivierePush`3347 ·
`pruefePushAbo`3393 · `b64ToUint8`3342 · `goTab`2468 ·
`aktiverTab`3448 · `appBeenden`2250 · `loescheAlles`3496 (DSGVO) ·
Feedback: `fbOeffnen`3452 / `fbSprechen`3459 / `fbSenden`3469

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

## 4. Sprachbefehle (Stand FUSION15B, `erkenneKommando`1779)

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
| „weiter"/„überspringen" | kontextsensitiv (`istUeberspringen`1774) |

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
| (Cron) | wecker-cron.mjs (198 Z) | Erinnerungs-Push · `digestFaellig`98 (Mo+Do, 18-Uhr-Stunde Berlin) · `feedbackDigest`109 |

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
- **Android-Chrome liefert nur 1 deutsche Stimme** → Klangfarben
  (pitch/rate) sind der Vielfalt-Ersatz.
- **`u.rate` darf nur EINMAL gesetzt werden** (Preset gewinnt).
- Doppelte Skalierung verhindern: `_skaliert`-Wächter beachten.
- 402 = Plus fehlt (Sync/Wochenplan), 429 = Tageslimit, 413 = Blob
  zu groß, 403 = Geräte-Limit.

---

## 8. Testinfrastruktur (nach Sandbox-Reset neu zu erzeugen!)

Verloren gehen bei Sandbox-Reset: `/tmp/harness3.js` + `/tmp/tests3.js`
(40 Szenarien A–J; **Tests laufen IM eval-Kontext**, sonst sind
`const`/`let` der App unsichtbar; DOM-Stubs inkl. `options`,
`wakeLock`, globals `elemente/gesprochen/ttsBlockiert/recInstanz`), `/tmp/test_sync.mjs`
(9), `/tmp/test_limit.mjs` (4), `/tmp/test_digest.mjs` (13, echtes
P-256-Paar, Date.now-Mock, Redis-Router), `/tmp/test_kontingent.mjs`
(5), `/tmp/test_wochenplan.mjs` (6), `/tmp/test_loeschen.mjs` (6).
**Pflichtablauf nach jedem Edit:** Script-Blöcke extrahieren →
`node --check` → betroffene Suiten → zip.

---

## 9. Offene Punkte (Stand jetzt)

- FUSION16 **noch nicht ausgerollt** (kumulativ: Klangfarben,
  TTS-Säuberung, Mikro nach Einführung, BOM-Fix, Wake Lock,
  gestaffelte Timer-Ansagen, Mikro wach im Kochmodus, progressive
  Erinnerung, Navigations-Regex mit Artikeln).
- Postfach: verifiziert (6 Einträge, API liefert korrekt).
- „go A11y": ~40 Label-/Tastatur-Fixes (einziger Sonar-Punkt mit
  echtem Produktwert).
- Gewerbeanmeldung → Händlerbund → `agb.html` + `widerruf.html` +
  PayPal-Direktkauf auf `/plus`.
- Testfamilien-Rekrutierung (Ziel ≥30 % Woche-4-Retention).
