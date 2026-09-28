function appendOperation(operation) {
    let container = document.getElementById('Ergebnisfeld');
    if (container.innerHTML === '0' || container.dataset.fresh === '1') {
        container.innerHTML = '';
        container.dataset.fresh = '0';
    }
    container.innerHTML += operation;
}

function Ergebnis() {
    let container = document.getElementById('Ergebnisfeld');
    try {
        let result = eval(container.innerHTML);
        container.innerHTML = (result === undefined) ? '0' : String(result);
    } catch (e) {
        container.innerHTML = 'Fehler';
    }
    container.dataset.fresh = '1';
}

function Zurück() {
    let container = document.getElementById('Ergebnisfeld');
    if (container.innerHTML.endsWith(' ')) {
        container.innerHTML = container.innerHTML.slice(0, -3);
    } else {
        container.innerHTML = container.innerHTML.slice(0, -1);
    }
    if (container.innerHTML === '') {
        container.innerHTML = '0';
    }
}

function löschen() {
    let container = document.getElementById('Ergebnisfeld');
    container.innerHTML = '0';
    container.dataset.fresh = '0';
}
