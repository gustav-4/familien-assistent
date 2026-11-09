// =====================================================
// REZEPT-DATENBANK (strukturiert, kuratiert)
// Allergene pro Rezept fest hinterlegt -> harter Filter.
// diet     = erfuellte Ernaehrungsformen (vegan impliziert
//            vegetarisch + pescetarisch, siehe DIET_IMPLIES)
// varianten= moegliche Anpassungen, z.B. vegane Variante
// stile    = weiche Stil-Tags fuers Ranking + Recherche
// Basis-Portionen: 2 Erwachsene + 2 Kinder
// =====================================================
const RECIPES = [
  {
    id: "eintopf",
    name: "Möhren-Kartoffel-Eintopf",
    timeMin: 35,
    time: "ca. 35 Min.",
    allergens: ["sellerie"],
    tags: ["glutenfrei", "laktosefrei", "vegetarisch"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["gesund", "nachhaltig", "budget", "pflanzenbetont"],
    ingredients: [
      { name: "Möhren", qty: 500, unit: "g" },
      { name: "Kartoffeln", qty: 600, unit: "g" },
      { name: "Zwiebel", qty: 1, unit: "Stück" },
      { name: "Gemüsebrühe", qty: 1, unit: "Liter" },
      { name: "Rapsöl", qty: 2, unit: "EL" },
      { name: "Petersilie", qty: 1, unit: "Bund" }
    ],
    steps: [
      { text: "Wasche die Möhren und schneide sie in etwa 2 Zentimeter dicke Scheiben." },
      { text: "Schäle die Kartoffeln und schneide sie in mundgerechte Würfel." },
      { text: "Würfle die Zwiebel fein." },
      { text: "Erhitze 2 Esslöffel Rapsöl im großen Topf und dünste die Zwiebel glasig an. Das dauert etwa 2 Minuten.", timer: 120,
        announce: "Die Zwiebeln sollten jetzt glasig sein." },
      { text: "Gib Möhren und Kartoffeln dazu, brate alles kurz mit an und gieße mit 1 Liter Gemüsebrühe auf." },
      { text: "Lass den Eintopf nun zugedeckt 15 Minuten köcheln. Ich sage dir Bescheid – du hast jetzt Zeit für die Kinder.", timer: 900,
        announce: "15 Minuten sind um. Die Möhren sollten jetzt gar sein. Stich mit einer Gabel hinein, um zu prüfen." },
      { text: "Schmecke mit Salz und Pfeffer ab und streue die gehackte Petersilie darüber." },
      { text: "Fertig! Der Eintopf kann serviert werden. Guten Appetit für die ganze Familie!" }
    ]
  },
  {
    id: "ofengemuese",
    name: "Ofengemüse mit Reis",
    timeMin: 40,
    time: "ca. 40 Min.",
    allergens: [],
    tags: ["glutenfrei", "laktosefrei", "vegan"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["gesund", "pflanzenbetont", "cleanlabel"],
    ingredients: [
      { name: "Paprika", qty: 2, unit: "Stück" },
      { name: "Zucchini", qty: 1, unit: "Stück" },
      { name: "Süßkartoffeln", qty: 400, unit: "g" },
      { name: "Reis", qty: 250, unit: "g" },
      { name: "Olivenöl", qty: 3, unit: "EL" },
      { name: "Paprikapulver", qty: 1, unit: "TL" }
    ],
    steps: [
      { text: "Heize den Ofen auf 220 Grad Ober- und Unterhitze vor." },
      { text: "Schneide Paprika, Zucchini und Süßkartoffeln in grobe Stücke." },
      { text: "Vermenge das Gemüse auf einem Backblech mit 3 Esslöffeln Olivenöl, Paprikapulver und etwas Salz." },
      { text: "Schiebe das Blech in den Ofen. Das Gemüse braucht 25 Minuten. Ich melde mich!", timer: 1500,
        announce: "25 Minuten sind um. Das Gemüse sollte jetzt weich sein und leicht gebräunte Ränder haben." },
      { text: "Koche währenddessen den Reis nach Packungsanleitung. Meist sind das 2 Tassen Wasser auf 1 Tasse Reis, etwa 15 Minuten.", timer: 900,
        announce: "Der Reis sollte jetzt gar sein. Das Wasser sollte vollständig aufgesogen sein." },
      { text: "Richte Reis und Ofengemüse zusammen an. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "nudeln",
    name: "Nudeln mit schneller Tomatensoße",
    timeMin: 25,
    time: "ca. 25 Min.",
    allergens: ["gluten"],
    tags: ["vegetarisch", "kinderliebling"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["budget", "mealprep"],
    ingredients: [
      { name: "Nudeln", qty: 400, unit: "g" },
      { name: "Passierte Tomaten", qty: 500, unit: "ml" },
      { name: "Zwiebel", qty: 1, unit: "Stück" },
      { name: "Knoblauchzehe", qty: 1, unit: "Stück" },
      { name: "Olivenöl", qty: 2, unit: "EL" },
      { name: "Oregano", qty: 1, unit: "TL" }
    ],
    steps: [
      { text: "Setze einen großen Topf mit gesalzenem Wasser für die Nudeln auf." },
      { text: "Würfle Zwiebel und Knoblauch fein." },
      { text: "Erhitze Olivenöl in einer Pfanne und dünste Zwiebel und Knoblauch 2 Minuten an.", timer: 120,
        announce: "Zwiebel und Knoblauch sollten jetzt duften und glasig sein." },
      { text: "Gieße die passierten Tomaten dazu, würze mit Oregano, Salz und einer Prise Zucker. Lass die Soße 10 Minuten leise köcheln.", timer: 600,
        announce: "Die Soße ist fertig. Sie sollte leicht eingedickt sein." },
      { text: "Koche die Nudeln nach Packungszeit bissfest. Meist 9 bis 11 Minuten.", timer: 600,
        announce: "Probiere jetzt eine Nudel. Sie sollte bissfest sein." },
      { text: "Gieße die Nudeln ab, vermenge sie mit der Soße. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "couscous",
    name: "Schnelle Couscous-Gemüsepfanne",
    timeMin: 18,
    time: "ca. 18 Min.",
    allergens: ["gluten", "sellerie"],
    tags: ["vegan", "superschnell"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["mealprep", "international"],
    ingredients: [
      { name: "Couscous", qty: 250, unit: "g" },
      { name: "Paprika", qty: 2, unit: "Stück" },
      { name: "Zucchini", qty: 1, unit: "Stück" },
      { name: "Kirschtomaten", qty: 250, unit: "g" },
      { name: "Olivenöl", qty: 2, unit: "EL" },
      { name: "Gemüsebrühe", qty: 0.3, unit: "Liter" }
    ],
    steps: [
      { text: "Koche 300 Milliliter Gemüsebrühe auf, gieße sie über den Couscous und lass ihn zugedeckt 5 Minuten quellen.", timer: 300,
        announce: "Der Couscous sollte jetzt die Brühe aufgesogen haben. Lockere ihn mit einer Gabel auf." },
      { text: "Schneide währenddessen Paprika und Zucchini in kleine Würfel und halbiere die Kirschtomaten." },
      { text: "Erhitze Olivenöl in einer großen Pfanne und brate das Gemüse 6 Minuten bei hoher Hitze an.", timer: 360,
        announce: "Das Gemüse sollte jetzt bissfest sein." },
      { text: "Hebe den Couscous unter das Gemüse, würze mit Salz, Pfeffer und etwas Zitronensaft. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "omelett",
    name: "Gemüse-Omelett",
    timeMin: 15,
    time: "ca. 15 Min.",
    allergens: ["ei"],
    tags: ["glutenfrei", "superschnell", "vegetarisch"],
    diet: ["vegetarisch", "pescetarisch", "lowcarb"],
    varianten: [],
    stile: ["highprotein", "cleanlabel"],
    ingredients: [
      { name: "Eier", qty: 6, unit: "Stück" },
      { name: "Paprika", qty: 1, unit: "Stück" },
      { name: "Frühlingszwiebeln", qty: 2, unit: "Stück" },
      { name: "Milch", qty: 50, unit: "ml" },
      { name: "Butter", qty: 1, unit: "EL" }
    ],
    steps: [
      { text: "Würfle die Paprika klein und schneide die Frühlingszwiebeln in Ringe." },
      { text: "Verquirle die Eier mit der Milch, Salz und Pfeffer." },
      { text: "Erhitze Butter in der Pfanne und brate das Gemüse 2 Minuten an.", timer: 120,
        announce: "Das Gemüse ist angebraten." },
      { text: "Gieße die Eimasse darüber und lass das Omelett bei mittlerer Hitze 5 Minuten stocken.", timer: 300,
        announce: "Das Omelett sollte jetzt gestockt sein. Die Oberfläche darf nicht mehr flüssig glänzen." },
      { text: "Halbiere das Omelett und richte es an. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "tomatensuppe",
    name: "Tomatensuppe mit Brot",
    timeMin: 20,
    time: "ca. 20 Min.",
    allergens: ["gluten", "laktose", "sellerie"],
    tags: ["vegetarisch", "kinderliebling"],
    diet: ["vegetarisch", "pescetarisch"],
    varianten: [{ macht: "vegan", text: "Hafercreme statt Sahne verwenden" }],
    stile: ["budget", "gesund"],
    ingredients: [
      { name: "Passierte Tomaten", qty: 750, unit: "ml" },
      { name: "Zwiebel", qty: 1, unit: "Stück" },
      { name: "Gemüsebrühe", qty: 0.25, unit: "Liter" },
      { name: "Sahne oder Hafercreme", qty: 100, unit: "ml" },
      { name: "Brot", qty: 1, unit: "Stück" },
      { name: "Olivenöl", qty: 2, unit: "EL" }
    ],
    steps: [
      { text: "Würfle die Zwiebel und dünste sie in Olivenöl 2 Minuten glasig.", timer: 120,
        announce: "Die Zwiebeln sind glasig." },
      { text: "Gieße passierte Tomaten und Brühe dazu, würze mit Salz, Pfeffer und einer Prise Zucker. Lass die Suppe 10 Minuten köcheln.", timer: 600,
        announce: "Die Suppe ist fertig gekocht." },
      { text: "Rühre die Sahne ein und schmecke nochmal ab." },
      { text: "Schneide das Brot in Scheiben und serviere es dazu. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "bratkartoffeln",
    name: "Bratkartoffeln mit Kräuterquark",
    timeMin: 20,
    time: "ca. 20 Min. (mit vorgekochten Kartoffeln)",
    allergens: ["laktose"],
    tags: ["glutenfrei", "vegetarisch", "resteverwertung"],
    diet: ["vegetarisch", "pescetarisch"],
    varianten: [{ macht: "vegan", text: "veganen Quark statt Kräuterquark verwenden" }],
    stile: ["budget", "nachhaltig"],
    ingredients: [
      { name: "Vorgekochte Kartoffeln", qty: 800, unit: "g" },
      { name: "Quark", qty: 500, unit: "g" },
      { name: "Schnittlauch", qty: 1, unit: "Bund" },
      { name: "Zwiebel", qty: 1, unit: "Stück" },
      { name: "Rapsöl", qty: 3, unit: "EL" }
    ],
    steps: [
      { text: "Schneide die vorgekochten Kartoffeln in Scheiben und würfle die Zwiebel." },
      { text: "Verrühre den Quark mit geschnittenem Schnittlauch, Salz, Pfeffer und einem Schluck Mineralwasser." },
      { text: "Erhitze das Öl in einer großen Pfanne und brate die Kartoffeln mit der Zwiebel 12 Minuten goldbraun. Zwischendurch wenden!", timer: 720,
        announce: "Die Bratkartoffeln sollten jetzt goldbraun und knusprig sein." },
      { text: "Mit Salz würzen und mit dem Kräuterquark servieren. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "curry",
    name: "Gemüse-Curry mit Kokosmilch und Reis",
    timeMin: 28,
    time: "ca. 28 Min.",
    allergens: [],
    tags: ["vegan", "glutenfrei", "laktosefrei"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["pflanzenbetont", "international", "gesund"],
    ingredients: [
      { name: "Reis", qty: 250, unit: "g" },
      { name: "Kokosmilch", qty: 400, unit: "ml" },
      { name: "Blumenkohl", qty: 1, unit: "Stück" },
      { name: "Möhren", qty: 300, unit: "g" },
      { name: "Currypaste mild (Zutatenliste prüfen!)", qty: 1, unit: "EL" },
      { name: "Rapsöl", qty: 2, unit: "EL" }
    ],
    steps: [
      { text: "Setze den Reis nach Packungsanleitung auf. Meist 2 Tassen Wasser auf 1 Tasse Reis, etwa 15 Minuten." },
      { text: "Teile den Blumenkohl in kleine Röschen und schneide die Möhren in dünne Scheiben." },
      { text: "Erhitze Öl im Topf, röste die Currypaste kurz an und gib das Gemüse dazu." },
      { text: "Gieße die Kokosmilch an und lass das Curry zugedeckt 12 Minuten köcheln.", timer: 720,
        announce: "Das Gemüse sollte jetzt gar, aber noch bissfest sein. Die Möhren prüfst du am besten mit einer Gabel." },
      { text: "Mit Salz abschmecken und mit dem Reis servieren. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "haehnchenpfanne",
    name: "Hähnchen-Gemüse-Pfanne mit Reis",
    timeMin: 30,
    time: "ca. 30 Min.",
    allergens: ["soja"],
    tags: ["glutenfrei", "laktosefrei", "eiweissreich"],
    diet: [],
    varianten: [
      { macht: "vegetarisch", text: "Tofu statt Hähnchen verwenden" },
      { macht: "vegan", text: "Tofu statt Hähnchen und vegane Sojasauce verwenden" }
    ],
    stile: ["highprotein", "mealprep", "international"],
    ingredients: [
      { name: "Hähnchenbrustfilet", qty: 500, unit: "g" },
      { name: "Reis", qty: 250, unit: "g" },
      { name: "Brokkoli", qty: 1, unit: "Stück" },
      { name: "Paprika", qty: 2, unit: "Stück" },
      { name: "Sojasauce glutenfrei", qty: 3, unit: "EL" },
      { name: "Rapsöl", qty: 2, unit: "EL" }
    ],
    steps: [
      { text: "Setze den Reis nach Packungsanleitung auf." },
      { text: "Schneide das Hähnchen in mundgerechte Streifen, den Brokkoli in Röschen und die Paprika in Streifen." },
      { text: "Brate das Hähnchen in heißem Öl 6 Minuten rundherum kräftig an.", timer: 360,
        announce: "Wichtig: Schneide ein dickes Stück auf. Das Fleisch muss innen komplett weiß sein, nicht mehr rosa oder glasig." },
      { text: "Gib das Gemüse dazu und brate alles weitere 8 Minuten.", timer: 480,
        announce: "Das Gemüse sollte bissfest sein." },
      { text: "Mit Sojasauce ablöschen und mit dem Reis servieren. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "auflauf",
    name: "Kartoffel-Brokkoli-Auflauf",
    timeMin: 38,
    time: "ca. 38 Min.",
    allergens: ["laktose"],
    tags: ["glutenfrei", "vegetarisch", "kinderliebling"],
    diet: ["vegetarisch", "pescetarisch"],
    varianten: [{ macht: "vegan", text: "Hafersahne und veganen Käse statt Sahne und Käse verwenden" }],
    stile: ["budget"],
    ingredients: [
      { name: "Kartoffeln", qty: 800, unit: "g" },
      { name: "Brokkoli", qty: 1, unit: "Stück" },
      { name: "Sahne", qty: 200, unit: "ml" },
      { name: "Geriebener Käse", qty: 150, unit: "g" },
      { name: "Muskatnuss", qty: 1, unit: "TL" }
    ],
    steps: [
      { text: "Heize den Ofen auf 200 Grad Ober- und Unterhitze vor." },
      { text: "Schäle die Kartoffeln, schneide sie in dünne Scheiben und koche sie 8 Minuten vor.", timer: 480,
        announce: "Die Kartoffeln sind vorgegart." },
      { text: "Teile den Brokkoli in Röschen und gib ihn die letzten 3 Minuten mit ins Kochwasser." },
      { text: "Schichte Kartoffeln und Brokkoli in eine Auflaufform, würze mit Salz, Pfeffer und Muskat, gieße die Sahne darüber und bestreue alles mit Käse." },
      { text: "Backe den Auflauf 18 Minuten im Ofen.", timer: 1080,
        announce: "Der Käse sollte jetzt goldbraun geschmolzen sein." },
      { text: "Kurz abkühlen lassen und servieren. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "chili",
    name: "Chili sin Carne mit Reis",
    timeMin: 45,
    time: "ca. 45 Min.",
    allergens: [],
    tags: ["vegan", "glutenfrei", "laktosefrei", "vorkochen"],
    diet: ["vegan", "vegetarisch", "pescetarisch"],
    varianten: [],
    stile: ["pflanzenbetont", "highprotein", "budget", "mealprep", "nachhaltig", "international"],
    ingredients: [
      { name: "Kidneybohnen (Dose)", qty: 2, unit: "Stück" },
      { name: "Mais (Dose)", qty: 1, unit: "Stück" },
      { name: "Gehackte Tomaten (Dose)", qty: 2, unit: "Stück" },
      { name: "Zwiebel", qty: 2, unit: "Stück" },
      { name: "Reis", qty: 300, unit: "g" },
      { name: "Paprikapulver", qty: 2, unit: "TL" },
      { name: "Kreuzkümmel", qty: 1, unit: "TL" },
      { name: "Olivenöl", qty: 2, unit: "EL" }
    ],
    steps: [
      { text: "Würfle die Zwiebeln und dünste sie in Olivenöl 3 Minuten an.", timer: 180,
        announce: "Die Zwiebeln sind glasig." },
      { text: "Gib Paprikapulver und Kreuzkümmel dazu und röste die Gewürze eine halbe Minute mit." },
      { text: "Gieße die gehackten Tomaten an, gib abgespülte Bohnen und Mais dazu. Lass das Chili 25 Minuten leise köcheln. Zeit für andere Dinge – ich melde mich!", timer: 1500,
        announce: "Das Chili ist fertig. Es sollte schön sämig eingekocht sein." },
      { text: "Koche währenddessen den Reis nach Packungsanleitung." },
      { text: "Schmecke mit Salz und etwas Zucker ab. Übrigens: Das Chili schmeckt aufgewärmt am nächsten Tag noch besser. Fertig – guten Appetit!" }
    ]
  },
  {
    id: "ofenhaehnchen",
    name: "Ofen-Hähnchenschenkel mit Kartoffeln",
    timeMin: 60,
    time: "ca. 60 Min.",
    allergens: [],
    tags: ["glutenfrei", "laktosefrei", "wochenende"],
    diet: [],
    varianten: [{ macht: "vegetarisch", text: "Ofen-Halloumi oder Kichererbsen statt Hähnchen verwenden" }],
    stile: ["highprotein"],
    ingredients: [
      { name: "Hähnchenschenkel", qty: 4, unit: "Stück" },
      { name: "Kartoffeln", qty: 1000, unit: "g" },
      { name: "Zitrone", qty: 1, unit: "Stück" },
      { name: "Knoblauchzehe", qty: 3, unit: "Stück" },
      { name: "Rosmarin", qty: 1, unit: "Bund" },
      { name: "Olivenöl", qty: 4, unit: "EL" }
    ],
    steps: [
      { text: "Heize den Ofen auf 200 Grad Ober- und Unterhitze vor." },
      { text: "Schneide die Kartoffeln in Spalten und vermenge sie auf einem tiefen Blech mit Olivenöl, Salz und Rosmarin." },
      { text: "Reibe die Hähnchenschenkel mit Salz, Paprikapulver und zerdrücktem Knoblauch ein und lege sie auf die Kartoffeln. Zitronenscheiben darüber verteilen." },
      { text: "Schiebe das Blech in den Ofen. Alles gart jetzt 45 Minuten – du hast frei, ich melde mich!", timer: 2700,
        announce: "45 Minuten sind um. Wichtige Garprobe: Stich an der dicksten Stelle ins Fleisch. Der austretende Saft muss klar sein, nicht rosa. Im Zweifel 10 Minuten verlängern." },
      { text: "Alles zusammen servieren. Fertig – ein richtiges Festessen, guten Appetit!" }
    ]
  }
];

// =====================================================
// ERNAEHRUNGS-LOGIK
// Allergien bleiben IMMER hart und additiv (Sicherheit).
// Ernaehrungsformen sind weicher: per Person im Profil,
// gesteuert ueber den Koch-Modus. vegan impliziert
// vegetarisch + pescetarisch. Varianten verhindern
// leere Listen im Familien-Modus.
// =====================================================
const DIET_LABELS = {
  vegan: "vegan", vegetarisch: "vegetarisch",
  pescetarisch: "pescetarisch", lowcarb: "low carb"
};
// Welche Anforderungen erfuellt ein Rezept-/Varianten-Tag?
const DIET_IMPLIES = {
  vegan: ["vegan", "vegetarisch", "pescetarisch"],
  vegetarisch: ["vegetarisch", "pescetarisch"],
  pescetarisch: ["pescetarisch"],
  lowcarb: ["lowcarb"]
};
// Weiche Stil-Vorlieben (Familienprofil, gespeichert)
const STILE = [
  { id: "pflanzenbetont", label: "🌱 Pflanzenbetont" },
  { id: "highprotein", label: "💪 High Protein" },
  { id: "gesund", label: "🥗 Gesund & ausgewogen" },
  { id: "nachhaltig", label: "♻️ Saisonal/Nachhaltig" },
  { id: "fermentiert", label: "🫙 Fermentiert" },
  { id: "cleanlabel", label: "🧾 Clean Label" },
  { id: "international", label: "🌍 Internationale Aromen" },
  { id: "mealprep", label: "⏱ Meal Prep/Schnell" },
  { id: "budget", label: "💰 Budgetfreundlich" }
];

let kochModus = "familie";      // "familie" oder ein Personenname
let familienStile = [];         // gespeicherte weiche Vorlieben

// Welche Ernaehrungsformen sind im aktuellen Modus gefordert?
// Rueckgabe: { diet: [Personennamen] }
function requiredDiets() {
  if (typeof mitglieder === "undefined") return {};
  const quelle = kochModus === "familie"
    ? mitglieder
    : mitglieder.filter(m => m.name === kochModus);
  const map = {};
  quelle.forEach(m => (m.ernaehrung || []).forEach(d => {
    if (!map[d]) map[d] = [];
    if (!map[d].includes(m.name)) map[d].push(m.name);
  }));
  return map;
}

// Erfuellt ein Rezept eine Ernaehrungs-Anforderung -
// direkt oder ueber eine Variante?
function satisfiesDiet(recipe, diet) {
  const direkt = (recipe.diet || []).some(tag =>
    (DIET_IMPLIES[tag] || [tag]).includes(diet));
  if (direkt) return { ok: true, variante: null };
  const v = (recipe.varianten || []).find(va =>
    (DIET_IMPLIES[va.macht] || [va.macht]).includes(diet));
  if (v) return { ok: true, variante: v.text };
  return { ok: false, variante: null };
}

// Passt ein Rezept zum aktuellen Modus? Liefert Varianten-Hinweise.
function dietPasses(recipe) {
  // KI-Treffer wurden serverseitig bereits nach Ernaehrungsform
  // gefiltert -> hier nicht erneut hart filtern.
  if (String(recipe.id || "").startsWith("ki_"))
    return { ok: true, hinweise: [] };
  const map = requiredDiets();
  const hinweise = [];
  for (const diet in map) {
    const s = satisfiesDiet(recipe, diet);
    if (!s.ok) return { ok: false, hinweise: [] };
    if (s.variante)
      hinweise.push(`${DIET_LABELS[diet]}-Variante für ` +
        `${map[diet].join(", ")}: ${s.variante}`);
  }
  return { ok: true, hinweise };
}

// Wie gut passt ein Rezept zu den weichen Stil-Vorlieben? (Anzahl Treffer)
function styleScore(recipe) {
  if (!familienStile.length) return 0;
  const s = recipe.stile || [];
  return familienStile.filter(x => s.includes(x)).length;
}

// =====================================================
// ZUSTAND
// =====================================================
let selectedRecipe = null;
let stepIndex = 0;
let timerInterval = null;
// Restzeit des laufenden Garvorgangs (0 = kein Timer). Steuert, wie
// aggressiv das Mikrofon im Kochmodus horcht: Wer auf den Ofen wartet,
// sagt kein "fertig" - dort darf die Erkennung pausieren und damit den
// Systemton sparen. Sobald es wieder um Handarbeit geht, hoert die App
// dauerhaft zu.
let timerRest = 0;
let reminderTimeout = null;
let recognition = null;
let listening = false;
// Erinnerungs-Abstaende (Feedback 23.07.: "kommt so oft ... nervt"):
// progressiv statt starr - je laenger ohne Reaktion, desto seltener.
const REMINDER_STUFEN = [90, 150, 240];
let reminderStufe = 0;

// =====================================================
// SPRACHAUSGABE (Text-to-Speech, im Browser eingebaut)
// =====================================================
let ttsActive = false;
let ttsCooldownUntil = 0;
let micMuted = false;
// ECHO-FENSTER: Was die App GERADE sagt bzw. eben gesagt hat. Nur
// dagegen wird abgeglichen - nicht gegen die komplette Ansage. Sonst
// wuerde z.B. waehrend des Hilfetexts (der alle Befehle aufzaehlt)
// jeder echte Befehl des Nutzers faelschlich als Echo verworfen.
let ttsEchoAktuell = "";
let ttsEchoVorher = "";
// Wird nach dem Ende einer Ansage aufgerufen (Kette, Bereit-Ton).
let ttsDanach = null;

// ---------- Bildschirm wachhalten (Feedback 23.07.) ----------
// Beim Kochen darf das Handy nicht in den Ruhezustand fallen -
// mit Teigfingern entsperren ist der Tod des Kochmodus.
// KUECHEN-DISPLAY-SPERRE: Mehrere Bereiche brauchen den wachen
// Bildschirm (Kochen, Lausch-Modus). Jeder meldet seinen GRUND an;
// die Sperre faellt erst, wenn KEIN Grund mehr besteht. Vorher gab
// das Ende des einen Bereichs die Sperre des anderen mit frei.
// Wichtig fuers Mikrofon: Mobile Systeme beenden die Web-Spracherkennung,
// sobald das Display abdunkelt - wacher Bildschirm = offenes Mikrofon.
let wakeLockHandle = null;
let wakeLockAnfrageLaeuft = false;
const wakeLockGruende = new Set();
async function wakeLockAnfordern() {
  if (!wakeLockGruende.size || wakeLockHandle || wakeLockAnfrageLaeuft) return;
  if (!navigator.wakeLock || document.hidden) return;
  wakeLockAnfrageLaeuft = true;
  try {
    const h = await navigator.wakeLock.request("screen");
    // Waehrend der Anfrage beendet? Dann sofort wieder freigeben.
    if (!wakeLockGruende.size) { try { h.release(); } catch (e) {} return; }
    wakeLockHandle = h;
    h.addEventListener("release", () => {
      if (wakeLockHandle === h) wakeLockHandle = null;
      // Vom SYSTEM freigegeben (z. B. Energiesparen), obwohl noch
      // gekocht wird und die App sichtbar ist: sofort neu anfordern.
      if (wakeLockGruende.size && !document.hidden)
        setTimeout(wakeLockAnfordern, 500);
    });
  } catch (e) { wakeLockHandle = null; /* Gerät kann es nicht: egal */ }
  finally { wakeLockAnfrageLaeuft = false; }
}
function wakeLockAn(grund) {
  wakeLockGruende.add(grund || "koch");
  return wakeLockAnfordern();
}
function wakeLockAus(grund) {
  wakeLockGruende.delete(grund || "koch");
  if (wakeLockGruende.size) return;
  const h = wakeLockHandle;
  wakeLockHandle = null;
  try { if (h) h.release(); } catch (e) {}
}
function wakeLockAktiv() { return Boolean(wakeLockHandle); }

// Koch-Modul-Status: "aktiv", solange ein Rezept laeuft.
let kochAktiv = false;
function kochSitzungStart() {
  kochAktiv = true;
  wakeLockAn("koch");
}
function kochSitzungEnde() {
  kochAktiv = false;
  wakeLockAus("koch");
}
// Nach Tab-Wechsel/Displaysperre gibt das System die Sperre frei -
// beim Zurueckkehren erneut anfordern, solange ein Grund besteht.
// Im aktiven Kochmodus wird ausserdem das Mikrofon sofort wieder
// geoeffnet (auch wenn es vorher in der Ruhepause war).
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  wakeLockAnfordern();
  if (kochAktiv && cookingVisible() && typeof GlobalVoice !== "undefined"
      && !GlobalVoice.aktiv && !micMuted) {
    try { gvStart(); } catch (e) {}
  }
});


function cookingVisible() {
  return !document.getElementById("tab-kochen").classList.contains("hidden");
}

// ---------- Signaltoene (App-eigen, kurz, unaufdringlich) ----------
// Der Android-SYSTEMTON bei jedem Erkennungs-Neustart laesst sich aus
// einer Web-App heraus NICHT abschalten. Deshalb zwei Massnahmen:
// (1) Neustarts so weit wie moeglich vermeiden, (2) EIGENE, eindeutig
// unterscheidbare Toene geben, damit der Nutzer den Zustand ohne den
// Systemton erkennt: aufsteigend = Mikro an, absteigend = Mikro
// schlaeft, kurzer heller Ton = "sprich jetzt".
let audioCtx = null;
function tonKontext() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}

// toene = [[Frequenz in Hz, Dauer in ms], ...] - nacheinander gespielt
function tonSpielen(toene, lautstaerke) {
  const ctx = tonKontext();
  if (!ctx) return;
  try {
    let t = ctx.currentTime + 0.01;
    const vol = typeof lautstaerke === "number" ? lautstaerke : 0.09;
    for (const paar of toene) {
      const dauer = paar[1] / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = paar[0];
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dauer + 0.02);
      t += dauer + 0.03;
    }
  } catch (e) {}
}

function tonAktiv() { tonSpielen([[660, 90], [880, 110]]); }
function tonSchlaf() { tonSpielen([[660, 120], [440, 190]]); }
function tonBereit() { tonSpielen([[990, 70]], 0.07); }

function muteMic() {
  // FUSION17: Die Erkennung wird NICHT mehr abgewürgt. Jeder Neustart
  // erzeugt auf Android den System-Bereitton - bei einer Ansage pro
  // Kochschritt war das Dauerpiepen. Der Schutz gegen "App hört sich
  // selbst" liegt ohnehin als Softwaresperre in recognition.onresult
  // (ttsActive + ttsCooldownUntil), das Stoppen war reine Doppelung.
  micMuted = true;
}

function unmuteMic() {
  micMuted = false;
  // Direkt nach der Ansage ist der Nutzer am Zug: sofort wieder
  // aufnahmebereit, ohne Wartestufe.
  gvBackoffZuruecksetzen();
  gvNeustart();
}

// BUGFIX: Chrome bricht lange Ansagen nach ~15 Sekunden stumm ab
// (bekannter speechSynthesis-Fehler). Deshalb wird der Text jetzt
// in kurze Saetze/Stuecke zerlegt und als Kette gesprochen - jedes
// Stueck bleibt unter der kritischen Laenge.
// ---------- TTS-Säuberung ----------
// Die Vorlese-Stimme soll SPRECHEN, nicht beschreiben: Icons/Emojis
// fliegen raus (sonst sagt sie "Bratpfanne und Spiegelei"), und
// eingeklammerte Einschübe werden zu natürlichen Komma-Einschüben
// (sonst verfaellt die Stimme in seltsame Klammer-Betonung).
// Die SICHTBARE Sprechblase zeigt weiterhin den Originaltext.
function ttsSaeubern(text) {
  let t = String(text);
  // (Einschub) -> , Einschub,
  // RT1-03: verschachtelte Klammern - wiederholen, bis nichts bleibt
  for (let runde = 0; runde < 5; runde++) {
    const vorher = t;
    t = t.replace(/\s*\(([^()]{0,120})\)/g, ", $1,");
    if (t === vorher) break;
  }
  t = t.replace(/[()]/g, " "); // Reste einzelner Klammern
  // Emojis, Piktogramme, Dingbats, Pfeile, Varianten-Selektoren
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2300}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2049}\u{203C}]/gu, " ");
  // Zier-/Steuerzeichen, die Stimmen vorlesen oder verschlucken
  t = t.replace(/[«»‹›„“”·•▪◦✓✔✗♀♂👍]/g, " ");
  // Satzzeichen-Hygiene nach den Ersetzungen
  t = t.replace(/\s+,/g, ",").replace(/,{2,}/g, ",");
  t = t.replace(/,\s*([.!?])/g, "$1");
  t = t.replace(/\s{2,}/g, " ").trim();
  t = t.replace(/^,\s*/, "").replace(/,\s*$/, ".");
  return t;
}


function speakChunks(text) {
  const stuecke = [];
  const saetze = String(text).match(/[^.!?…]+[.!?…]*\s*/g) || [String(text)];
  for (let s of saetze) {
    s = s.trim();
    while (s.length > 180) {                 // Notfalls an Kommas teilen
      let cut = s.lastIndexOf(",", 180);
      if (cut < 60) cut = s.lastIndexOf(" ", 180);
      if (cut < 60) cut = 180;
      stuecke.push(s.slice(0, cut + 1).trim());
      s = s.slice(cut + 1).trim();
    }
    if (s) stuecke.push(s);
  }
  return stuecke;
}
// Sichtbare Sprechblase: zeigt jede Ansage auch als Text an.
// Ueberlebenswichtig, wenn der Browser die Sprachausgabe (noch)
// blockiert - die App bleibt dann trotzdem voll bedienbar.
function gvSprechblase(text) {
  try {
    let b = document.getElementById("gvSage");
    if (!b) {
      b = document.createElement("div");
      b.id = "gvSage";
      document.body.appendChild(b);
    }
    b.textContent = "💬 " + text;
    b.classList.add("sichtbar");
    // BUGFIX: Frueher blendete sich die Blase nach einer GESCHAETZTEN
    // Zeit aus (4 s + 60 ms je Zeichen, gedeckelt bei 15 s). Eine
    // Rezeptvorstellung mit voller Zutatenliste dauert vorgelesen aber
    // 30-45 s - die Zutaten verschwanden mitten im Satz. Jetzt haengt
    // die Blase an der ECHTEN Sprachausgabe (gvSprechblaseAus() wird
    // vom Ende der Ansage aufgerufen). Der Timer hier ist nur noch
    // Rueckfallebene, falls der Browser die Stimme blockiert - sonst
    // bliebe die Blase ewig stehen.
    clearTimeout(gvSprechblase._t);
    gvSprechblase._t = setTimeout(() => {
      if (!window.speechSynthesis.speaking
          && !window.speechSynthesis.pending) {
        b.classList.remove("sichtbar");
        ttsActive = false;
        unmuteMic();
      }
    }, Math.max(6000, text.length * 90) + 2000);
  } catch (e) { unmuteMic(); }
}

// Blase ausblenden - wird vom Ende der Ansage angestossen.
function gvSprechblaseAus() {
  try {
    clearTimeout(gvSprechblase._t);
    const b = document.getElementById("gvSage");
    if (b) b.classList.remove("sichtbar");
  } catch (e) {}
}

// ---------- Echo-Erkennung (pur & testbar) ----------
// Vergleichsform: Kleinschreibung, nur Buchstaben/Ziffern, ein Leerzeichen.
function gvNorm(s) {
  return String(s || "").toLowerCase()
    .replace(/[^a-zäöüß0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");
}

// Hat das Mikrofon die App SELBST gehoert? Verglichen wird nur gegen
// das gerade bzw. eben gesprochene Stueck (Echo-Fenster), niemals gegen
// die ganze Ansage - sonst wuerde waehrend des Hilfetexts jeder echte
// Befehl des Nutzers als Echo verworfen.
// Einzelne Woerter gelten nur bei voller Uebereinstimmung als Echo:
// sonst wuerde "Milch" verschluckt, nur weil die App eben eine
// Zutatenliste mit Milch vorgelesen hat.
function istEigenesEcho(gehoert, aktuell, vorher) {
  const h = gvNorm(gehoert);
  if (h.length < 3) return false;
  const woerter = h.split(" ");
  for (const quelle of [gvNorm(aktuell), gvNorm(vorher)]) {
    if (!quelle) continue;
    if (woerter.length < 2) {
      if (quelle === h) return true;
      continue;
    }
    if (quelle.includes(h)) return true;
    const lang = woerter.filter((w) => w.length > 2);
    if (lang.length >= 2) {
      const treffer = lang.filter((w) => quelle.includes(w)).length;
      if (treffer / lang.length >= 0.75) return true;
    }
  }
  return false;
}

let ttsStartete = false;      // hat der Browser JE eine Ansage gestartet?
let ttsNotausTimer = null;    // Zwangs-Entstummung (Deadlock-Schutz)

// ---------- Vorlese-Stimme (waehlbar, Geraete-Stimmen) ----------
let stimmenCache = [];
function stimmenLaden() {
  try {
    stimmenCache = (window.speechSynthesis.getVoices() || [])
      .filter((v) => String(v.lang).toLowerCase().startsWith("de"));
  } catch (e) { stimmenCache = []; }
  return stimmenCache;
}
if (window.speechSynthesis && window.speechSynthesis.addEventListener) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    stimmenLaden();
    stimmenAuswahlFuellen();
  });
}
// ---------- Klangfarben (Tonhoehe/Tempo-Presets) ----------
const KLANGFARBEN = {
  standard:   { pitch: 1.0,  rate: 0.95,
    name: "Natürlich",       probe: "Hallo! Ich bin die natürliche Klangfarbe." },
  ruhig:      { pitch: 0.85, rate: 0.92,
    name: "Ruhig & tief",    probe: "Hallo! Ich spreche ruhig und gelassen mit euch." },
  freundlich: { pitch: 1.15, rate: 0.97,
    name: "Hell & freundlich", probe: "Hallo! Ich bin die helle, freundliche Klangfarbe!" },
  flott:      { pitch: 1.05, rate: 1.15,
    name: "Flott & munter",  probe: "Hallo! Mit mir geht alles ein bisschen flotter!" },
};
// Schalter "Bereitton weiter reduzieren": laesst die Ruhepause
// auch im Kochmodus greifen (dort mit laengerem Fenster).
const GV_RUHE_KOCH_MS = 60000;
function ruheImKochmodus() {
  try { return localStorage.getItem("ka_ruhe_koch") === "1"; }
  catch (e) { return false; }
}
function ruheKochGewaehlt() {
  const box = document.getElementById("ruheKochWahl");
  if (!box) return;
  try {
    localStorage.setItem("ka_ruhe_koch", box.checked ? "1" : "0");
  } catch (e) {}
  speak(box.checked
    ? "Alles klar. Beim Kochen pausiert das Mikrofon jetzt nach einer " +
      "Minute Stille. Tipp auf den Mikrofon-Knopf weckt es wieder."
    : "Gut. Das Mikrofon bleibt beim Kochen durchgehend wach.", true);
}
function ruheKochFuellen() {
  const box = document.getElementById("ruheKochWahl");
  if (box) box.checked = ruheImKochmodus();
}


function klangAktuell() {
  let k = "standard";
  try { k = localStorage.getItem("ka_klang") || "standard"; } catch (e) {}
  return KLANGFARBEN[k] || KLANGFARBEN.standard;
}
function klangGewaehlt() {
  const sel = document.getElementById("klangWahl");
  if (!sel) return;
  try { localStorage.setItem("ka_klang", sel.value); } catch (e) {}
  const k = KLANGFARBEN[sel.value] || KLANGFARBEN.standard;
  speak(k.probe + " So lese ich eure Rezepte vor.", true);
}
function klangAuswahlFuellen() {
  const sel = document.getElementById("klangWahl");
  if (!sel) return;
  let akt = "standard";
  try { akt = localStorage.getItem("ka_klang") || "standard"; } catch (e) {}
  sel.innerHTML = "";
  Object.keys(KLANGFARBEN).forEach((key) => {
    const o = document.createElement("option");
    o.value = key;
    o.textContent = KLANGFARBEN[key].name;
    if (key === akt) o.selected = true;
    sel.appendChild(o);
  });
}


function stimmeAktuelle() {
  let uri = "";
  try { uri = localStorage.getItem("ka_stimme") || ""; } catch (e) {}
  if (!uri) return null;
  if (!stimmenCache.length) stimmenLaden();
  return stimmenCache.find((v) => v.voiceURI === uri) || null;
}
function stimmenAuswahlFuellen() {
  const sel = document.getElementById("stimmeWahl");
  if (!sel) return;
  const stimmen = stimmenLaden();
  let uri = "";
  try { uri = localStorage.getItem("ka_stimme") || ""; } catch (e) {}
  sel.innerHTML = "";
  const std = document.createElement("option");
  std.value = "";
  std.textContent = "Standard-Stimme des Geräts";
  sel.appendChild(std);
  stimmen.forEach((v) => {
    const o = document.createElement("option");
    o.value = v.voiceURI;
    o.textContent = v.name + " (" + v.lang + ")";
    if (v.voiceURI === uri) o.selected = true;
    sel.appendChild(o);
  });
}
function stimmeGewaehlt() {
  const sel = document.getElementById("stimmeWahl");
  if (!sel) return;
  try { localStorage.setItem("ka_stimme", sel.value); } catch (e) {}
  stimmeProbe();
}
function stimmeProbe() {
  speak("Hallo! So klinge ich beim Vorlesen eurer Rezepte. " +
    "Guten Appetit!", true);
}


function speak(text, interrupt, danach) {
  try {
    gvSprechblase(text); // Sprechblase zeigt ORIGINAL
    text = ttsSaeubern(text); // gesprochen wird die Saubere Fassung
    muteMic();
    // Die eigene Redezeit ist KEINE Stille: Zaehler sofort UND am Ende
    // zuruecksetzen. Nur am Ende reichte nicht - bricht die Ansage ab
    // oder bleibt sie haengen, schliefe das Mikro trotzdem ein.
    gvLetztesErgebnis = Date.now();
    ttsDanach = typeof danach === "function" ? danach : null;
    gvChipAnsage(); // ehrlich anzeigen: die App redet gerade
    if (interrupt) window.speechSynthesis.cancel();

    // DEADLOCK-SCHUTZ: Egal was mit der Ansage passiert - nach
    // spaetestens 12 Sekunden geht das Mikrofon zwingend wieder an.
    // (Vorher konnte eine vom Browser blockierte Ansage das Mikro
    // dauerhaft stumm lassen: onend kam nie -> unmute kam nie.)
    clearTimeout(ttsNotausTimer);
    // BUGFIX v9: Der Schutz wuergte lange Ansagen (Kochschritt +
    // Mengen > 12 s) mitten im Satz ab - deshalb fehlten auch die
    // Mengen am Ende. Neu: Solange AKTIV gesprochen wird, wacht er
    // nur weiter. Eingreifen darf er nur, wenn nichts spielt und
    // das Mikro trotzdem stumm haengt (blockierte Ansage).
    ttsNotausTimer = setTimeout(function notaus() {
      if (window.speechSynthesis.speaking || ttsActive) {
        ttsNotausTimer = setTimeout(notaus, 4000);
        return;
      }
      if (micMuted) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        unmuteMic();
      }
    }, 12000);

    const finish = () => {
      if (window.speechSynthesis.speaking
          || window.speechSynthesis.pending) return;
      ttsActive = false;
      // 1,5 s statt 0,8 s: Android liefert erkannten Text spuerbar
      // verzoegert - in der alten Luecke landete die eigene Ansage
      // als Einkaufsartikel auf der Liste.
      ttsCooldownUntil = Date.now() + 1500;
      gvSprechblaseAus();
      // WICHTIG: Die eigene Redezeit zaehlt NICHT als Stille. Sonst
      // schlaeft das Mikrofon waehrend einer langen Ansage ein.
      gvLetztesErgebnis = Date.now();
      const nach = ttsDanach;
      ttsDanach = null;
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) unmuteMic();
        gvChipStand();
        if (nach) { try { nach(); } catch (e) {} }
      }, 800);
    };

    let gestartet = false;
    for (const stueck of speakChunks(text)) {
      const u = new SpeechSynthesisUtterance(stueck);
      const sv = stimmeAktuelle();
      if (sv) u.voice = sv;
      const kf = klangAktuell();
      u.pitch = kf.pitch;
      u.rate = kf.rate;
      u.lang = "de-DE";
      // Lesetempo kommt aus der Klangfarbe (Basis frueher: 0.95)
      u.onstart = () => { gestartet = true; ttsStartete = true;
        ttsActive = true;
        // Echo-Fenster mitfuehren: nur das laufende und das eben
        // gesprochene Stueck gelten als "das war ich selbst".
        ttsEchoVorher = ttsEchoAktuell;
        ttsEchoAktuell = stueck; };
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
    }

    // TTS-WAECHTER: Startet binnen 2,5 s keine Ansage, blockiert
    // der Browser die Sprachausgabe (Android: erst nach der ersten
    // Beruehrung erlaubt). Dann: Warteschlange leeren und das
    // Mikrofon SOFORT wieder freigeben - die Sprechblase hat den
    // Text ja bereits angezeigt.
    setTimeout(() => {
      if (!gestartet && !window.speechSynthesis.speaking) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
        ttsActive = false;
        ttsCooldownUntil = 0;
        gvLetztesErgebnis = Date.now();
        unmuteMic();
        gvChipStand();
        const nach = ttsDanach;
        ttsDanach = null;
        if (nach) { try { nach(); } catch (e) {} }
      }
    }, 2500);
  } catch (e) {
    try { unmuteMic(); gvChipStand(); } catch (e2) {}
    const nach = ttsDanach;
    ttsDanach = null;
    if (nach) { try { nach(); } catch (e2) {} }
  }
}

// Sprachausgabe beim ersten Fingertipp freischalten (Browser-
// Autoplay-Regel): eine stumme Mini-Ansage "entsperrt" die Stimme.
document.addEventListener("click", function ttsUnlock() {
  try { tonKontext(); } catch (e) {} // Signaltoene ebenfalls freischalten
  try {
    if (!ttsStartete) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
  document.removeEventListener("click", ttsUnlock);
}, { once: true });

// =====================================================
// GLOBALE SPRACHSTEUERUNG (eine Instanz fuer die GANZE App)
// -----------------------------------------------------
// BUGFIX-Architektur: Vorher gab es VIER getrennte
// Erkennungs-Instanzen (Kochen, Termin, Einkauf, Feedback).
// Der Browser erlaubt aber nur EINE aktive Instanz - die
// Kochmodul-Instanz startete sich endlos neu und schoss die
// anderen ab (daher "geht nicht in jedem Modul"). Jetzt gibt
// es genau EINEN Controller: Er hoert dauerhaft zu, leitet
// Gesagtes an das aktive Modul bzw. globale Kommandos weiter
// und kann fuer Rueckfrage-Dialoge "reserviert" werden.
// Auto-Start: Ist die Mikrofon-Berechtigung schon erteilt,
// startet das Zuhoeren direkt beim App-Aufruf - App oeffnen
// und lossprechen.
// =====================================================
// Versionsstempel: bei JEDEM Release hochzaehlen (Anzeige im
// Footer + Sprachbefehl "Version" beantworten "Welche Version
// laeuft?" kuenftig in 2 Sekunden statt per Detektivarbeit).
const APP_VERSION = "FUSION50";

const GlobalVoice = { aktiv: false, dialog: null, gestartet: false };
// Ruhepause gegen den Android-Aktivierungston: Der Ton kommt vom
// SYSTEM bei jedem Erkennungs-Neustart und laesst sich per Web-App
// nicht abschalten. Wir reduzieren die Neustarts: Nach laengerer
// Stille pausiert das Zuhoeren automatisch (Chip antippen oder
// irgendwo tippen startet es wieder).
let GV_RUHE_MS = 20000; // v10: 20 s statt 90 s (Ton-Reduktion)
let gvLetztesErgebnis = Date.now();
// KERNURSACHE des Dauergepiepes (gemessen: 40 Neustarts/Minute).
// Android beendet die Erkennung nach ~1,5 s Stille - auch bei
// continuous=true. Jeder Neustart erzeugt den SYSTEMTON, den keine
// Web-App abschalten kann. Einzige wirksame Stellschraube: seltener
// neu starten, wenn nichts gesagt wird.
// Nach jedem ergebnislosen Ende waechst die Wartezeit; jedes erkannte
// Wort und jedes Ansage-Ende setzen sie sofort auf null zurueck.
const GV_BACKOFF_MS = [300, 1200, 3000, 6000, 12000, 20000];
let gvBackoffStufe = 0;
function gvBackoffZuruecksetzen() { gvBackoffStufe = 0; }

function gvChip(text, klasse) {
  const c = document.getElementById("gvChip");
  if (!c) return;
  c.textContent = text;
  // F-011: Ein Zustand, eine Anzeige. Im Kochmodus wandert der Text in
  // die Statuszeile des Kochbereichs; der schwebende Chip verschwindet,
  // damit er weder doppelt informiert noch Knoepfe verdeckt.
  let imKochen = false;
  try { imKochen = cookingVisible(); } catch (e) {}
  c.className = (klasse || "") + (imKochen ? " verborgen" : "");
  if (imKochen) gvKochStatus(text, klasse === "an" || klasse === "eingabe");
}

// BUGFIX: Der Chip zeigte waehrend einer Ansage weiter gruen "ich
// hoere" - obwohl jedes erkannte Wort verworfen wurde. Wer in dieser
// Zeit sprach, wurde kommentarlos ignoriert. Der Chip kennt jetzt drei
// ehrliche Zustaende: aus / ich rede / ich hoere.
function gvChipAnsage() {
  gvChip("🔊 Ich rede – du kannst mich unterbrechen", "redet");
}

// Chip auf den TATSAECHLICHEN Zustand zuruecksetzen.
function gvChipStand() {
  // Ein offener Eingabe-Modus hat Vorrang: Der Chip darf waehrend einer
  // Rueckfrage NICHT zwischen "hoere", "gleich wieder da" und
  // "Ruhepause" flackern - genau das machte unklar, wann man sprechen
  // darf.
  if (GlobalVoice.dialog && GlobalVoice.dialog.frage) {
    gvChip("🎙️ " + GlobalVoice.dialog.frage, "eingabe");
    return;
  }
  if (!GlobalVoice.aktiv) { gvChip("🎤 aus – tippen zum Einschalten", "aus"); return; }
  if (listening) gvChip("🎤 an – ich höre", "an");
  else gvChip("🎤 gleich wieder da …", "");
}

function gvKochStatus(text, listening) {
  const s = document.getElementById("micStatus");
  if (!s) return;
  s.textContent = text;
  s.className = listening ? "listening" : "";
}

function gvNeustart() {
  // micMuted blockiert hier bewusst NICHT mehr: waehrend einer Ansage
  // muss weiter zugehoert werden, damit der Nutzer unterbrechen kann.
  // Gegen die eigene Stimme schuetzt der Echo-Abgleich in onresult.
  if (!recognition || !GlobalVoice.aktiv) return;
  try { recognition.start(); } catch (e) {}
}

/* =====================================================================
   FUSION38 - LAUSCH-MODUS ("Termin" durch die Wohnung rufen)
   ---------------------------------------------------------------------
   Problemlage: Dauerlauschen ueber die Web-Speech-API erzeugt bei jedem
   internen Neustart den Android-Systemton (nicht abschaltbar, F2).
   Loesung: Ein WASM-Schluesselwort-Erkenner lauscht STILL ueber rohes
   Mikrofon-Audio (getUserMedia loest keinen Systemton aus). Erst beim
   erkannten Zuruf wird die Web-Speech-Erkennung EINMAL gestartet -
   dieser eine Ton ist dann der gewuenschte Bereitton, danach laeuft
   der normale Termindialog.

   Der eigentliche Erkenner steckt austauschbar in wakeword-adapter.js
   (Vertrag: window.KA_WAKEWORD = { start(onTreffer), stop() }).
   Diese Zustandsmaschine ist bewusst davon getrennt und ohne Netz
   testbar. Zustaende: aus -> lauscht -> pausiert (Diktat laeuft)
   -> lauscht. Tests: Szenarien L-01 bis L-06.
   ===================================================================== */
const LAUSCH = { status: "aus", intervall: null };

function lauschAdapter() {
  return (typeof window !== "undefined" && window.KA_WAKEWORD) || null;
}
function lauschAnzeige(text) {
  const s = document.getElementById("lauschStatus");
  if (s) s.textContent = text;
  const b = document.getElementById("lauschToggleBtn");
  if (b) b.textContent = LAUSCH.status === "aus"
    ? "📣 Lausch-Modus: aus" : "📣 Lausch-Modus: an";
}
function lauschStart() {
  if (LAUSCH.status !== "aus") return true;
  const a = lauschAdapter();
  if (!a || typeof a.start !== "function" || typeof a.stop !== "function") {
    lauschAnzeige("Kein Schluesselwort-Erkenner eingebunden. Bitte " +
      "wakeword-adapter.js einrichten (Anleitung steht in der Datei).");
    return false;
  }
  try { a.start(lauschTreffer); } catch (e) {
    lauschAnzeige("Der Erkenner in wakeword-adapter.js liess sich " +
      "nicht starten: " + (e && e.message));
    return false;
  }
  LAUSCH.status = "lauscht";
  wakeLockAn("lausch"); // Web-Grenze: nur bei wachem Bildschirm hoert das Mikro
  lauschAnzeige("Ich lausche still auf \u201eTermin\u201c - der " +
    "Bildschirm bleibt dafuer an. Beim Zuruf ertoent der Bereitton, " +
    "dann einfach den Termin sprechen.");
  return true;
}
function lauschStopp() {
  const a = lauschAdapter();
  if (a && typeof a.stop === "function") { try { a.stop(); } catch (e) {} }
  if (LAUSCH.intervall) { clearInterval(LAUSCH.intervall); LAUSCH.intervall = null; }
  const war = LAUSCH.status;
  LAUSCH.status = "aus";
  if (war !== "aus") wakeLockAus("lausch");
  lauschAnzeige("Lausch-Modus beendet.");
}
function lauschUmschalten() {
  if (LAUSCH.status === "aus") lauschStart(); else lauschStopp();
}
function lauschTreffer(wort) {
  if (LAUSCH.status !== "lauscht") return;
  if (!/termin/i.test(String(wort || ""))) return;
  const a = lauschAdapter();
  if (a && typeof a.stop === "function") { try { a.stop(); } catch (e) {} }
  LAUSCH.status = "pausiert";
  lauschAnzeige("Zuruf erkannt - ich hoere: sprich jetzt den Termin.");
  // Der EINE Systemton von recognition.start() ist hier der Bereitton.
  goTab("termine");
  gvStart();
  startTerminDialog(null);
  if (!LAUSCH.intervall) {
    LAUSCH.intervall = setInterval(lauschFortsetzen, 1500);
  }
}
function lauschFortsetzen() {
  if (LAUSCH.status !== "pausiert") return;
  if (GlobalVoice.aktiv) return; // Diktat laeuft noch
  const a = lauschAdapter();
  if (!a || typeof a.start !== "function") { lauschStopp(); return; }
  try { a.start(lauschTreffer); } catch (e) { lauschStopp(); return; }
  LAUSCH.status = "lauscht";
  if (LAUSCH.intervall) { clearInterval(LAUSCH.intervall); LAUSCH.intervall = null; }
  lauschAnzeige("Ich lausche wieder still auf \u201eTermin\u201c.");
}
function lauschSichtbarkeit(versteckt) {
  if (LAUSCH.status === "aus") return;
  const a = lauschAdapter();
  if (versteckt) {
    if (a && typeof a.stop === "function") { try { a.stop(); } catch (e) {} }
  } else if (LAUSCH.status === "lauscht" && a &&
      typeof a.start === "function") {
    try { a.start(lauschTreffer); } catch (e) {}
  }
}
document.addEventListener("visibilitychange",
  () => lauschSichtbarkeit(document.hidden));

function gvStart() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    gvChip("🎤 nicht unterstützt", "aus");
    gvKochStatus("Mikrofon: vom Browser nicht unterstützt – nutze den grünen Knopf.", false);
    return;
  }
  if (!recognition) {
    recognition = new SR();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (ev) => {
      gvLetztesErgebnis = Date.now(); // Aktivitaet: Ruhepause-Zaehler zuruecksetzen
      gvBackoffZuruecksetzen();       // es wird gesprochen -> wieder flott
      const said = ev.results[ev.results.length - 1][0].transcript.trim();
      if (!said) return;
      // 1) Hat die App sich selbst gehoert? -> verwerfen.
      if (istEigenesEcho(said, ttsEchoAktuell, ttsEchoVorher)) return;
      // 2) Waehrend einer Ansage: frueher wurde ALLES verworfen - wer
      //    dazwischenredete, wurde stumm ignoriert (haeufigste Ursache
      //    dafuer, dass "Auf die Einkaufsliste" nicht ankam). Jetzt
      //    duerfen echte Befehle und Antworten die Ansage abbrechen.
      if (ttsActive || Date.now() < ttsCooldownUntil) {
        if (!gvDarfUnterbrechen(said)) return;
        try { window.speechSynthesis.cancel(); } catch (e) {}
        ttsActive = false;
        ttsCooldownUntil = 0;
        ttsDanach = null;
        gvSprechblaseAus();
        gvChipStand();
      }
      gvRoute(said);
    };
    recognition.onstart = () => {
      listening = true;
      GlobalVoice.gestartet = true;
      // Waehrend einer Ansage bleibt der ehrliche "Ich rede"-Zustand
      // stehen - sonst wuerde der Chip wieder gruen luegen.
      if (!ttsActive) gvChip("🎤 an – ich höre", "an");
      if (cookingVisible()) {
        gvKochStatus("🎤 Ich höre zu – sag „fertig“, wenn du soweit bist", true);
      }
    };
    recognition.onerror = (e) => {
      if (e.error === "aborted") return; // bewusstes Stummschalten
      listening = false;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        GlobalVoice.aktiv = false;
        gvChip("🎤 aus – Berechtigung fehlt", "aus");
        gvKochStatus("Mikrofon nicht erlaubt – nutze den grünen Knopf.", false);
      } else if (e.error === "audio-capture") {
        GlobalVoice.aktiv = false;
        gvChip("🎤 kein Mikrofon", "aus");
        gvKochStatus("Kein Mikrofon gefunden – Bedienung über die Knöpfe.", false);
      }
      // "no-speech" u.ae.: onend startet automatisch neu
    };
    recognition.onend = () => {
      listening = false;
      // Automatische Ruhepause: lange nichts gehoert und kein
      // Dialog offen -> nicht neu starten (= kein Systemton mehr)
      // Ruhepause NICHT im Kochmodus (Feedback 23.07.: "muss weiter
      // aktiv bleiben") - beim Kochen sind die Hände belegt.
      const kochAn = cookingVisible();
      const ruheErlaubt = !kochAn || ruheImKochmodus();
      const ruheFenster = kochAn ? GV_RUHE_KOCH_MS : GV_RUHE_MS;
      if (GlobalVoice.aktiv && !GlobalVoice.dialog && ruheErlaubt
          && Date.now() - gvLetztesErgebnis > ruheFenster) {
        GlobalVoice.aktiv = false;
        gvChip("🎤 Ruhepause – tippen zum Weiterhören", "aus");
        tonSchlaf(); // deutlicher, absteigender Hinweiston
        return;
      }
      if (!GlobalVoice.aktiv) {
        gvChip("🎤 aus – tippen zum Einschalten", "aus");
        return;
      }
      // Waehrend einer Ansage NICHT neu starten: das erzeugte
      // Systemtoene, waehrend ohnehin die App redet. Den Neustart
      // uebernimmt unmuteMic() unmittelbar nach dem letzten Wort -
      // genau dann, wenn der Nutzer antworten will.
      if (micMuted) { gvChipStand(); return; }
      // ZIELSTRUKTUR KOCHMODUS: Das Mikrofon bleibt DAUERHAFT aktiv -
      // mit teigigen Haenden darf kein "fertig" verlorengehen.
      // Einzige Ausnahme: Waehrend eines laufenden Garvorgangs mit mehr
      // als 45 s Restzeit wartet die Familie ohnehin auf den Timer.
      // Dort pausiert die Erkennung und spart den Systemton - kurz vor
      // Ablauf ist sie rechtzeitig wieder da.
      const garpause = kochAn && timerRest > 45;
      let warten;
      // Offener Eingabe-Modus: Die App WARTET auf eine Antwort. Hier
      // darf es keine Pause geben, sonst faellt das erste Wort weg.
      if (GlobalVoice.dialog) {
        warten = 250;
      } else if (kochAn && !garpause) {
        warten = 300;                       // dauerhaft aufnahmebereit
      } else {
        const maxStufe = GV_BACKOFF_MS.length - 1;
        warten = GV_BACKOFF_MS[Math.min(gvBackoffStufe, maxStufe)];
        gvBackoffStufe++;
      }
      setTimeout(gvNeustart, warten);
      gvChipStand();
    };
  }
  // Aktivton NUR beim echten Einschalten - nicht bei den internen
  // Neustarts nach jeder Sprechpause. Das war die Quelle des
  // Dauergepiepes.
  const warAus = !GlobalVoice.aktiv;
  GlobalVoice.aktiv = true;
  gvLetztesErgebnis = Date.now();
  gvBackoffZuruecksetzen();
  if (warAus) tonAktiv();
  try { recognition.start(); } catch (e) {}
}

function gvStopp() {
  GlobalVoice.aktiv = false;
  GlobalVoice.dialog = null;
  einkaufKetteAktiv = false;
  if (recognition) { try { recognition.abort(); } catch (e) {} }
  gvChip("🎤 aus – tippen zum Einschalten", "aus");
}

function gvToggle() { GlobalVoice.aktiv ? gvStopp() : gvStart(); }

// v10: Bildschirm aus / App im Hintergrund -> SOFORT still.
// (Haeufigste Quelle des nervigen Aktivierungstons: Neustarts,
//  waehrend das Handy in der Tasche liegt.)
let gvWarAktivVorHintergrund = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    gvWarAktivVorHintergrund = GlobalVoice.aktiv;
    if (GlobalVoice.aktiv) {
      GlobalVoice.aktiv = false;
      if (recognition) { try { recognition.abort(); } catch (e) {} }
    }
  } else if (gvWarAktivVorHintergrund) {
    gvStart();
  }
});

// Beim App-Start: wenn die Berechtigung schon erteilt ist,
// sofort zuhoeren. Sonst wartet der Controller auf die erste
// Beruehrung irgendwo in der App und versucht es dann einmal
// (Browser verlangen fuer die Berechtigungs-Abfrage eine Geste).
function gvAutoStart() {
  gvChip("🎤 starte …", "");
  const versuch = () => { if (!GlobalVoice.gestartet) gvStart(); };
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "microphone" })
      .then((p) => {
        if (p.state === "granted") gvStart();
        else gvChip("🎤 tippen zum Einschalten", "aus");
      })
      .catch(versuch);
  } else {
    versuch();
  }
}

// ---------- Kommando-Erkennung (pur & testbar) ----------
const GV_TAB_WOERTER = {
  rezepte: "rezepte", rezept: "rezepte", rezepten: "rezepte",
  termine: "termine", terminen: "termine", kalender: "termine",
  einkauf: "einkauf", einkaufsliste: "einkauf", liste: "einkauf",
  kochen: "kochen", küche: "kochen",
  favoriten: "favoriten", lieblingsgerichte: "favoriten",
  familie: "familie", profil: "familie",
  heute: "heute", tagesuebersicht: "heute",
};

// "Weiter/Überspringen" als Universalbefehl - aber NUR, wenn das
// Wort (nahezu) allein gesagt wird. "Wir gehen weiter zum Park"
// waehrend eines Diktats darf nichts ueberspringen.
function istUeberspringen(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:überspringen|ueberspringen|weiter|skip|nächste(?:\s+frage)?|naechste(?:\s+frage)?|nächster(?:\s+schritt)?|naechster(?:\s+schritt)?)$/.test(t);
}

