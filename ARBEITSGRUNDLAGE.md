# ARBEITSGRUNDLAGE – Familien-Assistent FUSION30

Maschinell aus dem Code extrahiert (nicht aus Erinnerung). Zweck: Bei
jeder künftigen Reparatur sofort wissen, WAS wo liegt, ohne zu suchen.
Stand: FUSION30 / sw `app-fusion30`, index.html siehe Systemkarte.
205.241 Bytes, BOM entfernt, alle 25 Textdateien valides UTF-8.

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
`ttsSaeubern`1504 (Emoji+Klammer-Filter) · `speakChunks`1527 ·
`speak`1739 (zentraler Eingang; Reihenfolge: Sprechblase original →
säubern → Stimme/Klangfarbe → Chunks) · `gvSprechblase`1546 ·
`stimmenLaden`1625 · `stimmeAktuelle`1701 · `stimmenAuswahlFuellen`1708 ·
`stimmeGewaehlt`1727 · `stimmeProbe`1733 · `klangAktuell`1673 ·
`klangGewaehlt`1678 · `klangAuswahlFuellen`1685 ·
`muteMic`1477 / `unmuteMic`1486 (Mikro-Exklusivität, 12-s-Notaus)

**Spracherkennung / Router**
`GlobalVoice`1875 · `gvStart`1939 · `gvStopp`2057 · `gvToggle`2065 ·
`gvNeustart`1931 · `gvAutoStart`2087 · `gvChip`1894 ·
`erkenneKommando`2152 (**alle Befehle**, siehe §4) ·
`istUeberspringen`2115 · `gvRoute`2305 (Ausführung) · `gvOneShot`2988 ·
`initRecognition`2992 · `GV_RUHE_MS`1881 (20 s Stille → Pause)

**Rezepte / Kochen**
`RECIPES`934 (Standard-Rezepte) · `dietPasses`1339 / `requiredDiets`1313 /
`satisfiesDiet`1328 (Ernährungsform-Logik) · `styleScore`1357 ·
`renderRecipes`3329 · `selectedIntolerances`3250 · `setTimeGroup`3263 ·
`rechercheRezept`3878 (KI-Aufruf + 429/504-Behandlung) ·
`fehlermeldungRecherche`3285 · `rezeptVorstellen`3313 /
`rezeptVorstellungsText`3298 · `startCooking`3636 · `showStep`3691 /
`renderStep`3677 · `zutatenImSchritt`3661 · `startTimer`3728 ·
`confirmStep`3810 · `repeatStep`3832 · `armReminder`3796 ·
`flashStep`4018 · `clearTimers`4026 · Favoriten: `loadFavs`3078,
`saveFavs`3084, `addFavorite`3089, `renderFavoriten`3108

**Mengen-Kontinuität (FUSION15, kritisch)**
`portionFactor`4346 → `skaliereRezept`3456 schreibt das Rezept **einmal
bei der Auswahl** fest (inkl. Zahlen in Schritt-Prosa via
`smartMenge`3435 + `zahlVarianten`3441) → alle Anzeigen rechnen danach
mit Faktor 1 (Wächter `_skaliert`). Formatierung überall:
`smartQty`3487 (Rundung: g/ml 25er bzw. 50er ab 500; Liter .25;
EL/TL .5; Stück ganzzahlig).

**Einkauf / Verbrauch**
`buildShoppingList`3523 · `readShoppingList`3550 ·
`leereEinkaufsliste`3569 (+Knopf/Voice-Varianten 2926/2929) ·
`parseArtikelListe`2212 · `einkaufHinzufuegen`2227 ·
`VERBRAUCH`5232 · `vState`5299 · `vbSave`5331 · `renderVerbrauch`5380 ·
`vbRate`5301 · `vbReichtNochTage`5326 · `vbGekauft`5353 ·
Einkaufs-Modus: `vbVoiceCheckoffStart`5560 / `vbVoiceCheckoffStop`5608 / `vbVoiceCheckoffToggle`5622,
`vbVoiceHandle`5532, `vbMatchScore`5504

