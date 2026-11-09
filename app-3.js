// =====================================================
// TERMIN-MODUL (Phase 1)
// =====================================================
"use strict";

const KATEGORIEN = {
  rot:    { label: "Sehr wichtig", farbe: "#d64545",
            vorlauf: [1440, 120, 30], wiederholMin: 5 },
  orange: { label: "Wichtig", farbe: "#e08a3c",
            vorlauf: [1440, 60], wiederholMin: 10 },
  gelb:   { label: "Flexibel", farbe: "#d9b23c",
            vorlauf: [180], wiederholMin: 15 },
  gruen:  { label: "Locker", farbe: "#7e9c6f",
            vorlauf: [30], wiederholMin: 15 },
};
/* FUSION37: Termine aus dem Familien-Sync koennen von einer anderen
   App-Version stammen. Eine unbekannte Kategorie legte vorher die
   komplette Terminliste UND die Erinnerungsmaschine per TypeError
   lahm. Test: Szenario S-05. */
function katVon(t) {
  return (t && KATEGORIEN[t.kategorie]) || KATEGORIEN.orange;
}
const ROUTINE_FARBE = "#cfe0ec";
const TAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

let mitglieder = [];
let routinen = [];
let termine = [];
let matrixOffset = 0;
let aktiveErinnerung = null;

// ---------- Speichern & Laden ----------
function tLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}
/* =====================================================================
   FUSION37 - SYNC-VERSCHMELZUNG (Befund: stiller Terminverlust)
   ---------------------------------------------------------------------
   Vorher ersetzte der Familien-Sync den KOMPLETTEN Zustand nach
   Letzter-gewinnt: Trugen beide Elternteile innerhalb des 60-Sekunden-
   Poll-Fensters je einen Termin ein, ueberschrieb der spaetere Stand
   den frueheren - ein Termin verschwand lautlos auf allen Geraeten.

   Jetzt gilt: Jeder Eintrag traegt eine eigene ID und einen
   Aenderungsstempel (ts). Verschmolzen wird ELEMENTWEISE:
   - verschiedene IDs -> Vereinigung (nichts geht verloren)
   - gleiche ID       -> der neuere Stempel gewinnt
   - Loeschungen      -> Grabsteine (Tombstones), damit ein geloeschter
                         Termin nicht vom anderen Geraet aufersteht
   Der Stempel wird ZENTRAL beim Speichern vergeben (syncStempeln in
   tSaveAll) - so ist jeder Aenderungsweg automatisch erfasst, ohne
   dass einzelne Aufrufstellen daran denken muessen.
   Tests: Szenarien S-01 bis S-04.
   ===================================================================== */
function syncNeueId() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
let syncStempelStand = {};   // Merkzettel: key -> { id: Serialisierung }
function syncTombstones() {
  return tLoad("ka_sync_tombs", []);
}
function syncTombSchreiben(liste) {
  try {
    const kompakt = liste.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, 500);
    localStorage.setItem("ka_sync_tombs", JSON.stringify(kompakt));
  } catch (e) {}
}
function syncStempeln(key, liste) {
  const vorher = syncStempelStand[key] || {};
  const jetzt = {};
  const now = Date.now();
  for (const e of liste) {
    if (!e || typeof e !== "object") continue;
    if (!e.id) { e.id = syncNeueId(); e.ts = now; }
    const ser = JSON.stringify({ ...e, ts: 0 });
    if (vorher[e.id] !== undefined && vorher[e.id] !== ser) e.ts = now;
    if (!Number.isFinite(e.ts)) e.ts = now;
    jetzt[e.id] = ser;
  }
  const tombs = syncTombstones();
  let neueTombs = false;
  for (const id of Object.keys(vorher)) {
    if (!(id in jetzt)) { tombs.push({ id, ts: now }); neueTombs = true; }
  }
  if (neueTombs) syncTombSchreiben(tombs);
  syncStempelStand[key] = jetzt;
}
function syncMerge(lokal, fern) {
  const L = lokal || {}, F = fern || {};
  const tombs = {};
  for (const g of [].concat(L.geloescht || [], F.geloescht || [])) {
    if (!g || !g.id) continue;
    const ts = Number(g.ts) || 0;
    if (tombs[g.id] === undefined || ts > tombs[g.id]) tombs[g.id] = ts;
  }
  const mische = (a, b) => {
    const nachId = {};
    for (const e of [].concat(a || [], b || [])) {
      if (!e || typeof e !== "object") continue;
      const id = e.id || syncNeueId();
      const ts = Number(e.ts) || 0;
      if (tombs[id] !== undefined && tombs[id] >= ts) continue;
      if (!nachId[id] || ts >= (Number(nachId[id].ts) || 0)) {
        nachId[id] = { ...e, id, ts };
      }
    }
    return Object.values(nachId);
  };
  return {
    termine: mische(L.termine, F.termine),
    routinen: mische(L.routinen, F.routinen),
    mitglieder: mische(L.mitglieder, F.mitglieder),
    verbrauch: (F.verbrauch && typeof F.verbrauch === "object")
      ? F.verbrauch : (L.verbrauch || {}),
    geloescht: Object.keys(tombs).map((id) => ({ id, ts: tombs[id] }))
      .sort((a, b) => b.ts - a.ts).slice(0, 500),
  };
}
/* Fremddaten koennen von einer anderen App-Version stammen -
   Pflichtfelder absichern, bevor sie in die Anzeige laufen. */
function syncTerminHeilen(t) {
  if (!t || typeof t !== "object") return null;
  if (!t.bestaetigt || typeof t.bestaetigt !== "object") t.bestaetigt = {};
  if (!t.zuletztErinnert || typeof t.zuletztErinnert !== "object")
    t.zuletztErinnert = {};
  if (!Number.isFinite(Number(t.dauerMin))) t.dauerMin = 30;
  return t;
}

function tSaveAll() {
  syncStempeln("termine", termine);
  syncStempeln("routinen", routinen);
  syncStempeln("mitglieder", mitglieder);
  try {
    localStorage.setItem("ka_mitglieder", JSON.stringify(mitglieder));
    localStorage.setItem("ka_routinen", JSON.stringify(routinen));
    localStorage.setItem("ka_termine", JSON.stringify(termine));
  } catch (e) {}
  serverSync();
  syncGeplant();
}
function deviceId() {
  let id = localStorage.getItem("ka_device");
  if (!id) {
    // SECURITY-FIX (SonarCloud): kryptografisch starke Geraete-ID
    // statt erratbarem Pseudozufall. Bestehende Geraete behalten
    // ihre gespeicherte ID - nur NEUE IDs entstehen hier.
    if (window.crypto && crypto.getRandomValues) {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      id = "g" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    } else {
      // Museums-Browser ohne WebCrypto (koennen die App-Kern-
      // funktionen ohnehin nicht ausfuehren): zufallsfreie
      // Notkennung aus Zeit + Geraetemerkmalen - bewusst ohne unsicheren
      // Pseudozufall (SonarCloud-Regel S2245).
      let h = 5381;
      const merkmal = navigator.userAgent + screen.width + "x" +
        screen.height + new Date().getTimezoneOffset();
      for (let k = 0; k < merkmal.length; k++) {
        h = ((h * 33) ^ merkmal.charCodeAt(k)) >>> 0;
      }
      id = "g" + Date.now().toString(36) + h.toString(36);
    }
    localStorage.setItem("ka_device", id);
  }
  return id;
}
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("ka", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function idbSet(key, val) {
  return idbOpen().then((d) => new Promise((res, rej) => {
    const t = d.transaction("kv", "readwrite");
    t.objectStore("kv").put(val, key);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  })).catch(() => {});
}

function weckerPlan() {
  const eintraege = [];
  const texte = {};
  termine.forEach((t) => {
    const kat = katVon(t);
    const start = new Date(t.datum + "T" + t.zeit).getTime()
      - (t.wegzeitMin || 0) * 60000;
    if (start < Date.now() - 3600000) return;
    kat.vorlauf.forEach((min) => {
      const stage = String(min);
      if (t.bestaetigt[stage]) return;
      const ref = t.id + "_" + stage;
      eintraege.push({ ref, fireAt: start - min * 60000,
        endAt: start, repeatMin: kat.wiederholMin });
      const wann = min >= 60 ? Math.round(min / 60) + " Std." : min + " Min.";
      texte[ref] = `${kat.label}: ${t.titel} für ${t.person} in ${wann}` +
        (t.wegzeitMin ? ` (inkl. ${t.wegzeitMin} Min. Weg)` : "") +
        (t.verantwortlich ? ` – ${t.verantwortlich} übernimmt` : "");
    });
  });
  return { eintraege, texte };
}

function serverSync() {
  try {
    const plan = weckerPlan();
    idbSet("device", deviceId());
    idbSet("refs", plan.texte);
    fetch("/api/wecker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: deviceId(),
        eintraege: plan.eintraege }),
    }).catch(() => {});
  } catch (e) {}
}

// ---------- Push aktivieren ----------
function b64ToUint8(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
async function aktivierePush() {
  const status = document.getElementById("pushStatus");
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      status.textContent = "Dieses Gerät/Browser unterstützt kein Push " +
        "(iPhone: erst zum Home-Bildschirm hinzufügen).";
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      status.textContent = "Benachrichtigungen wurden nicht erlaubt.";
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const vr = await fetch("/api/vapid");
    const { publicKey } = await vr.json();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToUint8(publicKey),
    });
    await fetch("/api/push-anmelden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: deviceId(), subscription: sub }),
    });
    serverSync();
    status.textContent = "✅ Aktiv! Der Wächter erreicht dich jetzt auch " +
      "bei geschlossener App (Prüftakt: alle 5 Minuten).";
  } catch (e) {
    status.textContent = "Aktivierung fehlgeschlagen: " +
      String(e.message || e).slice(0, 80);
  }
}

// ---------- Push-Selbstheilung ----------
// BUGFIX: Wechselt der Server-Schluessel (z.B. Speicher geleert),
// werden alte Anmeldungen still ungueltig - der Push-Dienst lehnt
// mit 401/403 ab, ohne dass es jemand merkt. Diese Pruefung laeuft
// bei jedem App-Start und deckt DREI Faelle still ab:
//  1. Anmeldung vorhanden + Schluessel passt -> nur auffrischen
//  2. Anmeldung vorhanden + Schluessel veraltet -> erneuern
//  3. Berechtigung erteilt, aber KEINE Anmeldung (z.B. weil die
//     Aktivierung damals an einem Serverfehler scheiterte)
//     -> still im Hintergrund nachholen
// Ein manueller Klick auf "Push aktivieren" ist damit nur noch
// fuer die allererste Berechtigungs-Abfrage noetig.
async function pruefePushAbo() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!("Notification" in window)
        || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const vr = await fetch("/api/vapid");
    const { publicKey } = await vr.json();
    if (!publicKey) return;

    let sub = await reg.pushManager.getSubscription();
    let erneuert = false;

    if (sub) {
      // Fall 1/2: Schluessel der bestehenden Anmeldung vergleichen
      let passt = true;
      try {
        const alt = sub.options && sub.options.applicationServerKey;
        if (alt) {
          const altB64 = btoa(String.fromCharCode(
            ...new Uint8Array(alt)))
            .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          passt = (altB64 === publicKey);
        }
      } catch (e) {}
      if (!passt) {
        await sub.unsubscribe().catch(() => {});
        sub = null; // unten neu anmelden
      }
    }

    if (!sub) {
      // Fall 2/3: still neu anmelden (Berechtigung liegt ja vor)
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(publicKey),
      });
      erneuert = true;
    }

    await fetch("/api/push-anmelden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: deviceId(), subscription: sub }),
    });
    if (erneuert) {
      serverSync(); // Weckplan zur neuen Anmeldung hochladen
      const status = document.getElementById("pushStatus");
      if (status) status.textContent =
        "✅ Aktiv! Anmeldung wurde automatisch erneuert.";
    }
  } catch (e) {}
}

// ---------- Feedback per Sprache (Testphase) ----------
function aktiverTab() {
  const nav = document.querySelector("nav button.active");
  return nav ? nav.id.replace("nav-", "") : "?";
}
function fbOeffnen() {
  document.getElementById("fbPanel").classList.remove("hidden");
  document.getElementById("fbStatus").textContent = "";
}
function fbSchliessen() {
  document.getElementById("fbPanel").classList.add("hidden");
}
function fbSprechen() {
  // laeuft jetzt ueber den globalen Controller
  const status = document.getElementById("fbStatus");
  status.textContent = "🎤 Ich höre zu …";
  gvOneShot(null, (text) => {
    const alt = document.getElementById("fbText").value;
    document.getElementById("fbText").value = (alt ? alt + " " : "") + text;
    status.textContent = "Passt das so? Dann ✓ Absenden.";
  });
}
async function fbSenden() {
  const text = document.getElementById("fbText").value.trim();
  const status = document.getElementById("fbStatus");
  if (text.length < 3) { status.textContent = "Bitte erst etwas sagen/tippen."; return; }
  status.textContent = "Sende …";
  try {
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tab: aktiverTab(), device: deviceId() }),
    });
    const data = await r.json();
    if (data.success) {
      document.getElementById("fbText").value = "";
      status.textContent = "💚 Danke! Ist angekommen.";
      speak("Danke für dein Feedback!", true);
      setTimeout(fbSchliessen, 1500);
    } else {
      status.textContent = "Senden fehlgeschlagen – " + (data.error || "");
    }
  } catch (e) {
    status.textContent =
      fehlermeldungRecherche(location.protocol, 0);
  }
}

