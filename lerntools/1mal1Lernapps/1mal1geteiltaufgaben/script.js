const tableSize = 10; // Tabelle bis zu 10x10
const tableElement = document.getElementById("table");

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

function createTable() {
    for (let i = 1; i <= tableSize; i++) {
        const row = createRow(i);
        tableElement.appendChild(row);
    }
}

function checkAnswer(answer) {
    const input = prompt("Was ist das Ergebnis?");
    if (input == answer) {
        alert("Richtig! (;");
    } else {
        alert(`Falsch. Die richtige Antwort ist ${answer}.`);
    }
}

createTable();


function showPopup() {
    alert("Spielstart: Wenn man die Webseite öffnet sieht man eine Frage diese man beantworten muss. Die Frage wird zufällig aus dem 1x1 ausgewählt. Der Spieler muss die richtige Antwort in das vorgesehene Feld eingeben und dann auf den Button Antwort überprüfen klicken. Antwort überprüfen: Nachdem der Spieler die Antwort eingegeben hat, klickt er auf den Button Antwort überprüfen. Wenn die Antwort richtig ist, wird eine Nachricht Richtig! angezeigt und der Punktestand wird um 1 erhöht. Wenn die Antwort falsch ist, wird eine Nachricht Falsch! angezeigt und der Punktestand wird um 1 verringert. Zeitlimit: Der Spieler hat 25 Sekunden Zeit, um jede Frage zu beantworten. Ein Countdown-Timer zeigt die verbleibende Zeit an. Wenn die Zeit abgelaufen ist, wird eine Nachricht Zeit ist abgelaufen! angezeigt und der Punktestand wird auf 0 zurückgesetzt. Fortsetzung des Spiels: Nach der Beantwortung jeder Frage wird automatisch eine neue Frage generiert. Der Spieler kann so lange weiterspielen, bis er bereit ist, das Spiel zu beenden.");
}