// "Zurueck" als Universalbefehl - wie bei "weiter" nur, wenn das Wort
// (nahezu) allein gesagt wird. "Wir fahren zurueck nach Hamburg"
// waehrend eines Termindiktats darf keinen Schritt zuruecksetzen.
function istZurueck(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:(?:einen?|ein|1)\s+)?(?:schritt\s+)?zur(?:ü|ue)ck(?:\s+bitte)?$/.test(t)
    || /^(?:nochmal|einmal)\s+zur(?:ü|ue)ck$/.test(t)
    || /^(?:vorheriger|vorherige|voriger|vorige|letzter|letzte)\s+(?:schritt|frage)$/.test(t)
    || /^(?:ein\s+)?schritt\s+zur(?:ü|ue)ck$/.test(t);
}

// F-015: Abbruch der laufenden Anwendung (Kochen, Termin, Einkauf).
// WORTWAHL: Der Betreiber wollte ein sichereres Wort als "ende".
// "ende" ist einsilbig und wird von der Android-Erkennung leicht mit
// "Ente", "Haende" oder "Wende" verwechselt. "abbrechen" ist
// dreisilbig, kommt allein kaum im Alltagsgespraech vor und ist in
// dieser App bereits das Abbruchwort im Eingabe-Modus - ein Wort, eine
// Bedeutung. "ende" bleibt nur in der Einkaufs-Kette gueltig.
// Wie bei "weiter" und "zurueck" gilt die Alleinstehend-Sicherung:
// "am ende des tages" darf nichts abbrechen.
function istAnwendungEnde(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:abbrechen|abbruch|bitte abbrechen)$/.test(t)
    || /^(?:anwendung|kochen|kochmodus|termin|rezept|das|alles)\s+(?:abbrechen|beenden|schliessen|schließen)$/.test(t)
    || /^(?:beende|beenden)\s+(?:das\s+)?(?:kochen|den termin|die anwendung)$/.test(t);
}