// ---------- Alles loeschen (Datenschutz) ----------
async function loescheAlles() {
  if (!confirm("Wirklich ALLE Daten löschen?\n\nProfil, Termine, " +
      "Routinen, Verbrauch und Favoriten werden auf diesem Gerät UND " +
      "auf dem Erinnerungs-Server unwiderruflich entfernt.")) return;
  try {
    await fetch("/api/wecker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: deviceId(), loeschen: true }),
    });
  } catch (e) {}
  try { localStorage.clear(); } catch (e) {}
  try { indexedDB.deleteDatabase("ka"); } catch (e) {}
  alert("Alles gelöscht. Die App startet jetzt frisch.");
  location.reload();
}

// ---------- Familienprofil ----------
function personenAequivalent(m) {
  // RT1-07: Number(0) ist falsy - ein Saeugling zaehlte als Erwachsener.
  const roh = Number(m && m.alter);
  const a = Number.isFinite(roh) && roh >= 0 ? roh : 30;
  const w = m.geschlecht === "w";
  if (a <= 3) return 0.5;
  if (a <= 6) return 0.62;
  if (a <= 9) return 0.75;
  if (a <= 12) return w ? 0.8 : 0.85;
  if (a <= 14) return w ? 0.9 : 1.1;
  if (a <= 18) return w ? 0.95 : 1.2;
  if (a <= 64) return w ? 0.85 : 1.0;
  return w ? 0.75 : 0.9;
}
function summePE() {
  return mitglieder.reduce((s, m) => s + personenAequivalent(m), 0);
}
function mitgliederNamen() { return mitglieder.map((m) => m.name); }

function portionFactor() {
  if (mitglieder.length)
    return Math.max(summePE() / 3.2, 0.3);
  const a = parseInt(document.getElementById("adults").value || 2);
  const k = parseInt(document.getElementById("kids").value || 0);
  return (a * 1.0 + k * 0.6) / 3.2;
}

function addMember() {
  const name = (document.getElementById("memberName").value || "")
    .trim().slice(0, 30);
  const alter = Math.min(Math.max(parseInt(
    document.getElementById("memberAlter").value) || 0, 0), 99);
  const geschlecht = document.getElementById("memberGeschlecht").value;
  if (!name) return;
  const allergien = [...document.querySelectorAll(".palg:checked")]
    .map((c) => c.value);
  const ernaehrung = [...document.querySelectorAll(".pdiet:checked")]
    .map((c) => c.value);
  if (!mitgliederNamen().includes(name))
    mitglieder.push({ name, alter, geschlecht, allergien, ernaehrung });
  document.getElementById("memberName").value = "";
  document.getElementById("memberAlter").value = "";
  document.querySelectorAll(".palg").forEach((c) => { c.checked = false; });
  document.querySelectorAll(".pdiet").forEach((c) => { c.checked = false; });
  tSaveAll();
  renderMembers();
}
function renderMembers() {
  const box = document.getElementById("memberList");
  box.innerHTML = "";
  mitglieder.forEach((m, i) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.style.cssText = "font-size:.95rem;padding:6px 10px;cursor:pointer";
    const alg = (m.allergien && m.allergien.length)
      ? " ⚠" + m.allergien.join(",") : "";
    const ern = (m.ernaehrung && m.ernaehrung.length)
      ? " 🥗" + m.ernaehrung.map((d) => DIET_LABELS[d] || d).join(",") : "";
    chip.textContent =
      `${m.name} (${m.alter}, ${m.geschlecht === "w" ? "♀" : "♂"})` +
      `${alg}${ern} ✕`;
    chip.title = "Antippen zum Entfernen";
    chip.onclick = () => { mitglieder.splice(i, 1); tSaveAll(); renderMembers(); };
    box.appendChild(chip);
  });
  fuellePersonenSelects();
  renderKochModusSelect();
  syncFamilieAnzeige();
}

// BUGFIX: Die Zahlenfelder "Erwachsene/Kinder" oben blieben stur
// auf 2/2 stehen, egal was im Familienprofil stand. Sobald ein
// Profil existiert, werden die Felder jetzt daraus befuellt (ab
// 14 Jahren = Erwachsenen-Portion) und der Hinweis sagt klar,
// dass das Profil die Grundlage ist.
function syncFamilieAnzeige() {
  const info = document.getElementById("famAutoInfo");
  if (!mitglieder.length) {
    if (info) info.textContent = "Daraus berechne ich automatisch die " +
      "Mengen für Rezepte und Einkaufsliste.";
    return;
  }
  const erw = mitglieder.filter((m) => (m.alter || 0) >= 14).length;
  const kin = mitglieder.length - erw;
  const a = document.getElementById("adults");
  const k = document.getElementById("kids");
  if (a) a.value = Math.max(erw, 0) || 1;
  if (k) k.value = Math.max(kin, 0);
  if (info) info.textContent = `Nach eurem Familienprofil: ${erw} ` +
    `Erwachsene und ${kin} ${kin === 1 ? "Kind" : "Kinder"} ` +
    `(${summePE().toFixed(1)} Essens-Äquivalente) – das Profil ist ` +
    `die Grundlage für alle Mengen.`;
}
function fuellePersonenSelects() {
  ["tPerson", "tVerantwortlich", "rPerson"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const alt = sel.value;
    sel.innerHTML = "";
    const namen = id === "tVerantwortlich"
      ? [""].concat(mitgliederNamen()) : mitgliederNamen().concat(["Familie"]);
    namen.forEach((n) => {
      const o = document.createElement("option");
      o.value = n; o.textContent = n === "" ? "– offen –" : n;
      sel.appendChild(o);
    });
    if (namen.includes(alt)) sel.value = alt;
  });
}

// ---------- Sprach-Erfassung mit Rueckfrage-Dialog ----------
// Ablauf: "Termin" sagen (oder Knopf) -> Termin diktieren ->
// die App fragt nach: Beginn vor Ort oder Abfahrtszeit? ->
// ggf. Anfahrtsminuten -> Zusammenfassung -> "Ja" speichert.
// Die Entscheidungslogik ist ein PURER Automat (terminDialogNext)
// und damit ohne Browser testbar.

function parseJaNein(text) {
  const t = String(text).toLowerCase();
  if (/\b(ja|jawohl|genau|richtig|passt|klar|speichern|mach|gerne)\b/.test(t)) return "ja";
  if (/\b(nein|nö|nicht|abbrechen|verwerfen|stopp|stop|falsch)\b/.test(t)) return "nein";
  return null;
}

function parseMinutenAngabe(text) {
  const t = String(text).toLowerCase();
  if (/\b(keine|null|nix|nichts|ohne)\b/.test(t)) return 0;
  if (/anderthalb|eineinhalb/.test(t)) return 90;
  if (/dreiviertel/.test(t)) return 45;
  if (/viertel/.test(t)) return 15;
  if (/halbe?\s*stunde/.test(t)) return 30;
  const m = t.match(/(\d+)/);
  if (m) {
    let n = parseInt(m[1], 10);
    if (/stunde/.test(t) && n <= 12) n = n * 60;
    return Math.min(n, 480);
  }
  const woerter = { eine: 60, ein: 60, fünf: 5, zehn: 10, fünfzehn: 15,
    zwanzig: 20, dreißig: 30, vierzig: 40, sechzig: 60 };
  for (const [w, n] of Object.entries(woerter)) {
    if (new RegExp("\\b" + w + "\\b").test(t)) {
      return /stunde/.test(t) && n < 13 ? n * 60 : n;
    }
  }
  return null;
}

function addMinuten(hhmm, min) {
  const [h, m] = String(hhmm).split(":").map(Number);
  let ges = h * 60 + (m || 0) + min;
  ges = ((ges % 1440) + 1440) % 1440;
  const H = String(Math.floor(ges / 60)).padStart(2, "0");
  const M = String(ges % 60).padStart(2, "0");
  return H + ":" + M;
}

function terminZusammenfassung(t, abfahrt) {
  let ds = t.datum;
  try {
    ds = new Date(t.datum + "T12:00").toLocaleDateString("de-DE",
      { weekday: "long", day: "numeric", month: "long" });
  } catch (e) {}
  let s = `Also: ${t.titel} für ${t.person}, ${ds}, Beginn ${t.zeit} Uhr vor Ort`;
  if (t.wegzeit_min > 0) {
    s += `, Abfahrt ${addMinuten(t.zeit, -t.wegzeit_min)} Uhr`;
  }
  return s + ". Soll ich speichern?";
}

// ---------- Namens-Abgleich (pur & testbar) ----------
// BUGFIX: Die Spracherkennung verhunzt Namen gern ("Zoe" wird
// "Zoé", "So" oder "Zoll"). Deshalb wird die verstandene Person
// unscharf gegen die Familienmitglieder abgeglichen; passt nichts,
// fragt der Dialog gezielt nach.
function normalisiereName(s) {
  return String(s || "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe")
    .replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/é|è|ê/g, "e").replace(/[^a-z]/g, "");
}

