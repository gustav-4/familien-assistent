/*
 * Familien-Assistent – KI-Worker (lokale Inferenz)
 * ------------------------------------------------
 * Fuehrt das Sprachmodell in einem eigenen Thread aus. Dadurch bleiben
 * Oberflaeche, Spracherkennung, Erinnerungen und der Familien-Sync auf
 * dem Hauptthread vollstaendig reaktionsfaehig, waehrend die KI rechnet.
 *
 * Die Bibliothek (WebLLM, Apache-2.0) liegt unveraendert und versioniert
 * im eigenen Repository (/vendor) – es wird kein fremdes CDN geladen.
 * Netzwerkzugriffe gibt es nur EINMALIG fuer den Download der
 * Modellgewichte; Eingaben der Familie verlassen das Geraet nie.
 */
import { WebWorkerMLCEngineHandler } from "/vendor/web-llm-0.2.87/web-llm.js";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
