let aktuellerBericht = null;

function tokenHolen() {
  return (document.getElementById("tok").value || "").trim();
}

(function start() {
  try {
    const t = localStorage.getItem("ka_admin_token");
    if (t) { document.getElementById("tok").value = t; laden(); }
  } catch (e) {}
})();

async function laden() {
  const tok = tokenHolen();
  const ziel = document.getElementById("inhalt");
  if (!tok) { ziel.innerHTML = "<div class='karte'>Bitte Token eingeben.</div>"; return; }
  try { localStorage.setItem("ka_admin_token", tok); } catch (e) {}
  ziel.innerHTML = "<div class='karte'>Lade Bericht …</div>";
  try {
    const r = await fetch("/api/qa?token=" + encodeURIComponent(tok));
    if (r.status === 401) {
      ziel.innerHTML = "<div class='karte'>❌ Token stimmt nicht.</div>";
      return;
    }
    if (!r.ok) {
      ziel.innerHTML = "<div class='karte'>❌ Server-Fehler " + r.status + "</div>";
      return;
    }
    const d = await r.json();
    aktuellerBericht = d.bericht;
    zeichne(d);
  } catch (e) {
    ziel.innerHTML = "<div class='karte'>❌ Keine Verbindung.</div>";
  }
}

function zeichne(d) {
  const ziel = document.getElementById("inhalt");
  const b = d.bericht;
  if (!b) {
    ziel.innerHTML = "<div class='karte'>Noch kein Bericht vorhanden. " +
      "Der erste kommt nach dem nächsten nächtlichen Lauf.</div>";
    return;
  }
  const echte = b.fehler || [];
  const verdacht = b.verdachtsfaelle || [];
  let ampel = "a-gruen", ampelText = "Alles in Ordnung";
  if (!b.gesamt) { ampel = "a-rot"; ampelText = "Testlauf ausgefallen"; }
  else if (echte.length) { ampel = "a-rot"; ampelText = "Fehler gefunden"; }
  else if (b.stoerung) { ampel = "a-gelb"; ampelText = "Unvollständig"; }
  else if (verdacht.length) { ampel = "a-gelb"; ampelText = "Zu prüfen"; }

  let html = "";

  // --- Überblick in Alltagssprache ---
  html += "<div class='karte'>" +
    "<span class='ampel " + ampel + "'>" + ampelText + "</span>" +
    (b.stoerung
      ? "<div style='margin-top:10px;padding:8px 10px;background:#fdf2e0;" +
        "border:1px solid #e2c48a;border-radius:8px'>⚠️ <b>Der Prüf-" +
        "Durchgang war gestört:</b><br><span class='muted'>" +
        entschaerfe(b.stoerung) + "</span><br>Häufigste Ursache: " +
        "Das KI-Guthaben ist aufgebraucht – dann funktioniert auch die " +
        "Rezept-Recherche in der App nicht.</div>"
      : "") +
    (b.ueberschrift ? "<p style='margin-top:10px;font-size:1.05rem'><b>" +
      entschaerfe(b.ueberschrift) + "</b></p>" : "") +
    "<p style='margin-top:6px'><b>" + b.bestanden + " von " + b.gesamt +
    "</b> Prüfungen bestanden.<br>" +
    (echte.length
      ? "<span style='color:var(--rot)'><b>" + echte.length +
        " echte Fehler</b> – die App macht etwas nicht wie vorgesehen.</span>"
      : "Keine echten Fehler.") + "<br>" +
    (verdacht.length
      ? "<span style='color:var(--gelb)'><b>" + verdacht.length +
        " Verdachtsfälle</b> vom Prüf-Modell – können echte Fehler sein " +
        "oder falscher Alarm.</span>"
      : "Keine Verdachtsfälle.") +
    "</p><p class='muted'>Version " + b.version + " · " +
    (b.zeitpunkt || "").replace("T", " ").slice(0, 16) + " Uhr" +
    (b.lauf ? " · <a href='" + b.lauf + "'>Technisches Protokoll</a>" : "") +
    "</p></div>";

  // --- Befunde ---
  if (echte.length || verdacht.length) {
    html += "<div class='karte'><h2>Was genau gefunden wurde</h2>";
    if (b.klartextHinweis) {
      html += "<p class='muted'>" + entschaerfe(b.klartextHinweis) + "</p>";
    }
    echte.forEach((f) => { html += befundKarte(f, true); });
    verdacht.forEach((f) => { html += befundKarte(f, false); });
    html += "</div>";
  }

  // --- Freigabe-Knöpfe ---
  html += "<div class='karte'><h2>Freigaben</h2>";
  if (echte.length || verdacht.length) {
    html += "<p class='muted'>Schritt 1: Reparatur beauftragen. Danach " +
      "wird automatisch gebaut, hart getestet und vom Prüf-Modell " +
      "gegengeprüft – du bekommst wieder eine Meldung.</p>" +
      "<button class='gross' id='btnRep' data-aktion='freigabe:reparatur'>" +
      "🔧 Reparatur beauftragen</button>";
  } else {
    html += "<p class='muted'>Nichts zu reparieren.</p>";
  }
  html += "<p class='muted' style='margin-top:14px'>Schritt 2: Erst " +
    "klicken, wenn ein Reparatur-Bericht vorliegt und gut aussieht. " +
    "Dann geht die neue Version automatisch live.</p>" +
    "<button class='gross gruen' id='btnLive' data-aktion='freigabe:live'>" +
    "🚀 Live schalten</button>";
  html += "<div id='freigabeInfo' class='muted' style='margin-top:10px'></div>";
  html += "</div>";

  // --- Verlauf ---
  if (d.verlauf && d.verlauf.length) {
    html += "<div class='karte'><h2>Letzte Läufe</h2>";
    d.verlauf.forEach((v) => {
      html += "<div class='zeile'><span>" +
        (v.zeitpunkt || "").replace("T", " ").slice(0, 16) + "</span><span>" +
        v.bestanden + " ok" +
        (v.fehlgeschlagen ? " · " + v.fehlgeschlagen + " Fehler" : "") +
        (v.verdacht ? " · " + v.verdacht + " Verdacht" : "") +
        "</span></div>";
    });
    html += "</div>";
  }

  html += "<p class='muted' style='text-align:center'>" +
    "<button class='grau' data-aktion='laden'>Aktualisieren</button></p>";
  ziel.innerHTML = html;
}

