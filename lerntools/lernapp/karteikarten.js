"use strict";
let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
let eintraege = Object.values(dictionary);
let runde = [];
let falschGemerkt = [];
let index = 0;
let rundeGestartet = false;

function ladeKartenrunde(nurFalsche = false) {
    falschGemerkt = nurFalsche ? falschGemerkt : [];
    index = 0;
    runde = nurFalsche && falschGemerkt.length ?
        shuffle([...falschGemerkt]) :
        shuffle([...Object.values(dictionary)]);
    falschGemerkt = [];
    zeigeKarteikarte();
    document.getElementById("lernbuttons").style.display = "flex";
    document.getElementById("startHinweis").style.display = "none";
}

function zeigeKarteikarte() {
    const fortschrittText = document.getElementById("fortschrittText");
    const fortschrittFuellung = document.getElementById("fortschrittFuellung");
    const vorder = document.getElementById("vorderseite");
    const rueck = document.getElementById("rueckseite");
    if (index >= runde.length) {
        zeigeErgebnisfenster();
        return;
    }
    const karte = runde[index];
    const frageOderAntwort = Math.random() < 0.5;
    const vorderseite = frageOderAntwort ? karte.question : karte.answer;
    const rueckseite = frageOderAntwort ? karte.answer : karte.question;

    vorder.innerText = vorderseite;
    rueck.innerText = rueckseite;

    vorder.classList.add("aktiv");
    rueck.classList.remove("aktiv");

    fortschrittText.innerText = `Karte ${index + 1} von ${runde.length}`;
    fortschrittFuellung.style.width = `${((index + 1) / runde.length) * 100}%`;
}

function antwort(gewusst) {
    if (!gewusst) falschGemerkt.push(runde[index]);
    index++;
    zeigeKarteikarte();
}

function zeigeErgebnisfenster() {
    const overlay = document.getElementById("rundeBeendetOverlay");
    overlay.style.display = "flex";
}

function neuStarten(nurFalsche) {
    document.getElementById("rundeBeendetOverlay").style.display = "none";
    ladeKartenrunde(nurFalsche);
}

window.addEventListener("DOMContentLoaded", function() {
    const karteikarte = document.getElementById("karteikarte");
    const vorder = document.getElementById("vorderseite");
    const rueck = document.getElementById("rueckseite");
    const lernbuttons = document.getElementById("lernbuttons");
    const startHinweis = document.getElementById("startHinweis");

    if (!karteikarte) return;

    karteikarte.addEventListener("click", function() {
        if (!rundeGestartet) {
            rundeGestartet = true;
            ladeKartenrunde(false);
            if (lernbuttons) lernbuttons.style.display = "flex";
            if (startHinweis) startHinweis.style.display = "none";
        } else {
            vorder.classList.toggle("aktiv");
            rueck.classList.toggle("aktiv");
        }
    });
});

function shuffle(array) {
    let a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

window.antwort = antwort;
window.neuStarten = neuStarten;

function zeigeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'flex';
}

function schließeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'none';
}



// Arbeitsblatt erstellen

