function kopiere() {
  const t = document.getElementById("devid").textContent;
  try { navigator.clipboard.writeText(t); alert("Kopiert: " + t); }
  catch (e) { prompt("Manuell kopieren:", t); }
}
(function initToken() {
  try {
    document.getElementById("devid").textContent =
      localStorage.getItem("ka_device") || "(App auf diesem Gerät zuerst öffnen)";
    const t = localStorage.getItem("ka_admin_token");
    if (t) { document.getElementById("tok").value = t; laden(); }
  } catch (e) {}
})();
async function plusCode() {
  const ziel = document.getElementById("plusErgebnis");
  const tok = document.getElementById("tok").value.trim();
  if (!tok) { ziel.textContent = "Erst Token eingeben."; return; }
  ziel.textContent = "…";
  try {
    const r = await fetch("/api/termine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plus_freischalten: true, admin_token: tok }),
    });
    const d = await r.json();
    ziel.textContent = d.success ? d.code : ("❌ " + (d.error || r.status));
  } catch (e) { ziel.textContent = "❌ Keine Verbindung."; }
}
async function loeschAnfrage(körper) {
  körper.admin_token = document.getElementById("tok").value.trim();
  const r = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(körper),
  });
  return r.ok ? r.json() : null;
}
async function eintragLoeschen(eintrag, div) {
  if (!confirm("Diesen Eintrag endgültig löschen?\n\n" +
    (eintrag.text || "").slice(0, 120))) return;
  const d = await loeschAnfrage({ loeschen_eintrag: JSON.stringify(eintrag) });
  if (d && d.success) div.remove();
  else alert("Löschen fehlgeschlagen (Token korrekt?).");
}
async function alleLoeschen() {
  if (!confirm("Wirklich ALLE Feedback-Einträge endgültig löschen?")) return;
  const d = await loeschAnfrage({ loeschen: "alle" });
  if (d && d.success) laden();
  else alert("Löschen fehlgeschlagen (Token korrekt?).");
}
async function laden() {
  const status = document.getElementById("status");
  const liste = document.getElementById("liste");
  const tok = document.getElementById("tok").value.trim();
  if (!tok) { status.textContent = "Bitte Token eingeben."; return; }
  try { localStorage.setItem("ka_admin_token", tok); } catch (e) {}
  status.textContent = "Lade …";
  liste.innerHTML = "";
  try {
    const r = await fetch("/api/feedback?token=" + encodeURIComponent(tok));
    if (r.status === 401) { status.textContent = "❌ Falscher Token."; return; }
    if (!r.ok) { status.textContent = "❌ Server-Fehler " + r.status; return; }
    const d = await r.json();
    status.textContent = "✅ " + d.anzahl + " Einträge (neueste zuerst):";
    for (const e of d.eintraege) {
      const div = document.createElement("div");
      div.className = "eintrag";
      const kopf = document.createElement("div");
      kopf.className = "kopf";
      kopf.textContent = (e.zeit || "?").replace("T", " ").slice(0, 16) +
        " · Bereich: " + (e.bereich || "?") +
        " · Gerät: " + String(e.geraet || "?").slice(0, 10) + "…";
      const x = document.createElement("button");
      x.textContent = "✕";
      x.title = "Diesen Eintrag löschen";
      x.style.cssText = "float:right;background:#a33;padding:2px 9px;" +
        "border-radius:6px;border:0;color:#fff;cursor:pointer";
      x.onclick = () => eintragLoeschen(e, div);
      const text = document.createElement("div");
      text.textContent = e.text || "";
      div.appendChild(x);
      div.appendChild(kopf);
      div.appendChild(text);
      liste.appendChild(div);
    }
  } catch (e) {
    status.textContent = "❌ Keine Verbindung.";
  }
}

// F-034: Knoepfe tragen keine Programmzeilen mehr (strenge Sicherheitsregel).
const AKTIONEN = { laden, kopiere, plusCode, alleLoeschen };
document.addEventListener("click", (e) => {
  const el = e.target && e.target.closest ? e.target.closest("[data-aktion]") : null;
  if (!el) return;
  const teile = el.getAttribute("data-aktion").split(":");
  if (Object.prototype.hasOwnProperty.call(AKTIONEN, teile[0])) AKTIONEN[teile[0]](teile[1]);
});