function editierDistanz(a, b) {
  a = a.slice(0, 20); b = b.slice(0, 20);
  const d = Array.from({ length: a.length + 1 },
    (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function findeMitglied(gehoert, mitglieder) {
  const g = normalisiereName(gehoert);
  if (!g) return null;
  let best = null, bestD = 99;
  for (const m of mitglieder || []) {
    const n = normalisiereName(m);
    if (!n) continue;
    if (n === g) return m;
    if ((n.startsWith(g) || g.startsWith(n)) && bestD > 1) {
      best = m; bestD = 1; continue;
    }
    const d = editierDistanz(g, n);
    const limit = Math.min(n.length, g.length) <= 4 ? 1 : 2;
    if (d <= limit && d < bestD) { best = m; bestD = d; }
  }
  return best;
}

// Auch ganze Saetze verstehen ("für Zoe natürlich"):
// erst der komplette Text, dann jedes einzelne Wort.
// Fuellwoerter werden uebersprungen (sonst matcht "den"
// unscharf auf "Ben"), exakte Treffer schlagen unscharfe.
const GV_STOPPWOERTER = new Set(["der","die","das","den","dem","des",
  "ein","eine","einen","fuer","fur","ist","mit","und","von","vom",
  "zum","zur","bei","auf","an","in","im","es","er","sie","wir",
  "natuerlich","bitte","also","dann","doch","mal","noch"]);

function findeMitgliedImSatz(text, mitglieder) {
  const direkt = findeMitglied(text, mitglieder);
  if (direkt) return direkt;
  const woerter = String(text).split(/\s+/)
    .filter((w) => w.length >= 2
      && !GV_STOPPWOERTER.has(normalisiereName(w)));
  // 1. Durchgang: exakte Namensgleichheit
  for (const wort of woerter) {
    const wn = normalisiereName(wort);
    for (const m of mitglieder || []) {
      if (normalisiereName(m) === wn) return m;
    }
  }
  // 2. Durchgang: unscharfer Abgleich
  for (const wort of woerter) {
    const t = findeMitglied(wort, mitglieder);
    if (t) return t;
  }
  return null;
}

function frageAbfahrt(t) {
  return `Beginnt das um ${t.zeit} Uhr vor Ort, oder wollt ihr um ` +
    `${t.zeit} Uhr losfahren?`;
}

function terminDialogNext(state, ev) {
  const s = { ...state };
  const abbruch = ev.typ === "text" &&
    /\b(abbrechen|abbruch|vergiss es|stopp|stop)\b/.test(ev.text.toLowerCase());
  if (abbruch) return { state: s, fertig: true, sage: "Okay, abgebrochen." };

  // Überspringen: Frage mit sinnvollem Standard auslassen
  if (ev.typ === "text" && istUeberspringen(ev.text)) {
    if (s.phase === "warte_diktat") {
      return { state: s, fertig: true, sage: "Okay, übersprungen." };
    }
    if (s.phase === "frage_person") {
      s.phase = "frage_abfahrt"; s.wdh = 0;
      return { state: s, sage: frageAbfahrt(s.termin) };
    }
    if (s.phase === "frage_abfahrt" || s.phase === "frage_wegzeit") {
      // Standard: Zeit gilt vor Ort, Wegzeit bleibt wie erkannt
      s.abfahrt = false;
      s.phase = "frage_speichern"; s.wdh = 0;
      return { state: s, aktion: "formular",
        sage: terminZusammenfassung(s.termin, false) };
    }
    if (s.phase === "frage_speichern") {
      return { state: s, fertig: true,
        sage: "Okay – der Termin steht im Formular, speichern per Knopf." };
    }
  }

  if (s.phase === "warte_diktat" && ev.typ === "text") {
    s.phase = "warte_parse";
    return { state: s, aktion: "parse", text: ev.text,
      sage: "Einen Moment, ich übersetze." };
  }

  if (s.phase === "warte_parse") {
    if (ev.typ === "geparst") {
      const t = { ...ev.termin };
      const mit = ev.mitglieder || [];
      const pTreffer = findeMitglied(t.person, mit);
      if (pTreffer) t.person = pTreffer;
      const vTreffer = findeMitglied(t.verantwortlich, mit);
      if (vTreffer) t.verantwortlich = vTreffer;
      s.termin = t;
      s.mitglieder = mit;
      s.wdh = 0;
      if (!pTreffer && mit.length && t.person !== "Familie") {
        s.phase = "frage_person";
        return { state: s, aktion: "formular",
          sage: `Ich habe als Person „${t.person}“ verstanden. ` +
            `Für wen ist der Termin? Ich kenne: ${mit.join(", ")}.` };
      }
      s.phase = "frage_abfahrt";
      return { state: s, aktion: "formular",
        sage: `${t.titel} für ${t.person}. ` + frageAbfahrt(t) };
    }
    if (ev.typ === "parsefehler") {
      s.wdh = (s.wdh || 0) + 1;
      if (s.wdh >= 2) return { state: s, fertig: true,
        sage: "Das klappt gerade nicht – nutzt bitte das Formular." };
      s.phase = "warte_diktat";
      return { state: s,
        sage: ev.msg + " Sag den Termin bitte noch einmal." };
    }
  }

  if (s.phase === "frage_person" && ev.typ === "text") {
    const t = ev.text.toLowerCase();
    if (/\b(passt|stimmt|richtig|korrekt|so lassen|lass so)\b/.test(t)) {
      s.phase = "frage_abfahrt"; s.wdh = 0;
      return { state: s, sage: frageAbfahrt(s.termin) };
    }
    const treffer = findeMitgliedImSatz(ev.text, s.mitglieder || []);
    if (treffer) {
      s.termin = { ...s.termin, person: treffer };
      s.phase = "frage_abfahrt"; s.wdh = 0;
      return { state: s, aktion: "formular",
        sage: `Alles klar, ${treffer}. ` + frageAbfahrt(s.termin) };
    }
    s.wdh = (s.wdh || 0) + 1;
    if (s.wdh >= 2) { // nicht festbeissen: gehoerten Namen behalten
      s.phase = "frage_abfahrt"; s.wdh = 0;
      return { state: s, sage: `Ich lasse „${s.termin.person}“ stehen – ` +
        `ihr könnt es im Formular ändern. ` + frageAbfahrt(s.termin) };
    }
    return { state: s, sage: "Wen meinst du? Ich kenne: " +
      (s.mitglieder || []).join(", ") + ". Oder sag: passt." };
  }

  if (s.phase === "frage_abfahrt" && ev.typ === "text") {
    const t = ev.text.toLowerCase();
    if (/\b(vor ?ort|beginn|anfang|start|beginnt)\b/.test(t)) {
      s.abfahrt = false;
      if (s.termin.wegzeit_min > 0) {
        s.phase = "frage_speichern";
        return { state: s, aktion: "formular",
          sage: terminZusammenfassung(s.termin, false) };
      }
      s.phase = "frage_wegzeit";
      return { state: s, sage: "Plant ihr Anfahrtszeit ein? " +
        "Sag die Minuten, oder: keine." };
    }
    if (/\b(losfahren|abfahrt|abfahren|fahren|los)\b/.test(t)) {
      s.abfahrt = true;
      if (s.termin.wegzeit_min > 0) {
        s.termin = { ...s.termin,
          zeit: addMinuten(s.termin.zeit, s.termin.wegzeit_min) };
        s.phase = "frage_speichern";
        return { state: s, aktion: "formular",
          sage: terminZusammenfassung(s.termin, true) };
      }
      s.phase = "frage_wegzeit";
      return { state: s, sage: "Wie lange dauert die Anfahrt? Sag die Minuten." };
    }
    s.wdh = (s.wdh || 0) + 1;
    if (s.wdh >= 2) { // im Zweifel: Zeit gilt vor Ort
      s.abfahrt = false;
      s.phase = "frage_speichern";
      return { state: s, aktion: "formular",
        sage: "Ich nehme die Zeit als Beginn vor Ort. " +
          terminZusammenfassung(s.termin, false) };
    }
    return { state: s, sage: "Sag bitte: vor Ort – oder: losfahren." };
  }

  if (s.phase === "frage_wegzeit" && ev.typ === "text") {
    const min = parseMinutenAngabe(ev.text);
    if (min === null) {
      s.wdh = (s.wdh || 0) + 1;
      if (s.wdh >= 3) { s.termin = { ...s.termin, wegzeit_min: 0 };
        s.phase = "frage_speichern";
        return { state: s, aktion: "formular",
          sage: terminZusammenfassung(s.termin, s.abfahrt) }; }
      return { state: s, sage: "Wie viele Minuten? Oder sag: keine." };
    }
    s.termin = { ...s.termin, wegzeit_min: min };
    if (s.abfahrt && min > 0) {
      s.termin.zeit = addMinuten(s.termin.zeit, min);
    }
    s.phase = "frage_speichern";
    return { state: s, aktion: "formular",
      sage: terminZusammenfassung(s.termin, s.abfahrt) };
  }

  if (s.phase === "frage_speichern" && ev.typ === "text") {
    const jn = parseJaNein(ev.text);
    if (jn === "ja") return { state: s, aktion: "speichern", fertig: true };
    if (jn === "nein") return { state: s, fertig: true,
      sage: "Okay, nicht gespeichert. Das Formular ist ausgefüllt – " +
        "ihr könnt es anpassen." };
    s.wdh = (s.wdh || 0) + 1;
    if (s.wdh >= 3) return { state: s, fertig: true,
      sage: "Ich lasse den Termin im Formular – speichern könnt ihr per Knopf." };
    return { state: s, sage: "Ja zum Speichern – oder Nein zum Verwerfen?" };
  }

  return { state: s };
}

function fuelleTerminFormular(t) {
  document.getElementById("tTitel").value = t.titel;
  setSelect("tPerson", t.person);
  setSelect("tVerantwortlich", t.verantwortlich);
  document.getElementById("tDatum").value = t.datum;
  document.getElementById("tZeit").value = t.zeit;
  document.getElementById("tDauer").value = t.dauer_min;
  document.getElementById("tWegzeit").value = t.wegzeit_min;
  document.getElementById("tKategorie").value = t.kategorie;
  pruefeKollisionLive();
}

// F-025b: Einen gesprochenen Termin mit dem lokalen Regel-Leser verstehen.
// Antwortet im Schema der frueheren Server-Schnittstelle ({success, termin}
// bzw. {success:false, error}). `regel` ist zum Testen austauschbar.
function terminLokalVerstehen(text, heuteIso, namen, regel) {
  const leser = regel === undefined
    ? (typeof window !== "undefined" ? window.TerminRegel : null) : regel;
  if (!leser || typeof leser.parse !== "function" || typeof leser.pruefen !== "function") {
    return { success: false, error: "Der Termin-Leser ist nicht geladen. " +
      "Bitte die App schließen und neu öffnen." };
  }
  try {
    return leser.pruefen(leser.parse(text, heuteIso, namen));
  } catch (e) {
    return { success: false, error: "Termin nicht verstanden - bitte nochmal sagen" };
  }
}
function startTerminDialog(diktat) {
  const status = document.getElementById("terminVoiceStatus");
  const melde = (text) => { if (status) status.textContent = text; };
  let st = { phase: "warte_diktat", wdh: 0, abfahrt: false, termin: null };

  // F-025b: LOKAL verstehen (termin-regel.js), ohne Server und ohne KI-Dienst.
  function parseLokal(text) {
    melde("Verstanden: „" + text + "“ – übersetze …");
    const namen = mitgliederNamen();
    const data = terminLokalVerstehen(text, isoTag(new Date()), namen);
    if (!data.success) schritt({ typ: "parsefehler", msg: data.error });
    else schritt({ typ: "geparst", termin: data.termin, mitglieder: namen });
  }

  function schritt(ev) {
    const r = terminDialogNext(st, ev);
    st = r.state;
    // Absichtlich verzoegert: schritt() darf nicht ineinander verschachtelt
    // laufen, sonst wuerde die erste Sprachausgabe von der zweiten abgebrochen.
    if (r.aktion === "parse") setTimeout(() => parseLokal(r.text), 0);
    if (r.aktion === "formular" && st.termin) fuelleTerminFormular(st.termin);
    if (r.aktion === "speichern" && st.termin) {
      fuelleTerminFormular(st.termin);
      saveTermin(); // spricht selbst "Termin ... gespeichert"
    }
    if (r.sage) { melde(r.sage); speak(r.sage, true, () => {
      // Nach jeder Rueckfrage EIN Bereit-Ton: Der Nutzer weiss dadurch
      // sekundengenau, ab wann er antworten darf.
      if (GlobalVoice.dialog) { gvBackoffZuruecksetzen(); tonBereit(); }
    }); }
    if (r.fertig) { GlobalVoice.dialog = null; gvBereitVerbergen(); gvChipStand(); }
  }

  gvStart();
  gvBackoffZuruecksetzen();
  GlobalVoice.dialog = { frage: "Termin sprechen",
    onInput: (text) => schritt({ typ: "text", text }) };
  gvBereitAnzeigen("Termin sprechen");
  gvChipStand();
  if (diktat) {
    schritt({ typ: "text", text: diktat });
  } else {
    // Frueher sagte die App "Ich höre. Sprich deinen Termin." - und
    // hoerte sich dabei selbst zu. Jetzt: sichtbarer Hinweis + ein Ton.
    melde("🎤 Ich höre … sprich deinen Termin");
    tonBereit();
  }
}

// Kompatibilitaets-Huelle: der Knopf im Formular ruft weiter
// terminVoiceStart() auf.
function terminVoiceStart() { startTerminDialog(null); }
function setSelect(id, wert) {
  const sel = document.getElementById(id);
  if (!wert) return;
  if (![...sel.options].some((o) => o.value === wert)) {
    const o = document.createElement("option");
    o.value = wert; o.textContent = wert;
    sel.appendChild(o);
  }
  sel.value = wert;
}

// ---------- Kollisionspruefung ----------
function minuten(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}
function terminFenster(t) {
  const start = minuten(t.zeit) - (t.wegzeitMin || 0);
  return [start, minuten(t.zeit) + t.dauerMin];
}
function findeKollisionen(neu) {
  const treffer = [];
  const [nVon, nBis] = terminFenster(neu);
  const beteiligt = [neu.person, neu.verantwortlich].filter(Boolean);

  termine.forEach((t) => {
    if (t.id === neu.id || t.datum !== neu.datum) return;
    const andere = [t.person, t.verantwortlich].filter(Boolean);
    if (!beteiligt.some((p) => andere.includes(p) || p === "Familie"
        || andere.includes("Familie"))) return;
    const [von, bis] = terminFenster(t);
    if (nVon < bis && von < nBis)
      treffer.push(`Termin „${t.titel}“ (${t.zeit}, ${t.person})`);
  });

  const wt = (new Date(neu.datum + "T12:00").getDay() + 6) % 7;
  routinen.forEach((r) => {
    if (!r.tage.includes(wt)) return;
    if (!beteiligt.includes(r.person)) return;
    if (nVon < minuten(r.bis) && minuten(r.von) < nBis)
      treffer.push(`Routine „${r.label}“ von ${r.person} (${r.von}–${r.bis})`);
  });
  return treffer;
}
function pruefeKollisionLive() {
  const neu = formularTermin();
  const box = document.getElementById("tKollision");
  if (!neu) { box.textContent = ""; return; }
  const k = findeKollisionen(neu);
  box.textContent = k.length
    ? "⚠️ Kollision mit: " + k.join(" und ") : "";
  if (k.length) speak("Achtung, Kollision mit " + k[0], true);
}

// ---------- Termin speichern ----------
function formularTermin() {
  const titel = document.getElementById("tTitel").value.trim();
  const datum = document.getElementById("tDatum").value;
  const zeit = document.getElementById("tZeit").value;
  if (!titel || !datum || !zeit) return null;
  return {
    id: "t" + Date.now(),
    titel: titel.slice(0, 60),
    person: document.getElementById("tPerson").value || "Familie",
    verantwortlich: document.getElementById("tVerantwortlich").value || "",
    datum: datum,
    zeit: zeit,
    dauerMin: Math.max(5, parseInt(document.getElementById("tDauer").value) || 60),
    wegzeitMin: Math.max(0, parseInt(document.getElementById("tWegzeit").value) || 0),
    kategorie: document.getElementById("tKategorie").value,
    bestaetigt: {},
    zuletztErinnert: {},
  };
}
function saveTermin() {
  const neu = formularTermin();
  if (!neu) {
    speak("Bitte mindestens Titel, Datum und Uhrzeit angeben.", true);
    return;
  }
  const k = findeKollisionen(neu);
  if (k.length && !confirm("⚠️ Kollision mit:\n" + k.join("\n") +
      "\n\nTrotzdem speichern?")) return;
  termine.push(neu);
  termine.sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit));
  tSaveAll();
  document.getElementById("tTitel").value = "";
  document.getElementById("tKollision").textContent = "";
  renderTermineTab();
  speak(`Termin ${neu.titel} gespeichert.`, true);
}

// =====================================================================
// LOKALE SCANNER: Kassenbon -> Verbrauchs-Planer, Schulzettel -> Termine
// ---------------------------------------------------------------------
// OCR laeuft vollstaendig auf dem Geraet (scanner-lokal.js, Tesseract).
// Fotos und erkannter Text verlassen das Geraet nie. Eingetragene Termine
// und Kaeufe laufen ueber die bestehenden Speicherwege (tSaveAll/vbSave)
// und damit unveraendert durch den Ende-zu-Ende-verschluesselten
// Familien-Sync.
// =====================================================================
function scanStarten(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = "";
  el.click();
}
function scanStatusText(status, anteil) {
  const s = String(status || "");
  const was = /load|initializ/.test(s) ? "Texterkennung wird vorbereitet"
    : /recogniz/.test(s) ? "Lese Text" : "Arbeite";
  return "🔍 " + was + " – direkt auf diesem Gerät … " +
    Math.round((Number(anteil) || 0) * 100) + " %";
}
function scanFehlerText(e) {
  return "❌ Das Foto konnte nicht gelesen werden" +
    (e && e.message ? " (" + String(e.message).slice(0, 80) + ")" : "") +
    ". Tipp: gerade von oben, gutes Licht, ganzes Blatt im Bild.";
}
function heuteLokalIso() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}
function elMit(tag, text, stil) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = text;
  if (stil) el.style.cssText = stil;
  return el;
}
function rohtextDetails(text) {
  const d = document.createElement("details");
  d.style.marginTop = "6px";
  d.appendChild(elMit("summary", "Erkannten Text ansehen", "cursor:pointer"));
  d.appendChild(elMit("pre", String(text || "").slice(0, 4000),
    "white-space:pre-wrap;font-size:12px;max-height:220px;overflow:auto"));
  return d;
}

