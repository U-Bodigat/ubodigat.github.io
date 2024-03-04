function appendOperation(operation) {
    document.getElementById('Ergebnisfeld').innerHTML += operation;
}

function Ergebnis() {
    let container = document.getElementById('Ergebnisfeld');
    let result = eval(container.innerHTML);
    container.innerHTML = result;
}

function Zurück() {
    let container = document.getElementById('Ergebnisfeld');
    if (container.innerHTML.endsWith(' ')) {
        container.innerHTML = container.innerHTML.slice(0, -3);
    } else {}
    container.innerHTML = container.innerHTML.slice(0, -1);
}

function löschen() {
    let container = document.getElementById('Ergebnisfeld');
    container.innerHTML = container.innerHTML.slice(-1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, -1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
}