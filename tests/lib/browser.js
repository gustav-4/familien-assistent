// =====================================================================
// BROWSER-ATTRAPPE (selbstheilend)
// ---------------------------------------------------------------------
// Fuehrt die komplette App in EINEM eval-Kontext aus - so wie ein
// Browser es tut. Faengt damit Fehlerklassen, die "node --check" nie
// sieht (TDZ, Reihenfolge, fehlende Referenzen).
//
// SELBSTHEILUNG STUFE 1: Greift die App auf eine DOM-Eigenschaft zu,
// die die Attrappe nicht kennt, wird sie NICHT zum Absturz gebracht -
// stattdessen wird ein passender Platzhalter erzeugt UND der Vorfall
// protokolliert. Der Testlauf meldet danach, welche Attrappen-Luecken
// dauerhaft geschlossen werden sollten.
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");

const luecken = [];          // automatisch geschlossene Attrappen-Luecken
const gesprochen = [];       // alles, was die App gesagt hat
const elemente = {};         // simulierte DOM-Knoten
let ttsBlockiert = false;    // Browser verweigert Sprachausgabe
let recInstanz = null;       // letzte Spracherkennungs-Instanz
let wakeLockAnfragen = 0;
let wakeLockFreigaben = 0;

function merkeLuecke(art, name) {
  const schluessel = art + ":" + name;
  if (!luecken.includes(schluessel)) luecken.push(schluessel);
}

// --- DOM-Knoten mit Auffangnetz -------------------------------------
function knotenRoh(id) {
  return {
    id, _text: "", _html: "", value: "", disabled: false, checked: false,
    type: "", name: "", src: "", href: "", title: "", tagName: "DIV",
    style: {}, dataset: {}, children: [], options: [], files: [],
    classList: {
      _s: new Set(["hidden"]),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c, an) {
        if (an === undefined) an = !this._s.has(c);
        if (an) this._s.add(c); else this._s.delete(c);
        return an;
      },
    },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); this.children = []; },
    get innerText() {
      return this._text || String(this._html).replace(/<[^>]*>/g, " ");
    },
    set innerText(v) { this._text = String(v); },
    appendChild(k) { this.children.push(k); return k; },
    insertBefore(k) { this.children.push(k); return k; },
    removeChild(k) { return k; },
    remove() {},
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
    removeAttribute() {}, hasAttribute() { return false; },
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    querySelector(sel) { return element("q:" + id + ":" + sel); },
    querySelectorAll() { return []; },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: 100, height: 20, bottom: 20, right: 100 };
    },
    closest() { return null; },
    // AUDIT: className und classList waren getrennte Welten - eine
    // Aenderung per classList.add() blieb in className unsichtbar.
    // Tests, die className prueften, waren dadurch wirkungslos gruen.
    // Jetzt teilen sich beide denselben Speicher, wie im echten Browser.
    get className() { return [...this.classList._s].join(" "); },
    set className(v) {
      this.classList._s = new Set(String(v || "").split(/\s+/).filter(Boolean));
    },
  };
}

// Auffangnetz: unbekannte Eigenschaft -> Platzhalter statt Absturz
function element(id) {
  if (!elemente[id]) {
    elemente[id] = new Proxy(knotenRoh(id), {
      get(ziel, eigenschaft) {
        if (eigenschaft in ziel) return ziel[eigenschaft];
        if (typeof eigenschaft === "symbol") return undefined;
        merkeLuecke("dom-eigenschaft", String(eigenschaft));
        // Sinnvoller Platzhalter: Funktionen bleiben aufrufbar
        const platzhalter = function () { return undefined; };
        ziel[eigenschaft] = platzhalter;
        return platzhalter;
      },
      set(ziel, eigenschaft, wert) { ziel[eigenschaft] = wert; return true; },
    });
  }
  return elemente[id];
}

