# Herkunft (unveraendert aus npm)

| Datei | Paket | Lizenz |
|---|---|---|
| tesseract.min.js, worker.min.js | tesseract.js 7.0.0 (`dist/`) | Apache-2.0 |
| core/*-lstm.wasm.js | tesseract.js-core 7.0.0 | Apache-2.0 |
| lang/deu.traineddata.gz | @tesseract.js-data/deu 1.0.0 (`4.0.0_best_int`) | Apache-2.0 (Tesseract tessdata), Paket MIT |

Einzige Aenderung: Verweis auf Source-Maps (`sourceMappingURL`) entfernt,
da die .map-Dateien nicht mitgeliefert werden.
Alles wird von der eigenen Domain geladen - kein CDN, keine Bilddaten
verlassen das Geraet.