// Merker fuer die Rueckfrage im Kochmodus (Vorgabe des Betreibers:
// dort NICHT sofort abbrechen - ein versehentliches Wort mitten im
// Kochen waere aergerlich).
let abbruchWartetAufBestaetigung = false;

function istJa(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:ja|jawohl|genau|richtig|stimmt|ja bitte|ja genau|bestaetigen|bestätigen)$/.test(t);
}

function istNein(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:nein|nee|noe|nö|doch nicht|weitermachen|weiter kochen|abbrechen nein)$/.test(t);
}

// Bricht die gerade laufende Anwendung ab.
function anwendungAbbrechen() {
  abbruchWartetAufBestaetigung = false;
  if (typeof einkaufKetteStop === "function") einkaufKetteStop(true);
  GlobalVoice.dialog = null;
  if (typeof gvBereitVerbergen === "function") gvBereitVerbergen();
  let imKochen = false;
  try { imKochen = cookingVisible(); } catch (e) {}
  if (imKochen) {
    clearTimers();          // Timer stoppen
    kochSitzungEnde();      // Bildschirmsperre freigeben
    stepIndex = 0;
    goTab("rezepte");
    speak("Kochen beendet.", true);
  } else {
    speak("Abgebrochen.", true);
  }
  if (typeof gvChipStand === "function") gvChipStand();
}

