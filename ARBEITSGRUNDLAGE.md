# ARBEITSGRUNDLAGE – Familien-Assistent FUSION26

Maschinell aus dem Code extrahiert (nicht aus Erinnerung). Zweck: Bei
jeder künftigen Reparatur sofort wissen, WAS wo liegt, ohne zu suchen.
Stand: FUSION26 / sw `app-fusion26`, index.html siehe Systemkarte.
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
`ttsSaeubern`1482 (Emoji+Klammer-Filter) · `speakChunks`1505 ·
`speak`1717 (zentraler Eingang; Reihenfolge: Sprechblase original →
säubern → Stimme/Klangfarbe → Chunks) · `gvSprechblase`1524 ·
`stimmenLaden`1603 · `stimmeAktuelle`1679 · `stimmenAuswahlFuellen`1686 ·
`stimmeGewaehlt`1705 · `stimmeProbe`1711 · `klangAktuell`1651 ·
`klangGewaehlt`1656 · `klangAuswahlFuellen`1663 ·
`muteMic`1457 / `unmuteMic`1466 (Mikro-Exklusivität, 12-s-Notaus)

**Spracherkennung / Router**
`GlobalVoice`1853 · `gvStart`1899 · `gvStopp`1995 · `gvToggle`2003 ·
`gvNeustart`1891 · `gvAutoStart`2025 · `gvChip`1862 ·
`erkenneKommando`2084 (**alle Befehle**, siehe §4) ·
`istUeberspringen`2053 · `gvRoute`2233 (Ausführung) · `gvOneShot`2857 ·
`initRecognition`2871 · `GV_RUHE_MS`1859 (20 s Stille → Pause)

**Rezepte / Kochen**
`RECIPES`920 (Standard-Rezepte) · `dietPasses`1325 / `requiredDiets`1299 /
`satisfiesDiet`1314 (Ernährungsform-Logik) · `styleScore`1343 ·
`renderRecipes`3208 · `selectedIntolerances`3129 · `setTimeGroup`3142 ·
`rechercheRezept`3659 (KI-Aufruf + 429/504-Behandlung) ·
`fehlermeldungRecherche`3164 · `rezeptVorstellen`3192 /
`rezeptVorstellungsText`3177 · `startCooking`3470 · `showStep`3519 /
`renderStep`3505 · `zutatenImSchritt`3489 · `startTimer`3544 ·
`confirmStep`3591 · `repeatStep`3613 · `armReminder`3576 ·
`flashStep`3784 · `clearTimers`3792 · Favoriten: `loadFavs`2957,
`saveFavs`2963, `addFavorite`2968, `renderFavoriten`2987

**Mengen-Kontinuität (FUSION15, kritisch)**
`portionFactor`4111 → `skaliereRezept`3335 schreibt das Rezept **einmal
bei der Auswahl** fest (inkl. Zahlen in Schritt-Prosa via
`smartMenge`3314 + `zahlVarianten`3320) → alle Anzeigen rechnen danach
mit Faktor 1 (Wächter `_skaliert`). Formatierung überall:
`smartQty`3366 (Rundung: g/ml 25er bzw. 50er ab 500; Liter .25;
EL/TL .5; Stück ganzzahlig).

**Einkauf / Verbrauch**
`buildShoppingList`3402 · `readShoppingList`3429 ·
`leereEinkaufsliste`3448 (+Knopf/Voice-Varianten 2926/2929) ·
`parseArtikelListe`2144 · `einkaufHinzufuegen`2159 ·
`VERBRAUCH`4987 · `vState`5054 · `vbSave`5086 · `renderVerbrauch`5135 ·
`vbRate`5056 · `vbReichtNochTage`5081 · `vbGekauft`5108 ·
Einkaufs-Modus: `vbVoiceCheckoffStart`5315 / `vbVoiceCheckoffStop`5363 / `vbVoiceCheckoffToggle`5377,
`vbVoiceHandle`5287, `vbMatchScore`5259

**Familie / Termine**
`mitglieder`3818 · `addMember`4119 · `renderMembers`4139 ·
`personenAequivalent`4092 · `summePE`4106 ·
`termine`3820 · `tLoad`3825 · `tSaveAll`3829 (**+ syncGeplant**) ·
`formularTermin`4618 · `saveTermin`4637 · `findeKollisionen`4583 ·
`terminDialogNext`4338 (Zustandsautomat) · `startTerminDialog`4508 ·
`parseServer`4513 · `findeMitglied`4285 / `findeMitgliedImSatz`4312 ·
`editierDistanz`4273 · `renderMatrix`4714 · `wocheWechseln`4701 ·
`montagVon`4705 / `isoTag`4712 · `renderTerminListe`4786 ·
`checkErinnerungen`4828 · `zeigeErinnerung`4850 · `reminderOk`4878 ·
`routinen`3819 · `addRoutine`4669 · `renderRoutinen`4683

**Wochenplan (Plus)**
`wpPlanen`2338 · `wpLaeuft`2337 → POST `/api/rezept` mit
`modus:"wochenplan"` → Termine 18:00 in angezeigter Woche +
konsolidierte Liste über `smartQty`

**Familien-Sync (Plus, E2E)**
`syncCode`2453 · `syncSchluessel`2460 (PBKDF2 150k, Salt
`ka-familien-sync-v1`) · `syncVerschluesseln`2477 /
`syncEntschluesseln`2484 (AES-GCM, IV zufällig, Format `iv.ct` b64) ·
`syncDaten`2493 (termine/routinen/mitglieder/verbrauch) ·
`syncUebernehmen`2496 · `syncGeplant`2515 (2,5 s Debounce) ·
`syncSenden`2520 · `syncAbholen`2541 (Poll 60 s + visibilitychange) ·
`syncVerbinden`2576 · `syncEinladen`2619 + `syncEinladungsLink`2615
(Code im **URL-Fragment** `#sync=`, nie in Server-Logs) ·
`syncTrennen`2635 · `syncAnzeige`2558

**Onboarding**
`OB_FLAG`2676 · `OB_SCHRITTE`2677 · `OB_SAG`2684 · `obZeige`2712
(liest **Volltext** der Seite) · `obWeiter`2751 / `obZurueck`2756 ·
`obFertig`2759 (**startet Mikrofon → Berechtigungsdialog**) ·
`obMitgliedHinzu`2787 · `obMikro`2806 · `obPush`2817 · `obInstall`2829 ·
`onboardingOeffnen`2742

**Gerät / Infrastruktur**
`deviceId`3838 (crypto.getRandomValues, g+32 Hex; Museums-Fallback
djb2, **kein Math.random**) · `idbOpen`3865 / `idbSet`3873 ·
`weckerPlan`3882 · `serverSync`3905 · `aktivierePush`3925 ·
`pruefePushAbo`3971 · `b64ToUint8`3920 · `goTab`2878 ·
`aktiverTab`4026 · `appBeenden`2660 · `loescheAlles`4074 (DSGVO) ·
Feedback: `fbOeffnen`4030 / `fbSprechen`4037 / `fbSenden`4047

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

## 4. Sprachbefehle (Stand FUSION15B, `erkenneKommando`2084)

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
| „weiter"/„überspringen" | kontextsensitiv (`istUeberspringen`2053) |

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
Sicherheitsfilter nach der KI**) · `buildPrompt`338 ·
`normalizeRecipe`432 · `faelligeRefs`/`anzeigeRefs` (wecker.mjs)

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
