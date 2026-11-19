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
  ziel.innerHTML = "<div class='karte'>Lade Bericht \u2026</div>";
  try {
    const r = await fetch("/api/qa?token=" + encodeURIComponent(tok));
    if (r.status === 401) {
      ziel.innerHTML = "<div class='karte'>\u274c Token stimmt nicht.</div>";
      return;
    }
    if (!r.ok) {
      ziel.innerHTML = "<div class='karte'>\u274c Server-Fehler " + r.status + "</div>";
      return;
    }
    const d = await r.json();
    aktuellerBericht = d.bericht;
    zeichne(d);
  } catch (e) {
    ziel.innerHTML = "<div class='karte'>\u274c Keine Verbindung.</div>";
  }
}

function zeichne(d) {
  const ziel = document.getElementById("inhalt");
  const b = d.bericht;
  if (!b) {
    ziel.innerHTML = "<div class='karte'>Noch kein Bericht vorhanden. " +
      "Der erste kommt nach dem n\u00e4chsten n\u00e4chtlichen Lauf.</div>";
    return;
  }
  const echte = b.fehler || [];
  const verdacht = b.verdachtsfaelle || [];
  let ampel = "a-gruen", ampelText = "Alles in Ordnung";
  if (!b.gesamt) { ampel = "a-rot"; ampelText = "Testlauf ausgefallen"; }
  else if (echte.length) { ampel = "a-rot"; ampelText = "Fehler gefunden"; }
  else if (b.stoerung) { ampel = "a-gelb"; ampelText = "Unvollst\u00e4ndig"; }
  else if (verdacht.length) { ampel = "a-gelb"; ampelText = "Zu pr\u00fcfen"; }

  let html = "";

  // --- \u00dcberblick in Alltagssprache ---
  html += "<div class='karte'>" +
    "<span class='ampel " + ampel + "'>" + ampelText + "</span>" +
    (b.stoerung
      ? "<div style='margin-top:10px;padding:8px 10px;background:#fdf2e0;" +
        "border:1px solid #e2c48a;border-radius:8px'>\u26a0\ufe0f <b>Der Pr\u00fcf-" +
        "Durchgang war gest\u00f6rt:</b><br><span class='muted'>" +
        entschaerfe(b.stoerung) + "</span><br>H\u00e4ufigste Ursache: " +
        "Das KI-Guthaben ist aufgebraucht \u2013 dann funktioniert auch die " +
        "Rezept-Recherche in der App nicht.</div>"
      : "") +
    (b.ueberschrift ? "<p style='margin-top:10px;font-size:1.05rem'><b>" +
      entschaerfe(b.ueberschrift) + "</b></p>" : "") +
    "<p style='margin-top:6px'><b>" + b.bestanden + " von " + b.gesamt +
    "</b> Pr\u00fcfungen bestanden.<br>" +
    (echte.length
      ? "<span style='color:var(--rot)'><b>" + echte.length +
        " echte Fehler</b> \u2013 die App macht etwas nicht wie vorgesehen.</span>"
      : "Keine echten Fehler.") + "<br>" +
    (verdacht.length
      ? "<span style='color:var(--gelb)'><b>" + verdacht.length +
        " Verdachtsf\u00e4lle</b> vom Pr\u00fcf-Modell \u2013 k\u00f6nnen echte Fehler sein " +
        "oder falscher Alarm.</span>"
      : "Keine Verdachtsf\u00e4lle.") +
    "</p><p class='muted'>Version " + b.version + " \u00b7 " +
    (b.zeitpunkt || "").replace("T", " ").slice(0, 16) + " Uhr" +
    (b.lauf ? " \u00b7 <a href='" + b.lauf + "'>Technisches Protokoll</a>" : "") +
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

  // --- Freigabe-Kn\u00f6pfe ---
  html += "<div class='karte'><h2>Freigaben</h2>";
  if (echte.length || verdacht.length) {
    html += "<p class='muted'>Schritt 1: Reparatur beauftragen. Danach " +
      "wird automatisch gebaut, hart getestet und vom Pr\u00fcf-Modell " +
      "gegengepr\u00fcft \u2013 du bekommst wieder eine Meldung.</p>" +
      "<button class='gross' id='btnRep' data-aktion='freigabe:reparatur'>" +
      "\ud83d\udd27 Reparatur beauftragen</button>";
  } else {
    html += "<p class='muted'>Nichts zu reparieren.</p>";
  }
  html += "<p class='muted' style='margin-top:14px'>Schritt 2: Erst " +
    "klicken, wenn ein Reparatur-Bericht vorliegt und gut aussieht. " +
    "Dann geht die neue Version automatisch live.</p>" +
    "<button class='gross gruen' id='btnLive' data-aktion='freigabe:live'>" +
    "\ud83d\ude80 Live schalten</button>";
  html += "<div id='freigabeInfo' class='muted' style='margin-top:10px'></div>";
  html += "</div>";

  // --- Verlauf ---
  if (d.verlauf && d.verlauf.length) {
    html += "<div class='karte'><h2>Letzte L\u00e4ufe</h2>";
    d.verlauf.forEach((v) => {
      html += "<div class='zeile'><span>" +
        entschaerfe((v.zeitpunkt || "").replace("T", " ").slice(0, 16)) + "</span><span>" +
        entschaerfe(v.bestanden) + " ok" +
        (v.fehlgeschlagen ? " \u00b7 " + entschaerfe(v.fehlgeschlagen) + " Fehler" : "") +
        (v.verdacht ? " \u00b7 " + entschaerfe(v.verdacht) + " Verdacht" : "") +
        "</span></div>";
    });
    html += "</div>";
  }

  html += "<p class='muted' style='text-align:center'>" +
    "<button class='grau' data-aktion='laden'>Aktualisieren</button></p>";
  ziel.innerHTML = html; // NOSONAR - alle Nutzerdaten durch entschaerfe() HTML-kodiert
}