// Bricht eine laufende Spracheingabe ab (pur & testbar).
function istAbbruch(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:abbrechen|abbruch|vergiss es|vergessen|nichts|doch nicht|egal|stopp|stop)$/.test(t);
}

// Beendet die Einkaufs-Kette (mehrere Artikel nacheinander).
function istKetteEnde(text) {
  const t = String(text).toLowerCase().trim().replace(/[.,!?]+$/g, "");
  return /^(?:fertig|erledigt|ende|schluss|das war(?:'|’)?s|das wars|danke das war(?:'|’)?s|stopp|stop|aufh(?:ö|oe)ren|reicht|das reicht)$/.test(t);
}

// Darf Gesagtes eine laufende Ansage abbrechen? Ja bei einer offenen
// Rueckfrage (der Nutzer antwortet) und bei jedem echten Befehl.
// Alltagsgeplauder unterbricht weiterhin nicht.
function gvDarfUnterbrechen(text) {
  if (GlobalVoice.dialog) return true;
  if (istUeberspringen(text) || istZurueck(text)) return true;
  return Boolean(erkenneKommando(text));
}

function erkenneKommando(text) {
  const t = String(text).toLowerCase().trim()
    .replace(/[.,!?]+$/g, "");
  if (/^(stopp|stop|sei still|ruhe|leise)$/.test(t)) return { typ: "still" };
  if (/^(?:app[- ]?)?version$/.test(t)) return { typ: "version" };
  if (/^(?:plane?|erstelle)\s+(?:mir\s+)?(?:die\s+|meine\s+|eine?n?\s+)?woche(?:nplan)?$|^wochenplan$/.test(t)) {
    return { typ: "wochenplan" };
  }
  if (/^(?:einführung|einfuehrung|anleitung|tour|einrichtung)$/.test(t)) {
    return { typ: "einfuehrung" };
  }
  if (/^(?:mikro(?:fon)?|zuhören|zuhoeren)\s+(?:aus|stopp|stop|beenden)$/.test(t)) {
    return { typ: "mikro_aus" };
  }
  if (/^(?:app\s+|assistent\s+)?(?:beenden|schliessen|schließen)$/.test(t)
      || /^(?:tschüss|tschuess|auf wiedersehen)$/.test(t)) {
    return { typ: "app_ende" };
  }
  // RT2-02: nur als Aufforderung, nicht in beliebigen Saetzen
  // ("das war keine hilfe" ist kein Befehl).
  if (/^(?:hilfe|was kannst du(?: alles)?|hilf mir)\b/.test(t)) {
    return { typ: "hilfe" };
  }
  if (/^(?:jetzt\s+|los\s+|lass uns\s+)?koch(?:en)?(?:\s+start(?:en)?|\s+beginnen|\s+los)?$/.test(t)) {
    return { typ: "kochen" };
  }
  // BUGFIX: Die alte Regel verlangte fast wortwoertlich "auf die
  // (einkaufs)liste". Es scheiterten u.a. "auf die Einkaufs Liste"
  // (Android trennt zusammengesetzte Woerter oft), "... bitte",
  // "alles auf die Liste", "pack die Zutaten auf die Liste".
  let m = t.match(/^(?:(?:setz|setze|pack|packe|tu|tue|schreib|schreibe|nimm|mach|mache)\s+)?(?:(?:es|das|die|den|alles|mir|uns|mal|bitte|doch|noch|zutaten|einkauf)\s+)*auf\s+(?:die\s+(?:einkaufs\s*)?|einkaufs\s*)liste(?:\s+(?:setzen|schreiben|packen|drauf|bitte|danke))*$/);
  // F-016: "auf einkaufsliste" (ohne "die") gilt ebenfalls; bloßes "auf liste" nicht.
  // Auffangregel: kurzer Satz, der "auf die ... liste" enthaelt.
  // Kurz ist Bedingung, damit ein diktierter Termin nichts ausloest.
  if (!m && t.length <= 60 && /\bauf\s+(?:die\s+(?:\w+\s+)?(?:einkaufs\s*)?|einkaufs\s*)liste\b/.test(t)
      && !/\b(vorlesen|leeren|löschen|loeschen)\b/.test(t)) {
    m = [t];
  }
  if (m) return { typ: "auf_liste" };
  m = t.match(/^(?:(?:einkauf[:,]?\s+)?liste|einkaufs?liste)\s+(vorlesen|leeren|löschen|loeschen)$/);
  if (m) return { typ: "liste",
    aktion: m[1] === "vorlesen" ? "vorlesen" : "leeren" };
  // F-009: Frueher stand hier nur der Singular "rezept". Die Mehrzahl
  // "rezepte" war ueberhaupt kein Befehl und fiel in der Einkaufs-Kette
  // als Artikel durch ("rezepte ist auf der liste"). Zusaetzlich wurden
  // Fuellverben als Suchwunsch missdeutet: "rezept recherchieren"
  // suchte nach Rezepten zum Stichwort "recherchieren".
  m = t.match(/^(?:rezept(?:e|en)?|rezeptsuche|rezeptrecherche|suche|recherchiere)(?:[:,]?\s+(.+))?$/);
  if (m) {
    let rest = (m[1] || "").trim();
    // Fuellverben und Hoeflichkeitsfloskeln sind KEIN Suchwunsch.
    rest = rest.replace(
      /^(?:recherchieren|recherchiere|suchen|such|suche|finden|find|zeigen|zeig|anzeigen|starten|start|öffnen|oeffnen|bitte|mal|doch)\b[\s,]*/g,
      "").trim();
    if (/^(?:bitte|mal|doch|jetzt)$/.test(rest)) rest = "";
    return { typ: "rezept", rest: rest };
  }
  m = t.match(/^(?:neuer\s+|neuen\s+)?termin[:,]?\s*(.*)$/);
  if (m) return { typ: "termin", rest: m[1].trim() };
  // RT1-02: "Kaufen wir am Samstag zusammen ein?" ist eine Frage, kein
  // Befehl. Deshalb: Fragen ausschliessen und "kaufen/besorgen" nur mit
  // folgendem Artikel akzeptieren, nicht mit Pronomen.
  m = /[?]\s*$/.test(t) ? null
    : t.match(/^(?:einkauf|einkaufsliste|kaufe|besorge|auf die liste)\b[:,]?\s*(.*)$/)
      || t.match(/^(?:einkaufen|kaufen|besorgen)[:,]?\s+(?!wir\b|sie\b|die\b|das\b|den\b|dem\b|der\b|es\b|man\b)(.+)$/);
  if (m) return { typ: "einkauf", rest: m[1].trim() };
  // Fuellwoerter/Artikel beliebig oft ueberspringen ("gehe zu den
  // terminen", "wechsle zur einkaufsliste", "zeige mir die rezepte")
  m = t.match(/^(?:gehe?|wechs(?:le|el)|zeige?|öffne)\s+(?:(?:zu[rm]?|mir|bitte|die|den|das|dem|der)\s+)*([a-zäöüß]+)/);
  if (m && GV_TAB_WOERTER[m[1]]) return { typ: "nav", ziel: GV_TAB_WOERTER[m[1]] };
  return null;
}

// ---------- Einkaufs-Artikel (pur & testbar) ----------
function parseArtikelListe(text) {
  // RT2-08: Hoeflichkeitsfloskeln sind keine Einkaufsartikel.
  const FLOSKELN = ["bitte", "danke", "noch", "auch", "dazu", "und",
    "sonst", "ok", "okay", "gerne", "mal"];
  return String(text).split(/\s+und\s+|,/)
    .map((s) => s.trim()
      .replace(/^(?:noch|bitte|auch|dazu)\s+/i, "")
      .replace(/\s+(?:bitte|danke)$/i, "")
      .slice(0, 50))
    .filter((s) => s.length > 1 && !FLOSKELN.includes(s.toLowerCase()));
}

// Merker fuer "zurueck": wie viele Artikel kamen zuletzt dazu?
let einkaufZuletzt = [];

function einkaufHinzufuegen(text, danach) {
  const artikel = parseArtikelListe(text);
  if (!artikel.length) {
    speak("Das habe ich nicht verstanden.", true, danach);
    return;
  }
  artikel.forEach((name) => vState.liste.push({ name: name, laden: "" }));
  einkaufZuletzt = artikel.slice();
  vbSave(); renderVerbrauch();
  speak(artikel.length === 1
    ? artikel[0] + " ist auf der Liste."
    : artikel.join(" und ") + " sind auf der Liste.", true, danach);
}

// "Zurueck" in der Einkaufs-Kette: den zuletzt genannten Artikel
// wieder entfernen - der haeufigste Fall bei Versprechern.
function einkaufZurueck(danach) {
  if (!einkaufZuletzt.length) {
    speak("Da ist nichts zum Zurücknehmen.", true, danach);
    return;
  }
  const weg = einkaufZuletzt.slice();
  einkaufZuletzt = [];
  for (const name of weg) {
    for (let i = vState.liste.length - 1; i >= 0; i--) {
      if (vState.liste[i] && vState.liste[i].name === name) {
        vState.liste.splice(i, 1);
        break;
      }
    }
  }
  vbSave(); renderVerbrauch();
  speak(weg.join(" und ") + (weg.length === 1 ? " ist" : " sind") +
    " wieder von der Liste.", true, danach);
}

// ---------- Einkaufs-Kette (mehrere Artikel nacheinander) ----------
// Ablauf: "Einkaufsliste" -> Bereit-Ton -> Artikel -> Bestaetigung ->
// Bereit-Ton -> naechster Artikel -> ... bis "fertig".
// Die App stellt bewusst KEINE gesprochene Rueckfrage mehr ("Welcher
// Artikel?"). Genau die hoerte sie sich selbst wieder an und setzte
// sie als Artikel auf die Liste.
let einkaufKetteAktiv = false;

function einkaufKetteStart() {
  goTab("einkauf");
  einkaufKetteAktiv = true;
  einkaufKetteBereit();
}

function einkaufKetteBereit() {
  if (!einkaufKetteAktiv) return;
  gvStart();
  gvBackoffZuruecksetzen();
  GlobalVoice.dialog = { frage: "Artikel sagen – „fertig“ beendet",
    onInput: einkaufKetteEingabe };
  gvBereitAnzeigen("Artikel sagen");
  gvChipStand();
  tonBereit();
}

function einkaufKetteStop(stumm) {
  const lief = einkaufKetteAktiv;
  einkaufKetteAktiv = false;
  GlobalVoice.dialog = null;
  gvBereitVerbergen();
  if (lief && !stumm) speak("Okay, Einkaufsliste geschlossen.", true);
  gvChipStand();
}

// F-013: Frueher fielen ALLE Eingaben ausser "fertig" und "zurueck"
// ungeprueft an einkaufHinzufuegen durch - auch "abbrechen", "tschuess"
// und echte Befehle wie "rezept nudeln". Sie landeten als Artikel auf
// der Liste, statt ausgefuehrt zu werden. Jetzt hat die Befehlserkennung
// Vorrang; nur was KEIN Befehl ist, gilt als Artikel.
function einkaufKetteEingabe(text) {
  GlobalVoice.dialog = null;
  if (istKetteEnde(text) || istAbbruch(text)) {
    einkaufKetteStop(false);
    return;
  }
  if (istZurueck(text)) { einkaufZurueck(einkaufKetteBereit); return; }
  const befehl = erkenneKommando(text);
  if (befehl && befehl.typ !== "einkauf") {
    einkaufKetteStop(true);   // Kette still beenden, Befehl ausfuehren
    gvRoute(text);
    return;
  }
  einkaufHinzufuegen(text, einkaufKetteBereit);
}