**Familie / Termine**
`mitglieder`4053 · `addMember`4354 · `renderMembers`4374 ·
`personenAequivalent`4327 · `summePE`4341 ·
`termine`4055 · `tLoad`4060 · `tSaveAll`4064 (**+ syncGeplant**) ·
`formularTermin`4863 · `saveTermin`4882 · `findeKollisionen`4828 ·
`terminDialogNext`4573 (Zustandsautomat) · `startTerminDialog`4743 ·
`parseServer`4748 · `findeMitglied`4520 / `findeMitgliedImSatz`4547 ·
`editierDistanz`4508 · `renderMatrix`4959 · `wocheWechseln`4946 ·
`montagVon`4950 / `isoTag`4957 · `renderTerminListe`5031 ·
`checkErinnerungen`5073 · `zeigeErinnerung`5095 · `reminderOk`5123 ·
`routinen`4054 · `addRoutine`4914 · `renderRoutinen`4928

**Wochenplan (Plus)**
`wpPlanen`2410 · `wpLaeuft`2409 → POST `/api/rezept` mit
`modus:"wochenplan"` → Termine 18:00 in angezeigter Woche +
konsolidierte Liste über `smartQty`

**Familien-Sync (Plus, E2E)**
`syncCode`2525 · `syncSchluessel`2532 (PBKDF2 150k, Salt
`ka-familien-sync-v1`) · `syncVerschluesseln`2549 /
`syncEntschluesseln`2556 (AES-GCM, IV zufällig, Format `iv.ct` b64) ·
`syncDaten`2565 (termine/routinen/mitglieder/verbrauch) ·
`syncUebernehmen`2568 · `syncGeplant`2587 (2,5 s Debounce) ·
`syncSenden`2592 · `syncAbholen`2613 (Poll 60 s + visibilitychange) ·
`syncVerbinden`2648 · `syncEinladen`2691 + `syncEinladungsLink`2687
(Code im **URL-Fragment** `#sync=`, nie in Server-Logs) ·
`syncTrennen`2707 · `syncAnzeige`2630

**Onboarding**
`OB_FLAG`2748 · `OB_SCHRITTE`2749 · `OB_SAG`2756 · `obZeige`2784
(liest **Volltext** der Seite) · `obWeiter`2823 / `obZurueck`2828 ·
`obFertig`2831 (**startet Mikrofon → Berechtigungsdialog**) ·
`obMitgliedHinzu`2859 · `obMikro`2878 · `obPush`2889 · `obInstall`2901 ·
`onboardingOeffnen`2814

**Gerät / Infrastruktur**
`deviceId`4073 (crypto.getRandomValues, g+32 Hex; Museums-Fallback
djb2, **kein Math.random**) · `idbOpen`4100 / `idbSet`4108 ·
`weckerPlan`4117 · `serverSync`4140 · `aktivierePush`4160 ·
`pruefePushAbo`4206 · `b64ToUint8`4155 · `goTab`2999 ·
`aktiverTab`4261 · `appBeenden`2732 · `loescheAlles`4309 (DSGVO) ·
Feedback: `fbOeffnen`4265 / `fbSprechen`4272 / `fbSenden`4282

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

## 4. Sprachbefehle (Stand FUSION15B, `erkenneKommando`2152)

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
| „weiter"/„überspringen" | kontextsensitiv (`istUeberspringen`2115) |

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
(20-s-Budget) · `wochenplanPrompt`145 · `normalizePlanItem`185 ·
`verletztAllergen`271 / `verletztDiet`283 (**deterministischer
Sicherheitsfilter nach der KI**) · `buildPrompt`394 ·
`normalizeRecipe`496 · `faelligeRefs`/`anzeigeRefs` (wecker.mjs)

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
- **Regex aus Nutzerdaten IMMER maskieren** (`regexMaskiere`): "1.5"
  passte sonst auf "105" und ueberschrieb fremde Mengen im Schritttext.
- **`Number(x) || Standard` ist bei 0 falsch** - `Number.isFinite`
  pruefen (Alter 0 zaehlte als Erwachsener).
- **Befehlsmuster brauchen Wortgrenzen**: "kaufe" griff in "kaufen wir".
- **Formatierten Anzeigetext nie zurueckparsen**: der Groessenhinweis
  ("kleine") wanderte sonst in die Einheit.
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
| `tests/szenarien.js` | 76 deterministische Faelle (A–L); Gruppe **L = vom Red-Team gefundene echte Defekte**, dauerhaft als Rueckfallschutz |
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

## 9. Stand & offene Punkte

**Live und verifiziert:** FUSION25 (Deploy aus GitHub, stilles Update
aktiv). Testsuite 143 Pruefungen gruen (76 Szenarien + 67 Servertests).
Letzter QA-Lauf: 92/92 (76 eigene + 16 Red-Team-Faelle).