// ---------- Kassenbon ----------
async function bonFotoGewaehlt(input) {
  const datei = input && input.files && input.files[0];
  const box = document.getElementById("bonErgebnis");
  if (!datei || !box) return;
  if (!window.ScannerLokal) {
    box.textContent = "❌ Der Scanner ist noch nicht geladen – bitte kurz warten.";
    return;
  }
  box.textContent = scanStatusText("load", 0);
  let text = "";
  try {
    text = await window.ScannerLokal.erkenne(datei, { art: "bon",
      onFortschritt: (s, p) => { box.textContent = scanStatusText(s, p); } });
  } catch (e) { box.textContent = scanFehlerText(e); return; }
  const funde = window.ScannerLokal.bonArtikel(text)
    .filter((f) => VERBRAUCH.some((v) => v.id === f.id));
  bonVorschau(funde, text, box);
}

function bonVorschau(funde, text, box) {
  box.innerHTML = "";
  if (!funde.length) {
    box.appendChild(elMit("p", "Auf dem Bon habe ich keine Verbrauchsgüter " +
      "aus eurem Planer erkannt."));
    box.appendChild(rohtextDetails(text));
    return;
  }
  box.appendChild(elMit("p", "🧾 Erkannt – bitte kurz prüfen:", "font-weight:600;margin:4px 0"));
  const zeilen = [];
  funde.forEach((f) => {
    const item = VERBRAUCH.find((v) => v.id === f.id);
    const div = document.createElement("div");
    div.className = "entry";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = true;
    const name = elMit("span", " " + item.name, "flex:1");
    const anz = document.createElement("input");
    anz.type = "number"; anz.min = "1"; anz.max = "20";
    anz.value = String(f.menge || 1);
    anz.style.cssText = "width:56px;padding:4px";
    anz.setAttribute("aria-label", "Anzahl " + item.name);
    div.appendChild(cb); div.appendChild(name);
    div.appendChild(elMit("span", "Anzahl:", "margin-right:4px"));
    div.appendChild(anz);
    box.appendChild(div);
    zeilen.push({ id: f.id, cb, anz });
  });
  const ok = elMit("button", "✓ Als gekauft übernehmen");
  ok.className = "btn green"; ok.type = "button";
  ok.onclick = () => {
    const gebucht = bonUebernehmen(zeilen.filter((z) => z.cb.checked)
      .map((z) => ({ id: z.id, menge: parseInt(z.anz.value, 10) || 1 })));
    box.innerHTML = "";
    box.appendChild(elMit("p", gebucht.length
      ? "✅ Übernommen. Neue Reichweite: " + gebucht.join(" · ")
      : "Nichts übernommen."));
    if (gebucht.length) speak(gebucht.length === 1
      ? "Ein Artikel vom Bon übernommen."
      : gebucht.length + " Artikel vom Bon übernommen.", true);
  };
  box.appendChild(ok);
  box.appendChild(rohtextDetails(text));
}

/** Kaeufe verbuchen (pur bis auf vbSave); liefert Reichweiten-Texte. */
function bonUebernehmen(eintraege) {
  const texte = [];
  (eintraege || []).forEach((e) => {
    if (!vbKaufVerbuchen(e.id, e.menge)) return;
    // Steht der Artikel auf der Verbrauchs-Einkaufsliste: abhaken.
    for (let i = vState.liste.length - 1; i >= 0; i--)
      if (vState.liste[i].id === e.id) vState.liste.splice(i, 1);
    const item = VERBRAUCH.find((v) => v.id === e.id);
    const tage = vbIntervalTage(item) > 0 ? vbReichtNochTage(item) : null;
    texte.push(item.name + (tage != null ? " ~" + tage + " Tage" : ""));
  });
  if (texte.length) { vbSave(); renderVerbrauch(); }
  return texte;
}

// ---------- Schulzettel ----------
async function zettelFotoGewaehlt(input) {
  const datei = input && input.files && input.files[0];
  const box = document.getElementById("zettelErgebnis");
  if (!datei || !box) return;
  if (!window.ScannerLokal || !window.TerminRegel) {
    box.textContent = "❌ Der Scanner ist noch nicht geladen – bitte kurz warten.";
    return;
  }
  box.textContent = scanStatusText("load", 0);
  let text = "";
  try {
    text = await window.ScannerLokal.erkenne(datei, { art: "zettel",
      onFortschritt: (s, p) => { box.textContent = scanStatusText(s, p); } });
  } catch (e) { box.textContent = scanFehlerText(e); return; }
  const funde = window.TerminRegel.ausDokument(text, heuteLokalIso(),
    mitgliederNamen());
  zettelVorschau(funde, text, box);
}

/** Vorschlag fuer die Wegzeit: zuletzt genutzte Wegzeit bei gleichem Titel. */
function wegzeitVorschlag(titel) {
  const t = String(titel || "").toLowerCase().split(" – ")[0];
  for (let i = termine.length - 1; i >= 0; i--) {
    const x = termine[i];
    if (x.wegzeitMin > 0 && String(x.titel || "").toLowerCase().split(" – ")[0] === t)
      return x.wegzeitMin;
  }
  return 0;
}

/** Terminobjekt im App-Format aus einem geprueften Regel-Termin. */
function terminAusRegel(r, id) {
  return {
    id: id,
    titel: String(r.titel || "Termin").slice(0, 60),
    person: r.person || "Familie",
    verantwortlich: r.verantwortlich || "",
    datum: r.datum,
    zeit: r.zeit,
    dauerMin: Math.max(5, Number(r.dauer_min) || 60),
    wegzeitMin: Math.max(0, Number(r.wegzeit_min) || 0),
    kategorie: r.kategorie || "orange",
    bestaetigt: {},
    zuletztErinnert: {},
  };
}

/** Kollisionen + Ueberlastung fuer einen Termin (pur). */
function terminWarnungen(t) {
  const k = findeKollisionen(t).map((x) => "Kollision mit " + x);
  const u = window.TerminRegel ? window.TerminRegel.ueberlastung(t, termine, routinen) : [];
  return k.concat(u);
}

function zettelVorschau(funde, text, box) {
  box.innerHTML = "";
  if (!funde.length) {
    box.appendChild(elMit("p", "Auf dem Zettel habe ich kein Datum gefunden. " +
      "Ihr könnt den Termin unten von Hand eintragen.", "margin:4px 0"));
    box.appendChild(rohtextDetails(text));
    return;
  }
  box.appendChild(elMit("p", "📄 " + funde.length + (funde.length === 1
    ? " Termin" : " Termine") + " erkannt – bitte prüfen und eintragen:",
    "font-weight:600;margin:4px 0"));
  const basis = Date.now();
  funde.forEach((r, idx) => {
    const karte = document.createElement("div");
    karte.className = "karte";
    karte.style.cssText = "margin:8px 0;padding:10px;border:1px solid #ddd;border-radius:10px";
    const feld = (label, el) => {
      const l = elMit("label", label + " ", "display:block;margin:4px 0");
      l.appendChild(el); karte.appendChild(l); return el;
    };
    const titel = document.createElement("input");
    titel.type = "text"; titel.value = r.titel; titel.style.width = "70%";
    feld("Titel:", titel);
    const datum = document.createElement("input");
    datum.type = "date"; datum.value = r.datum;
    feld("Datum:", datum);
    const zeit = document.createElement("input");
    zeit.type = "time"; zeit.value = r.zeit;
    feld("Uhrzeit:", zeit);
    if (r.zeitGeschaetzt) karte.appendChild(elMit("p",
      "⚠️ Auf dem Zettel stand keine Uhrzeit – bitte ergänzen.",
      "color:#b86e00;margin:2px 0"));
    const person = document.createElement("select");
    ["Familie"].concat(mitgliederNamen()).forEach((n) => {
      const o = document.createElement("option"); o.value = n; o.textContent = n;
      person.appendChild(o);
    });
    if ([...person.options].some((o) => o.value === r.person)) person.value = r.person;
    feld("Für wen:", person);
    const wer = document.createElement("select");
    [""].concat(mitgliederNamen()).forEach((n) => {
      const o = document.createElement("option"); o.value = n;
      o.textContent = n || "– niemand –"; wer.appendChild(o);
    });
    if (r.verantwortlich) wer.value = r.verantwortlich;
    feld("Wer übernimmt:", wer);
    const dauer = document.createElement("input");
    dauer.type = "number"; dauer.min = "5"; dauer.max = "720";
    dauer.value = String(r.dauer_min || 60); dauer.style.width = "80px";
    feld("Dauer (Min.):", dauer);
    // Wegzeit-Abfrage: Ein Zettel nennt fast nie den Weg. Die App fragt
    // deshalb ausdruecklich nach und schlaegt die zuletzt genutzte Zeit
    // fuer denselben Anlass vor.
    const weg = document.createElement("input");
    weg.type = "number"; weg.min = "0"; weg.max = "240";
    weg.value = String(r.wegzeit_min || wegzeitVorschlag(r.titel) || 0);
    weg.style.cssText = "width:80px;outline:2px solid #f0b400;border-radius:6px";
    feld("🚗 Wie lange ist der Weg dorthin? (Min.)", weg);
    const warn = elMit("p", "", "color:#d64545;margin:4px 0");
    karte.appendChild(warn);
    const id = "z" + basis + "_" + idx;
    const aktuell = () => terminAusRegel({
      titel: titel.value.trim(), person: person.value, verantwortlich: wer.value,
      datum: datum.value, zeit: zeit.value, dauer_min: parseInt(dauer.value, 10),
      wegzeit_min: parseInt(weg.value, 10), kategorie: r.kategorie }, id);
    const pruefe = () => {
      const t = aktuell();
      const w = t.titel && t.datum && t.zeit ? terminWarnungen(t) : [];
      warn.textContent = w.length ? "⚠️ " + w.join(" · ") : "";
      return w;
    };
    [titel, datum, zeit, person, wer, dauer, weg].forEach((el) => {
      el.addEventListener("change", pruefe);
      el.addEventListener("input", pruefe);
    });
    pruefe();
    const ein = elMit("button", "📅 In die Wochen-Matrix eintragen");
    ein.className = "btn green"; ein.type = "button";
    ein.onclick = () => {
      const t = aktuell();
      if (!t.titel || !t.datum || !t.zeit) {
        warn.textContent = "Bitte Titel, Datum und Uhrzeit angeben.";
        return;
      }
      const w = pruefe();
      if (w.length && !confirm("⚠️ " + w.join("\n") + "\n\nTrotzdem eintragen?"))
        return;
      zettelTerminEintragen(t);
      karte.innerHTML = "";
      karte.appendChild(elMit("p", "✅ „" + t.titel + "“ am " +
        t.datum.split("-").reverse().join(".") + " um " + t.zeit +
        " eingetragen.", "margin:0"));
    };
    karte.appendChild(ein);
    box.appendChild(karte);
    if (idx === 0) setTimeout(() => { try { weg.focus(); } catch (e) {} }, 50);
  });
  box.appendChild(rohtextDetails(text));
}