// ---------- Zentrale Weiche ----------
function gvRoute(said) {
  // F-015: Offene Abbruch-Rueckfrage im Kochmodus zuerst beantworten.
  if (abbruchWartetAufBestaetigung) {
    if (istJa(said)) { anwendungAbbrechen(); return; }
    if (istNein(said) || istAnwendungEnde(said)) {
      abbruchWartetAufBestaetigung = false;
      speak("Gut, wir kochen weiter.", true);
      return;
    }
    // Alles andere: Rueckfrage verfaellt, Eingabe normal behandeln.
    abbruchWartetAufBestaetigung = false;
  }
  // F-015: Abbruch hat Vorrang VOR dem Dialog - sonst liesse sich ein
  // offener Termin-Dialog per Sprache nicht mehr verlassen.
  if (istAnwendungEnde(said)) {
    let imKochen = false;
    try { imKochen = cookingVisible(); } catch (e) {}
    if (imKochen) {
      abbruchWartetAufBestaetigung = true;
      speak("Wirklich das Kochen beenden? Sag ja oder nein.", true);
      return;
    }
    anwendungAbbrechen();
    return;
  }
  // 1) Laufender Rueckfrage-Dialog hat Vorrang
  if (GlobalVoice.dialog) {
    GlobalVoice.dialog.onInput(said);
    return;
  }
  // Onboarding offen? Dann hat es Vorrang vor ALLEN Kontexten:
  // "Weiter/Überspringen" blättert die Einrichtung.
  if (obOffen && istUeberspringen(said)) { obWeiter(); return; }
  const klein = said.toLowerCase();
  // 2) Kochmodus-Kommandos (nur wenn Kochen sichtbar)
  if (cookingVisible()) {
    if (/\b(fertig|erledigt|weiter|überspringen|ueberspringen|nächster|naechster)\b/.test(klein)) { confirmStep(); return; }
    if (/wiederhol/.test(klein)) { repeatStep(); return; }
  }
  // 3) Globale Kommandos - in jedem Modul verfuegbar
  // "Weiter/Überspringen" ohne aktiven Dialog: laufende Ansage
  // (z.B. Rezept-Vorstellung, Zutatenliste) sofort beenden
  if (istUeberspringen(said)) {
    window.speechSynthesis.cancel();
    return;
  }
  // "Zurueck" - im Kochmodus ein Schritt zurueck, sonst nur Hinweis.
  if (istZurueck(said)) {
    if (cookingVisible()) prevStep();
    else speak("Zurück geht hier gerade nicht.", true);
    return;
  }
  const k = erkenneKommando(said);
  if (!k) return; // Alltagsgespraech ignorieren
  if (k.typ === "still") { window.speechSynthesis.cancel(); return; }
  if (k.typ === "wochenplan") { wpPlanen(); return; }
  if (k.typ === "version") {
    speak("Es läuft Version " + APP_VERSION + ".", true);
    return;
  }
  if (k.typ === "einfuehrung") { onboardingOeffnen(); return; }
  if (k.typ === "mikro_aus") {
    GlobalVoice.aktiv = false; // verhindert jeden Neustart
    speak("Okay, Mikrofon ist aus. Zum Einschalten unten rechts auf " +
      "das Mikrofon-Symbol tippen.", true);
    gvChip("🎤 aus – tippen zum Einschalten", "aus");
    return;
  }
  if (k.typ === "app_ende") { appBeenden(); return; }
  if (k.typ === "hilfe") {
    speak("Ihr könnt sagen: Termin, dann den Termin sprechen. " +
      "Einkauf und ein Artikel. Liste vorlesen oder Liste leeren. " +
      "Nach der Rezeptwahl: Auf die Einkaufsliste. " +
      "Rezept und euer Wunsch. " +
      "Gehe zu Rezepten, Terminen, Einkauf, " +
      "Kochen, Favoriten oder Familie. Nach der Rezeptwahl: Kochen. Beim Kochen: fertig, weiter " +
      "oder wiederholen. Mikrofon aus schaltet das Zuhören ab, " +
      "App beenden verabschiedet mich. " +
      "Einführung öffnet die Anleitung. Weiter oder Überspringen lässt Fragen und Ansagen aus. Und Stopp, wenn ich still sein soll.", true);
    return;
  }
  if (k.typ === "kochen") {
    if (selectedRecipe) { startCooking(); }
    else { speak("Wählt zuerst ein Rezept aus.", true); goTab("rezepte"); }
    return;
  }
  if (k.typ === "nav") { goTab(k.ziel); speak("Okay.", true); return; }
  if (k.typ === "auf_liste") {
    if (selectedRecipe) {
      buildShoppingList();
      goTab("einkauf");
      speak("Die Zutaten von " + selectedRecipe.name +
        " sind auf der Einkaufsliste.", true);
    } else {
      speak("Wählt zuerst ein Rezept aus.", true);
      goTab("rezepte");
    }
    return;
  }
  if (k.typ === "liste") {
    goTab("einkauf");
    if (k.aktion === "vorlesen") readShoppingList();
    else leereEinkaufslisteVoice();
    return;
  }
  if (k.typ === "rezept") {
    goTab("rezepte");
    if (k.rest) rezeptSucheMitText(k.rest);
    else gvEingabe("Worauf habt ihr Lust?", rezeptSucheMitText);
    return;
  }
  if (k.typ === "einkauf") {
    if (k.rest) {
      goTab("einkauf");
      einkaufKetteAktiv = true;
      einkaufHinzufuegen(k.rest, einkaufKetteBereit);
    } else {
      einkaufKetteStart();
    }
    return;
  }
  if (k.typ === "termin") {
    goTab("termine");
    startTerminDialog(k.rest && k.rest.length > 3 ? k.rest : null);
  }
}

// ---------- Wochenplan-Automatik (Plus-Kernfeature) ----------
let wpLaeuft = false;
async function wpPlanen() {
  if (wpLaeuft) return;
  const info = document.getElementById("wpInfo");
  wpLaeuft = true;
  if (info) info.textContent = "⏳ Ich plane eure Woche …";
  speak("Einen Moment, ich plane eure Abendessen für die ganze " +
    "Woche – passend zu allen Ernährungsformen der Familie.", true);
  try {
    const r = await fetch("/api/rezept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modus: "wochenplan",
        device: deviceId(),
        kanal: (typeof syncCode !== "undefined" && syncCode)
          ? await syncKanalHole(syncCode) : "",
        unvertraeglichkeiten: selectedIntolerances(),
        ernaehrungsformen: ernaehrungsformen,
        stile: familienStile,
        ausschluss: ausschlussListe(),
        minuten_min: 15,
        minuten_max: 60,
      }),
    });
    if (r.status === 402) {
      let d = null;
      try { d = await r.json(); } catch (e) {}
      const m = (d && d.error) || "Der kostenlose Monats-Wochenplan " +
        "ist aufgebraucht.";
      if (info) info.innerHTML = "💎 " + entschaerfeHtml(m.replace(/kurze E-Mail.*$/,
        "")) + ' <a href="/plus.html">Alles über Familien-Plus</a>.';
      speak(m, true);
      return;
    }
    if (!r.ok) {
      if (info) info.textContent = "❌ Planung fehlgeschlagen (" +
        r.status + ") – bitte nochmal versuchen.";
      speak("Die Planung hat leider nicht geklappt. Versuch es " +
        "gleich nochmal.", true);
      return;
    }
    const d = await r.json();
    const plan = (d && d.plan) || [];
    if (!plan.length) {
      if (info) info.textContent = "❌ Kein sicheres Ergebnis.";
      return;
    }
    // 7 Abendessen als Termine der ANGEZEIGTEN Woche (18:00)
    const montag = montagVon(matrixOffset);
    const basis = Date.now();
    plan.forEach((g, idx) => {
      const tag = new Date(montag);
      tag.setDate(montag.getDate() + idx);
      termine.push({
        id: "wp" + basis + "_" + idx,
        titel: "🍽 " + g.name,
        person: "Familie",
        verantwortlich: "",
        datum: isoTag(tag),
        zeit: "18:00",
        dauerMin: Math.max(30, (g.timeMin || 30) + 15),
        wegzeitMin: 0,
        kategorie: "",
        bestaetigt: {},
        zuletztErinnert: {},
      });
    });
    termine.sort((a, b) => (a.datum + a.zeit).localeCompare(b.datum + b.zeit));
    tSaveAll(); // speichert lokal + Familien-Sync

    // Eine konsolidierte Einkaufsliste in Familienmengen
    const f = (typeof portionFactor === "function") ? portionFactor() : 1;
    const summen = {};
    plan.forEach((g) => (g.ingredients || []).forEach((z) => {
      const schluessel = (z.name + "|" + z.unit).toLowerCase();
      summen[schluessel] = summen[schluessel] ||
        { name: z.name, unit: z.unit, qty: 0 };
      summen[schluessel].qty += z.qty * f;
    }));
    let artikel = 0;
    Object.values(summen).forEach((s, idx) => {
      const eintragText = smartQty(
        { name: s.name, qty: s.qty, unit: s.unit }, 1);
      vState.liste.push({
        id: "wp" + basis + "_z" + idx,
        name: eintragText,
        laden: "",
      });
      artikel++;
    });
    vbSave();
    try { renderMatrix(); } catch (e) {}
    try { renderVerbrauch(); } catch (e) {}
    if (info) info.innerHTML = "✅ " + plan.length +
      " Abendessen geplant, " + artikel + " Artikel auf der Einkaufsliste. " +
      "<span style=\"font-size:.8rem\">ℹ️ Doppelt gegen eure " +
      "Angaben geprüft – bei Allergien bitte zusätzlich kurz die " +
      "Zutatenliste der Produkte checken.</span>";
    speak("Fertig! " + plan.length + " Abendessen stehen im Wochenplan, " +
      "und die Einkaufsliste hat " + artikel +
      " Artikel in euren Familienmengen. Guten Appetit!", true);
  } catch (e) {
    if (info) info.textContent = "❌ Keine Verbindung.";
    speak("Ich erreiche den Server gerade nicht.", true);
  } finally {
    wpLaeuft = false;
  }
}


// =====================================================
// FAMILIEN-SYNC (Plus) - Ende-zu-Ende-verschluesselt
// Der Familien-Code ist zugleich der Schluessel. Der Server
// sieht nur Chiffrat + Zeitstempel unter einem Code-Hash -
// das Versprechen "Klartexte nur auf euren Geraeten" bleibt wahr.
// =====================================================
let syncCode = "";
try { syncCode = localStorage.getItem("ka_sync_code") || ""; } catch (e) {}
let syncStand = 0;
try { syncStand = Number(localStorage.getItem("ka_sync_stand")) || 0; } catch (e) {}
let syncTimer = null;
let syncAktivSendung = false;

async function syncSchluessel(code) {
  const enc = new TextEncoder();
  const basis = await crypto.subtle.importKey("raw",
    enc.encode(String(code).trim().toUpperCase()), "PBKDF2", false,
    ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("ka-familien-sync-v1"),
      iterations: 150000, hash: "SHA-256" },
    basis, { name: "AES-GCM", length: 256 }, false,
    ["encrypt", "decrypt"]);
}
// F-029: Der Familien-Code ist zugleich der Schluessel und verlaesst das Handy
// nie. Zum Server geht nur die Kennung (SHA-256-Hash; Rechenweg wie auf dem
// Server: "ka1|" + CODE, erste 32 Zeichen).
async function syncKanalHole(code) {
  const c = String(code == null ? syncCode : code).trim().toUpperCase();
  const h = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode("ka1|" + c));
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
function syncB64(buf) {
  // F-026: in Stuecken, sonst Absturz ("Maximum call stack") ab ca. 150 KB.
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 8192) {
    s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  }
  return btoa(s);
}
function syncB64zurueck(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function syncVerschluesseln(objekt, code) {
  const key = await syncSchluessel(code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key,
    new TextEncoder().encode(JSON.stringify(objekt)));
  return syncB64(iv) + "." + syncB64(ct);
}
async function syncEntschluesseln(blob, code) {
  const [ivB, ctB] = String(blob).split(".");
  const key = await syncSchluessel(code);
  const klar = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: syncB64zurueck(ivB) }, key,
    syncB64zurueck(ctB));
  return JSON.parse(new TextDecoder().decode(klar));
}

function syncDaten() {
  return { termine, routinen, mitglieder, verbrauch: vState,
    geloescht: syncTombstones() };
}
function syncUebernehmen(d) {
  // FUSION37: verschmilzt elementweise statt zu ersetzen - siehe
  // Kommentarblock ueber syncMerge. Rueckgabe true, wenn dieses
  // Geraet Eintraege kannte, die dem fernen Stand fehlten (dann
  // muss der vereinigte Stand zurueckgesendet werden).
  if (!d || typeof d !== "object") return false;
  const m = syncMerge(syncDaten(), d);
  const fernKennt = {};
  [].concat(d.termine || [], d.routinen || [], d.mitglieder || [])
    .forEach((e) => { if (e && e.id) fernKennt[e.id] = true; });
  const lokalHatteMehr = [].concat(m.termine, m.routinen, m.mitglieder)
    .some((e) => e && e.id && !fernKennt[e.id]);
  termine = m.termine.map(syncTerminHeilen).filter(Boolean);
  routinen = m.routinen;
  mitglieder = m.mitglieder;
  if (m.verbrauch && typeof m.verbrauch === "object") vState = m.verbrauch;
  syncTombSchreiben(m.geloescht);
  // Merkzettel auf den verschmolzenen Stand setzen, damit das naechste
  // Stempeln fern uebernommene Eintraege nicht als Loeschung deutet.
  syncStempelStand = {};
  syncStempeln("termine", termine);
  syncStempeln("routinen", routinen);
  syncStempeln("mitglieder", mitglieder);
  try {
    localStorage.setItem("ka_termine", JSON.stringify(termine));
    localStorage.setItem("ka_routinen", JSON.stringify(routinen));
    localStorage.setItem("ka_mitglieder", JSON.stringify(mitglieder));
    localStorage.setItem("ka_verbrauch", JSON.stringify(vState));
  } catch (e) {}
  try { renderMembers(); } catch (e) {}
  try { renderTermineTab(); } catch (e) {}
  try { renderVerbrauch(); } catch (e) {}
  syncAnzeige();
  return lokalHatteMehr;
}

// Nach jeder lokalen Aenderung: gebuendelt (2,5 s) hochladen
function syncGeplant() {
  if (!syncCode) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncSenden, 2500);
}
async function syncSenden() {
  if (!syncCode || syncAktivSendung) return;
  syncAktivSendung = true;
  try {
    // FUSION37: Vor dem Senden den fernen Stand holen und elementweise
    // einarbeiten. Damit schrumpft das Verlustfenster von bis zu 60 s
    // (Poll-Takt) auf die Dauer dieses einen Abrufs - und selbst ein
    // Zusammenstoss kostet dank ID-Vereinigung keinen Eintrag mehr.
    try {
      const vorab = await fetch("/api/termine?kanal=" +
        await syncKanalHole(syncCode));
      if (vorab.ok) {
        const dv = await vorab.json();
        if (dv.blob && Number(dv.stand) > syncStand) {
          const fern = await syncEntschluesseln(dv.blob, syncCode);
          syncStand = Number(dv.stand);
          try { localStorage.setItem("ka_sync_stand",
            String(syncStand)); } catch (e) {}
          syncUebernehmen(fern);
        }
      }
    } catch (e) { /* Netzfehler hier: einfach normal weitersenden */ }
    const stand = Date.now();
    const blob = await syncVerschluesseln(syncDaten(), syncCode);
    const r = await fetch("/api/termine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kanal: await syncKanalHole(syncCode), blob, stand,
        device: deviceId() }),
    });
    if (r.status === 402) { syncTrennen(true); return; }
    if (r.ok) {
      syncStand = stand;
      try { localStorage.setItem("ka_sync_stand", String(stand)); } catch (e) {}
      syncAnzeige();
    }
  } catch (e) { /* Netzfehler: naechster Anlauf beim Poll */ }
  finally { syncAktivSendung = false; }
}
async function syncAbholen() {
  if (!syncCode) return;
  try {
    const r = await fetch("/api/termine?kanal=" +
      await syncKanalHole(syncCode));
    if (r.status === 402) { syncTrennen(true); return; }
    if (!r.ok) return;
    const d = await r.json();
    if (d.blob && Number(d.stand) > syncStand) {
      const obj = await syncEntschluesseln(d.blob, syncCode);
      syncStand = Number(d.stand);
      try { localStorage.setItem("ka_sync_stand", String(syncStand)); } catch (e) {}
      // FUSION37: elementweise verschmelzen; kannte dieses Geraet
      // Eintraege, die druben fehlten, wird der vereinigte Stand
      // zurueckgesendet, damit KEIN Geraet etwas verliert.
      if (syncUebernehmen(obj)) syncGeplant();
    }
  } catch (e) {}
}

