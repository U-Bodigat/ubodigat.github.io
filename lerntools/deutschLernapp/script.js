let fragen = [{
        frage: "Was ist die Mehrzahl von 'Haus'?",
        antworten: ["Häuser", "Heuser", "Häusen"],
        korrekteAntwort: 0,
        bereitsBeantwortet: false
    },
    {
        frage: "Wie nennt man das Gegenteil von 'alt'?",
        antworten: ["Jung", "Neu", "Früh"],
        korrekteAntwort: 0,
        bereitsBeantwortet: false
    },
    {
        frage: "Wie schreibt man 'Apfel'?",
        antworten: ["Apfel", "Appel", "Apfel"],
        korrekteAntwort: 2,
        bereitsBeantwortet: false
    },
    {
        frage: "Welches Wort ist ein Nomen?",
        antworten: ["Laufen", "Schnell", "Auto"],
        korrekteAntwort: 2,
        bereitsBeantwortet: false
    },
    {
        frage: "Wie nennt man das weibliche Haustier von 'Hund'?",
        antworten: ["Hundin", "Hündin", "Hundchen"],
        korrekteAntwort: 1,
        bereitsBeantwortet: false
    },
    {
        frage: "Wie nennt man das Gegenteil von 'Tag'?",
        antworten: ["Morgen", "Nacht", "Abend"],
        korrekteAntwort: 1,
        bereitsBeantwortet: false
    }
];

let punktestand = 0;
let aktuelleFrageIndex = 0;

function anzeigen() {
    document.getElementById("frage").innerHTML = fragen[aktuelleFrageIndex].frage;
    document.getElementById("antworten").innerHTML = "";
    fragen[aktuelleFrageIndex].antworten.forEach(function(antwort, index) {
        let radio = document.createElement("input");
        radio.setAttribute("type", "radio");
        radio.setAttribute("name", "antworten");
        radio.setAttribute("value", index);
        radio.setAttribute("id", "antwort" + index);
        let label = document.createElement("label");
        label.setAttribute("for", "antwort" + index);
        label.innerHTML = antwort;
        let br = document.createElement("br");
        document.getElementById("antworten").appendChild(radio);
        document.getElementById("antworten").appendChild(label);
        document.getElementById("antworten").appendChild(br);
    });
}

function antwortAuswerten() {
    let ausgewaehlteAntwort = document.querySelector('input[name="antworten"]:checked');
    if (ausgewaehlteAntwort === null) {
        alert("Bitte wählen Sie eine Antwort aus.");
        return;
    }
    if (ausgewaehlteAntwort.value == fragen[aktuelleFrageIndex].korrekteAntwort) {
        punktestand++;
        alert("Richtig!");
    } else {
        punktestand--;
        let korrekteAntwort = fragen[aktuelleFrageIndex].antworten[fragen[aktuelleFrageIndex].korrekteAntwort];
        alert("Leider falsch! Die korrekte Antwort lautet: " + korrekteAntwort);
    }
    fragen[aktuelleFrageIndex].bereitsBeantwortet = true;
    anzeigenPunktestand();
    aktuelleFrageIndex++;
    if (aktuelleFrageIndex < fragen.length