/** In die Wochen-Matrix eintragen – gleicher Weg wie saveTermin(). */
function zettelTerminEintragen(t) {
  if (termine.some((x) => x.id === t.id)) return false;
  termine.push(t);
  termine.sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit));
  tSaveAll(); // lokal + Weckplan + E2E-Familien-Sync
  renderTermineTab();
  speak(`Termin ${t.titel} eingetragen.`, true);
  return true;
}

// ---------- Routinen ----------
function renderTageBoxen() {
  const box = document.getElementById("rTage");
  if (box.childElementCount) return;
  TAGE_KURZ.forEach((t, i) => {
    const l = document.createElement("label");
    l.style.cssText = "display:inline-flex;margin-right:8px";
    const c = document.createElement("input");
    c.type = "checkbox"; c.value = i; c.className = "rtag";
    if (i < 5) c.checked = true;
    l.appendChild(c); l.appendChild(document.createTextNode(" " + t));
    box.appendChild(l);
  });
}
function addRoutine() {
  const person = document.getElementById("rPerson").value;
  const label = document.getElementById("rLabel").value.trim() || "Abwesend";
  const tage = [...document.querySelectorAll(".rtag:checked")]
    .map((c) => parseInt(c.value));
  const von = document.getElementById("rVon").value;
  const bis = document.getElementById("rBis").value;
  if (!person || !tage.length || !von || !bis) return;
  routinen.push({ id: "r" + Date.now(), person, label: label.slice(0, 30),
    tage, von, bis });
  document.getElementById("rLabel").value = "";
  tSaveAll();
  renderTermineTab();
}
function renderRoutinen() {
  const box = document.getElementById("routineList");
  box.innerHTML = "";
  routinen.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "entry";
    const span = document.createElement("span");
    span.textContent = `${r.person}: ${r.label} – ` +
      r.tage.map((t) => TAGE_KURZ[t]).join(",") + ` ${r.von}–${r.bis}`;
    const del = document.createElement("button");
    del.className = "btn ghost"; del.textContent = "✕";
    del.onclick = () => { routinen.splice(i, 1); tSaveAll(); renderTermineTab(); };
    div.appendChild(span); div.appendChild(del);
    box.appendChild(div);
  });
}

// ---------- Wochen-Matrix ----------
function wocheWechseln(richtung) {
  matrixOffset = richtung === 0 ? 0 : matrixOffset + richtung;
  renderMatrix();
}
function montagVon(offset) {
  const d = new Date();
  const tag = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - tag + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
// F-008: LOKALE Datumsteile verwenden. toISOString() rechnet nach UTC und
// verschiebt lokale Mitternacht oestlich von UTC auf den Vortag.
function isoTag(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}

function renderMatrix() {
  const START = 7, ENDE = 21, PX = 36;
  const grid = document.getElementById("matrixGrid");
  grid.innerHTML = "";
  grid.style.cssText =
    `display:grid;grid-template-columns:44px repeat(7,minmax(86px,1fr));` +
    `gap:4px;min-width:680px`;
  const montag = montagVon(matrixOffset);
  document.getElementById("matrixWoche").textContent =
    " Woche ab " + montag.toLocaleDateString("de-DE",
      { day: "2-digit", month: "2-digit" });

  const zeitCol = document.createElement("div");
  zeitCol.style.cssText = `position:relative;height:${(ENDE-START)*PX+24}px`;
  for (let h = START; h <= ENDE; h++) {
    const z = document.createElement("div");
    z.className = "muted";
    z.style.cssText = `position:absolute;top:${(h-START)*PX+18}px;` +
      `font-size:.7rem;right:4px`;
    z.textContent = h + ":00";
    zeitCol.appendChild(z);
  }
  grid.appendChild(zeitCol);

  const heuteIso = isoTag(new Date());
  for (let d = 0; d < 7; d++) {
    const tagDatum = new Date(montag);
    tagDatum.setDate(montag.getDate() + d);
    const tagIso = isoTag(tagDatum);
    const col = document.createElement("div");
    col.style.cssText =
      `position:relative;height:${(ENDE-START)*PX+24}px;border-radius:8px;` +
      `background:${tagIso === heuteIso ? "#f3ead6" : "#fbf7ee"}`;
    const head = document.createElement("div");
    head.style.cssText = "text-align:center;font-size:.72rem;font-weight:700";
    head.textContent = TAGE_KURZ[d] + " " +
      tagDatum.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    col.appendChild(head);

    const block = (vonMin, bisMin, farbe, text, blass) => {
      const von = Math.max(vonMin, START * 60);
      const bis = Math.min(bisMin, ENDE * 60);
      if (bis <= von) return;
      const b = document.createElement("div");
      b.style.cssText =
        `position:absolute;left:3px;right:3px;border-radius:6px;` +
        `top:${(von - START * 60) / 60 * PX + 18}px;` +
        `height:${Math.max((bis - von) / 60 * PX - 2, 12)}px;` +
        `background:${farbe};overflow:hidden;font-size:.62rem;` +
        `padding:1px 4px;color:${blass ? "#56708a" : "#fff"};` +
        `opacity:${blass ? ".85" : "1"}`;
      b.textContent = text;
      b.title = text;
      col.appendChild(b);
    };

    routinen.forEach((r) => {
      if (r.tage.includes(d))
        block(minuten(r.von), minuten(r.bis), ROUTINE_FARBE,
          r.person + " " + r.label, true);
    });
    termine.forEach((t) => {
      if (t.datum === tagIso)
        block(minuten(t.zeit), minuten(t.zeit) + t.dauerMin,
          katVon(t).farbe,
          t.zeit + " " + t.titel + " (" + t.person + ")", false);
    });
    grid.appendChild(col);
  }
}

// ---------- Terminliste ----------
function renderTerminListe() {
  const box = document.getElementById("terminList");
  box.innerHTML = "";
  const jetzt = new Date();
  const kommende = termine.filter((t) =>
    new Date(t.datum + "T" + t.zeit).getTime() + t.dauerMin * 60000 >
    jetzt.getTime() - 86400000);
  if (!kommende.length) {
    box.innerHTML = '<p class="muted">Noch keine Termine erfasst.</p>';
    return;
  }
  kommende.forEach((t) => {
    const idx = termine.indexOf(t);
    const div = document.createElement("div");
    div.className = "entry";
    const dot = document.createElement("span");
    dot.style.cssText = `display:inline-block;width:12px;height:12px;` +
      `border-radius:50%;background:${katVon(t).farbe};` +
      `margin-right:6px;flex-shrink:0`;
    const span = document.createElement("span");
    span.style.flex = "1";
    const dat = new Date(t.datum + "T" + t.zeit).toLocaleDateString("de-DE",
      { weekday: "short", day: "2-digit", month: "2-digit" });
    span.textContent = `${dat} ${t.zeit} – ${t.titel} (${t.person}` +
      (t.verantwortlich ? `, übernimmt: ${t.verantwortlich}` : "") + ")";
    const del = document.createElement("button");
    del.className = "btn ghost"; del.textContent = "✕";
    del.onclick = () => { termine.splice(idx, 1); tSaveAll(); renderTermineTab(); };
    div.appendChild(dot); div.appendChild(span); div.appendChild(del);
    box.appendChild(div);
  });
}

function renderTermineTab() {
  renderTageBoxen();
  fuellePersonenSelects();
  renderRoutinen();
  renderTerminListe();
  renderMatrix();
}

// ---------- Erinnerungs-Maschine ----------
function checkErinnerungen() {
  if (aktiveErinnerung) return;
  const jetzt = Date.now();
  for (const t of termine) {
    const start = new Date(t.datum + "T" + t.zeit).getTime()
      - (t.wegzeitMin || 0) * 60000;
    if (start < jetzt - 60000) continue;
    const kat = katVon(t);
    for (const min of kat.vorlauf) {
      const stage = String(min);
      if (t.bestaetigt[stage]) continue;
      const faellig = start - min * 60000;
      if (jetzt < faellig) continue;
      const zuletzt = t.zuletztErinnert[stage] || 0;
      if (jetzt - zuletzt < kat.wiederholMin * 60000) continue;
      t.zuletztErinnert[stage] = jetzt;
      tSaveAll();
      zeigeErinnerung(t, stage, min);
      return;
    }
  }
}
function zeigeErinnerung(t, stage, min) {
  aktiveErinnerung = { id: t.id, stage };
  const wann = min >= 60
    ? Math.round(min / 60) + " Stunden" : min + " Minuten";
  const weg = t.wegzeitMin ? ` (inkl. ${t.wegzeitMin} Min. Wegzeit)` : "";
  const text = `${katVon(t).label}: ${t.titel} für ${t.person} ` +
    `in ${wann}${weg}` +
    (t.verantwortlich ? ` – ${t.verantwortlich} übernimmt` : "");
  document.getElementById("reminderText").textContent = "⏰ " + text;
  document.getElementById("reminderBanner").classList.remove("hidden");
  speak("Erinnerung! " + text + ". Bitte mit OK bestätigen.", true);
  // BUGFIX: Auf Android-Chrome ist "new Notification()" verboten
  // (wirft immer) - dort geht es nur ueber den Service Worker.
  if ("Notification" in window && Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) =>
        reg.showNotification("Familien-Assistent",
          { body: text, icon: "/icon.svg" })
      ).catch(() => {
        try { new Notification("Familien-Assistent", { body: text }); }
        catch (e) {}
      });
    } else {
      try { new Notification("Familien-Assistent", { body: text }); }
      catch (e) {}
    }
  }
}
function reminderOk() {
  if (aktiveErinnerung) {
    const t = termine.find((x) => x.id === aktiveErinnerung.id);
    if (t) { t.bestaetigt[aktiveErinnerung.stage] = true; tSaveAll(); }
    try {
      fetch("/api/wecker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: deviceId(),
          bestaetige: aktiveErinnerung.id + "_" + aktiveErinnerung.stage }),
      }).catch(() => {});
    } catch (e) {}
    aktiveErinnerung = null;
  }
  document.getElementById("reminderBanner").classList.add("hidden");
}

// ---------- Start ----------
// Laedt Mitglieder, Routinen, Termine und Stile aus dem lokalen Speicher.
// Eigene Funktion, damit sie testbar ist (F-020).
// F-020: Defekte Eintraege (null, Zahlen, falscher Typ) werden uebersprungen,
// statt den ganzen Start bzw. den Terminplaner zu blockieren.
function istDatenObjekt(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}
function ladeListe(key, istGueltig) {
  const w = tLoad(key, []);
  return Array.isArray(w) ? w.filter(istGueltig) : [];
}
function termineLaden() {
  mitglieder = ladeListe("ka_mitglieder",
    (m) => typeof m === "string" || istDatenObjekt(m));
  // Migration: alte Namens-Strings -> Profil-Objekte; fehlende
  // Felder (allergien, ernaehrung) defensiv ergaenzen.
  mitglieder = mitglieder.map((m) => {
    const obj = typeof m === "string"
      ? { name: m, alter: 30, geschlecht: "w" } : m;
    if (!Array.isArray(obj.allergien)) obj.allergien = [];
    if (!Array.isArray(obj.ernaehrung)) obj.ernaehrung = [];
    return obj;
  });
  routinen = ladeListe("ka_routinen", istDatenObjekt);
  termine = ladeListe("ka_termine", istDatenObjekt);
  familienStile = tLoad("ka_stile", []); // weiche Stil-Vorlieben laden
}
// F-024: "Heute"-Seite. Reine Auswertung aus Terminen und Einkaufsliste.
// Wochenplan-Abendessen sind Termine, deren Titel mit "🍽" beginnt.
function heuteUebersicht(termineListe, einkaufAnzahl, jetzt) {
  const tag = isoTag(jetzt);
  const hh = String(jetzt.getHours()).padStart(2, "0") + ":" +
    String(jetzt.getMinutes()).padStart(2, "0");
  const gueltig = (Array.isArray(termineListe) ? termineListe : []).filter((t) =>
    istDatenObjekt(t) && typeof t.datum === "string" && typeof t.zeit === "string");
  const heute = gueltig.filter((t) => t.datum === tag)
    .sort((a, b) => a.zeit.localeCompare(b.zeit));
  const istEssen = (t) => String(t.titel || "").startsWith("🍽");
  const kuenftig = gueltig.filter((t) => t.datum > tag)
    .sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit));
  return {
    tag,
    essen: heute.filter(istEssen),
    termine: heute.filter((t) => !istEssen(t))
      .map((t) => Object.assign({}, t, { vorbei: t.zeit < hh })),
    naechster: kuenftig.length ? kuenftig[0] : null,
    einkaufAnzahl: Number.isFinite(Number(einkaufAnzahl)) ? Number(einkaufAnzahl) : 0,
  };
}
function renderHeute() {
  const jetzt = new Date();
  const u = heuteUebersicht(termine,
    (typeof vState !== "undefined" && vState && vState.liste) ? vState.liste.length : 0, jetzt);
  const setze = (id, kinder) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = "";
    kinder.forEach((k) => el.appendChild(k));
  };
  const zeile = (text, stil) => {
    const p = document.createElement("p");
    p.style.cssText = "margin:6px 0;" + (stil || "");
    p.textContent = text;
    return p;
  };
  const kopf = (text) => {
    const h = document.createElement("h3");
    h.style.cssText = "margin:12px 0 4px;font-size:.95rem";
    h.textContent = text;
    return h;
  };
  const datumEl = document.getElementById("heuteDatum");
  if (datumEl) datumEl.textContent = jetzt.toLocaleDateString("de-DE",
    { weekday: "long", day: "numeric", month: "long" });
  setze("heuteEssen", [kopf("🍽 Heute essen"),
    ...(u.essen.length
      ? u.essen.map((t) => zeile(t.zeit + " – " + String(t.titel).replace(/^🍽\s*/, "")))
      : [zeile("Noch nichts geplant. Der Wochenplan steht im Reiter „Termine“.", "color:var(--muted)")])]);
  setze("heuteTermine", [kopf("📅 Termine heute"),
    ...(u.termine.length
      ? u.termine.map((t) => zeile(t.zeit + " – " + t.titel + " (" + (t.person || "?") + ")",
          t.vorbei ? "opacity:.55" : ""))
      : [zeile("Heute stehen keine Termine an.", "color:var(--muted)")])]);
  setze("heuteNaechster", u.naechster ? [kopf("➡️ Als Nächstes"),
    zeile(new Date(u.naechster.datum + "T12:00:00").toLocaleDateString("de-DE",
      { weekday: "short", day: "2-digit", month: "2-digit" }) + " " + u.naechster.zeit +
      " – " + u.naechster.titel)] : []);
  const knopf = document.createElement("button");
  knopf.className = "btn";
  knopf.type = "button";
  knopf.textContent = "🛒 Einkaufsliste öffnen";
  knopf.onclick = () => goTab("einkauf");
  setze("heuteEinkauf", [kopf("🛒 Einkauf"),
    zeile(u.einkaufAnzahl ? u.einkaufAnzahl + " Artikel auf der Liste." : "Die Liste ist leer."),
    knopf]);
}