function erstelleDynamischeAufgabe(vokabeln, index, usedIndexes = []) {
    const aufgabentypen = [
        "deutsch-nach-englisch",
        "englisch-nach-deutsch",
        "lueckentext",
        "satz"
    ];
    let moeglicheTypen = aufgabentypen.slice();
    if (vokabeln.length < 2) moeglicheTypen = moeglicheTypen.filter(t => t !== "satz");
    let typ = moeglicheTypen[Math.floor(Math.random() * moeglicheTypen.length)];
    const vok = vokabeln[index];
    if (typ === "deutsch-nach-englisch") {
        return {
            frage: `Was heißt <b>${vok.question}</b> auf Englisch?`,
            loesung: vok.answer
        };
    }
    if (typ === "englisch-nach-deutsch") {
        return {
            frage: `Was heißt <b>${vok.answer}</b> auf Deutsch?`,
            loesung: vok.question
        };
    }
    if (typ === "lueckentext") {
        let satzTemplates = [
            `Ich habe gestern ein(e) <b>LÜCKE</b> gesehen.`,
            `Das Wort <b>LÜCKE</b> bedeutet etwas Besonderes.`,
            `Kannst du <b>LÜCKE</b> erklären?`
        ];
        let zufall = Math.floor(Math.random() * satzTemplates.length);
        let satz = satzTemplates[zufall].replace("LÜCKE", vok.question);
        let satzMitLuecke = satz.replace(vok.question, "_______");
        return {
            frage: `Ergänze das fehlende Wort: ${satzMitLuecke}`,
            loesung: vok.question
        };
    }
    if (typ === "satz" && vokabeln.length >= 2) {
        let andereIndexes = vokabeln.map((_, idx) => idx).filter(idx => idx !== index && !usedIndexes.includes(idx));
        let idx2 = andereIndexes[Math.floor(Math.random() * andereIndexes.length)];
        let vok2 = vokabeln[idx2];
        return {
            frage: `Bilde einen Satz mit den Wörtern <b>${vok.question}</b> und <b>${vok2.question}</b>!`,
            loesung: `z.B.: "${vok.question} und ${vok2.question} sind wichtige Wörter."`
        };
    }
    return {
        frage: `Was heißt <b>${vok.question}</b> auf Englisch?`,
        loesung: vok.answer
    };
}

function isGerman(text) {
    return /[äöüß]|der|die|das|und|ein|ist|mit|zu|auf|dem|des|im|am/i.test(text);
}

const satzBausteine = {
    Deutsch: [
        ["Ich", "Du", "Er", "Sie", "Wir", "Ihr", "Sie"],
        ["trinke", "esse", "mag", "habe", "gehe", "finde", "kaufe"],
        ["das Wasser", "das Brot", "einen Apfel", "den Hund", "das Auto"],
        ["am Morgen", "am Abend", "im Park", "zu Hause", "heute"]
    ],
    Englisch: [
        ["I", "You", "He", "She", "We", "They"],
        ["drink", "eat", "like", "have", "go", "find", "buy"],
        ["the water", "the bread", "an apple", "the dog", "the car"],
        ["in the morning", "in the evening", "in the park", "at home", "today"]
    ]
};

function generiereSatzBausteineMitLoesung(vokabel, sprache) {
    let arr = satzBausteine[sprache].map(a => a.slice());
    if (!arr[1].includes(vokabel)) arr[1][Math.floor(Math.random() * arr[1].length)] = vokabel;
    let bausteine = arr.map(teil => teil[Math.floor(Math.random() * teil.length)]);
    let gemischt = bausteine.slice();
    for (let i = gemischt.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gemischt[i], gemischt[j]] = [gemischt[j], gemischt[i]];
    }
    let loesung = bausteine.join(" ") + (sprache === "Deutsch" ? "." : ".");
    return { aufgabeWorte: gemischt, loesung };
}