function syncAnzeige() {
  const s = document.getElementById("syncStatus");
  const verbunden = document.getElementById("syncVerbunden");
  const formular = document.getElementById("syncFormular");
  if (!s) return;
  if (syncCode) {
    if (verbunden) verbunden.classList.remove("hidden");
    if (formular) formular.classList.add("hidden");
    s.textContent = "✅ Verbunden: " + syncCode.slice(0, 9) + "…" +
      (syncStand ? " (Stand " +
        new Date(syncStand).toLocaleTimeString("de-DE",
          { hour: "2-digit", minute: "2-digit" }) + ")" : "");
  } else {
    if (verbunden) verbunden.classList.add("hidden");
    if (formular) formular.classList.remove("hidden");
    s.textContent = "";
  }
}
async function syncVerbinden() {
  const eingabe = document.getElementById("syncCodeEingabe");
  const info = document.getElementById("syncInfo");
  const code = String((eingabe && eingabe.value) || "").trim().toUpperCase();
  if (!/^FAM-[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(code)) {
    if (info) info.textContent =
      "Bitte einen gültigen Code im Format FAM-XXXXX-XXXXX eingeben.";
    return;
  }
  if (info) info.textContent = "Prüfe Code …";
  try {
    const r = await fetch("/api/termine?kanal=" + await syncKanalHole(code));
    if (r.status === 402) {
      if (info) info.innerHTML = "Dieser Code ist noch nicht " +
        "freigeschaltet. Familien-Plus (unbegrenzte KI-Recherche + " +
        "Familien-Sync) gibt es zum Founder-Preis von 29 €/Jahr – " +
        "<a href=\"/plus.html\">" +
        "Alles über Familien-Plus</a>.";
      return;
    }
    if (!r.ok) { if (info) info.textContent =
      "❌ Server-Fehler " + r.status + " – bitte nochmal versuchen."; return; }
    const d = await r.json();
    syncCode = code;
    try { localStorage.setItem("ka_sync_code", code); } catch (e) {}
    syncStand = 0;
    if (d.blob) {
      await syncAbholen(); // vorhandenen Familienstand uebernehmen
    } else {
      await syncSenden();  // erster im Kanal: lokalen Stand hochladen
    }
    if (info) info.textContent = "";
    syncAnzeige();
    speak("Familien-Sync ist verbunden. Termine und Listen werden " +
      "jetzt verschlüsselt geteilt.", true);
  } catch (e) {
    if (info) info.textContent = "❌ Keine Verbindung.";
  }
}
function syncEinladungsLink() {
  // Code im URL-FRAGMENT (#): erreicht niemals Server oder Logs
  return location.origin + "/#sync=" + encodeURIComponent(syncCode);
}
async function syncEinladen() {
  if (!syncCode) return;
  const url = syncEinladungsLink();
  const text = "Tippe diesen Link an, dann verbindet sich dein " +
    "Familien-Assistent automatisch mit unserer Familie: " + url;
  if (navigator.share) {
    try { await navigator.share({ title: "Familien-Assistent", text }); return; }
    catch (e) { /* abgebrochen -> Fallback */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    speak("Der Einladungs-Link ist kopiert. Schick ihn per " +
      "WhatsApp oder S M S an den Partner.", true);
  } catch (e) { prompt("Link manuell kopieren:", url); }
}

function syncTrennen(wegenPlus) {
  syncCode = "";
  syncStand = 0;
  try {
    localStorage.removeItem("ka_sync_code");
    localStorage.removeItem("ka_sync_stand");
  } catch (e) {}
  syncAnzeige();
  const info = document.getElementById("syncInfo");
  if (wegenPlus && info) info.textContent =
    "Die Freischaltung dieses Codes ist abgelaufen.";
}

// Poll: jede Minute + sofort beim Zurueckkehren in die App
setInterval(syncAbholen, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncAbholen();
});


// ---------- App per Sprache beenden ----------
// Ehrlicher Hinweis: Ein Browser-Tab darf sich aus Sicherheits-
// gruenden meist NICHT selbst schliessen. Deshalb: Stimme + Mikro
// aus, Abschieds-Bildschirm, und der Schliessversuch dort, wo die
// Plattform ihn erlaubt (installierte App).
function appBeenden() {
  GlobalVoice.aktiv = false;
  GlobalVoice.dialog = null;
  if (recognition) { try { recognition.abort(); } catch (e) {} }
  gvChip("🎤 aus", "aus");
  speak("Bis bald!", true);
  const o = document.getElementById("byeOverlay");
  if (o) o.classList.remove("hidden");
  setTimeout(() => { try { window.close(); } catch (e) {} }, 1800);
}

// =====================================================
// GEFUEHRTE STARTSEITE / ERSTEINRICHTUNG (v11)
// Zustand lebt in Variablen (nicht nur im DOM) - dadurch
// vollstaendig im Simulator testbar.
// =====================================================
const OB_FLAG = "ka_onboarding_fertig";
const OB_SCHRITTE = 8;
let obOffen = false;
let obIndex = 0;

// Gesprochene Kurzfassung jeder Seite. Browser erlauben Sprach-
// ausgabe erst nach der ersten Beruehrung - Seite 1 erscheint daher
// ggf. nur als Sprechblase; ab dem ersten Tipp spricht die App.
const OB_SAG = [
  "Herzlich willkommen! Diese App nimmt eurem Familienalltag die " +
    "Denkarbeit ab: Ihr sprecht – sie plant, erinnert und denkt " +
    "Allergien mit. Wichtig: Alle Familiendaten bleiben nur auf " +
    "eurem Gerät. Tippt oder sagt: Weiter.",
  "Das kann eure App: freihändig kochen mit vorgelesenen Schritten, " +
    "sichere Rezepte passend zu Allergien und Ernährungsform, " +
    "Einkaufsliste per Zuruf, Termin-Erinnerungen auch bei " +
    "geschlossener App, Vorrats-Planung und die Wochen-Übersicht.",
  "Nehmt euch jetzt einmalig höchstens zehn Minuten – ich führe " +
    "euch Schritt für Schritt durch die Einrichtung.",
  "Schritt 1: Tragt eure Familienmitglieder ein – Name, Alter und " +
    "Geschlecht. Daraus berechne ich automatisch alle Portionsmengen.",
  "Schritt 2: Erlaubt einmalig das Mikrofon – danach könnt ihr die " +
    "App einfach ansprechen.",
  "Schritt 3: Aktiviert die Erinnerungen, damit ich euch auch bei " +
    "geschlossener App an Termine erinnern kann.",
  "Schritt 4: Installiert die App auf dem Startbildschirm – ein " +
    "Fingertipp, und eure Daten bleiben dauerhaft erhalten.",
  "Und zum Schluss ganz ehrlich: Die App hilft nur, wenn ihr sie " +
    "auch benutzt. Gebt euch ein paar Tage – dann wird es " +
    "selbstverständlich, und es wird sich für euch lohnen! " +
    "Und noch eine Bitte: Nutzt den Feedback-Knopf unten in der App " +
    "für Wünsche und Probleme – ihr formt die App mit. " +
    "Tippt jetzt auf: Los geht's.",
];


function obZeige() {
  document.querySelectorAll(".ob-step").forEach((el) => {
    el.classList.toggle("hidden",
      Number(el.getAttribute("data-ob")) !== obIndex);
  });
  const dots = document.getElementById("obDots");
  if (dots) {
    dots.innerHTML = "";
    for (let d = 0; d < OB_SCHRITTE; d++) {
      const s = document.createElement("span");
      if (d === obIndex) s.className = "an";
      dots.appendChild(s);
    }
  }
  const zurueck = document.getElementById("obZurueckBtn");
  if (zurueck) zurueck.style.visibility = obIndex === 0 ? "hidden" : "visible";
  const weiter = document.getElementById("obWeiterBtn");
  if (weiter) weiter.textContent =
    obIndex === OB_SCHRITTE - 1 ? "🚀 Los geht's!" : "Weiter ›";
  if (obOffen) {
    // Kompletten sichtbaren Seitentext vorlesen (Wunsch: nicht nur
    // Zusammenfassung). Knoepfe/Navigation bleiben stumm.
    const el = document.querySelector(
      '.ob-step[data-ob="' + obIndex + '"]');
    let volltext = el ? el.innerText.replace(/\s+/g, " ").trim() : "";
    if (volltext.length > 1200) volltext = volltext.slice(0, 1200);
    speak(volltext || (OB_SAG[obIndex] || ""), true);
  }
}

function onboardingOeffnen() {
  obOffen = true;
  obIndex = 0;
  const o = document.getElementById("onboarding");
  if (o) o.classList.remove("hidden");
  obZeige();
  obFamListeAktualisieren();
}

function obWeiter() {
  if (obIndex >= OB_SCHRITTE - 1) { obFertig(false); return; }
  obIndex++;
  obZeige();
}
function obZurueck() {
  if (obIndex > 0) { obIndex--; obZeige(); }
}
function obFertig(uebersprungen) {
  obOffen = false;
  try { localStorage.setItem(OB_FLAG, "1"); } catch (e) {}
  const o = document.getElementById("onboarding");
  if (o) o.classList.add("hidden");
  // Mikrofon-Berechtigung direkt nach der Einführung einholen:
  // Der Klick auf "Los geht's" ist die Nutzer-Geste, die Browser
  // dafür verlangen - besser Moment gibt es nicht.
  try {
    if (typeof gvStart === "function" && !GlobalVoice.gestartet) {
      gvStart();
    }
  } catch (e) {}
  if (!uebersprungen) {
    speak("Fertig eingerichtet! Sagt zum Beispiel: Rezept – und euren " +
      "Wunsch. Oder: Hilfe.", true);
  }
}

function obFamListeAktualisieren() {
  const box = document.getElementById("obFamListe");
  if (!box) return;
  box.textContent = mitglieder.length
    ? "✅ Dabei: " + mitglieder.map((m) => m.name +
        (m.alter ? " (" + m.alter + ")" : "")).join(", ")
    : "Noch niemand eingetragen.";
}

function obMitgliedHinzu() {
  const nameEl = document.getElementById("obName");
  const alterEl = document.getElementById("obAlter");
  const name = String((nameEl && nameEl.value) || "").trim().slice(0, 30);
  const alter = parseInt((alterEl && alterEl.value) || "", 10);
  if (!name) return;
  const gEl = document.getElementById("obGeschlecht");
  const geschlecht = (gEl && gEl.value) === "m" ? "m" : "w";
  mitglieder.push({ name: name,
    alter: Number.isFinite(alter) ? alter : 30,
    geschlecht: geschlecht, allergien: [], ernaehrung: [] });
  tSaveAll();
  renderMembers();
  if (nameEl) nameEl.value = "";
  if (alterEl) alterEl.value = "";
  obFamListeAktualisieren();
  speak(name + " ist dabei!", true);
}

function obMikro() {
  gvStart();
  const s = document.getElementById("obMikroStatus");
  setTimeout(() => {
    if (!s) return;
    s.textContent = GlobalVoice.gestartet
      ? "✅ Mikrofon aktiv – die App hört zu!"
      : "Bitte die Browser-Abfrage mit „Zulassen“ bestätigen.";
  }, 1200);
}

function obPush() {
  try { aktivierePush(); } catch (e) {}
  const s = document.getElementById("obPushStatus");
  setTimeout(() => {
    if (!s) return;
    const quelle = document.getElementById("pushStatus");
    s.textContent = (quelle && quelle.textContent)
      ? quelle.textContent
      : "Bitte die Abfrage bestätigen …";
  }, 1500);
}

function obInstall() {
  const s = document.getElementById("obInstallStatus");
  const btn = document.getElementById("kaInstallBtn");
  if (btn) {
    btn.click();
    if (s) s.textContent = "Folge der Browser-Abfrage …";
  } else if (s) {
    s.textContent = "📱 iPhone/iPad: Teilen-Symbol → „Zum Home-Bildschirm“. " +
      "Sonst: Browser-Menü ⋮ → „App installieren“.";
  }
}


// ---------- Rezeptsuche per Sprache ----------
function rezeptSucheMitText(text) {
  const wunsch = String(text || "").trim().slice(0, 120);
  if (!wunsch) { speak("Das habe ich nicht verstanden.", true); return; }
  const feld = document.getElementById("searchWish");
  if (feld) feld.value = wunsch;
  speak("Ich suche: " + wunsch + ".", true);
  rechercheRezept(false);
}
function rezeptVoiceStart() {
  goTab("rezepte");
  gvOneShot("Worauf habt ihr Lust?", rezeptSucheMitText);
}

// ---------- EINGABE-MODUS (loest gvOneShot ab) ----------
// Vorher: Die App STELLTE eine gesprochene Rueckfrage ("Worauf habt ihr
// Lust?") und horchte gleichzeitig. Drei Fehler auf einmal:
// 1. Sie hoerte ihre eigene Frage und verarbeitete sie als Antwort.
// 2. Der Nutzer wusste nicht, ab wann er sprechen darf.
// 3. Der Chip sprang zwischen "starte", "hoere" und "Ruhepause".
// Jetzt: EIN Bereit-Ton, ein unuebersehbares Banner, ein stabiler Chip -
// und die Erkennung laeuft ohne Pause, bis geantwortet oder abgebrochen
// wurde. Kein gesprochener Satz, der zurueckgehoert werden koennte.
const GV_EINGABE_MAX_MS = 25000;   // Notausstieg, damit das Mikro nicht ewig heiss bleibt
let gvEingabeTimer = null;

function gvBereitAnzeigen(text) {
  const b = document.getElementById("gvBereit");
  const t = document.getElementById("gvBereitText");
  if (t) t.textContent = text;
  // F-011: Im Kochmodus wuerde das Banner ueber den Kochschritten
  // liegen - genau die Ueberlagerung, die stoerte. Dort genuegt die
  // Statuszeile, die gvChip ohnehin mitfuehrt.
  let imKochen = false;
  try { imKochen = cookingVisible(); } catch (e) {}
  if (b && !imKochen) b.classList.add("sichtbar");
}

function gvBereitVerbergen() {
  const b = document.getElementById("gvBereit");
  if (b) b.classList.remove("sichtbar");
}

function gvEingabeBeenden(stumm) {
  clearTimeout(gvEingabeTimer);
  gvEingabeTimer = null;
  GlobalVoice.dialog = null;
  gvBereitVerbergen();
  gvChipStand();
  if (!stumm) tonSchlaf();
}

// frage = NUR sichtbarer Text, wird bewusst NICHT gesprochen.
function gvEingabe(frage, callback) {
  clearTimeout(gvEingabeTimer);
  gvStart();
  gvBackoffZuruecksetzen();
  gvBereitAnzeigen(frage || "Sprich jetzt");
  gvChip("🎙️ " + (frage || "Sprich jetzt"), "eingabe");
  GlobalVoice.dialog = {
    frage: frage || "Sprich jetzt",
    onInput: (text) => {
      if (istUeberspringen(text) || istAbbruch(text)) {
        gvEingabeBeenden(false);
        speak("Okay, abgebrochen.", true);
        return;
      }
      gvEingabeBeenden(true);
      callback(text);
    },
  };
  tonBereit();
  gvEingabeTimer = setTimeout(() => {
    if (!GlobalVoice.dialog) return;
    gvEingabeBeenden(false);
  }, GV_EINGABE_MAX_MS);
}

// Kompatibilitaetshuelle fuer bestehende Aufrufe
function gvOneShot(frage, callback) { gvEingabe(frage, callback); }

// Kompatibilitaets-Huelle: das Kochmodul rief bisher
// initRecognition() auf - jetzt startet das den Controller.
function initRecognition() {
  gvStart();
}

// =====================================================
// TABS
// =====================================================
function goTab(name) {
  // Koch-Modul nicht sichtbar = inaktiv -> Display-Sperre aufheben.
  // Laufende Garzeit-Timer bleiben bewusst bestehen (kurzer Blick auf
  // die Einkaufsliste darf die Nudeln nicht vergessen lassen); bei der
  // Rueckkehr in ein laufendes Rezept wird die Sperre neu angefordert.
  if (typeof kochAktiv !== "undefined") {
    if (name !== "kochen") wakeLockAus("koch");
    else if (kochAktiv) wakeLockAn("koch");
  }
  // NEU (Einkaufs-Voice): Freihändig-Modus beenden, wenn man Einkauf verlässt
  // (verhindert Mikrofon-Konflikt mit der Koch-Spracherkennung)
  if (name !== "einkauf" && typeof vbVoiceCheckoffStop === "function")
    vbVoiceCheckoffStop();
  if (name !== "einkauf" && typeof einkaufKetteStop === "function")
    einkaufKetteStop(true);
  ["heute", "familie", "rezepte", "einkauf", "kochen", "favoriten", "termine"]
    .forEach(t => {
      document.getElementById("tab-" + t).classList.toggle("hidden", t !== name);
      document.getElementById("nav-" + t).classList.toggle("active", t === name);
    });
  if (name === "rezepte") {
    renderKochModusSelect();
    renderStilChips();
    renderRecipes();
  }
  if (name === "heute") renderHeute();
  if (name === "favoriten") renderFavoriten();
  if (name === "termine") renderTermineTab();
  if (name === "einkauf" && typeof renderVerbrauch === "function")
    renderVerbrauch();
}

// =====================================================
// KOCH-MODUS & STIL-VORLIEBEN (UI)
// =====================================================
function renderKochModusSelect() {
  const sel = document.getElementById("kochModusSel");
  if (!sel) return;
  const alt = kochModus;
  sel.innerHTML = '<option value="familie">👨‍👩‍👧‍👦 Ganze Familie</option>';
  (typeof mitglieder !== "undefined" ? mitglieder : []).forEach(m => {
    const o = document.createElement("option");
    o.value = m.name;
    const e = (m.ernaehrung || []).length
      ? " (" + m.ernaehrung.map(d => DIET_LABELS[d]).join(", ") + ")" : "";
    o.textContent = "Nur " + m.name + e;
    sel.appendChild(o);
  });
  if ([...sel.options].some(o => o.value === alt)) sel.value = alt;
  else kochModus = "familie";
}

function setKochModus(v) {
  kochModus = v;
  selectedRecipe = null;
  document.getElementById("toShopBtn").disabled = true;
  renderRecipes();
}

function renderStilChips() {
  const box = document.getElementById("stilChips");
  if (!box) return;
  box.innerHTML = "";
  STILE.forEach(s => {
    const b = document.createElement("button");
    const aktiv = familienStile.includes(s.id);
    b.type = "button";
    b.className = "btn " + (aktiv ? "" : "ghost");
    b.style.cssText = "padding:8px 12px;font-size:.85rem";
    b.textContent = s.label;
    b.onclick = () => toggleStil(s.id);
    box.appendChild(b);
  });
}

function toggleStil(id) {
  const i = familienStile.indexOf(id);
  if (i >= 0) familienStile.splice(i, 1);
  else familienStile.push(id);
  try { localStorage.setItem("ka_stile", JSON.stringify(familienStile)); }
  catch (e) {}
  renderStilChips();
  renderRecipes();
}

// =====================================================
// FAVORITEN (dauerhaft auf dem Geraet gespeichert)
// =====================================================
function loadFavs() {
  try {
    // F-028: nur echte Eintraege einer Liste behalten
    const l = JSON.parse(localStorage.getItem("ka_favoriten") || "[]");
    return Array.isArray(l)
      ? l.filter((e) => e && typeof e === "object" && !Array.isArray(e)) : [];
  } catch (e) { return []; }
}

function saveFavs(favs) {
  try { localStorage.setItem("ka_favoriten", JSON.stringify(favs)); }
  catch (e) {}
}

function addFavorite() {
  if (!selectedRecipe) return;
  const favs = loadFavs();
  const btn = document.getElementById("favBtn");
  if (favs.some(f => f.name === selectedRecipe.name)) {
    btn.disabled = true;
    btn.textContent = "⭐ Ist schon in euren Favoriten";
    return;
  }
  const kopie = JSON.parse(JSON.stringify(selectedRecipe));
  kopie.tags = (kopie.tags || [])
    .filter(t => !String(t).includes("frisch entwickelt"));
  favs.unshift(kopie);
  saveFavs(favs);
  btn.disabled = true;
  btn.textContent = "⭐ Gespeichert! Zu finden unter „Favoriten“";
  speak("Als Favorit gespeichert.");
}

function renderFavoriten() {
  const favs = loadFavs();
  const list = document.getElementById("favList");
  list.innerHTML = "";
  document.getElementById("favInfo").textContent = favs.length
    ? "Ein Tipp auf „Nochmal kochen“ springt direkt zur Einkaufsliste."
    : "Noch keine Favoriten – nach dem letzten Kochschritt kannst du " +
      "Gerichte, die allen geschmeckt haben, hier verewigen.";

  favs.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h2");
    h.textContent = "⭐ " + r.name;
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = (r.time || "") + "  " + (r.tags || []).join(" · ");
    const cook = document.createElement("button");
    cook.className = "btn green";
    cook.textContent = "🍳 Nochmal kochen";
    cook.onclick = () => {
      selectedRecipe = r._skaliert ? r : skaliereRezept(r, portionFactor());
      document.getElementById("toShopBtn").disabled = false;
      buildShoppingList();
      goTab("einkauf");
    };
    const del = document.createElement("button");
    del.className = "btn ghost";
    del.textContent = "Entfernen";
    del.onclick = () => {
      favs.splice(idx, 1);
      saveFavs(favs);
      renderFavoriten();
    };
    card.appendChild(h); card.appendChild(p);
    card.appendChild(cook); card.appendChild(del);
    list.appendChild(card);
  });
}

// =====================================================
// PORTIONS-FAKTOR (Basis: 2 Erwachsene + 2 Kinder = 3.2)
// =====================================================
// HINWEIS: portionFactor() ist WEITER UNTEN definiert (profilbewusst).
// Die frühere Doppel-Definition an dieser Stelle wurde entfernt -
// zwei gleichnamige Funktionen sind eine klassische Fehlerquelle.

