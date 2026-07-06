/* =====================================================================
   install.js  –  App-Installation für Familien-Assistent
   Android/Chrome: echter Installations-Knopf (beforeinstallprompt)
   iPhone/Safari:  Anleitung "Zum Home-Bildschirm"
   ===================================================================== */
(function () {
  "use strict";
  var deferredInstall = null;

  function laeuftAlsApp() {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  }
  function istIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function baueOberflaeche() {
    if (document.getElementById("kaInstallStyle")) return;
    var style = document.createElement("style");
    style.id = "kaInstallStyle";
    style.textContent =
      "#kaInstallCard{display:none;background:#fffdf8;border-radius:14px;" +
      "padding:18px;margin:16px auto;max-width:560px;text-align:center;" +
      "box-shadow:0 2px 10px rgba(120,100,70,.18);border:2px solid #7e9c6f;" +
      "font-family:system-ui,Arial,sans-serif}" +
      "#kaInstallCard.show{display:block}" +
      "#kaInstallCard h2{margin:0 0 6px;font-size:1.05rem;color:#3e3832}" +
      "#kaInstallCard p{margin:0 0 12px;font-size:.85rem;color:#94897a}" +
      "#kaInstallBtn{border:none;border-radius:10px;padding:14px 20px;" +
      "font-size:1.1rem;font-weight:700;cursor:pointer;background:#7e9c6f;" +
      "color:#fff;width:100%;max-width:320px}" +
      "#kaInstallBtn:active{opacity:.85}" +
      "#kaIosOverlay{display:none;position:fixed;inset:0;z-index:9999;" +
      "background:rgba(0,0,0,.55);align-items:center;justify-content:center;" +
      "padding:20px;font-family:system-ui,Arial,sans-serif}" +
      "#kaIosOverlay.show{display:flex}" +
      "#kaIosBox{background:#fffdf8;border-radius:14px;padding:20px;" +
      "max-width:380px;width:100%;box-shadow:0 6px 24px rgba(0,0,0,.3)}" +
      "#kaIosBox h2{margin:0 0 12px;font-size:1.05rem;color:#3e3832}" +
      "#kaIosBox p{margin:0 0 10px;font-size:.95rem;color:#3e3832;line-height:1.5}" +
      "#kaIosBox .muted{color:#94897a;font-size:.82rem}" +
      "#kaIosClose{border:none;border-radius:10px;padding:12px 18px;" +
      "font-size:1rem;font-weight:700;cursor:pointer;background:#efe6d4;" +
      "color:#3e3832;margin-top:8px;width:100%}";
    document.head.appendChild(style);

    var card = document.createElement("div");
    card.id = "kaInstallCard";
    card.innerHTML =
      '<h2>\uD83D\uDCF2 App aufs Handy holen</h2>' +
      '<p>Installiere den Familien-Assistenten wie eine echte App \u2013 ' +
      'mit Icon auf dem Homescreen, Vollbild und Sprachsteuerung.</p>' +
      '<button id="kaInstallBtn" type="button">' +
      '\uD83D\uDCF2 Jetzt installieren</button>';

    var ios = document.createElement("div");
    ios.id = "kaIosOverlay";
    ios.innerHTML =
      '<div id="kaIosBox">' +
      '<h2>\uD83D\uDCF2 In 2 Schritten installieren</h2>' +
      '<p>1\uFE0F\u20E3 Tippe unten in Safari auf <b>Teilen</b> ' +
      '<span style="font-size:1.3em">\u2B06\uFE0F</span></p>' +
      '<p>2\uFE0F\u20E3 W\u00E4hle <b>\u201EZum Home-Bildschirm\u201C</b> ' +
      '<span style="font-size:1.3em">\u2795</span></p>' +
      '<p class="muted">Danach erscheint das Icon auf deinem Homescreen \u2013 ' +
      'wie jede andere App.</p>' +
      '<button id="kaIosClose" type="button">Verstanden</button></div>';

    document.body.insertBefore(card, document.body.firstChild);
    document.body.appendChild(ios);

    document.getElementById("kaInstallBtn")
      .addEventListener("click", appInstallieren);
    document.getElementById("kaIosClose")
      .addEventListener("click", function () { ios.classList.remove("show"); });
    ios.addEventListener("click", function (e) {
      if (e.target === ios) ios.classList.remove("show");
    });
  }

  function zeigeKarte() {
    var c = document.getElementById("kaInstallCard");
    if (c) c.classList.add("show");
  }
  function versteckeKarte() {
    var c = document.getElementById("kaInstallCard");
    if (c) c.classList.remove("show");
  }

  function appInstallieren() {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(function () {
        deferredInstall = null; versteckeKarte();
      });
    } else if (istIOS()) {
      document.getElementById("kaIosOverlay").classList.add("show");
    } else {
      alert("\u00D6ffne das Browser-Men\u00FC und w\u00E4hle " +
        "\u201EApp installieren\u201C bzw. " +
        "\u201EZum Startbildschirm hinzuf\u00FCgen\u201C.");
    }
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    if (!laeuftAlsApp()) zeigeKarte();
  });
  window.addEventListener("appinstalled", function () { versteckeKarte(); });

  function start() {
    if (laeuftAlsApp()) return;
    baueOberflaeche();
    if (istIOS()) zeigeKarte();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();