function generiereArbeitsblatt() {
    const dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
    if (Object.keys(dictionary).length === 0) {
        alert("Es sind keine Vokabeln vorhanden!");
        return;
    }
    const vokabeln = Object.values(dictionary).sort(() => Math.random() - 0.5);
    const aufgaben = [];
    const aufgabenLösungen = [];
    let nummer = 1;

    for (let vok of vokabeln) {
        let frageText = '',
            loesungText = '';
        if (isGerman(vok.question) && !isGerman(vok.answer)) {
            frageText = `Übersetze <b>${vok.question}</b> ins Englische:`;
            loesungText = vok.answer;
        } else if (!isGerman(vok.question) && isGerman(vok.answer)) {
            frageText = `Übersetze <b>${vok.question}</b> ins Deutsche:`;
            loesungText = vok.answer;
        } else {
            frageText = `Übersetze <b>${vok.question}</b>:`;
            loesungText = vok.answer;
        }
        aufgaben.push(`
            <div class="aufgaben-card">
                <span class="nr">${nummer}.</span>
                <div class="frage-feld-wrap">
                    <span class="frage">${frageText}</span>
                    <span class="feld"></span>
                </div>
            </div>
        `);
        aufgabenLösungen.push({
            nummer: nummer,
            frage: frageText,
            loesung: loesungText
        });
        nummer++;

        let sprache = isGerman(vok.question) ? "Deutsch" : "Englisch";
        let vokabelImSatz = sprache === "Deutsch" ? vok.question : vok.answer;
        let { aufgabeWorte, loesung } = generiereSatzBausteineMitLoesung(vokabelImSatz, sprache);
        aufgaben.push(`
            <div class="aufgaben-card">
                <span class="nr">${nummer}.</span>
                <div class="frage-feld-wrap">
                    <span class="frage">
                        Bilde einen sinnvollen Satz aus diesen Wörtern (${sprache}): 
                        <b>${aufgabeWorte.join('</b>, <b>')}</b>
                    </span>
                    <span class="feld"></span>
                </div>
            </div>
        `);
        aufgabenLösungen.push({
            nummer: nummer,
            frage: `Bilde einen sinnvollen Satz aus diesen Wörtern (${sprache}): <b>${aufgabeWorte.join('</b>, <b>')}</b>`,
            loesung: loesung
        });
        nummer++;
    }
    const loesungenJSON = JSON.stringify(aufgabenLösungen);

    const arbeitsblattHTML = `
        <html>
        <head>
            <title>Arbeitsblatt - Vokabeln</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
            <style>
                html, body { height: 100%; }
                body { min-height: 100vh; font-family: 'Inter', Arial, sans-serif; background: #f4f6fb; color: #212738; margin: 0; padding: 0; }
                .arbeitsblatt-container { max-width: 900px; margin: 40px auto 32px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(24,56,115,0.15); padding: 48px 40px 40px 40px;}
                .logo { display: block; margin: 0 auto 14px auto; width: 160px; }
                h1 { text-align: center; margin-bottom: 18px; font-weight: 800; letter-spacing: 0.5px; color: #0a3161; font-size: 2.2rem; }
                .arbeitsblatt-btns { text-align:center; margin-bottom: 28px;}
                .druck-btn { display: inline-block; margin: 0 10px 0 0; background: linear-gradient(90deg, #16c57b 60%, #31b9c8 100%); color: #fff; font-size: 1.1rem; font-weight: bold; border: none; border-radius: 8px; padding: 14px 34px; box-shadow: 0 3px 12px rgba(24,56,115,0.12); cursor: pointer; transition: background 0.2s; }
                .druck-btn:hover { background: linear-gradient(90deg, #12915e 60%, #0d7e8d 100%); }
                .aufgaben-card { display: flex; align-items: center; background: #f9fafe; border-radius: 16px; margin: 14px 0; padding: 18px 22px; box-shadow: 0 3px 8px rgba(60,80,130,0.06); font-size: 1.1rem; }
                .aufgaben-card .nr { font-weight: bold; color: #3467c7; margin-right: 20px; font-size: 1.3rem; flex-shrink: 0; line-height: 1.7; }
                .frage-feld-wrap { display: flex; align-items: center; flex: 1; min-width: 0; gap: 24px; }
                .frage { flex: 1 1 0%; min-width: 0; word-break: break-word; line-height: 1.6; }
                .feld { border-bottom: 2px solid #b6b8c3; width: 220px; min-width: 120px; margin-left: 0; flex-shrink: 0; height: 26px; vertical-align: middle; display: inline-block; position: relative; top: 0;}
                @media print { .druck-btn { display: none !important; } body { background: #fff !important; } .arbeitsblatt-container { box-shadow: none; border-radius: 0; } }
            </style>
        </head>
        <body>
            <div class="arbeitsblatt-container">
                <img class="logo" src="/bilder/ubodigatlogobreit.png" alt="Logo">
                <h1>Arbeitsblatt: Vokabeln</h1>
                <div class="arbeitsblatt-btns">
                    <button class="druck-btn" onclick="window.print()">🖨️ Drucken</button>
                    <button class="druck-btn" onclick="zeigeLoesungsblatt()">🔑 Lösungsblatt anzeigen</button>
                </div>
                ${aufgaben.join("")}
            </div>
            <script>
                function zeigeLoesungsblatt() {
                    const aufgabenLösungen = ${loesungenJSON};
                    const lösungen = [];
                    for (let i = 0; i < aufgabenLösungen.length; i++) {
                        const eintrag = aufgabenLösungen[i];
                        lösungen.push(
                            '<div class="aufgaben-card">' +
                            '<span class="nr">' + eintrag.nummer + '.</span>' +
                            '<div class="frage-feld-wrap"><span class="frage">' + eintrag.frage + '</span>' +
                            '<span class="feld" style="border:none;padding-left:16px;color:#18b57d;font-weight:bold;">' + (eintrag.loesung || "") + '</span></div></div>'
                        );
                    }
                    const loesungsblattHTML = '<html><head>' +
                        '<title>Lösungsblatt - Vokabeln</title>' +
                        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">' +
                        '<style>html,body{height:100%;}body{min-height:100vh;font-family:Inter,Arial,sans-serif;background:#fff;color:#212738;margin:0;padding:0;}.arbeitsblatt-container{max-width:900px;margin:40px auto 32px auto;background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(24,56,115,0.15);padding:48px 40px 40px 40px;}.logo{display:block;margin:0 auto 14px auto;width:160px;}h1{text-align:center;margin-bottom:18px;font-weight:800;letter-spacing:0.5px;color:#18b57d;font-size:2.2rem;}.arbeitsblatt-btns{text-align:center;margin-bottom:28px;}.druck-btn{display:inline-block;margin:0 10px 0 0;background:linear-gradient(90deg,#18b57d 60%,#43d2c8 100%);color:#fff;font-size:1.1rem;font-weight:bold;border:none;border-radius:8px;padding:14px 34px;box-shadow:0 3px 12px rgba(24,56,115,0.12);cursor:pointer;transition:background 0.2s;}.druck-btn:hover{background:linear-gradient(90deg,#089158 60%,#1e8380 100%);}.aufgaben-card{display:flex;align-items:center;background:#f9fafe;border-radius:16px;margin:14px 0;padding:18px 22px;box-shadow:0 3px 8px rgba(60,80,130,0.06);font-size:1.1rem;}.aufgaben-card .nr{font-weight:bold;color:#18b57d;margin-right:20px;font-size:1.3rem;flex-shrink:0;line-height:1.7;}.frage-feld-wrap{display:flex;align-items:center;flex:1;min-width:0;gap:24px;}.frage{flex:1 1 0%;min-width:0;word-break:break-word;line-height:1.6;}.feld{border-bottom:2px solid #b6b8c3;width:220px;min-width:120px;margin-left:0;flex-shrink:0;height:26px;vertical-align:middle;display:inline-block;position:relative;top:0;}@media print{.druck-btn{display:none!important;}body{background:#fff!important;}.arbeitsblatt-container{box-shadow:none;border-radius:0;}}</style></head>' +
                        '<body><div class="arbeitsblatt-container">' +
                        '<img class="logo" src="/bilder/ubodigatlogobreit.png" alt="Logo">' +
                        '<h1>Lösungsblatt</h1>' +
                        '<div class="arbeitsblatt-btns">'+
                        '<button class="druck-btn" onclick="window.print()">🖨️ Drucken</button>'+
                        '</div>'+
                        lösungen.join('') +
                        '</div></body></html>';
                    const w = window.open('', '_blank');
                    w.document.write(loesungsblattHTML);
                    w.document.close();
                }
            </script>
        </body>
        </html>
    `;
    const w = window.open("", "_blank");
    w.document.write(arbeitsblattHTML);
    w.document.close();
}