// F-023: "Was verlässt mein Handy?" - EHRLICHE Uebersicht. Die Texte stehen
// hier in einer Liste; ein Test stellt sicher, dass jede /api/-Adresse im
// Code hier erklaert ist. Wer eine neue Server-Verbindung einbaut, MUSS hier
// einen Eintrag ergaenzen (sonst wird die Pipeline rot).
function datenschutzZeilen() {
  return [
    { gruppe: "lokal", titel: "Familie, Allergien, Termine, Einkauf",
      text: "Namen, Alter, Allergien und Ernährungsform deiner Familie, deine Termine, Routinen, Einkaufsliste, Favoriten und Einstellungen werden nur im Speicher dieses Handys abgelegt. Es gibt kein Konto und keine Anmeldung. Wann einzelne Angaben für eine Funktion trotzdem übertragen werden, steht unter „Das verlässt dein Handy“." },
    { gruppe: "lokal", titel: "Scanner für Kassenbon und Schulzettel",
      text: "Das Foto wird auf dem Handy per Texterkennung gelesen. Weder das Foto noch der Text werden an einen Server geschickt." },
    { gruppe: "lokal", titel: "Termine per Sprache",
      text: "Das stille Lauschen auf das Stichwort „Termin“ und das Verstehen deines gesprochenen Termins (Datum, Uhrzeit, Person) laufen auf dem Handy nach festen Regeln. Dein Satz wird dafür nicht an einen KI-Dienst geschickt." },
    { gruppe: "lokal", titel: "Datensicherung",
      text: "Die Sicherung entsteht auf dem Handy und wird von dir selbst als Datei abgelegt. Mit Passwort ist sie verschlüsselt. Sync-Code und Geräte-Kennung sind nicht enthalten." },
    { gruppe: "server", route: "rezept", titel: "Rezeptsuche, Kochschritte, Wochenplan",
      text: "Gesendet werden dein Essenswunsch, die Unverträglichkeiten und Ernährungsformen, der Zeitrahmen, bei Kochschritten Gerichtname und Zutaten, die Geräte-Kennung und – falls vorhanden – eine aus deinem Familien-Code berechnete Kennung (nicht der Code selbst). Ein KI-Dienst erstellt daraus die Rezepte. Namen deiner Familienmitglieder werden dafür nicht gesendet." },
    { gruppe: "server", route: "wecker", titel: "Erinnerungen",
      text: "Gesendet werden anonyme Nummern mit den Zeitpunkten und die Geräte-Kennung. Titel, Personen und Orte deiner Termine bleiben auf dem Handy; die Benachrichtigung wird erst auf dem Handy zusammengesetzt." },
    { gruppe: "server", route: "push-anmelden", titel: "Benachrichtigungen einschalten",
      text: "Gesendet wird die Adresse, unter der dein Browser Benachrichtigungen empfängt, zusammen mit der Geräte-Kennung." },
    { gruppe: "server", route: "vapid", titel: "Öffentlicher Schlüssel für Benachrichtigungen",
      text: "Die App holt einen öffentlichen Schlüssel ab. Es werden keine Angaben von dir gesendet." },
    { gruppe: "server", route: "termine", titel: "Familien-Abgleich (Plus)",
      text: "Eure Termine, Routinen und Familienangaben werden auf dem Handy mit dem Familien-Code verschlüsselt und nur verschlüsselt abgelegt. Der Code selbst wird nicht an den Server gesendet, nur eine daraus berechnete Kennung. Ehrlich dazu: Wer sehr viel Rechenaufwand betreibt, könnte aus der Kennung den Code erraten. Gib den Code nur an Familienmitglieder weiter." },
    { gruppe: "server", route: "feedback", titel: "Rückmeldung senden",
      text: "Nur wenn du auf „Senden“ tippst: dein Text, der aktuelle Reiter und die Geräte-Kennung." },
    { gruppe: "hinweis", titel: "Spracherkennung durch den Browser",
      text: "Wenn du mit der App sprichst, erledigt die Spracherkennung dein Browser, nicht die App. Bei Chrome auf Android werden Sprachaufnahmen dafür üblicherweise an einen Server des Browser-Herstellers geschickt. Darauf hat die App keinen Einfluss. Wer das nicht möchte, tippt statt zu sprechen." },
  ];
}
function datenschutzRendern() {
  const box = document.getElementById("datenschutzSeite");
  if (!box) return;
  const gruppen = [
    ["lokal", "Das bleibt auf deinem Handy"],
    ["server", "Das verlässt dein Handy"],
    ["hinweis", "Gut zu wissen"],
  ];
  box.textContent = "";
  gruppen.forEach(([g, kopf]) => {
    const h = document.createElement("h3");
    h.textContent = kopf;
    h.style.cssText = "margin:10px 0 4px;font-size:1rem";
    box.appendChild(h);
    datenschutzZeilen().filter((z) => z.gruppe === g).forEach((z) => {
      const p = document.createElement("p");
      p.style.cssText = "margin:4px 0";
      const b = document.createElement("b");
      b.textContent = z.titel + ": ";
      p.appendChild(b);
      p.appendChild(document.createTextNode(z.text));
      box.appendChild(p);
    });
  });
}

// F-022: DATENSICHERUNG. Alle App-Daten (ka_*) als Datei sichern und
// wiederherstellen, optional per Passwort verschluesselt (AES-GCM, Schluessel
// per PBKDF2 mit zufaelligem Salz). Nie in der Datei: Sync-Code (gaebe Zugang
// zur Familie), Sync-Staende und Geraete-ID (gehoert zu diesem Geraet).
// Es verlaesst nichts das Geraet - die Datei speichert der Nutzer selbst.
const SICHERUNG_AUSGENOMMEN = ["ka_sync_code", "ka_sync_stand", "ka_sync_tombs",
  "ka_device"];
const SICHERUNG_MAX_ZEICHEN = 5000000;
function sicherungSchluesselOk(k) { return /^ka_[a-z0-9_]{1,60}$/.test(String(k)); }
function sicherungSammeln() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !sicherungSchluesselOk(k) || SICHERUNG_AUSGENOMMEN.includes(k)) continue;
    const v = localStorage.getItem(k);
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
function sicherungB64(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 8192) {
    s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  }
  return btoa(s);
}
function sicherungB64zurueck(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function sicherungSchluessel(passwort, salz) {
  const basis = await crypto.subtle.importKey("raw",
    new TextEncoder().encode(String(passwort)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salz, iterations: 250000, hash: "SHA-256" },
    basis, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function sicherungErstellen(passwort) {
  const daten = sicherungSammeln();
  const kopf = { app: "familien-assistent", format: 1, version: APP_VERSION,
    erstellt: new Date().toISOString() };
  if (!passwort) {
    return JSON.stringify(Object.assign(kopf, { verschluesselt: false, daten }), null, 1);
  }
  const salz = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await sicherungSchluessel(passwort, salz);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key,
    new TextEncoder().encode(JSON.stringify(daten)));
  return JSON.stringify(Object.assign(kopf, { verschluesselt: true,
    salz: sicherungB64(salz), iv: sicherungB64(iv), inhalt: sicherungB64(ct) }), null, 1);
}
// Rueckgabe: { ok:true, daten, erstellt, version, anzahl } oder
// { ok:false, grund: "keinBackup" | "passwort" | "defekt" }
async function sicherungPruefen(text, passwort) {
  const fehl = (grund) => ({ ok: false, grund });
  if (typeof text !== "string" || text.length > SICHERUNG_MAX_ZEICHEN) return fehl("defekt");
  let f;
  try { f = JSON.parse(text); } catch (e) { return fehl("keinBackup"); }
  if (!istDatenObjekt(f) || f.app !== "familien-assistent" || f.format !== 1) {
    return fehl("keinBackup");
  }
  let daten;
  if (f.verschluesselt === true) {
    if (!passwort) return fehl("passwort");
    try {
      const key = await sicherungSchluessel(passwort, sicherungB64zurueck(f.salz));
      const klar = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: sicherungB64zurueck(f.iv) }, key,
        sicherungB64zurueck(f.inhalt));
      daten = JSON.parse(new TextDecoder().decode(klar));
    } catch (e) { return fehl("passwort"); }
  } else {
    daten = f.daten;
  }
  if (!istDatenObjekt(daten)) return fehl("defekt");
  const sauber = {};
  for (const k of Object.keys(daten)) {
    if (!sicherungSchluesselOk(k) || typeof daten[k] !== "string") return fehl("defekt");
    if (SICHERUNG_AUSGENOMMEN.includes(k)) continue;
    sauber[k] = daten[k];
  }
  return { ok: true, daten: sauber, erstellt: f.erstellt, version: f.version,
    anzahl: Object.keys(sauber).length };
}
// Ersetzt die App-Daten durch die der Sicherung. Schlaegt das Schreiben fehl
// (Speicher voll), wird der alte Stand zurueckgeschrieben: false.
function sicherungEinspielen(daten) {
  const alt = sicherungSammeln();
  try {
    Object.keys(daten).forEach((k) => localStorage.setItem(k, daten[k]));
  } catch (e) {
    try {
      Object.keys(daten).forEach((k) => { if (!(k in alt)) localStorage.removeItem(k); });
      Object.keys(alt).forEach((k) => localStorage.setItem(k, alt[k]));
    } catch (e2) { /* nichts weiter moeglich */ }
    return false;
  }
  Object.keys(alt).forEach((k) => { if (!(k in daten)) localStorage.removeItem(k); });
  return true;
}
let sicherungBereit = null;
function sicherungMelde(t) {
  const el = document.getElementById("sicherungStatus");
  if (el) el.textContent = t;
}
async function sicherungSpeichern() {
  const pwEl = document.getElementById("sicherungPw");
  const pw = pwEl ? pwEl.value : "";
  sicherungMelde("Sicherung wird erstellt …");
  try {
    const text = await sicherungErstellen(pw);
    const name = "familien-assistent-sicherung-" + isoTag(new Date()) + ".json";
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    sicherungMelde("Gespeichert als " + name + ". " + (pw
      ? "Die Datei ist mit deinem Passwort verschlüsselt. Merke dir das Passwort gut, ohne es lässt sich die Datei nicht öffnen."
      : "Achtung: Ohne Passwort ist die Datei NICHT verschlüsselt. Bewahre sie sicher auf."));
  } catch (e) {
    sicherungMelde("Das Sichern hat nicht geklappt. Bitte noch einmal versuchen.");
  }
}
async function sicherungDateiGewaehlt(input) {
  sicherungBereit = null;
  const go = document.getElementById("sicherungGoBtn");
  if (go) go.classList.add("hidden");
  const datei = input && input.files && input.files[0];
  if (!datei) return;
  const pwEl = document.getElementById("sicherungPw");
  let text = "";
  try { text = await datei.text(); } catch (e) { sicherungMelde("Die Datei konnte nicht gelesen werden."); return; }
  const r = await sicherungPruefen(text, pwEl ? pwEl.value : "");
  if (!r.ok) {
    sicherungMelde({
      passwort: "Das Passwort fehlt oder ist falsch. Bitte oben das Passwort eintragen und die Datei noch einmal wählen.",
      keinBackup: "Das ist keine Sicherung des Familien-Assistenten.",
      defekt: "Die Sicherung ist beschädigt und kann nicht verwendet werden.",
    }[r.grund] || "Die Sicherung kann nicht verwendet werden.");
    return;
  }
  sicherungBereit = r;
  sicherungMelde("Sicherung gefunden (" + r.anzahl + " Datenbereiche, erstellt " +
    String(r.erstellt || "").slice(0, 10) + "). Mit „Jetzt wiederherstellen“ ersetzt du die Daten auf diesem Gerät durch diese Sicherung.");
  if (go) go.classList.remove("hidden");
}
function sicherungWiederherstellen() {
  if (!sicherungBereit) return;
  const ok = sicherungEinspielen(sicherungBereit.daten);
  if (!ok) { sicherungMelde("Wiederherstellen ging nicht (Speicher voll?). Deine bisherigen Daten sind unverändert."); return; }
  sicherungBereit = null;
  sicherungMelde("Wiederhergestellt. Die App lädt neu …");
  setTimeout(() => { try { location.reload(); } catch (e) {} }, 800);
}

