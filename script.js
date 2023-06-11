let docTitel = document.title;
window, addEventListener("blur", () => {
    document.title = "ubodigat.tk | Inaktiv 💤";
})
window, addEventListener("focus", () => {
    document.title = docTitel;
})

// Dies sorgt dafür dass wenn man den tab ändern sich der titel ändert.

function copyText() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "Dieser Text ist leider nicht konfiguriert, melden sie sich beim Webseite-Betrieber. Ihr U:Bodigat.tk Support Team: 'contact@ubodigat.tk'";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}

function copyText2() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "Dieser Text ist leider nicht konfiguriert, melden sie sich beim Webseite-Betrieber. Ihr U:Bodigat.tk Support Team: 'contact@ubodigat.tk'";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}

//Sort für die copierung der Texte in die Zwischenablage bei der drückung des jeweiligen buttons.

//Code für 1 x 1 Tabelle
const tableSize = 10; // Tabelle bis zu 10x10
const tableElement = document.getElementById("table");

// Funktion zum Erstellen einer Tabellenzeile
function createRow(rowNum) {
    const row = document.createElement("div");
    row.classList.add("row");
    for (let i = 1; i <= tableSize; i++) {
        const cell = document.createElement("button");
        cell.innerText = `${rowNum} x ${i}`;
        cell.addEventListener("click", () => checkAnswer(rowNum * i));
        row.appendChild(cell);
    }
    return row;
}

// Funktion zum Erstellen der gesamten Tabelle
function createTable() {
    for (let i = 1; i <= tableSize; i++) {
        const row = createRow(i);
        tableElement.appendChild(row);
    }
}

// Funktion zum Überprüfen der Antwort
function checkAnswer(answer) {
    const input = prompt("Was ist das Ergebnis?");
    if (input == answer) {
        alert("Richtig!");
    } else {
        alert(`Falsch. Die richtige Antwort ist ${answer}.`);
    }
}

createTable();

//ende des codes der 1 x 1 Tabelle