function befundKarte(f, istEchterFehler) {
  const dring = { hoch: "🔴 dringend", mittel: "🟠 sollte bald",
    niedrig: "🟡 kann warten" }[f.dringlichkeit] || "";
  let s = "<div class='fall" + (istEchterFehler ? " echt" : "") + "'>";
  s += "<div style='font-size:.78rem;color:var(--muted)'>" +
    (istEchterFehler ? "Fehler" : "Verdacht") +
    (f.bereich ? " · " + entschaerfe(f.bereich) : "") +
    (dring ? " · " + dring : "") + "</div>";
  // Klartext zuerst - das ist das Wichtige
  s += "<div style='margin-top:4px'><b>" +
    entschaerfe(f.klartext || f.name) + "</b></div>";
  if (f.auswirkung) {
    s += "<div style='margin-top:3px'>Was das bedeutet: " +
      entschaerfe(f.auswirkung) + "</div>";
  }
  if (f.vorschlag) {
    s += "<div style='margin-top:4px;padding:6px 8px;background:#eef4ea;" +
      "border-radius:6px'>🔧 <b>Vorschlag:</b> " +
      entschaerfe(f.vorschlag) + "</div>";
  }
  // Technische Fassung nur klein und aufklappbar
  s += "<details style='margin-top:5px'><summary class='muted' " +
    "style='font-size:.78rem;cursor:pointer'>Technische Fassung</summary>" +
    "<div class='muted' style='font-size:.78rem;margin-top:3px'>" +
    entschaerfe(f.name) + (f.fehlertext ? "<br>" + entschaerfe(f.fehlertext)
      : "") + "</div></details>";
  s += "</div>";
  return s;
}

function entschaerfe(text) {
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

async function freigabe(art) {
  const info = document.getElementById("freigabeInfo");
  const frage = art === "reparatur"
    ? "Reparatur automatisch bauen und testen lassen?"
    : "Die geprüfte Version JETZT für alle Familien live schalten?";
  if (!confirm(frage)) return;
  const rep = document.getElementById("btnRep");
  const live = document.getElementById("btnLive");
  if (rep) rep.disabled = true;
  if (live) live.disabled = true;
  info.textContent = "Starte …";
  try {
    const r = await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_token: tokenHolen(),
        freigabe: art,
        befund: aktuellerBericht
          ? (aktuellerBericht.fehler || []).concat(
              aktuellerBericht.verdachtsfaelle || [])
              .map((f) => f.name).join(" | ").slice(0, 400)
          : "",
      }),
    });
    const d = await r.json();
    if (d.success) {
      info.innerHTML = art === "reparatur"
        ? "✅ Reparatur läuft. Du bekommst eine Meldung aufs Handy, " +
          "sobald der Bericht fertig ist (meist wenige Minuten)."
        : "✅ Live-Schaltung läuft. Die App aktualisiert sich bei den " +
          "Familien beim nächsten Start von selbst.";
    } else {
      info.textContent = "❌ " + (d.error || "Start fehlgeschlagen");
      if (rep) rep.disabled = false;
      if (live) live.disabled = false;
    }
  } catch (e) {
    info.textContent = "❌ Keine Verbindung.";
    if (rep) rep.disabled = false;
    if (live) live.disabled = false;
  }
}

// F-034: Knoepfe tragen keine Programmzeilen mehr (strenge Sicherheitsregel).
const AKTIONEN = { laden, freigabe };
document.addEventListener("click", (e) => {
  const el = e.target && e.target.closest ? e.target.closest("[data-aktion]") : null;
  if (!el) return;
  const teile = el.getAttribute("data-aktion").split(":");
  if (Object.prototype.hasOwnProperty.call(AKTIONEN, teile[0])) AKTIONEN[teile[0]](teile[1]);
});