**Erledigt in dieser Ausbaustufe:**
- Kochmodus: Wake Lock, gestaffelte Timer-Ansagen, Mikro bleibt wach,
  progressive Erinnerung, Bereitton-Reduktion (kein `abort()` mehr).
- Mengen-Kontinuitaet inkl. maskierter Regex (RT2-05).
- 9 echte Defekte vom Red-Team gefunden und behoben (Gruppe L).
- QA-Kette komplett: naechtlicher Lauf → Handy-Push → Klartext-Bericht
  → Freigabe-Knopf 1 (Reparatur) → Freigabe-Knopf 2 (live).
- Ehrlichkeitsregel: gestoerter/leerer Lauf meldet NIE "alles in Ordnung".

**Offen, technisch (auf Zuruf):**
- „go A11y": ~40 Label-/Tastatur-Fixes (einziger Sonar-Punkt mit
  echtem Produktwert).
- „go Schnellerfassung": App-Shortcut + Teilen-Ziel fuer die
  Einkaufsliste (Manifest-Erweiterung).
- GitHub-Actions auf `@v5` heben (Node-20-Warnung, unkritisch).
- TWA/Play-Store-Paket.

**Offen, geschaeftlich (Engpass!):**
1. Gewerbeanmeldung Gemeinde Seevetal (Einzelunternehmen
   „app-performance-solution", Inhaber Axel Hoffmann).
2. Haendlerbund-Mitgliedschaft → AGB + Widerrufsbelehrung
   (Prompt liegt vor) → `agb.html` + `widerruf.html` einbauen.
3. PayPal-Link → Direktkauf auf `/plus` freischalten.
4. Testfamilien rekrutieren (Anrufliste + Telefonleitfaden + A5-Aushang
   liegen vor). Ziel: >=30 % Woche-4-Retention.
5. Danach ELTERN/Funke: Pilot-Kooperation statt Verkauf.

**Preis-/Produktmodell:** Familien-Plus 29 EUR/Jahr (Founder), bis
5 Geraete. Free: 5 KI-Recherchen/Tag, 1 Wochenplan/Monat.
Verkaufsweg aktuell: unverbindliche Bestell-E-Mail ueber `/plus`,
Code-Erzeugung im Feedback-Postfach.

---

## 10. Uebergabe an einen neuen Chat

Damit ein neuer Chat SOFORT arbeitsfaehig ist, braucht er **beides**:
1. **Das aktuelle ZIP** (`familien_assistent_FUSION25.zip` o. neuer) -
   ohne den Code kann nichts geaendert werden.
2. **Diese Datei** - sie liegt im ZIP unter `ARBEITSGRUNDLAGE.md`.

Ausserdem die Arbeitsregel des Betreibers:
> Rollen: maximal profitorientierter Owner, formaler
> Senior-Systemarchitekt, epistemisch unabhaengiger Audit-Reviewer,
> Senior Software Engineer. Evidenzbasiert statt Annahmen
> (unverifizierte Menuepfade als [unverifiziert] markieren).
> Ausschliesslich komplette Dateien, alle Befehle einzeln, nach JEDER
> Aenderung hart testen. Immer EIN Step, dann auf Bestaetigung oder
> Ausgabe warten. Laienverstaendliche Klick-Anleitungen, keine
> Floskeln, radikale Kostendisziplin (kurze Antworten, Buendelung).

**Erste Handgriffe im neuen Chat:**
```
mkdir -p /home/claude/merge && cd /home/claude/merge \
  && unzip -oq /mnt/user-data/uploads/familien_assistent_FUSION25.zip
node tests/run.js            # muss 76/76 gruen sein
node tests/heilung.js        # Systemkarte synchronisieren
```
Danach ist der Stand exakt reproduziert.

---

## 11. Audit 31.07.2026 - warum die taeglichen Pruefungen versagt haben

Drei vom Betreiber gemeldete Fehler (App hoert sich selbst / Aktivton
wiederholt sich / Zutatenliste verschwindet beim Vorlesen) sind weder
vom taeglichen Red-Team noch vom taeglichen Funktionslauf je bemerkt
worden. Ursache, maschinell festgestellt:

1. **Das Red-Team war strukturell blind.** Es bekommt in `redteam.mjs`
   nur die in `ZIELFUNKTIONEN` gelisteten REINEN Funktionen zu sehen -
   bis heute ausschliesslich Rechenkerne. Alle drei Fehler lagen in der
   Ereignis- und Zeitsteuerung (`recognition.onresult`, `onend`,
   Sprechblasen-Timer). Diese Ebene war nie Ziel eines Angriffs.
2. **Der "Funktionstest" war derselbe Lauf.** `qa.yml` startete nur
   `tests/run.js`. Die Servertests unter `tests/server/` liefen gar
   nicht mit.
3. **Ein Test prueft Text statt Verhalten.** Das alte `G6` suchte eine
   Zeichenkette im Quelltext. Es wurde rot, als der Schutz VERBESSERT
   wurde - und waere gruen geblieben, haette man ihn geloescht.

**Behoben:**
- `ZIELFUNKTIONEN` um die Sprach- und Ausschlussfunktionen erweitert.
  *Regel: Jede neue reine Funktion gehoert dort hinein.*
- Ereignisebene testbar gemacht: `tests/lib/browser.js` hat jetzt eine
  AudioContext-Attrappe (`toeneGespielt()`, `toeneLeeren()`), die
  Erkennungs-Attrappe war bereits ueber `recInstanz` steuerbar.
- `G6` auf Verhalten umgeschrieben; Block **M1-M45** ergaenzt
  (Fehlertests zu allen drei gemeldeten Fehlern + Zufallsbeschuss).
- **`tests/mutation.js` neu:** zerstoert jede Reparatur einzeln und
  verlangt, dass die benannten Tests rot werden. Findet Tests, die nur
  Zierde sind - hat beim ersten Lauf sofort zwei entlarvt (die
  Auffangregel des Einkaufsbefehls und der Zufallsbeschuss, dem das
  Wort "zurueck" im Vorrat fehlte).
- `qa.yml` startet jetzt Szenarien **+ Servertests + Mutationstest**.

**Pflichtlauf vor jeder Auslieferung:**
```
node tests/run.js                       # 124/124 gruen
for f in tests/server/*.test.mjs; do node "$f"; done
node tests/mutation.js                  # 14/14 Mutationen bemerkt
node tests/heilung.js                   # Systemkarte synchronisieren
```

### Was das Testnetz weiterhin NICHT abdeckt
Ehrliche Grenze - das ist nur auf einem echten Geraet pruefbar:
- Ob der Android-**Systemton** tatsaechlich seltener kommt (die App
  kann ihn nicht abschalten, nur die Neustarts reduzieren).
- Ob die eigenen Signaltoene zur richtigen Sekunde erklingen.
- Echte Laufzeit der KI-Recherche gegen das Netlify-Limit.
- Echtes Verhalten der Android-Spracherkennung (Verzoegerung,
  getrennte Schreibweise zusammengesetzter Woerter).

---

## 12. Abnahmeregeln (ersetzt alle frueheren Formulierungen)

### Warum die alten Regeln versagt haben
"Hoechst effizient" und "absolut maximal hart testen" sind
Anstrengungsbeschreibungen. Sie haben keine Abbruchbedingung: Man kann
sie erfuellen und trotzdem Fehler ausliefern. Ausserdem ziehen sie
gegeneinander - wer schneller sein will, prueft weniger. In der Sitzung
vom 31.07. wurde dieser Ermessensspielraum systematisch zugunsten des
Lieferns statt des Pruefens genutzt.

### Die Aufloesung: zwei getrennte Achsen
Der Widerspruch verschwindet, sobald beide Begriffe verschiedene Dinge
steuern duerfen:

| Begriff | Steuert | Darf NIE |
| --- | --- | --- |
| **Haerte** | den **Abnahmepunkt** - wann etwas fertig ist | verhandelt, verschoben oder abgekuerzt werden |
| **Effizienz** | den **Weg** dorthin - Reihenfolge, Umfang, Wiederverwendung | Beweise weglassen |

**Vorrangregel:** Kollidieren beide, gewinnt ausnahmslos die Haerte.
Effizienz kuerzt den Weg zum Beweis, niemals den Beweis.

Damit ist Effizienz nicht mehr "weniger pruefen", sondern: **zuerst das
Billigste pruefen, das am ehesten fehlschlaegt.**

### Die Pipeline ist die Regel
Der Abnahmepunkt ist keine Absichtserklaerung, sondern der Rueckgabewert
von `node tests/pipeline.js`. Exit 0 = abgenommen. Alles andere = nicht
abgenommen. **Was nicht in der Pipeline steht, gilt nicht.**

| Stufe | Inhalt | Laufzeit | Blockiert |
| --- | --- | --- | --- |
| **0** | Reproduktionsnachweis: jeder gemeldete Fehler hat Test **und** Mutation | < 1 s | alles |
| **1** | Statische Evidenz: Syntax, Hausregeln, Listengleichstand, Zeitbudget, Versionsstempel | ~1 s | Stufe 2-3 |
| **2** | Deterministische Isolation: Szenarien + Servertests, vollstaendig mit Attrappen | < 1 s | Stufe 3 |
| **3** | Dynamische Haerte: Mutationsprobe - jede Reparatur wird zerstoert, die Tests MUESSEN rot werden | ~15 s | Abnahme |

Fail-Fast: Bei der ersten roten Stufe bricht der Lauf ab. Spaetere
Stufen laufen gar nicht erst - eine teure Mutationsprobe auf einem Code
mit Syntaxfehler ist verschwendete Zeit.

### Stufe 0 ist die eigentliche Neuerung
Sie beantwortet die Frage, die ich mir in der Sitzung vom 31.07.
mehrfach nicht gestellt habe: **Wird dieser Fehler ueberhaupt von einem
Test bewacht?**

Ablauf bei jeder Meldung des Betreibers:
1. Eintrag in `tests/fehlerregister.json` - **Symptom im Wortlaut**, nicht
   meine Deutung.
2. Test oder Messung schreiben, die den Fehler nachstellt und **ROT** ist.
   Die rote Zeile wird dem Betreiber gezeigt, bevor Code angefasst wird.
3. Erst danach reparieren.
4. Mutation in `tests/mutation.js` hinterlegen, die beweist, dass der
   Test den Fehler wirklich faengt.

Fehlt Schritt 1, 2 oder 4, ist Stufe 0 rot und **nichts** wird
abgenommen.

### Effizienz - erlaubte Mittel
Ausschliesslich Mittel, die den Weg verkuerzen, nie den Beweis:
* **Test Impact Analysis:** Jede Stufe kennt ihre Quelldateien. Aendert
  sich keine davon, wird die Stufe uebersprungen.
* **Zwischenspeicher:** Ergebnis wird per Inhalts-Hash gemerkt
  (`tests/berichte/pipeline-cache.json`). Im CI mit `--alles` bewusst
  ignoriert - dort zaehlt nur das vollstaendige Bild.
* **Auto-Cancel:** Ein neuer Commit bricht den laufenden CI-Lauf ab
  (`concurrency` in `qa.yml`).
* **Billig vor teuer:** Stufe 1 kostet 1 Sekunde und faengt Syntax-,
  Arithmetik- und Versionsfehler, fuer die Stufe 3 15 Sekunden braucht.

### Harte Verbote
1. **Keine Zahl ohne Messung.** Jede Zahl, Frist oder Grenze stammt aus
   einem Befehl, dessen Ausgabe im selben Beitrag sichtbar ist. Nicht
   messbar -> **[ungeprueft]** dahinterschreiben. Kein "ungefaehr",
   kein "typisch".
2. **Kein Fix ohne roten Test.** Siehe Stufe 0.
3. **Ein gemeldeter Fehler pro Schritt.** Buendelung mehrerer Meldungen
   ist untersagt - sie war 31.07. die Ursache veralteter
   Mutationsmuster und uebersehener Zusammenhaenge.
4. **Bei Zeitfehlern zuerst der Pfad.** Vor jeder Timing-Reparatur wird
   JEDER Netzzugriff der Anfrage aufgelistet. Ohne diese Liste keine
   Aenderung. (Zwei Redis-Aufrufe ohne Zeitlimit blieben so drei
   Reparaturversuche lang unentdeckt.)
5. **Kein Test, der nur Quelltext liest,** wo Verhalten pruefbar ist.
   Solche Tests werden gruen, wenn man die Reparatur loescht, und rot,
   wenn man sie verbessert.

### Was die Pipeline NICHT kann
Ehrliche Grenze, die kein Zusatz aufhebt: Toene, echte
Spracherkennung, echte Netzlaufzeiten und das Verhalten des
Android-Systemtons sind nur auf einem echten Geraet pruefbar. Fuer
diesen Bereich gilt: Ergebnisse werden als **[ungeprueft]**
gekennzeichnet, bis der Betreiber sie bestaetigt.