// =====================================================
// FREITEXT-AUSSCHLUSS (Vorlieben, Religion, Verzicht)
// -----------------------------------------------------
// Bewusst getrennt von den Allergie-Ankreuzfeldern: Ein reiner
// Wortvergleich ist nur so gut wie das eingegebene Wort und ersetzt
// keine Allergie-Sicherheit. Damit "Schwein" trotzdem nicht an Speck
// und Salami vorbeigeht, gibt es Synonymgruppen. Diese Liste MUSS mit
// AUSSCHLUSS_GRUPPEN in netlify/functions/rezept.mjs uebereinstimmen.
// =====================================================
const AUSSCHLUSS_GRUPPEN = [
  ["schwein","schweinefleisch","schweinefilet","schweinelende","speck",
   "bacon","schinken","salami","kassler","kasseler","chorizo","cabanossi",
   "leberkäse","leberkaese","bratwurst","mettwurst","mett","wiener",
   "frankfurter","schweineschmalz","pancetta","guanciale","prosciutto",
   "serranoschinken","gelatine","gelantine"],
  ["rind","rindfleisch","beef","steak","roastbeef","tafelspitz","ochse"],
  ["lamm","lammfleisch","hammel","lammkeule","lammfilet"],
  ["alkohol","wein","rotwein","weißwein","weisswein","bier","rum","cognac",
   "likör","likoer","sherry","portwein","wodka","whisky","whiskey",
   "calvados","marsala","weinbrand","amaretto","prosecco","sekt"],
  ["zwiebel","zwiebeln","schalotte","schalotten","frühlingszwiebel",
   "fruehlingszwiebel","lauchzwiebel","zwiebelpulver"],
  ["knoblauch","knofi","knoblauchzehe","knoblauchpulver"],
  ["pilz","pilze","champignon","champignons","pfifferling","steinpilz",
   "shiitake","austernpilz","egerling"],
  ["koriander","cilantro","koriandergrün","koriandergruen"],
  ["scharf","chili","chilli","peperoni","cayenne","sambal","harissa",
   "tabasco","jalapeno","jalapeño","chiliflocken"],
  ["innereien","leber","niere","nieren","herz","zunge","kutteln","bries"],
  ["kokos","kokosmilch","kokosnuss","kokosraspel","kokosöl","kokosoel"],
  ["rosine","rosinen","sultanine","sultaninen","korinthen"],
  ["oliven","olive","olivenpaste","tapenade"],
];

// Eingabefeld -> saubere Begriffsliste (pur & testbar)
function ausschlussParse(text) {
  return String(text || "")
    .split(/[,;]|\s+und\s+|\n/)
    .map((s) => s.trim().toLowerCase().slice(0, 40))
    .filter((s) => s.length > 1)
    .slice(0, 15);
}

// Begriff -> alle mitgemeinten Woerter (pur & testbar)
function ausschlussErweitern(begriffe) {
  const raus = new Set();
  for (const b of begriffe) {
    const w = String(b || "").toLowerCase().trim();
    if (w.length < 2) continue;
    raus.add(w);
    for (const gruppe of AUSSCHLUSS_GRUPPEN) {
      if (gruppe.some((g) => g === w || w.includes(g) || g.includes(w))) {
        gruppe.forEach((g) => raus.add(g));
      }
    }
  }
  return [...raus];
}

// Enthaelt ein Rezept einen ausgeschlossenen Begriff? (pur & testbar)
// Geprueft werden Zutaten UND Schritttexte - eine Zutat kann in der
// Anleitung auftauchen, ohne in der Liste zu stehen.
function ausschlussTrifft(recipe, begriffe) {
  if (!recipe || !begriffe || !begriffe.length) return null;
  const woerter = ausschlussErweitern(begriffe);
  const felder = [];
  (recipe.ingredients || []).forEach((i) => felder.push(String(i && i.name || "")));
  (recipe.steps || []).forEach((s) => felder.push(String(s && s.text || "")));
  felder.push(String(recipe.name || ""));
  const text = felder.join(" | ").toLowerCase();
  for (const w of woerter) if (text.includes(w)) return w;
  return null;
}

function ausschlussListe() {
  const feld = document.getElementById("ausschlussFeld");
  return ausschlussParse(feld ? feld.value : "");
}

function ausschlussSpeichern() {
  try {
    const feld = document.getElementById("ausschlussFeld");
    localStorage.setItem("fa_ausschluss", feld ? feld.value : "");
  } catch (e) {}
  if (typeof renderRecipes === "function") renderRecipes();
}

function ausschlussLaden() {
  try {
    const feld = document.getElementById("ausschlussFeld");
    const wert = localStorage.getItem("fa_ausschluss");
    if (feld && wert) feld.value = wert;
  } catch (e) {}
}

function selectedIntolerances() {
  const manuell = Array.from(document.querySelectorAll(".intol:checked"))
    .map(c => c.value);
  const ausProfil = (typeof mitglieder !== "undefined" ? mitglieder : [])
    .flatMap(m => m.allergien || []);
  return [...new Set(manuell.concat(ausProfil))];
}

// =====================================================
// ZEITGRUPPEN-FILTER (15-20 / 20-30 / 30-40 / ab 40)
// =====================================================
let timeMinSel = 0, timeMaxSel = 999;

function setTimeGroup(btn) {
  timeMinSel = parseInt(btn.dataset.min);
  timeMaxSel = parseInt(btn.dataset.max);
  document.querySelectorAll(".timebtn")
    .forEach(b => b.classList.toggle("active-time", b === btn));
  selectedRecipe = null;
  document.getElementById("toShopBtn").disabled = true;
  renderRecipes();
}

// =====================================================
// REZEPTE (harter Allergie-Filter + Ernaehrungs-Modus +
// weiches Stil-Ranking)
// =====================================================
// ---------- Rezept-Vorstellung bei Auswahl ----------
// Wunsch: Nach dem Antippen stellt die App das Rezept erst
// komplett vor (Name, Zeit, ZUTATEN in Familienmengen) - als
// Sprachausgabe UND sichtbar (Sprechblase) - damit die Familie
// sich endgueltig entscheiden kann, BEVOR es losgeht.
// Ehrliche Fehlertexte: unterscheidet lokal / Serverfehler / Netz.
// (Vorher log der Text "nur in der Online-Version" auch dann, wenn
//  man laengst online war und der SERVER einen Fehler hatte.)
function fehlermeldungRecherche(protokoll, httpStatus) {
  if (protokoll === "file:") {
    return "Lokal geöffnet – die Recherche braucht den Server. " +
      "Ich leite zur Online-Version weiter …";
  }
  if (httpStatus) {
    return "❌ Der Rezept-Server meldet Fehler " + httpStatus +
      ". Bitte in einer Minute nochmal versuchen.";
  }
  return "❌ Keine Verbindung zum Rezept-Server (Internet prüfen) – " +
    "bitte nochmal versuchen.";
}

function rezeptVorstellungsText(r, f) {
  const zutaten = (r.ingredients || [])
    .map((i) => smartQty(i, f)).join(", ");
  let s = `${r.name}, etwa ${r.timeMin} Minuten. `;
  s += `Ihr braucht: ${zutaten}. `;
  const variante = (r.varianten || [])[0];
  if (variante && variante.text) s += `Tipp: ${variante.text}`;
  // BUGFIX: Frueher endete die Ansage mit "Zum Einkaufen sagt: Auf die
  // Einkaufsliste." Die App sprach damit ihren eigenen Ausloeser aus -
  // der Echo-Schutz konnte danach nicht mehr unterscheiden, ob das
  // Mikrofon den Nutzer oder die App gehoert hat. Die Bedienhinweise
  // stehen jetzt SICHTBAR unter der Rezeptliste (#rezeptHinweis).
  return s.trim();
}

function rezeptVorstellen(r) {
  const hinweis = document.getElementById("rezeptHinweis");
  if (hinweis) hinweis.classList.remove("hidden");
  try {
    speak(rezeptVorstellungsText(selectedRecipe, 1), true, tonBereit);
  } catch (e) {
    speak(`${r.name} ausgewählt.`, true, tonBereit);
  }
}

/* FUSION37: KI-Text (Rezeptname, Tags, Varianten-Hinweise) wird vor
   jedem innerHTML-Einsatz entschaerft. Der Server kuerzt zwar, filtert
   aber kein HTML - ein Modell-Ausrutscher oder eine ueber die eigene
   Suchanfrage eingeschleuste Auszeichnung wuerde sonst ausgefuehrt.
   Test: Szenario S-06. */
function entschaerfeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

let stdRezepteOffen = false;
function toggleStdRezepte() {
  stdRezepteOffen = !stdRezepteOffen;
  renderRecipes();
}

function renderRecipes() {
  const intol = selectedIntolerances();
  const list = document.getElementById("recipeList");
  const resBox = document.getElementById("searchResults");
  list.innerHTML = "";
  resBox.innerHTML = "";
  let shown = 0, kiShown = 0, stdShown = 0;

  const standard = RECIPES.filter(r => !String(r.id || "").startsWith("ki_"));
  const ki = RECIPES.filter(r => String(r.id || "").startsWith("ki_"));
  // Freitext-Ausschluss gilt auch fuer die mitgelieferten Rezepte,
  // nicht nur fuer die recherchierten.
  const ausschluss = ausschlussListe();

  // --- Standard-Rezepte: filtern + nach Stil ranken ---
  const passende = [];
  standard.forEach(r => {
    if (r.allergens.some(a => intol.includes(a))) return; // Allergie: hart
    if (ausschlussTrifft(r, ausschluss)) return;          // Wunsch-Ausschluss
    if (r.timeMin < timeMinSel || r.timeMin > timeMaxSel) return;
    const d = dietPasses(r);
    if (!d.ok) return; // Ernaehrungsform passt nicht (auch nicht per Variante)
    passende.push({ r, hinweise: d.hinweise, score: styleScore(r) });
  });
  passende.sort((a, b) => b.score - a.score);

  passende.forEach(({ r, hinweise, score }) => {
    shown++;
    stdShown++;
    const div = document.createElement("div");
    div.className = "card recipe" + (selectedRecipe === r ? " selected" : "");
    let tags = r.tags.map(t =>
      `<span class="tag">${entschaerfeHtml(t)}</span>`).join("");
    if (score > 0)
      tags = `<span class="tag" style="background:#dde8d4;color:#4a6b3a">` +
        `✓ passt zu eurem Stil</span>` + tags;
    const hinweisHtml = hinweise.map(h =>
      `<p class="muted" style="color:#7e9c6f;margin:4px 0 0">` +
      `🔄 ${entschaerfeHtml(h)}</p>`).join("");
    div.innerHTML = `<h2>${entschaerfeHtml(r.name)}</h2>` +
      `<p class="muted">${entschaerfeHtml(r.time)} &nbsp; ${tags}</p>` +
      hinweisHtml;
    div.onclick = () => {
      selectedRecipe = r._skaliert ? r : skaliereRezept(r, portionFactor());
      document.getElementById("toShopBtn").disabled = false;
      renderRecipes();
      rezeptVorstellen(r);
    };
    list.appendChild(div);
  });

  // --- KI-Treffer: serverseitig gefiltert, nur Allergen defensiv pruefen ---
  ki.forEach(r => {
    if ((r.allergens || []).some(a => intol.includes(a))) return;
    if (ausschlussTrifft(r, ausschluss)) return;
    kiShown++;
    const div = document.createElement("div");
    div.className = "card recipe" + (selectedRecipe === r ? " selected" : "");
    const tags = (r.tags || [])
      .map(t => `<span class="tag">${entschaerfeHtml(t)}</span>`).join("");
    div.innerHTML = `<h2>${entschaerfeHtml(r.name)}</h2>` +
      `<p class="muted">${entschaerfeHtml(r.time)} &nbsp; ${tags}</p>`;
    div.onclick = () => {
      selectedRecipe = r._skaliert ? r : skaliereRezept(r, portionFactor());
      document.getElementById("toShopBtn").disabled = false;
      renderRecipes();
      rezeptVorstellen(r);
    };
    resBox.appendChild(div);
  });

  // FUSION v10: Standard-Rezepte hinter Aufklapp-Knopf (Wunsch)
  list.classList.toggle("hidden", !stdRezepteOffen);
  const stdBtn = document.getElementById("stdToggle");
  if (stdBtn) stdBtn.textContent = stdRezepteOffen
    ? "📖 Standard-Rezepte ausblenden"
    : `📖 Standard-Rezepte anzeigen (${stdShown})`;

  if (kiShown > 0) {
    const head = document.createElement("div");
    head.className = "card";
    head.style.borderLeft = "5px solid var(--accent)";
    head.innerHTML = "<h2>🔍 Deine Suchergebnisse</h2>" +
      "<p class='muted'>Frisch für euch entwickelt und sicherheitsgeprüft – " +
      "bei der nächsten Suche werden sie ersetzt.</p>";
    resBox.insertBefore(head, resBox.firstChild);
  }

  // --- Info-Text ---
  let info = "";
  if (intol.length)
    info += `Unverträglichkeiten aktiv: ${intol.join(", ")}. `;
  const map = requiredDiets();
  const dietKeys = Object.keys(map);
  if (dietKeys.length)
    info += `Ernährungsform (${kochModus === "familie"
      ? "ganze Familie" : kochModus}): ` +
      `${dietKeys.map(d => DIET_LABELS[d]).join(", ")}. `;
  if (shown === 0)
    info += "Kein passendes Standard-Rezept – ändere Zeit oder Koch-Modus " +
            "oder nutze die Recherche.";
  document.getElementById("filterInfo").textContent =
    info || "Alle Rezepte verfügbar.";
}

// =====================================================
// INTELLIGENTE MENGEN-RUNDUNG
// =====================================================
// Skalierte MENGE als Zahl+Einheit (fuer Text-Ersetzungen)
function smartMenge(ing, f) {
  const voll = smartQty(ing, f);
  const name = String(ing.name);
  return voll.endsWith(name)
    ? voll.slice(0, voll.length - name.length).trim() : voll;
}
function zahlVarianten(q) {
  const a = String(q);
  const b = a.replace(".", ",");
  return a === b ? [a] : [a, b];
}
/** Maskiert Sonderzeichen fuer den Einsatz in regulaeren Ausdruecken.
 *  RT2-05: Ohne Maskierung passte "1.5" auch auf "105" - dadurch wurden
 *  fremde Mengen im Schritttext ueberschrieben. */
function regexMaskiere(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Rezept EINMAL aufs Familienprofil festschreiben. Ersetzt auch
 * Mengenangaben in der Schritt-Prosa ("Koche 200 g Reis" ->
 * skalierte Menge), damit Vorstellung, Liste und Kochen
 * durchgehend DIESELBEN Zahlen sprechen. */
function skaliereRezept(r, f) {
  const kopie = JSON.parse(JSON.stringify(r));
  kopie._skaliert = true;
  (kopie.ingredients || []).forEach((ing) => {
    const neu = smartMenge(ing, f);
    (kopie.steps || []).forEach((s) => {
      ["text", "announce"].forEach((feld) => {
        if (!s[feld]) return;
        zahlVarianten(ing.qty).forEach((z) => {
          // Punkt/Komma als EINE Alternative, alles andere maskiert.
          const zahl = regexMaskiere(z).replace(/\\\./, "[.,]")
            .replace(/,/, "[.,]");
          const einheit = regexMaskiere(ing.unit);
          // F-019: Ohne Einheit ("2 Eier") frass das Muster das Leerzeichen
          // vor dem Namen mit ("2Eier"). Dann nur die ZAHL ersetzen und
          // verlangen, dass der Zutatenname folgt.
          const re = ing.unit === ""
            ? new RegExp("(^|[^\\d.,])" + zahl + "(?=\\s+" +
                regexMaskiere(ing.name) + ")", "g")
            : new RegExp(
              "(^|[^\\d.,])" + zahl + "\\s*" + einheit + "\\b", "g");
          s[feld] = s[feld].replace(re, "$1" + neu);
        });
      });
    });
    // Zutat selbst festschreiben (Anzeige danach mit Faktor 1)
    // Nur die ZAHL zurueckschreiben. Die Einheit bleibt, wie sie ist:
    // der Anzeigetext kann Zusaetze wie "kleine" enthalten (RT2-04),
    // die sonst in die Einheit wandern wuerden. Einheiten aendern sich
    // beim Skalieren ohnehin nie.
    const m = neu.match(/^([\d.,]+)/);
    if (m) ing.qty = Number(m[1].replace(",", "."));
  });
  return kopie;
}


// F-018: Glaettet eine Menge nur, wenn es der Familie hilft und die
// Abweichung klein bleibt. (pur & testbar)
function glaetteMenge(q, f) {
  // Ohne Umrechnung bleibt die Menge exakt so, wie sie im Rezept steht.
  if (Math.abs(f - 1) < 0.001) return Math.round(q * 10) / 10;
  const grenze = q * 0.1;
  // Von grob nach fein: die groebste Stufe gewinnt, die noch innerhalb
  // der 10-Prozent-Grenze liegt.
  for (const stufe of [100, 50, 25, 10, 5, 1]) {
    const gerundet = Math.round(q / stufe) * stufe;
    if (gerundet > 0 && Math.abs(gerundet - q) <= grenze) return gerundet;
  }
  // Nichts passt: genaue Menge, hoechstens eine Nachkommastelle.
  return Math.round(q * 10) / 10;
}

function smartQty(ing, f) {
  const q = ing.qty * f;
  const unit = ing.unit;

  if (unit === "Stück" || unit === "Bund") {
    const rounded = Math.ceil(q);
    const diff = rounded - q;
    // RT1-06/RT2-04: Hinweis nur, wenn wirklich eine Bruchmenge
    // vorliegt - "1 Bund kleine Petersilie" war Unsinn.
    let hint = "";
    const bruch = Math.abs(q - Math.round(q)) > 0.01;
    if (bruch && diff >= 0.5) hint = "kleine ";
    else if (bruch && q - Math.floor(q) >= 0.85) hint = "große ";
    const unitText = unit === "Bund" ? " Bund" : "";
    return `${rounded}${unitText} ${hint}${ing.name}`;
  }

  if (unit === "g" || unit === "ml") {
    // F-018: Frueher wurde IMMER auf ein 25er- bzw. 50er-Raster
    // gerundet - auch beim Faktor 1, also ohne jede Umrechnung.
    // Belegt: 105 g -> 100 g, 33 g -> 25 g, 7 g -> 25 g (das
    // 3,5-fache). Bei Mehl verschmerzbar, bei Hefe, Backpulver, Salz
    // oder Gewuerzen gefaehrlich - und unsichtbar, weil die Familie
    // die Abweichung nicht bemerkt.
    // Neue Regel: Ohne Umrechnung wird NICHTS veraendert. Mit
    // Umrechnung wird nur geglaettet, solange die Abweichung unter
    // 10 % bleibt; sonst gilt die genaue Menge.
    return `${glaetteMenge(q, f)} ${unit} ${ing.name}`;
  }

  if (unit === "Liter") {
    const rounded = Math.max(0.25, Math.round(q * 4) / 4);
    return `${String(rounded).replace(".", ",")} Liter ${ing.name}`;
  }

  if (unit === "EL" || unit === "TL") {
    const rounded = Math.max(0.5, Math.round(q * 2) / 2);
    return `${String(rounded).replace(".", ",")} ${unit} ${ing.name}`;
  }

  return `${Math.round(q * 10) / 10} ${unit} ${ing.name}`;
}

function buildShoppingList() {
  if (!selectedRecipe) return;
  const f = selectedRecipe._skaliert ? 1 : portionFactor();
  const ul = document.getElementById("shopList");
  ul.innerHTML = "";
  selectedRecipe.ingredients.forEach(ing => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.onchange = () => li.classList.toggle("done", cb.checked);
    const span = document.createElement("span");
    span.textContent = smartQty(ing, f);
    li.appendChild(cb); li.appendChild(span);
    ul.appendChild(li);
  });
  if (typeof mitglieder !== "undefined" && mitglieder.length) {
    document.getElementById("portionInfo").textContent =
      `(für ${mitglieder.length} Personen nach Profil – ` +
      `${summePE().toFixed(1)} Essens-Äquivalente)`;
  } else {
    const a = document.getElementById("adults").value;
    const k = document.getElementById("kids").value;
    document.getElementById("portionInfo").textContent =
      `(für ${a} Erwachsene + ${k} Kinder)`;
  }
}

