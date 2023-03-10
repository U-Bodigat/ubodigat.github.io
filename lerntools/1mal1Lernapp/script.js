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
        alert("Richtig! (;");
    } else {
        alert(`Falsch. Die richtige Antwort ist ${answer}.`);
    }
}

createTable();

//New 1 mal 1 Lernapp