// F-021 (Nachtrag): Das Versionsfeld liegt in der Fusszeile NACH dem Skript.
// Beim sofortigen Aufruf existiert es noch nicht - darum zusaetzlich nach
// dem Laden der Seite. (Vorher blieb die Anzeige immer leer.)
function versionAnzeigen() {
  const el = document.getElementById("appVersion");
  if (el) el.textContent = "Version " + APP_VERSION;
  return Boolean(el);
}
document.addEventListener("DOMContentLoaded", versionAnzeigen);
// F-021: "Nach Update suchen". Fragt den Service Worker nach einer neuen
// Version. Aendert und loescht KEINE lokalen Daten. Findet der Browser eine
// neue sw.js, uebernimmt sie sich selbst (skipWaiting) und die Seite laedt
// einmal neu (controllerchange-Handler im Start-Block).
function updateZustand(reg, online) {
  if (!reg) return "nichtUnterstuetzt";
  if (!online) return "offline";
  return (reg.installing || reg.waiting) ? "neu" : "aktuell";
}
function updateText(zustand) {
  const t = {
    neu: "Neue Version gefunden. Die App lädt gleich neu.",
    aktuell: "Du hast die neueste Version (" + APP_VERSION + ").",
    offline: "Keine Internetverbindung. Bitte später noch einmal versuchen.",
    nichtUnterstuetzt: "Dieser Browser kann sich nicht selbst aktualisieren. " +
      "Bitte die App schließen und neu öffnen.",
  };
  return t[zustand] || t.nichtUnterstuetzt;
}
// F-036: Nach "neue Version gefunden" muss auch wirklich neu geladen werden.
// Vorher haengte das Neuladen daran, dass die Seite beim Start schon von einem
// Service Worker gesteuert wurde - sonst blieb die alte Version stehen.
let updateNeuGeladen = false;
function updateNeuGeladenZuruecksetzen() { updateNeuGeladen = false; }
function updateVersionGleich(swVersion, appVersion) {
  const sv = String(swVersion || "").replace(/^app-/i, "").toUpperCase();
  return sv !== "" && sv === String(appVersion || "").toUpperCase();
}
function updateNachAktivierungNeuLaden(worker, neuLaden, verzoegerungMs) {
  if (!worker) return false;
  const los = () => {
    if (updateNeuGeladen) return;           // nur einmal, kein Dauer-Neuladen
    updateNeuGeladen = true;
    setTimeout(neuLaden, verzoegerungMs === undefined ? 600 : verzoegerungMs);
  };
  if (worker.state === "activated") { los(); return true; }
  worker.addEventListener("statechange", () => {
    if (worker.state === "activated") los();
  });
  return true;
}
// Fragt den aktiven Service Worker nach seiner Version (leer = keine Antwort).
function updateSwVersionFragen(reg) {
  return new Promise((ok) => {
    try {
      const w = reg && reg.active;
      if (!w || typeof MessageChannel === "undefined") return ok("");
      const kanal = new MessageChannel();
      const t = setTimeout(() => ok(""), 1500);
      kanal.port1.onmessage = (e) => { clearTimeout(t); ok(String(e.data || "")); };
      w.postMessage("version", [kanal.port2]);
    } catch (e) { ok(""); }
  });
}
async function updatePruefen() {
  const el = document.getElementById("updateStatus");
  if (el) el.textContent = "Suche nach Updates …";
  let reg = null;
  const online = !(typeof navigator !== "undefined" && navigator.onLine === false);
  try {
    if ("serviceWorker" in navigator) {
      reg = await navigator.serviceWorker.getRegistration();
      if (reg && online) await reg.update();
    }
  } catch (e) { /* Netzfehler: unten als 'aktuell' bzw. 'offline' gemeldet */ }
  let z = updateZustand(reg, online);
  if (z === "aktuell") {
    // Neue Version schon aktiv, aber diese Seite noch die alte? Dann neu laden.
    const sv = await updateSwVersionFragen(reg);
    if (sv && !updateVersionGleich(sv, APP_VERSION)) z = "neu";
  }
  if (el) el.textContent = updateText(z);
  if (z === "neu") {
    const w = reg.installing || reg.waiting || { state: "activated" };
    updateNachAktivierungNeuLaden(w, () => { try { location.reload(); } catch (e) {} });
  }
  return z;
}
(function initTermine() {
  termineLaden();
  renderMembers();
  if ("Notification" in window && Notification.permission === "default") {
    setTimeout(() => { try { Notification.requestPermission(); } catch (e) {} },
      4000);
  }
  ["tDatum", "tZeit", "tDauer", "tWegzeit", "tPerson", "tVerantwortlich"]
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", pruefeKollisionLive);
    });
  setInterval(checkErinnerungen, 30000);
  setTimeout(checkErinnerungen, 3000);
  try { stimmenAuswahlFuellen(); klangAuswahlFuellen(); ruheKochFuellen(); } catch (e) {}
  try { syncAnzeige(); syncAbholen(); } catch (e) {}
  try {
    const m = location.hash.match(/sync=([A-Za-z2-9-]+)/);
    if (m && !syncCode) {
      const feld = document.getElementById("syncCodeEingabe");
      if (feld) feld.value = decodeURIComponent(m[1]);
      history.replaceState(null, "", location.pathname); // Code aus Adresszeile
      goTab("familie");
      syncVerbinden();
    }
  } catch (e) {}
  versionAnzeigen(); // Feld steht in der Fusszeile NACH diesem Skript: siehe DOMContentLoaded

  // Lokal geoeffnet (Doppelklick auf die Datei)? Dann klar sagen,
  // was hier nicht geht, statt kryptischer Einzel-Fehlermeldungen.
  // Geführte Ersteinrichtung beim allerersten Start (v11)
  try {
    if (!localStorage.getItem(OB_FLAG)) onboardingOeffnen();
  } catch (e) {}
  if (location.protocol === "file:") {
    // v10.2: Nutzerfreundlich wie frueher - AUTOMATISCH zur
    // Online-Version. Das Banner erklaert kurz warum, dann geht
    // es ohne einen einzigen Klick weiter.
    const b = document.getElementById("lokalBanner");
    if (b) b.classList.remove("hidden");
    setTimeout(() => {
      location.replace("https://familienassistent.net/");
    }, 1500);
  }
  // Gespeicherte Wunsch-Ausschluesse ins Feld zuruecklegen
  try { ausschlussLaden(); } catch (e) {}
  // Globale Sprachsteuerung: sofort zuhoeren, wenn die
  // Mikrofon-Berechtigung schon erteilt ist
  gvAutoStart();
  // Service Worker fuer installierbare App + Push registrieren
  // (FUSION v10: inkl. deiner Update-Logik - neue sw.js laedt die
  //  Seite genau einmal frisch, plus dauerhafte Speichererlaubnis)
  if ("serviceWorker" in navigator) {
    let swRefreshing = false;
    const swHatteController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (swRefreshing || !swHatteController) return;
      swRefreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    // Push-Anmeldung pruefen und ggf. automatisch erneuern
    setTimeout(() => { try { pruefePushAbo(); } catch (e) {} }, 6000);
  }
})();