// --- Globale Browser-Umgebung ---------------------------------------
// Node 22 schuetzt einige Globale (navigator, crypto) mit reinen
// Gettern - direkte Zuweisung wirft. Deshalb hart ueberschreiben.
function setzeGlobal(name, wert) {
  try { global[name] = wert; return; } catch (e) { /* Getter-Schutz */ }
  Object.defineProperty(global, name, {
    value: wert, writable: true, configurable: true, enumerable: true,
  });
}

let audioInstanz = null;

function umgebungAufbauen() {
  global.window = global;
  global.self = global;
  global.document = {
    getElementById: element,
    createElement: (t) => element("neu:" + t + ":" + Object.keys(elemente).length),
    createTextNode: (t) => ({ textContent: t }),
    querySelector: (s) => element("qs:" + s),
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    hidden: false, visibilityState: "visible",
    body: element("body"), head: element("head"),
    documentElement: element("html"),
    activeElement: element("body"),
    cookie: "",
  };
  const navigatorAttrappe = {
    userAgent: "Testattrappe/1.0 (Android 14)", language: "de-DE",
    languages: ["de-DE"], onLine: true, maxTouchPoints: 5,
    serviceWorker: {
      register: async () => ({ pushManager: { getSubscription: async () => null,
        subscribe: async () => ({ endpoint: "https://push.test/x",
          toJSON: () => ({ endpoint: "https://push.test/x", keys: {} }) }) } }),
      ready: Promise.resolve({ pushManager: { getSubscription: async () => null } }),
      controller: null, addEventListener() {},
    },
    clipboard: { writeText: async () => {} },
    wakeLock: {
      request: async () => {
        wakeLockAnfragen++;
        return { released: false, addEventListener() {},
          release() { wakeLockFreigaben++; } };
      },
    },
    storage: { persist: async () => true, persisted: async () => true },
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) },
    share: undefined, vibrate: () => true,
  };
  setzeGlobal("navigator", navigatorAttrappe);
  global.screen = { width: 1080, height: 1920, orientation: { type: "portrait" } };
  global.location = {
    protocol: "https:", hostname: "familienassistent.net",
    origin: "https://familienassistent.net", pathname: "/", hash: "",
    href: "https://familienassistent.net/", search: "",
    reload() {}, replace() {}, assign() {},
  };
  global.history = { replaceState() {}, pushState() {}, back() {} };
  global.localStorage = {
    _d: {},
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null;
    },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    clear() { this._d = {}; },
    get length() { return Object.keys(this._d).length; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
  };
  global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  global.indexedDB = {
    open() {
      const anfrage = { onupgradeneeded: null, onsuccess: null, onerror: null,
        result: {
          createObjectStore: () => ({ createIndex() {} }),
          objectStoreNames: { contains: () => false },
          transaction: () => ({
            objectStore: () => ({
              put: () => ({ onsuccess: null }),
              get: () => ({ onsuccess: null, result: null }),
              delete: () => ({ onsuccess: null }),
            }),
            oncomplete: null,
          }),
        } };
      setTimeout(() => {
        if (anfrage.onupgradeneeded) anfrage.onupgradeneeded({ target: anfrage });
        if (anfrage.onsuccess) anfrage.onsuccess({ target: anfrage });
      }, 0);
      return anfrage;
    },
    deleteDatabase() { return { onsuccess: null }; },
  };
  global.SpeechSynthesisUtterance = function (t) {
    this.text = t; this.lang = "de-DE"; this.rate = 1; this.pitch = 1;
    this.voice = null;
    this.onstart = null; this.onend = null; this.onerror = null;
  };
  global.speechSynthesis = {
    speaking: false, pending: false, paused: false,
    getVoices: () => [
      { name: "Attrappe Deutsch", lang: "de-DE", voiceURI: "test-de", default: true },
    ],
    addEventListener() {}, removeEventListener() {},
    speak(u) {
      gesprochen.push(u.text);
      if (ttsBlockiert) {
        setTimeout(() => u.onerror && u.onerror({ error: "not-allowed" }), 0);
        return;
      }
      setTimeout(() => {
        u.onstart && u.onstart();
        u.onend && u.onend();
      }, 0);
    },
    cancel() {}, pause() {}, resume() {},
  };
  function Erkennung() {
    this.lang = ""; this.continuous = false; this.interimResults = false;
    this.maxAlternatives = 1;
    this.onresult = null; this.onerror = null; this.onend = null;
    this.onstart = null; this.onaudiostart = null;
    this.gestartet = 0; this.gestoppt = 0; this.abgebrochen = 0;
    this.start = () => { this.gestartet++; };
    this.stop = () => { this.gestoppt++; };
    this.abort = () => { this.abgebrochen++; this.gestoppt++; };
    recInstanz = this;
    global.recInstanz = this;
  }
  global.SpeechRecognition = Erkennung;
  global.webkitSpeechRecognition = Erkennung;
  // --- Signaltoene messbar machen -----------------------------------
  // Ohne diese Attrappe war die gesamte Ton-Logik im Test unsichtbar:
  // tonKontext() lieferte null und jeder Ton verpuffte lautlos. Genau
  // solche Loecher sind der Grund, warum die taeglichen Pruefungen die
  // Ton-Fehler nie sehen konnten.
  function GainAttrappe() {
    this.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    this.connect = () => {};
  }
  function OszillatorAttrappe(ctx) {
    this.type = "sine";
    this.frequency = { value: 0 };
    this.connect = () => {};
    this.start = () => { ctx._toene.push(this.frequency.value); };
    this.stop = () => {};
  }
  function AudioContextAttrappe() {
    this.state = "running";
    this.currentTime = 0;
    this._toene = [];
    this.resume = () => { this.state = "running"; };
    this.createOscillator = () => new OszillatorAttrappe(this);
    this.createGain = () => new GainAttrappe();
    this.destination = {};
    audioInstanz = this;
    global.audioInstanz = this;
  }
  global.AudioContext = AudioContextAttrappe;
  global.webkitAudioContext = AudioContextAttrappe;
  global.Notification = {
    permission: "granted", requestPermission: async () => "granted",
  };
  global.fetch = async () => ({
    ok: true, status: 200,
    json: async () => ({ success: true, recipes: [], refs: [], plan: [] }),
    text: async () => "{}",
  });
  setzeGlobal("crypto", require("crypto").webcrypto);
  global.btoa = (s) => Buffer.from(s, "binary").toString("base64");
  global.atob = (s) => Buffer.from(s, "base64").toString("binary");
  global.alert = () => {};
  global.confirm = () => true;
  global.prompt = () => "";
  global.matchMedia = () => ({ matches: false, addEventListener() {},
    removeEventListener() {} });
  global.requestAnimationFrame = (f) => setTimeout(f, 0);
  global.cancelAnimationFrame = () => {};
  global.getComputedStyle = () => ({ getPropertyValue: () => "" });

  // Testwerkzeuge fuer die Szenarien sichtbar machen
  global.elemente = elemente;
  global.gesprochen = gesprochen;
  global.el = element;
  global.setzeTtsBlockiert = (b) => { ttsBlockiert = b; };
  // Toene zaehlen/zuruecksetzen (Frequenzfolge = Art des Tons)
  global.toeneGespielt = () => (audioInstanz ? audioInstanz._toene.slice() : []);
  global.toeneLeeren = () => { if (audioInstanz) audioInstanz._toene = []; };
  global.gesprochenLeeren = () => { gesprochen.length = 0; };
  global.wakeLockZaehler = () => ({ an: wakeLockAnfragen, aus: wakeLockFreigaben });
  global.attrappenLuecken = () => luecken.slice();
}

// --- App-Quelltext aus index.html holen ------------------------------
function appQuelltext(wurzel) {
  const html = fs.readFileSync(path.join(wurzel, "index.html"), "utf8");
  const bloecke = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  return bloecke
    .map((b) => b.replace(/^<script>/, "").replace(/<\/script>$/, ""))
    .join("\n;\n");
}

module.exports = { umgebungAufbauen, appQuelltext, element, elemente,
  gesprochen, luecken };