function readShoppingList() {
  // BUGFIX: brach ohne gewaehltes Rezept STUMM ab und ignorierte
  // die per Sprache/Verbrauch hinzugefuegten Artikel komplett.
  const teile = [];
  if (selectedRecipe) {
    const f = portionFactor();
    teile.push(...selectedRecipe.ingredients.map((i) => smartQty(i, f)));
  }
  if (vState.liste.length) {
    teile.push(...vState.liste.map((e) => e.name));
  }
  if (!teile.length) {
    speak("Die Einkaufsliste ist leer.", true);
    return;
  }
  speak("Eure Einkaufsliste: " + teile.join(". "), true);
}

// ===== "Liste leeren" =====
function leereEinkaufsliste() {
  vState.liste = [];
  vbSave(); renderVerbrauch();
  const ul = document.getElementById("shopList");
  if (ul) ul.innerHTML = "";
  const info = document.getElementById("portionInfo");
  if (info) info.textContent = "";
  speak("Alles klar, die Liste ist leer.", true);
}
function leereEinkaufslisteKnopf() {
  if (confirm("Wirklich die ganze Einkaufsliste leeren?")) leereEinkaufsliste();
}
function leereEinkaufslisteVoice() {
  gvOneShot("Wirklich die ganze Liste leeren? Ja oder Nein?", (antwort) => {
    if (parseJaNein(antwort) === "ja") leereEinkaufsliste();
    else speak("Okay, die Liste bleibt.", true);
  });
}

// =====================================================
// KOCHMODUS (Schritt fuer Schritt mit Bestätigung)
// =====================================================
// ZWEISTUFIGE RECHERCHE (FUSION26): Recherchierte Rezepte kommen
// zunaechst OHNE Kochschritte - das haelt die Serveranfrage klein und
// beendet die chronischen 504-Fehler. Die Schritte werden erst geholt,
// wenn wirklich gekocht wird.
// WICHTIG fuer die Mengen-Kontinuitaet (FUSION15): Wir schicken die
// BEREITS SKALIERTEN Zutaten mit und lassen die KI genau diese Zahlen
// verwenden. Dadurch gibt es KEINEN zweiten Skalierungsdurchlauf, und
// der Waechter `_skaliert` bleibt unangetastet.
let schritteLaden = false;
async function schritteNachladen(rezept) {
  if (schritteLaden) return false;
  schritteLaden = true;
  const status = document.getElementById("stepText");
  if (status) status.textContent = "⏳ Ich schreibe die Kochschritte …";
  try {
    const r = await fetch("/api/rezept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modus: "schritte",
        device: deviceId(),
        kanal: (typeof syncCode !== "undefined" && syncCode)
          ? await syncKanalHole(syncCode) : "",
        gericht: rezept.name,
        minuten: rezept.timeMin,
        zutaten: (rezept.ingredients || []).map((i) => ({
          name: i.name, qty: i.qty, unit: i.unit })),
        ausschluss: ausschlussListe(),
      }),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    if (!d.success || !Array.isArray(d.steps) || !d.steps.length)
      throw new Error(d.error || "keine Schritte");
    rezept.steps = d.steps;
    return true;
  } catch (e) {
    if (status) status.textContent =
      "❌ Die Kochschritte konnten nicht geladen werden. " +
      "Bitte nochmal auf „Jetzt kochen“ tippen.";
    speak("Die Kochschritte konnten nicht geladen werden. " +
      "Bitte versuch es gleich nochmal.", true);
    return false;
  } finally { schritteLaden = false; }
}

async function startCooking() {
  if (!selectedRecipe) { goTab("rezepte"); return; }
  if (!(selectedRecipe.steps || []).length) {
    goTab("kochen");
    document.getElementById("recipeTitle").textContent = selectedRecipe.name;
    const ok = await schritteNachladen(selectedRecipe);
    if (!ok) return;
  }
  stepIndex = 0;
  goTab("kochen");
  document.getElementById("recipeTitle").textContent = selectedRecipe.name;
  initRecognition();
  const favBox = document.getElementById("favoriteBox");
  const favBtn = document.getElementById("favBtn");
  favBox.classList.add("hidden");
  favBtn.disabled = false;
  favBtn.textContent = "⭐ Das war lecker – als Favorit speichern";
  speak(`Los geht's mit ${selectedRecipe.name}. Sag jeweils fertig, ` +
        `wenn ein Schritt geschafft ist.`, true);
  kochSitzungStart(); // Bildschirm + Mikrofon bleiben an, solange gekocht wird
  showStep(); // laeuft sofort - unabhaengig von der Ansage
}

// Zutaten samt Menge heraussuchen, die in einem Schritt vorkommen
// (pur & testbar). Singular/Plural wird grob toleriert.
function zutatenImSchritt(step, recipe, f) {
  const text = String(step.text).toLowerCase();
  const treffer = [];
  (recipe.ingredients || []).forEach((ing) => {
    const name = String(ing.name).toLowerCase();
    const formen = [name];
    if (name.length > 4) formen.push(name.slice(0, -1));
    if (name.length > 5) formen.push(name.slice(0, -2));
    if (formen.some((fo) => text.includes(fo))) {
      treffer.push(smartQty(ing, f));
    }
  });
  return treffer;
}

// Nur Anzeige (ohne Sprache) - Bugfix: Anzeige war an TTS gekoppelt
function renderStep() {
  const steps = selectedRecipe.steps;
  if (stepIndex >= steps.length) return;
  document.getElementById("progressBar").style.width =
    Math.round((stepIndex / steps.length) * 100) + "%";
  document.getElementById("stepText").textContent =
    `Schritt ${stepIndex + 1} von ${steps.length}: ${steps[stepIndex].text}`;
  // Mengenangaben zum Schritt einblenden (skaliert aufs Familienprofil)
  const zt = zutatenImSchritt(steps[stepIndex], selectedRecipe, selectedRecipe._skaliert ? 1 : portionFactor());
  document.getElementById("stepZutaten").textContent =
    zt.length ? "📏 " + zt.join("  ·  ") : "";
  document.getElementById("timerBox").classList.add("hidden");
}

function showStep() {
  clearTimers();
  const steps = selectedRecipe.steps;
  if (stepIndex >= steps.length) return;
  const step = steps[stepIndex];

  renderStep();
  // Begleitspur inkl. Mengen - blockiert nichts
  const ztSpruch = zutatenImSchritt(step, selectedRecipe, selectedRecipe._skaliert ? 1 : portionFactor());
  speak(step.text + (ztSpruch.length
    ? " Mengen: " + ztSpruch.join(", ") + "." : ""));

  // Timer/Erinnerung starten SOFORT (v3) - nicht erst nach der Ansage
  if (step.timer) startTimer(step);
  else armReminder(true); // neuer Schritt -> Abstand zurueck auf 90 s
}

// Wann soll die Restzeit angesagt werden? (pur & testbar)
function restzeitAnsageFaellig(rest) {
  if (rest > 300) return rest % 120 === 0;   // > 5 Min: alle 2 Minuten
  if (rest >= 60) return rest % 60 === 0;    // 1-5 Min: jede Minute
  return rest === 20 || rest === 10;         // Endspurt: 20 s und 10 s
}

// In den letzten 20 Sekunden zaehlt die App nicht nur herunter, sondern
// fordert zur GARPROBE auf. Grund: Die letzten Sekunden entscheiden
// darueber, ob das Essen auf den Punkt gegart oder verkocht ist - und
// genau dann steht die Familie oft noch woanders. (pur & testbar)
function garprobeText(step, rest) {
  const wieViel = "Noch " + rest + " Sekunden. ";
  const eigen = step && step.announce ? String(step.announce).trim() : "";
  if (eigen) return wieViel + "Schau jetzt nach: " + eigen;
  return wieViel + "Schau jetzt nach, ob es gar ist – lieber einmal zu " +
    "früh probieren als verkochen lassen.";
}


function startTimer(step) {
  let remaining = step.timer;
  const box = document.getElementById("timerBox");
  box.classList.remove("hidden");
  const render = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    box.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
  };
  render();
  timerRest = remaining;
  timerInterval = setInterval(() => {
    remaining--;
    timerRest = remaining;
    render();
    // Wunsch: Erinnerungsstimme meldet sich alle 45 Sekunden -
    // auch waehrend ein Koch-Timer laeuft (kurze Restzeit-Ansage)
    // Gestaffelte Restzeit-Ansagen (Feedback 23.07.: "sonst nervts")
    // > 5 Min: alle 2 Min · 1-5 Min: jede Minute · < 1 Min: 30 s + 10 s
    if (restzeitAnsageFaellig(remaining)) {
      if (remaining === 20) {
        speak(garprobeText(step, remaining));
      } else {
        const mm = Math.floor(remaining / 60);
        const ss = remaining % 60;
        speak("Noch " + (mm ? mm + (mm === 1 ? " Minute" : " Minuten") +
          (ss ? " " + ss : "") : ss + " Sekunden") + ".");
      }
    }
    if (remaining <= 0) {
      timerRest = 0;
      clearInterval(timerInterval);
      box.textContent = "⏱ 0:00 – Zeit ist um!";
      speak(step.announce || "Die Zeit ist um.", true);
      armReminder(true); // Timer vorbei -> Abstand zurueck auf 90 s
    }
  }, 1000);
}

// Wie lange dauert ein Schritt voraussichtlich? (pur & testbar)
// Schritte mit Timer: dessen Laufzeit. Schritte ohne Timer: die
// restliche Gesamtzeit des Rezepts, gleichmaessig verteilt.
// Frueher stand hier eine starre 90 - unabhaengig davon, ob der Schritt
// "Zwiebel wuerfeln" (30 s) oder "Teig gehen lassen" (45 min) war.
function schrittDauerSek(recipe, index) {
  const steps = (recipe && recipe.steps) || [];
  const step = steps[index];
  if (!step) return 90;
  if (step.timer > 0) return step.timer;
  const gesamt = Math.max(1, Number(recipe.timeMin) || 30) * 60;
  let mitTimer = 0, ohneTimer = 0;
  steps.forEach((st) => {
    if (st && st.timer > 0) mitTimer += st.timer; else ohneTimer++;
  });
  if (!ohneTimer) return 90;
  const rest = Math.max(60, gesamt - mitTimer);
  return Math.min(600, Math.max(45, Math.round(rest / ohneTimer)));
}

// Wann soll die naechste "Sag fertig"-Erinnerung kommen? (pur & testbar)
// Erste Erinnerung bei drei Vierteln der veranschlagten Schrittdauer -
// vorher waere sie Bevormundung. Danach hoechstens einmal pro Minute,
// damit die Vorgabe "maximal zweimal pro Minute" sicher eingehalten ist.
function reminderAbstandSek(recipe, index, stufe) {
  if (stufe > 0) return [60, 90, 120][Math.min(stufe - 1, 2)];
  return Math.max(40, Math.round(schrittDauerSek(recipe, index) * 0.75));
}

function armReminder(neuStarten) {
  clearTimeout(reminderTimeout);
  if (neuStarten) reminderStufe = 0;
  const sek = reminderAbstandSek(selectedRecipe, stepIndex, reminderStufe);
  reminderTimeout = setTimeout(() => {
    speak("Kleine Erinnerung: Sag fertig oder erledigt, wenn du soweit " +
          "bist. Sag wiederhole, wenn ich den Schritt nochmal sagen soll.");
    reminderStufe++;
    armReminder();
  }, sek * 1000);
}

let lastConfirm = 0;

function confirmStep() {
  const now = Date.now();
  if (now - lastConfirm < 1500) return;
  lastConfirm = now;

  clearTimers();
  const steps = selectedRecipe ? selectedRecipe.steps : [];
  if (stepIndex < steps.length - 1) {
    stepIndex++;
    showStep();
    flashStep();
  } else {
    document.getElementById("progressBar").style.width = "100%";
    document.getElementById("stepText").textContent =
      "🎉 Alles geschafft! Guten Appetit!";
    document.getElementById("favoriteBox").classList.remove("hidden");
    kochSitzungEnde(); // Rezept beendet -> Bildschirm darf wieder schlafen
    speak("Alles geschafft. Du bist großartig. Guten Appetit! " +
          "Wenn es allen geschmeckt hat, kannst du das Gericht " +
          "jetzt als Favorit speichern.", true);
  }
}

function repeatStep() {
  lastConfirm = Date.now();
  showStep();
  flashStep();
}

// NEU: ein Schritt zurueck. Fehlte bisher komplett - es gab nur
// vorwaerts (confirmStep) und nochmal (repeatStep).
function prevStep() {
  lastConfirm = Date.now();
  clearTimers();
  if (!selectedRecipe || !selectedRecipe.steps) return;
  if (stepIndex > 0) {
    stepIndex--;
    document.getElementById("favoriteBox").classList.add("hidden");
    // Nach "Alles geschafft" zurueckgeblaettert: Rezept laeuft wieder.
    if (!kochAktiv) kochSitzungStart();
    showStep();
    flashStep();
  } else {
    speak("Das ist schon der erste Schritt.", true);
    renderStep();
    flashStep();
  }
}

// =====================================================
// KI-REZEPTRECHERCHE (laeuft nur in der Online-Version)
// =====================================================
let rechercheZyklen = 0;
let rechercheZweiterAnlauf = 0;
let letzterWunsch = null;
let bisherigeNamen = [];

function updateRetryButton() {
  const retryBtn = document.getElementById("retryBtn");
  const rest = 3 - rechercheZyklen;
  if (rest > 0) {
    retryBtn.classList.remove("hidden");
    retryBtn.disabled = false;
    retryBtn.textContent =
      `🔄 Andere Vorschläge (noch ${rest}× möglich)`;
  } else {
    retryBtn.disabled = true;
    retryBtn.textContent = "🔄 Limit erreicht – ändere deine Anfrage";
  }
}

async function rechercheRezept(istWiederholung) {
  const status = document.getElementById("searchStatus");
  const btn = document.getElementById("searchBtn");
  const retryBtn = document.getElementById("retryBtn");
  const wunsch = document.getElementById("searchWish").value.trim();

  if (wunsch !== letzterWunsch) {
    rechercheZyklen = 0;
    bisherigeNamen = [];
    letzterWunsch = wunsch;
    istWiederholung = false;
  }
  if (istWiederholung) {
    if (rechercheZyklen >= 3) return;
    rechercheZyklen++;
  }

  btn.disabled = true;
  retryBtn.disabled = true;
  status.textContent =
    "🔍 Recherchiere 3 Rezeptvorschläge … (etwa 5 Sekunden)";

  const ernaehrungsformen = Object.keys(requiredDiets());

  try {
    const r = await fetch("/api/rezept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modus: "kurz",           // Stufe 1: ohne Kochschritte (siehe startCooking)
        device: deviceId(),
        kanal: (typeof syncCode !== "undefined" && syncCode)
          ? await syncKanalHole(syncCode) : "",
        wunsch: wunsch,
        unvertraeglichkeiten: selectedIntolerances(),
        ernaehrungsformen: ernaehrungsformen,
        stile: familienStile,
        minuten_min: timeMinSel,
        minuten_max: timeMaxSel,
        vermeide: bisherigeNamen,
        ausschluss: ausschlussListe(),
      }),
    });
    if (r.status === 429) {
      // Tageskontingent erreicht - freundlich erklaeren statt Fehler
      let d = null;
      try { d = await r.json(); } catch (e) {}
      const meldung = (d && d.error) ||
        "Das Tageskontingent an KI-Recherchen ist erreicht – morgen " +
        "gibt es frische Ideen!";
      status.innerHTML = "⏳ " + entschaerfeHtml(meldung) +
        ' <a href="/plus.html">(Mit Familien-Plus: unbegrenzt)</a>';
      speak(meldung, true);
      btn.disabled = false;
      return;
    }
    if (!r.ok) {
      // Serverfehler sind meist Ausrutscher: EINMAL still nachfassen.
      // Bis zu ZWEI stille Wiederholungen: Der Server bricht nach 9 s
      // selbst ab, ein zweiter Anlauf ist danach fast immer erfolgreich.
      // Drei Versuche a ~7 s bleiben fuer die Familie ertraeglich und
      // ersparen ihr die Fehlermeldung fast vollstaendig.
      if ((r.status === 502 || r.status === 503 || r.status === 504)
          && rechercheZweiterAnlauf < 2) {
        rechercheZweiterAnlauf++;
        status.textContent = "🔄 Der Server war zu langsam – Versuch " +
          (rechercheZweiterAnlauf + 1) + " von 3 …";
        setTimeout(() => rechercheRezept(istWiederholung), 1500);
        return;
      }
      rechercheZweiterAnlauf = 0;
      // DIAGNOSE: Kommt eine lesbare Antwort von UNSERER Funktion oder
      // hat die Plattform die Verbindung gekappt? Vorher sah beides
      // gleich aus ("Fehler 504") und war nicht auseinanderzuhalten.
      let d = null;
      try { d = await r.json(); } catch (e) {}
      status.textContent = d && d.quelle === "app"
        ? "❌ " + d.error + " (Server brauchte " +
          Math.round((d.ms || 0) / 1000) + " s)"
        : fehlermeldungRecherche(location.protocol, r.status) +
          " [Verbindung vom Anbieter gekappt]";
      btn.disabled = false;
      return;
    }
    rechercheZweiterAnlauf = 0;
    const data = await r.json();

    if (!data.success) {
      status.textContent = "❌ " + (data.error || "Keine Antwort erhalten.");
      btn.disabled = false;
      return;
    }

    for (let i = RECIPES.length - 1; i >= 0; i--) {
      if (String(RECIPES[i].id || "").startsWith("ki_")) {
        RECIPES.splice(i, 1);
      }
    }

    const vorschlaege = data.recipes || (data.recipe ? [data.recipe] : []);
    let filterAnpassen = false;
    for (let i = vorschlaege.length - 1; i >= 0; i--) {
      const rec = vorschlaege[i];
      rec.id = "ki_" + Date.now() + "_" + i;
      rec.time = "ca. " + rec.timeMin + " Min.";
      rec.tags = ["🆕 frisch entwickelt"].concat(rec.tags || []);
      // Defensive Defaults, falls der Server Felder nicht mitliefert
      rec.steps = Array.isArray(rec.steps) ? rec.steps : [];
      rec.allergens = rec.allergens || [];
      rec.diet = rec.diet || ernaehrungsformen.slice();
      rec.varianten = rec.varianten || [];
      rec.stile = rec.stile || [];
      if (rec.timeMin < timeMinSel || rec.timeMin > timeMaxSel)
        filterAnpassen = true;
      RECIPES.unshift(rec);
    }

    if (filterAnpassen) {
      timeMinSel = 0; timeMaxSel = 999;
      document.querySelectorAll(".timebtn").forEach((b) =>
        b.classList.toggle("active-time", b.dataset.min === "0"));
    }

    selectedRecipe = null;
    document.getElementById("toShopBtn").disabled = true;
    renderRecipes();
    const erste = document.querySelector("#searchResults .recipe");
    if (erste) erste.scrollIntoView({ behavior: "smooth", block: "center" });
    status.textContent = "✅ " + vorschlaege.length +
      " unterschiedliche Vorschläge gefunden und sicherheitsgeprüft – " +
      "tippe dein Lieblingsrezept an. (Zutaten bitte kurz gegenprüfen.)";

    vorschlaege.forEach((v) => bisherigeNamen.push(v.name));
    updateRetryButton();
  } catch (e) {
    status.textContent =
      fehlermeldungRecherche(location.protocol, 0);
  }
  btn.disabled = false;
}

function flashStep() {
  const el = document.getElementById("stepText");
  el.style.transition = "background .15s";
  el.style.background = "#dff3e0";
  el.style.borderRadius = "8px";
  setTimeout(() => { el.style.background = "transparent"; }, 450);
}

function clearTimers() {
  // Die Display-Sperre haengt NICHT mehr an den Timern: clearTimers()
  // laeuft bei jedem Schritt - frueher fiel die Sperre dadurch schon
  // nach Schritt 1. Sie endet jetzt nur mit kochSitzungEnde().
  timerRest = 0;
  clearInterval(timerInterval);
  clearTimeout(reminderTimeout);
}