// =====================================================
// VERBRAUCHSGUETER-PLANER (Phase E1)
// Startwerte = kuratierte Schaetzungen (Statistik/DGE/
// Herstellerangaben). Die App LERNT dann den echten
// Verbrauch eures Haushalts aus jedem Kauf ("faktor").
// =====================================================
// rate-Typen: pe = pro Personen-Aequivalent | linear =
// basis + proPerson | gruppe = pro Kopf mit Alters-/
// Geschlechts-Filter. Wert = Packungen pro Woche.
const VERBRAUCH = [
  // --- Drogerie ---
  { id:"klopapier", name:"Toilettenpapier (10er)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0, proPerson:0.1 } },
  { id:"kuechenrolle", name:"Küchenrolle (4er)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.18, proPerson:0.02 } },
  { id:"taschentuecher", name:"Taschentücher (Großpack)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.04, proPerson:0.025 } },
  { id:"seife", name:"Handseife", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.1, proPerson:0.05 } },
  { id:"duschgel", name:"Duschgel", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.22, minAlter:4 } },
  { id:"shampoo", name:"Shampoo", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.13, minAlter:2 } },
  { id:"zahnpasta", name:"Zahnpasta", laden:"Drogerie",
    rate:{ typ:"linear", basis:0, proPerson:0.11 } },
  { id:"zahnbuersten", name:"Zahnbürsten (4er)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0, proPerson:0.031 } },
  { id:"waschmittel", name:"Waschmittel (20 WL)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.1, proPerson:0.05 } },
  { id:"spuelmittel", name:"Spülmittel", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.2, proPerson:0.03 } },
  { id:"spuelmaschinentabs", name:"Spülmaschinen-Tabs (40er)",
    laden:"Drogerie", rate:{ typ:"linear", basis:0.06, proPerson:0.025 } },
  { id:"muellbeutel", name:"Müllbeutel (20er)", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.1, proPerson:0.025 } },
  { id:"allzweck", name:"Allzweckreiniger", laden:"Drogerie",
    rate:{ typ:"linear", basis:0.12, proPerson:0.01 } },
  { id:"deo", name:"Deo", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.12, minAlter:11 } },
  { id:"damenhygiene", name:"Damenhygiene", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.25, minAlter:12, maxAlter:52,
           geschlecht:"w" } },
  { id:"windeln", name:"Windeln (50er)", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.7, maxAlter:3 } },
  { id:"feuchttuecher", name:"Feuchttücher", laden:"Drogerie",
    rate:{ typ:"gruppe", proKopf:0.7, maxAlter:3 } },
  { id:"milch", name:"Milch (4×1 L)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.25 } },
  { id:"butter", name:"Butter (250 g)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.5 } },
  { id:"eier", name:"Eier (10er)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.35 } },
  { id:"brot", name:"Brot (Laib)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.5 } },
  { id:"toast", name:"Toastbrot", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.3 } },
  { id:"kaese", name:"Käse (200 g)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.7 } },
  { id:"joghurt", name:"Joghurt (4er)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.6 } },
  { id:"muesli", name:"Müsli/Flocken", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.2 } },
  { id:"nudeln", name:"Nudeln (500 g)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.4 } },
  { id:"reis", name:"Reis (1 kg)", laden:"Supermarkt",
    rate:{ typ:"pe", proPE:0.15 } },
  { id:"mehl", name:"Mehl (1 kg)", laden:"Supermarkt",
    rate:{ typ:"linear", basis:0.2, proPerson:0.02 } },
  { id:"zucker", name:"Zucker (1 kg)", laden:"Supermarkt",
    rate:{ typ:"linear", basis:0.12, proPerson:0.01 } },
  { id:"kaffee", name:"Kaffee (500 g)", laden:"Supermarkt",
    rate:{ typ:"gruppe", proKopf:0.25, minAlter:18 } },
  { id:"oel", name:"Speiseöl", laden:"Supermarkt",
    rate:{ typ:"linear", basis:0.12, proPerson:0.015 } },
];

let vState = { items: {}, liste: [] };

function vbRate(item) {
  const r = item.rate;
  if (r.typ === "pe") return r.proPE * summePE();
  if (r.typ === "linear")
    return r.basis + r.proPerson * mitglieder.length;
  if (r.typ === "gruppe") {
    const n = mitglieder.filter((m) =>
      (r.minAlter == null || m.alter >= r.minAlter) &&
      (r.maxAlter == null || m.alter <= r.maxAlter) &&
      (!r.geschlecht || m.geschlecht === r.geschlecht)).length;
    return r.proKopf * n;
  }
  return 0;
}
function vbIntervalTage(item) {
  const rate = vbRate(item);
  if (rate <= 0) return 0;
  return Math.min(Math.max(7 / rate, 3), 180);
}
function vbStatus(item) {
  if (!vState.items[item.id])
    vState.items[item.id] = { zuletzt: Date.now(), faktor: 1,
      inListe: false, snoozeUntil: 0 };
  return vState.items[item.id];
}
function vbReichtNochTage(item) {
  const s = vbStatus(item);
  // Mehrere Packungen auf einmal gekauft (z. B. vom Kassenbon): der
  // Vorrat reicht entsprechend laenger.
  const intervall = vbIntervalTage(item) * s.faktor * vbMenge(s);
  return Math.round((s.zuletzt + intervall * 86400000 - Date.now()) / 86400000);
}
function vbSave() {
  try { localStorage.setItem("ka_verbrauch", JSON.stringify(vState)); }
  catch (e) {}
  serverSync();
  try { syncGeplant(); } catch (e) {}
}

function vbInListe(id) {
  const item = VERBRAUCH.find((x) => x.id === id);
  const s = vbStatus(item);
  s.inListe = true;
  vState.liste.push({ id: id, name: item.name, laden: item.laden });
  vbSave(); renderVerbrauch();
}
function vbZurueckstellen(id) {
  const item = VERBRAUCH.find((x) => x.id === id);
  const s = vbStatus(item);
  const basis = vbIntervalTage(item) * s.faktor;
  s.snoozeUntil = Date.now() + basis * 0.2 * 86400000;
  s.faktor = Math.min(s.faktor * 1.1, 3);
  vbSave(); renderVerbrauch();
}
function vbMenge(s) {
  const n = Number(s && s.menge);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 20) : 1;
}
// Einen Kauf verbuchen und den echten Verbrauch lernen. Gemeinsamer
// Kern fuer "abgehakt" (Einkaufsliste) und den Kassenbon-Scanner.
function vbKaufVerbuchen(id, menge) {
  const item = VERBRAUCH.find((x) => x.id === id);
  if (!item) return false;
  const s = vbStatus(item);
  // Lernen pro Packung: Wer letztes Mal 3 Stueck kaufte, hat in der
  // gemessenen Zeit auch 3 Stueck verbraucht.
  const tatsaechlich = (Date.now() - s.zuletzt) / 86400000 / vbMenge(s);
  const basis = vbIntervalTage(item);
  if (basis > 0 && tatsaechlich > 1) {
    s.faktor = Math.min(Math.max(
      s.faktor * 0.7 + (tatsaechlich / basis) * 0.3, 0.4), 3);
  }
  s.zuletzt = Date.now();
  s.menge = vbMenge({ menge: menge });
  s.inListe = false;
  s.snoozeUntil = 0;
  return true;
}
function vbGekauft(eintragIdx) {
  const eintrag = vState.liste[eintragIdx];
  if (eintrag && eintrag.id) vbKaufVerbuchen(eintrag.id, 1);
  vState.liste.splice(eintragIdx, 1);
  vbSave(); renderVerbrauch();
}
function vbVoiceAdd() {
  // evtl. laufenden Einkaufs-Modus beenden (Mikro-Konflikt vermeiden)
  if (typeof vbVoiceActive !== "undefined" && vbVoiceActive)
    vbVoiceCheckoffStop();
  // laeuft ueber den globalen Controller - keine Zweit-Instanz
  gvOneShot("Welcher Artikel?", einkaufHinzufuegen);
}

// --- Anzeige ---
function renderVerbrauch() {
  const info = document.getElementById("vbInfo");
  if (!info) return;
  info.textContent = mitglieder.length
    ? `Berechnet für euer Profil: ${mitglieder.length} Personen ` +
      `(${summePE().toFixed(1)} Essens-Äquivalente). Die App lernt euren ` +
      `echten Verbrauch mit jedem Einkauf dazu.`
    : "Lege zuerst euer Familienprofil an (Reiter Familie) – dann plane " +
      "ich Mengen und Zeitpunkte automatisch.";

  const evtl = document.getElementById("vbEvtl");
  evtl.innerHTML = "";
  let evtlCount = 0;
  if (mitglieder.length) {
    VERBRAUCH.forEach((item) => {
      if (vbIntervalTage(item) <= 0) return;
      const s = vbStatus(item);
      if (s.inListe || Date.now() < s.snoozeUntil) return;
      if (vbReichtNochTage(item) > 2) return;
      evtlCount++;
      const div = document.createElement("div");
      div.className = "entry";
      const span = document.createElement("span");
      span.style.flex = "1";
      span.textContent = item.name + " (" + item.laden + ")";
      const ja = document.createElement("button");
      ja.className = "btn"; ja.style.padding = "7px 10px";
      ja.textContent = "In die Liste";
      ja.onclick = () => vbInListe(item.id);
      const nein = document.createElement("button");
      nein.className = "btn ghost"; nein.style.padding = "7px 10px";
      nein.textContent = "Zurückstellen";
      nein.onclick = () => vbZurueckstellen(item.id);
      div.appendChild(span); div.appendChild(ja); div.appendChild(nein);
      evtl.appendChild(div);
    });
  }
  if (!evtlCount)
    evtl.innerHTML = '<p class="muted">Gerade nichts fällig – ich melde ' +
      'mich, wenn etwas zur Neige gehen müsste.</p>';

  const ul = document.getElementById("vbListe");
  ul.innerHTML = "";
  if (!vState.liste.length)
    ul.innerHTML = '<p class="muted">Leer. Artikel kommen aus „bald ' +
      'leer“, per Sprache oder aus „Alle Artikel“.</p>';
  vState.liste.forEach((e, idx) => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.onchange = () => vbGekauft(idx);
    const span = document.createElement("span");
    span.textContent = e.name + (e.laden ? " – " + e.laden : "");
    li.appendChild(cb); li.appendChild(span);
    ul.appendChild(li);
  });

  const alle = document.getElementById("vbAlle");
  alle.innerHTML = "";
  if (mitglieder.length) {
    VERBRAUCH.forEach((item) => {
      if (vbIntervalTage(item) <= 0) return;
      const s = vbStatus(item);
      const tage = vbReichtNochTage(item);
      const div = document.createElement("div");
      div.className = "entry";
      const span = document.createElement("span");
      span.style.flex = "1";
      span.textContent = item.name + " – reicht noch ca. " +
        (tage > 0 ? tage + " Tage" : "ist fällig");
      const leer = document.createElement("button");
      leer.className = "btn ghost"; leer.style.padding = "6px 10px";
      leer.textContent = s.inListe ? "auf Liste ✓" : "Jetzt leer";
      leer.disabled = s.inListe;
      leer.onclick = () => vbInListe(item.id);
      div.appendChild(span); div.appendChild(leer);
      alle.appendChild(div);
    });
  }
}

(function initVerbrauch() {
  vState = tLoad("ka_verbrauch", { items: {}, liste: [] });
  if (!vState.items) vState.items = {};
  if (!vState.liste) vState.liste = [];
})();

// =====================================================
// NEU: EINKAUFS-MODUS – freihändig per Sprache abhaken
// Hakt Artikel der Verbrauchs-Einkaufsliste per Stimme ab und
// nutzt dafuer die bestehende Lernfunktion vbGekauft() (Zyklus
// passt sich an). Vollständig eigenständig, eigener Erkenner –
// veraendert KEINE vorhandene Logik.
// =====================================================
let vbVoiceRec = null;
let vbVoiceActive = false;
let vbVoiceTtsUntil = 0;

const VB_FUELLWORTER =
  /\b(okay|ok|oka|fertig|erledigt|gekauft|hab ich|habe|hab|haben wir|ja|drin|dazu|eingepackt|im wagen|gibts|gibt es|noch|den|die|das|der|ein|eine|einen)\b/g;

function vbNorm(s) {
  let x = " " + String(s).toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zäöüß ]/g, " ")
    .replace(VB_FUELLWORTER, " ")
    .replace(/\s+/g, " ").trim() + " ";
  const syn = {
    " klopapier ": " toilettenpapier ", " klo papier ": " toilettenpapier ",
    " küchenpapier ": " küchenrolle ", " zewa ": " küchenrolle ",
    " tempo ": " taschentücher ", " tempos ": " taschentücher ",
    " zahncreme ": " zahnpasta ", " spüli ": " spülmittel ",
    " geschirrspülmittel ": " spülmittel ", " müllsäcke ": " müllbeutel ",
    " mülltüten ": " müllbeutel ", " kaffeebohnen ": " kaffee ",
    " kaffeepulver ": " kaffee "
  };
  for (const k in syn) x = (" " + x + " ").split(k).join(syn[k]).trim();
  return x.trim();
}

function vbKurzName(n) {
  return String(n).replace(/\([^)]*\)/g, "").trim();
}

function vbMatchScore(spoken, itemName) {
  const a = vbNorm(spoken), b = vbNorm(itemName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const at = a.split(" "), bt = b.split(" ");
  let hits = 0;
  bt.forEach((t) => {
    if (t.length >= 3 && at.some((x) => x === t)) hits += 2;          // exakter Wort-Treffer
    else if (t.length >= 4 && at.some((x) => x.includes(t) || t.includes(x)))
      hits += 1;                                                       // Teil-Treffer
  });
  return hits;
}

function vbVoiceSay(text) {
  // Fenster setzen, in dem die eigene Sprachausgabe ignoriert wird (Echo-Schutz)
  vbVoiceTtsUntil = Date.now() + Math.max(2500, text.length * 90) + 1200;
  try { speak(text, true); } catch (e) {}
}

function vbVoiceCheckoffButton() {
  const btn = document.getElementById("vbVoiceBtn");
  if (!btn) return;
  btn.textContent = vbVoiceActive
    ? "⏹ Einkaufs-Modus beenden"
    : "🛒 Freihändig abhaken (Einkaufs-Modus)";
}

function vbVoiceHandle(said) {
  if (!vState.liste.length) {
    vbVoiceSay("Die Liste ist leer.");
    vbVoiceCheckoffStop();
    return;
  }
  const scored = vState.liste
    .map((e, idx) => ({ idx, name: e.name, score: vbMatchScore(said, e.name) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return; // nichts Passendes -> still ignorieren (Lärmschutz)
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    vbVoiceSay("Mehrere passen: " +
      scored.slice(0, 3).map((s) => vbKurzName(s.name)).join(", ") +
      ". Bitte genauer sagen.");
    return;
  }
  const hit = scored[0];
  const name = vState.liste[hit.idx].name;
  vbGekauft(hit.idx); // BESTEHENDE Lernfunktion: Zyklus anpassen + entfernen + neu rendern
  if (!vState.liste.length) {
    vbVoiceSay(vbKurzName(name) + ", abgehakt. Alles erledigt!");
    vbVoiceCheckoffStop();
  } else {
    vbVoiceSay(vbKurzName(name) + ", abgehakt.");
  }
}

function vbVoiceCheckoffStart() {
  // FUSION v10: globalen Sprach-Controller pausieren - der
  // Einkaufs-Modus bekommt das Mikrofon exklusiv
  GlobalVoice.aktiv = false;
  GlobalVoice.dialog = null;
  if (recognition) { try { recognition.abort(); } catch (e) {} }
  gvChip("🎤 Einkaufs-Modus aktiv", "an");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = document.getElementById("vbVoiceStatus");
  if (!SR) {
    if (status) status.textContent =
      "Spracherkennung wird von diesem Browser nicht unterstützt.";
    return;
  }
  if (!vState.liste.length) {
    if (status) status.textContent =
      "Die Einkaufsliste ist leer – erst Artikel aufnehmen.";
    return;
  }
  vbVoiceRec = new SR();
  vbVoiceRec.lang = "de-DE";
  vbVoiceRec.continuous = true;
  vbVoiceRec.interimResults = false;
  vbVoiceRec.onresult = (ev) => {
    if (Date.now() < vbVoiceTtsUntil) return; // eigenes Sprechen ignorieren
    const said = ev.results[ev.results.length - 1][0].transcript.toLowerCase();
    vbVoiceHandle(said);
  };
  vbVoiceRec.onerror = (e) => {
    if (e.error === "aborted") return;
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      vbVoiceActive = false;
      vbVoiceCheckoffButton();
      if (status) status.textContent =
        "Mikrofon nicht erlaubt – hake Artikel per Häkchen ab.";
    }
  };
  vbVoiceRec.onend = () => {
    if (vbVoiceActive) { try { vbVoiceRec.start(); } catch (e) {} }
  };
  vbVoiceActive = true;
  try { vbVoiceRec.start(); } catch (e) {}
  vbVoiceCheckoffButton();
  if (status) status.textContent =
    "🎤 Hört zu … sag z. B. „Milch okay“. Zum Beenden den Knopf drücken.";
  vbVoiceSay("Einkaufs-Modus an. Sag mir, was im Wagen ist.");
}

function vbVoiceCheckoffStop() {
  if (!vbVoiceActive && !vbVoiceRec) return;
  vbVoiceActive = false;
  if (vbVoiceRec) {
    try { vbVoiceRec.abort(); } catch (e) {}
    vbVoiceRec = null;
  }
  vbVoiceCheckoffButton();
  const status = document.getElementById("vbVoiceStatus");
  if (status) status.textContent = "Einkaufs-Modus beendet.";
  // FUSION v10: globalen Sprach-Controller wieder uebernehmen lassen
  setTimeout(() => { try { gvStart(); } catch (e) {} }, 400);
}

function vbVoiceCheckoffToggle() {
  if (vbVoiceActive) vbVoiceCheckoffStop();
  else vbVoiceCheckoffStart();
}
