// =====================================================================
// QUELLEN der App (F-034)
// Der Programmcode der App steht nicht mehr direkt in index.html, sondern
// in Dateien /app-1.js, /app-2.js (wegen der strengen Sicherheitsregel ohne
// 'unsafe-inline'). Alle Test-Werkzeuge lesen den Code ueber diese Datei,
// damit sie in BEIDEN Zustaenden (vorher/nachher) funktionieren.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");

/** Lokale App-Skripte in der Reihenfolge ihres Auftretens in index.html. */
function appDateien(wurzel) {
  const html = fs.readFileSync(path.join(wurzel, "index.html"), "utf8");
  const aus = [];
  for (const m of html.matchAll(/<script[^>]*\bsrc="\/(app-\d+\.js)"[^>]*>/g)) {
    if (fs.existsSync(path.join(wurzel, m[1]))) aus.push(m[1]);
  }
  return aus;
}

/** Programmcode in Ausfuehrungsreihenfolge (eingebettete Bloecke + app-N.js). */
function appCodeBloecke(wurzel) {
  const html = fs.readFileSync(path.join(wurzel, "index.html"), "utf8");
  const aus = [];
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const kopf = m[1];
    const quelle = (kopf.match(/\bsrc="\/(app-\d+\.js)"/) || [])[1];
    if (quelle) {
      if (fs.existsSync(path.join(wurzel, quelle)))
        aus.push({ name: quelle, code: fs.readFileSync(path.join(wurzel, quelle), "utf8") });
      continue;
    }
    if (/\bsrc\s*=/.test(kopf)) continue;                      // andere externe Datei
    if (/type\s*=\s*["'][^"']*json/i.test(kopf)) continue;     // JSON-LD
    aus.push({ name: "index.html (eingebettet)", code: m[2] });
  }
  return aus;
}

/** index.html plus alle ausgelagerten App-Skripte als ein Text (fuer Textpruefungen). */
function appGesamtText(wurzel) {
  const html = fs.readFileSync(path.join(wurzel, "index.html"), "utf8");
  return [html].concat(appDateien(wurzel)
    .map((d) => fs.readFileSync(path.join(wurzel, d), "utf8"))).join("\n");
}

module.exports = { appDateien, appCodeBloecke, appGesamtText };