function befundKarte(f, istEchterFehler) {
  const dring = { hoch: "\ud83d\udd34 dringend", mittel: "\ud83d\udfe0 sollte bald",
    niedrig: "\ud83d\udfe1 kann warten" }[f.dringlichkeit] || "";
  let s = "<div class='fall" + (istEchterFehler ? " echt" : "") + "'>";
  s += "<div style='font-size:.78rem;color:var(--muted)'>" +
    (istEchterFehler ? "Fehler" : "Verdacht") +
    (f.bereich ? " \u00b7 " + entschaerfe(f.bereich) : "") +
    (dring ? " \u00b7 " + dring : "") + "</div>";
  // Klartext zuerst - das ist das Wichtige
  s += "<div style='margin-top:4px'><b>" +
    entschaerfe(f.klartext || f.name) + "</b></div>";
  if (f.auswirkung) {
    s += "<div style='margin-top:3px'>Was das bedeutet: " +
      entschaerfe(f.auswirkung) + "</div>";
  }
  if (f.vorschlag) {
    s += "<div style='margin-top:4px;padding:6px 8px;background:#eef4ea;" +
      "border-radius:6px'>\ud83d\udd27 <b>Vorschlag:</b> " +
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
    : "Die gepr\u00fcfte Version JETZT f\u00fcr alle Familien live schalten?";
  if (!confirm(frage)) return;
  const rep = document.getElementById("btnRep");
  const live = document.getElementById("btnLive");
  if (rep) rep.disabled = true;
  if (live) live.disabled = true;
  info.textContent = "Starte \u2026";
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
        ? "\u2705 Reparatur l\u00e4uft. Du bekommst eine Meldung aufs Handy, " +
          "sobald der Bericht fertig ist (meist wenige Minuten)."
        : "\u2705 Live-Schaltung l\u00e4uft. Die App aktualisiert sich bei den " +
          "Familien beim n\u00e4chsten Start von selbst.";
    } else {
      info.textContent = "\u274c " + (d.error || "Start fehlgeschlagen");
      if (rep) rep.disabled = false;
      if (live) live.disabled = false;
    }
  } catch (e) {
    info.textContent = "\u274c Keine Verbindung.";
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
