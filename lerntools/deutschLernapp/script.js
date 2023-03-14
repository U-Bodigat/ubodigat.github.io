// Definieren Sie ein Array mit Fragen-Objekten
let fragen = [{
        frage: "Was ist die Hauptstadt von Frankreich?",
        antworten: ["Berlin", "Paris", "Madrid", "Rom"],
        korrekteAntwort: 1
    },
    {
        frage: "Wer schrieb das Buch 'Die Verwandlung'?",
        antworten: ["Franz Kafka", "Friedrich Nietzsche", "Thomas Mann", "Hermann Hesse"],
        korrekteAntwort: 0
    },
    {
        frage: "Was ist die höchste Zahl in einer klassischen Roulette-Spiel?",
        antworten: ["31", "36", "50", "100"],
        korrekteAntwort: 1
    }
];

// Initialisieren Sie die Variablen für Punkte und aktuelle Frage
let punkte = 0;
let aktuelleFrage = 0;

// Funktion zum Laden der aktuellen Frage
function ladeFrage() {
    // Elemente für Frage und Antworten im HTML-Dokument finden
    let frageElement = document.getElementById("frage");
    let antwortenElement = document.getElementById("antworten");

    // Frage in das HTML-Element einfügen
    frageElement.textContent = fragen[aktuelleFrage].frage;

    // Antwort-Buttons im HTML-Element einfügen
    antwortenElement.innerHTML = "";
    for (let i = 0; i < fragen[aktuelleFrage].antworten.length; i++) {
        let button = document.createElement("button");
        button.textContent = fragen[aktuelleFrage].antworten[i];
        button.value = i;

        // Event-Listener für die Antwort-Buttons hinzufügen
        button.onclick = function() {
            // Wenn die ausgewählte Antwort korrekt ist, erhöhen Sie die Punkte
            if (this.value == fragen[aktuelleFrage].korrekteAntwort) {
                punkte++;
                document.getElementById("ergebnis").textContent = "Richtig!";
            } else { // Ansonsten Punkte abziehen
                punkte--;
                document.getElementById("ergebnis").textContent = "Falsch!";
            }

            // Punktestand aktualisieren
            document.getElementById("punkte").textContent = "Punkte: " + punkte;

            // Nächste Frage laden
            aktuelleFrage++;
            if (aktuelleFrage < fragen.length) {
                ladeFrage();
            } else { // Quiz beendet
                frageElement.textContent = "Quiz beendet";
                antwortenElement.innerHTML = "";
                document.getElementById("submit").style.display = "none"; // Submit-Button ausblenden
            }
        }
        antwortenElement.appendChild(button);
    }
}

// Laden Sie die erste Frage, wenn die Seite geladen wird
window.onload = ladeFrage();