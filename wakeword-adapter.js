/* =====================================================================
   WAKEWORD-ADAPTER fuer den Lausch-Modus (FUSION38)
   ---------------------------------------------------------------------
   AUFGABE: Still (ohne Android-Systemton!) auf das Zuruf-Wort "Termin"
   lauschen und bei Erkennung die App benachrichtigen. Der Systemton
   entsteht nur beim SpeechRecognizer - rohes Mikrofon-Audio ueber
   getUserMedia/WebAudio ist lautlos. Deshalb lebt hier ein kleiner
   WASM-Schluesselwort-Erkenner, und erst NACH dem Treffer startet die
   App die normale Spracherkennung (der eine Ton = Bereitton).

   VERTRAG (mehr braucht die App nicht):

       window.KA_WAKEWORD = {
         async start(onTreffer) { ... },  // beginnt zu lauschen;
                                          // onTreffer("termin") rufen
         stop() { ... },                  // beendet das Lauschen und
                                          // gibt das Mikrofon frei
       };

   Die Zustandsmaschine (lauschStart/lauschTreffer/... in index.html)
   uebernimmt alles Weitere: Bereitton, Termindialog, Wiederaufnahme
   nach dem Diktat, Pause bei verstecktem Tab, Wake-Lock. Sie ist
   durch die Szenarien L-01 bis L-06 abgesichert und stuerzt auch ohne
   diesen Adapter nicht ab - sie zeigt dann nur einen Hinweis.

   ZWEI ERPROBTE WEGE, den Erkenner zu fuellen - EINEN waehlen,
   die Bausteine lokal in /vendor/ ablegen und den Block einkommentieren:

   ---------------------------------------------------------------------
   WEG A: Picovoice Porcupine Web (empfohlen: klein & treffsicher)
   ---------------------------------------------------------------------
   Vorbereitung (einmalig, am Rechner):
     1. Kostenloses Konto auf console.picovoice.ai -> AccessKey kopieren.
     2. Dort unter "Porcupine" das deutsche Schluesselwort "Termin"
        trainieren -> termin_de_wasm.ppn herunterladen.
     3. npm-Pakete @picovoice/porcupine-web und @picovoice/web-voice-
        processor holen; aus deren dist/ die IIFE-Bundles nach
        /vendor/porcupine.js und /vendor/web-voice-processor.js legen,
        das deutsche Modell porcupine_params_de.pv nach /vendor/.
     4. Beide vendor-Skripte VOR dieser Datei in index.html einbinden
        oder hier per dynamischem <script>-Tag nachladen.

   // const PV_ACCESS_KEY = "HIER-DEIN-ACCESSKEY";
   // let pvPorcupine = null, pvAbo = null;
   // window.KA_WAKEWORD = {
   //   async start(onTreffer) {
   //     if (!pvPorcupine) {
   //       pvPorcupine = await PorcupineWeb.PorcupineWorker.create(
   //         PV_ACCESS_KEY,
   //         [{ label: "termin", publicPath: "/vendor/termin_de_wasm.ppn" }],
   //         (erkennung) => onTreffer(erkennung.label),
   //         { publicPath: "/vendor/porcupine_params_de.pv" });
   //     }
   //     pvAbo = await WebVoiceProcessor.WebVoiceProcessor.subscribe(
   //       pvPorcupine);
   //   },
   //   stop() {
   //     try {
   //       if (pvPorcupine)
   //         WebVoiceProcessor.WebVoiceProcessor.unsubscribe(pvPorcupine);
   //     } catch (e) {}
   //   },
   // };

   ---------------------------------------------------------------------
   WEG B: Vosk-Browser (komplett frei, aber ~40-50 MB Modell)
   ---------------------------------------------------------------------
   Vorbereitung:
     1. vosk-browser (IIFE-Bundle) nach /vendor/vosk.js legen.
     2. Kleines deutsches Modell (vosk-model-small-de) als ZIP nach
        /vendor/vosk-model-small-de.zip.
     3. /vendor/vosk.js vor dieser Datei einbinden.

   // let voskModell = null, voskErkenner = null, voskStrom = null,
   //     voskKontext = null, voskKnoten = null;
   // window.KA_WAKEWORD = {
   //   async start(onTreffer) {
   //     if (!voskModell)
   //       voskModell = await Vosk.createModel(
   //         "/vendor/vosk-model-small-de.zip");
   //     voskErkenner = new voskModell.KaldiRecognizer(16000,
   //       JSON.stringify(["termin"]));   // Grammatik: NUR das Zuruf-Wort
   //     voskErkenner.on("result", (m) => {
   //       const text = (m.result && m.result.text) || "";
   //       if (/termin/i.test(text)) onTreffer("termin");
   //     });
   //     voskStrom = await navigator.mediaDevices.getUserMedia({
   //       audio: { channelCount: 1, sampleRate: 16000 } });
   //     voskKontext = new AudioContext({ sampleRate: 16000 });
   //     const quelle = voskKontext.createMediaStreamSource(voskStrom);
   //     voskKnoten = voskKontext.createScriptProcessor(4096, 1, 1);
   //     voskKnoten.onaudioprocess = (ev) =>
   //       voskErkenner.acceptWaveform(ev.inputBuffer);
   //     quelle.connect(voskKnoten);
   //     voskKnoten.connect(voskKontext.destination);
   //   },
   //   stop() {
   //     try { if (voskKnoten) voskKnoten.disconnect(); } catch (e) {}
   //     try { if (voskKontext) voskKontext.close(); } catch (e) {}
   //     try {
   //       if (voskStrom)
   //         voskStrom.getTracks().forEach((t) => t.stop());
   //     } catch (e) {}
   //     voskKnoten = voskKontext = voskStrom = null;
   //   },
   // };

   ---------------------------------------------------------------------
   EHRLICHE GRENZEN (Web-Plattform, kein Bug dieser App):
   - App muss geoeffnet und der Bildschirm an sein (Wake-Lock haelt ihn
     wach, kostet Akku). Kein Lauschen bei dunklem Bildschirm oder aus
     dem Hintergrund - das koennte nur ein nativer Wrapper.
   - iPhone/Safari: getUserMedia geht, aber die Grenzen sind strenger;
     der Lausch-Modus ist primaer fuer Android/Chrome gedacht.
   - Solange dieser Adapter nicht gefuellt ist, zeigt der Knopf in der
     App einen Hinweis und sonst passiert nichts - bewusst so gebaut.
   ===================================================================== */
"use strict";
/* Ohne einkommentierten Weg bleibt window.KA_WAKEWORD absichtlich
   undefiniert - die App erkennt das und erklaert es dem Nutzer. */
