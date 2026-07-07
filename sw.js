/*
 * Familien-Assistent – Service Worker (Zero-Knowledge-Push)
 * Der Server schickt nur ein leeres Wecksignal. Dieser Worker
 * holt die fälligen Zufallsnummern, schlägt die Klartexte
 * im LOKALEN Speicher des Geräts nach und baut die
 * Benachrichtigung erst hier zusammen.
 *
 * VERSION: bei jedem Release hochzählen. Allein die Änderung
 * dieses Strings reicht, damit der Browser die sw.js als
 * geändert erkennt und den Update-Zyklus (Weg A) auslöst.
 */
const VERSION = "app-fusion12";

self.addEventListener("install", (e) => self.skipWaiting());

self.addEventListener("activate", (e) =>
  e.waitUntil((async () => {
    // Nur alte PROGRAMM-Caches entfernen. Dies betrifft ausschliesslich
    // die Cache-API (Code/Assets) und niemals localStorage oder IndexedDB
    // -> Profil, Termine, Favoriten etc. bleiben unberuehrt.
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
    );
    await clients.claim();
  })())
);

function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("ka", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function idbGet(key) {
  return idb().then((d) => new Promise((res, rej) => {
    const t = d.transaction("kv", "readonly");
    const g = t.objectStore("kv").get(key);
    g.onsuccess = () => res(g.result);
    g.onerror = () => rej(g.error);
  }));
}

function fallbackNotification() {
  return self.registration.showNotification("Familien-Assistent", {
    body: "⏰ Erinnerung – bitte App öffnen",
    tag: "ka-fallback",
    icon: "/icon.svg",
  });
}

/* FUSION v10: Push-Fallback-GARANTIE. Ein Push-Ereignis endet NIE
   ohne sichtbare Benachrichtigung - auch bei leerer refs-Liste
   (nicht nur bei Exceptions). Browser drosseln sonst die Push-
   Zustellung schleichend ("userVisibleOnly"-Verstoss). */
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let gezeigt = 0;
    try {
      const device = await idbGet("device");
      if (device) {
        const r = await fetch("/api/wecker?device=" +
          encodeURIComponent(device) + "&due=1");
        const data = await r.json();
        const refs = (data && data.refs) || [];
        const texte = (await idbGet("refs")) || {};
        for (const ref of refs.slice(0, 3)) {
          await self.registration.showNotification("Familien-Assistent", {
            body: texte[ref] || "⏰ Erinnerung – bitte App öffnen",
            tag: ref,
            icon: "/icon.svg",
            requireInteraction: true,
            actions: [{ action: "ok", title: "✓ OK / Erledigt" }],
            data: { ref, device },
          });
          gezeigt++;
        }
      }
      // Feedback-Digest fuer den Betreiber
      try {
        const dNeu = Number(data && data.digest) || 0;
        if (dNeu > 0) {
          await self.registration.showNotification("Familien-Assistent", {
            body: "📬 " + dNeu + " neue Rückmeldung" +
              (dNeu === 1 ? "" : "en") + " – Postfach öffnen",
            tag: "ka-feedback",
            icon: "/icon.svg",
            data: { url: "/feedback-admin.html" },
          });
          gezeigt++;
        }
      } catch (err) {}
    } catch (err) { /* faellt unten in den Fallback */ }
    if (gezeigt === 0) {
      try { await fallbackNotification(); } catch (err) {}
    }
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const d = e.notification.data || {};
  if (e.action === "ok" && d.ref) {
    e.waitUntil(fetch("/api/wecker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device: d.device, bestaetige: d.ref }),
    }).catch(() => {}));
  } else {
    const ziel = d.url || "/";
    e.waitUntil(clients.matchAll({ type: "window" }).then((wins) => {
      if (ziel === "/" && wins.length) return wins[0].focus();
      return clients.openWindow(ziel);
    }));
  }
});

/* =====================================================================
   FETCH-HANDLER – Pflicht, damit Chrome die App als installierbar
   erkennt und den Installations-Knopf anzeigt (beforeinstallprompt).
   Kein respondWith -> der Browser lädt ganz normal aus dem Netz,
   es wird also nichts an der bestehenden Funktion verändert.
   ===================================================================== */
self.addEventListener("fetch", (e) => {});