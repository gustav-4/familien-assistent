/* ═══════════════════════════════════════════════════════════════════════
   Familien-Assistent – Erweiterungen
   Reihenfolge: Paywall-Gate → Garantie-Modal → Load-Patches
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Paywall-Zustandsvariable ──────────────────────────────────────── */
var paywallAktiv = false;

/* ── Lizenz-Weiche (IIFE, läuft synchron beim Parsen) ─────────────── */
(function lizenzWeiche() {
  var MONAT_MS  = 30  * 24 * 60 * 60 * 1000;
  var JAHR_MS   = 365 * 24 * 60 * 60 * 1000;

  /* 1. Stripe-Redirect auswerten */
  try {
    var params  = new URLSearchParams(window.location.search);
    var session = params.get('checkout_session');
    if (session === 'lifetime') {
      localStorage.setItem('lizenz_aktiv',  'true');
      localStorage.setItem('lizenz_ablauf', String(Date.now() + 100 * JAHR_MS));
      history.replaceState(null, '', window.location.pathname);
    } else if (session === 'jahr') {
      localStorage.setItem('lizenz_aktiv',  'true');
      localStorage.setItem('lizenz_ablauf', String(Date.now() + JAHR_MS));
      history.replaceState(null, '', window.location.pathname);
    } else if (session === 'monat') {
      localStorage.setItem('lizenz_aktiv',  'true');
      localStorage.setItem('lizenz_ablauf', String(Date.now() + MONAT_MS));
      history.replaceState(null, '', window.location.pathname);
    }
  } catch(e) {}

  /* 2. Ablauf prüfen */
  try {
    var ablauf = parseInt(localStorage.getItem('lizenz_ablauf') || '0', 10);
    if (ablauf && Date.now() > ablauf) {
      localStorage.removeItem('lizenz_aktiv');
      localStorage.removeItem('lizenz_ablauf');
    }
  } catch(e) {}

  /* 3. Lizenz aktiv → fertig */
  if (localStorage.getItem('lizenz_aktiv') === 'true') return;

  /* 4. Test-Startdatum setzen (einmalig beim ersten Besuch) */
  var testStart = parseInt(localStorage.getItem('test_start') || '0', 10);
  if (!testStart) {
    testStart = Date.now();
    try { localStorage.setItem('test_start', String(testStart)); } catch(e) {}
  }

  /* 5. Paywall auslösen nach 14 Tagen */
  var VIERZEHN_TAGE_MS = 14 * 24 * 60 * 60 * 1000;
  if (Date.now() > testStart + VIERZEHN_TAGE_MS) {
    paywallAktiv = true;
    document.addEventListener('DOMContentLoaded', function() {
      var overlay = document.getElementById('paywall-overlay');
      if (overlay) overlay.style.display = 'flex';
    });
  }
})();

/* ── B2B-Code einlösen ─────────────────────────────────────────────── */
function b2bCodeEinloesen() {
  var input  = document.getElementById('pw-code-input');
  var fehler = document.getElementById('pw-code-fehler');
  if (!input) return;
  var code = (input.value || '').trim().toUpperCase();
  if (code === 'WEIHNACHTEN2026') {
    localStorage.setItem('lizenz_aktiv',  'true');
    localStorage.setItem('lizenz_ablauf', String(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000));
    window.location.reload();
  } else {
    if (fehler) fehler.style.display = 'block';
    setTimeout(function() { if (fehler) fehler.style.display = 'none'; }, 3000);
  }
}

/* ── Stripe-Zahlungsweiterleitung ───────────────────────────────────── */
function paywallMonat() {
  window.location.href = 'https://buy.stripe.com/9B6eVdadD3Vbevc6wEdEs00';
}
function paywallJahr() {
  window.location.href =  'https://buy.stripe.com/00w7sLetT0IZ4UCcV2dEs01';
}
function paywallLifetime() {
  window.location.href = 'https://buy.stripe.com/9B6eVd5Xn4Zf3Qy8EMdEs02';
}
function paywallOeffnen() {
  var o = document.getElementById('paywall-overlay');
  if (o) o.style.display = 'flex';
}

/* ── Onboarding-Öffner (Fallback, falls extern noch nicht geladen) ── */
if (typeof window.onboardingOeffnen !== 'function') {
  window.onboardingOeffnen = function onboardingOeffnen() {
    var ob = document.getElementById('onboarding') || document.querySelector('[id*="onboarding"]');
    if (ob) ob.style.display = '';
  };
}

/* ── Garantie-Modal ────────────────────────────────────────────────── */
function garantieModalOeffnen() {
  var m = document.getElementById('garantieModal');
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  return false;
}
function garantieModalSchliessen() {
  var m = document.getElementById('garantieModal');
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('click', function(e) {
    var m = document.getElementById('garantieModal');
    if (m && e.target === m) garantieModalSchliessen();
  });
}

