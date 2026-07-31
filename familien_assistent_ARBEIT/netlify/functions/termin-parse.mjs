/**
 * Termin-Sprachverstehen (Server-Funktion)
 * -----------------------------------------
 * Bekommt den gesprochenen Satz ("Donnerstag halb drei Zahnarzt
 * fuer Lena, dauert eine Stunde, rot") und uebersetzt ihn per KI
 * in einen strukturierten Termin. Datums-Plausibilitaet wird
 * anschliessend OHNE KI geprueft.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function antwort(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function safeJsonParse(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start === -1 || end === 0) return null;
    return JSON.parse(text.slice(start, end));
  } catch { return null; }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST")
    return antwort(405, { success: false, error: "Nur POST" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return antwort(500, { success: false, error: "Kein API-Schluessel" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return antwort(400, { success: false, error: "Ungueltige Anfrage" });
  }

  const text = String(body.text || "").slice(0, 400);
  const heute = String(body.heute || "").slice(0, 10);
  const wochentag = String(body.wochentag || "").slice(0, 12);
  const mitglieder = Array.isArray(body.mitglieder)
    ? body.mitglieder.slice(0, 12).map((m) => String(m).slice(0, 30)) : [];

  if (text.length < 3)
    return antwort(200, { success: false, error: "Kein Text verstanden" });

  const prompt = `Du wandelst gesprochene Terminangaben einer Familie in
strukturierte Daten um. Heute ist ${wochentag}, der ${heute}.
Bekannte Familienmitglieder: ${mitglieder.join(", ") || "keine angegeben"}.

Gesprochener Satz: "${text}"

Antworte mit NUR diesem JSON (kein Markdown, kein Text drumherum):
{
  "titel": "kurzer Titel, z.B. Zahnarzt",
  "person": "fuer wen (aus den Mitgliedern, sonst woertlich)",
  "verantwortlich": "wer hinbringt/wahrnimmt, falls genannt, sonst leer",
  "datum": "YYYY-MM-DD (relative Angaben wie 'naechsten Dienstag' aufloesen)",
  "zeit": "HH:MM (24h; 'halb drei' nachmittags = 14:30 bei Alltagsterminen)",
  "dauer_min": 60,
  "wegzeit_min": 0,
  "kategorie": "rot|orange|gelb|gruen (nur wenn genannt, sonst 'orange')"
}
Regeln: Fehlende Angaben sinnvoll schaetzen (Dauer 60, Wegzeit 0).
Datum nie in der Vergangenheit - im Zweifel der naechste passende Tag.`;

  try {
    const aiResp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok)
      return antwort(502, { success: false,
        error: "KI-Dienst antwortet nicht (" + aiResp.status + ")" });

    const data = await aiResp.json();
    const t = safeJsonParse(
      (data.content && data.content[0] && data.content[0].text) || "");

    // ---- Pruefschicht ohne KI ----
    if (!t || typeof t.titel !== "string" || !t.titel.trim())
      return antwort(200, { success: false,
        error: "Termin nicht verstanden - bitte nochmal sagen" });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t.datum || "")))
      return antwort(200, { success: false,
        error: "Datum nicht verstanden - bitte mit Tag wiederholen" });
    if (!/^\d{2}:\d{2}$/.test(String(t.zeit || "")))
      return antwort(200, { success: false,
        error: "Uhrzeit nicht verstanden - bitte mit Uhrzeit wiederholen" });

    t.dauer_min = Math.min(Math.max(Math.round(Number(t.dauer_min) || 60), 5), 720);
    t.wegzeit_min = Math.min(Math.max(Math.round(Number(t.wegzeit_min) || 0), 0), 240);
    if (!["rot", "orange", "gelb", "gruen"].includes(t.kategorie))
      t.kategorie = "orange";
    t.titel = String(t.titel).slice(0, 60);
    t.person = String(t.person || "Familie").slice(0, 30);
    t.verantwortlich = String(t.verantwortlich || "").slice(0, 30);

    // Vergangenheits-Check
    const dt = new Date(t.datum + "T" + t.zeit);
    if (isNaN(dt.getTime()))
      return antwort(200, { success: false, error: "Datum unklar" });

    return antwort(200, { success: true, termin: t });

  } catch (e) {
    return antwort(500, { success: false,
      error: "Verstehen fehlgeschlagen: " + String(e).slice(0, 120) });
  }
};