/* ── Geräte-ID initialisieren ──────────────────────────────────────── */
(function() {
  try {
    if (!localStorage.getItem('familienapp_deviceId')) {
      var arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      var id = Array.from(arr, function(b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
      localStorage.setItem('familienapp_deviceId', id);
    }
  } catch(e) {}
})();
var _inlineDeviceId = (function() { try { return localStorage.getItem('familienapp_deviceId'); } catch(e) { return ''; } })();

/* ── Load-Patches (warten auf externe Scripts) ─────────────────────── */
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
window.addEventListener('load', function() {

  /* Patch 1: personenAequivalent() – Altersstaffelung (Anforderung 1) */
  if (typeof window.personenAequivalent === 'function') {
    var _origPersonen = window.personenAequivalent;
    window.personenAequivalent = function(mitglied) {
      if (mitglied && mitglied.alter !== undefined) {
        var alter = parseInt(mitglied.alter, 10);
        if (!isNaN(alter) && alter <= 5)  return 0.33;
        if (!isNaN(alter) && alter >= 15 && mitglied.geschlecht === 'm') return 1.3;
      }
      return _origPersonen(mitglied);
    };
  }

  /* Patch 2: serverSync global verfügbar machen (Fallback-Stub) */
  if (typeof window.serverSync !== 'function') {
    window.serverSync = function() {
      var s = localStorage.getItem('familienapp_termine');
      if (s) {
        try {
          var termine = JSON.parse(s);
          console.log('[serverSync] Stub: ' + termine.length + ' Termin(e) bereit zur Synchronisation.');
        } catch(e) {}
      }
    };
  }

  /* Patch 3: saveTermin – "offen für alle" Marktplatz-Markierung */
  if (typeof window.saveTermin === 'function') {
    var _origSaveTermin = window.saveTermin;
    window.saveTermin = function() {
      var mitgliedSelect = document.getElementById('terminMitglied') ||
                           document.querySelector('[data-termin-mitglied]');
      var keineAuswahl = !mitgliedSelect ||
                         !mitgliedSelect.value ||
                         mitgliedSelect.value === '' ||
                         mitgliedSelect.value === 'alle';
      if (keineAuswahl) {
        var key = 'familienapp_termine';
        try {
          var raw     = localStorage.getItem(key);
          var termine = raw ? JSON.parse(raw) : [];
          var letzter = termine[termine.length - 1];
          if (letzter && !letzter.offenFuerAlle) {
            letzter.offenFuerAlle = true;
            letzter.deviceId       = _inlineDeviceId;
            localStorage.setItem(key, JSON.stringify(termine));
          }
        } catch(e) {}
      }
      var result = _origSaveTermin.apply(this, arguments);
      window.serverSync();
      return result;
    };
  }

  /* Patch 4: MutationObserver – "Termin übernehmen"-Buttons */
  function terminUebernehmen(terminId) {
    try {
      var raw     = localStorage.getItem('familienapp_termine');
      var termine = raw ? JSON.parse(raw) : [];
      var idx     = termine.findIndex(function(t) { return t.id === terminId; });
      if (idx === -1) return;
      termine[idx].deviceId       = _inlineDeviceId;
      termine[idx].offenFuerAlle  = false;
      localStorage.setItem('familienapp_termine', JSON.stringify(termine));
      if (typeof window.saveTermin === 'function') window.saveTermin();
      window.serverSync();
      var btn = document.querySelector('[data-uebernehmen="' + terminId + '"]');
      if (btn) { btn.textContent = '✔ Übernommen'; btn.disabled = true; }
    } catch(e) {}
  }

  function terminBtnEinfuegen(container) {
    var karten = container.querySelectorAll('[data-termin-id]');
    karten.forEach(function(karte) {
      var tid = karte.getAttribute('data-termin-id');
      if (!tid || karte.querySelector('[data-uebernehmen]')) return;
      try {
        var raw     = localStorage.getItem('familienapp_termine');
        var termine = JSON.parse(raw || '[]');
        var t = termine.find(function(x) { return x.id === tid; });
        if (!t || !t.offenFuerAlle) return;
      } catch(e) { return; }
      var btn = document.createElement('button');
      btn.className = 'btn btn-uebernehmen';
      btn.setAttribute('data-uebernehmen', tid);
      btn.textContent = '✋ Termin übernehmen';
      btn.addEventListener('click', function() { terminUebernehmen(tid); });
      karte.appendChild(btn);
    });
  }

  var terminList = document.getElementById('terminList');
  if (terminList) {
    terminBtnEinfuegen(terminList);
    var observer = new MutationObserver(function() {
      terminBtnEinfuegen(terminList);
    });
    observer.observe(terminList, { childList: true, subtree: true });
  }

  /* Paywall-Guard für init / onboardingAutostart */
  if (paywallAktiv) {
    if (typeof window.init === 'function')               window.init               = function() {};
    if (typeof window.onboardingAutostart === 'function') window.onboardingAutostart = function() {};
  }
}); /* end load */
} /* end window.addEventListener guard */
