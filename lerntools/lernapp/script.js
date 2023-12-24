let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
let ran_key;

function übunghinzufügen() {
    console.log('Start übunghinzufügen');
    const frage = frageInput.value.trim();
    const antwort = antwortInput.value.trim();

    console.log('Frage:', frage);
    console.log('Antwort:', antwort);

    if (frage !== '' && antwort !== '') {
        const key = frage;
        dictionary[key] = {
            question: frage,
            answer: antwort,
            incorrectAttempts: 0
        };

        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        render();
        window.scrollTo(0, 0);
    }

    frageInput.value = "";
    antwortInput.value = "";
}

function render() {
    Übungsliste.innerHTML = '';
    for (let key in dictionary) {
        const { question, answer } = dictionary[key];
        const listItem = document.createElement('li');
        listItem.setAttribute('data-key', key);
        listItem.innerHTML = `
            <span class="delete-icon" onclick="deleteÜbung('${key}')">&#10060;</span>
            <span class="edit-icon" onclick="editÜbung('${key}')">&#9998;</span>
            <b id="Abtrennung">F r a g e :</b> &nbsp ${question} &nbsp
            <b id="Abtrennung">L ö s u n g 💡:</b> &nbsp ${answer}
        `;
        Übungsliste.appendChild(listItem);
    }
}

function deleteÜbung(key) {
    delete dictionary[key];
    localStorage.setItem('dictionary', JSON.stringify(dictionary));
    render();
}

function editÜbung(key) {
    console.log('Edit Übung für Schlüssel:', key);
    const übung = dictionary[key];
    const editFrageInput = document.getElementById('editFrage');
    const editAntwortInput = document.getElementById('editAntwort');
    editFrageInput.value = key;
    editFrageInput.setAttribute('data-original-key', key);
    editAntwortInput.value = übung.answer;
    document.getElementById('popupContainer').style.display = 'flex';
}

function saveEdit() {
    const editFrageInput = document.getElementById('editFrage');
    const editAntwortInput = document.getElementById('editAntwort');
    const editedKey = editFrageInput.value.trim();
    const originalKey = editFrageInput.getAttribute('data-original-key');
    if (editedKey !== '') {
        const newAnswer = editAntwortInput.value.trim();
        const existingKey = Object.keys(dictionary).find(key => key.toLowerCase() === originalKey.toLowerCase());

        if (existingKey !== undefined) {
            const oldKey = existingKey;
            delete dictionary[oldKey];
            dictionary[editedKey] = {
                question: editedKey,
                answer: newAnswer,
                incorrectAttempts: (dictionary[oldKey] && dictionary[oldKey].incorrectAttempts) || 0
            };
            localStorage.setItem('dictionary', JSON.stringify(dictionary));
            render();
            closePopup();
        } else {
            console.error('Ungültiger oder nicht vorhandener Schlüssel:', originalKey, 'Alle Schlüssel:', Object.keys(dictionary));
        }
    }
}

function closePopup() {
    document.getElementById('popupContainer').style.display = 'none';
}

function löschen() {
    localStorage.clear();
    dictionary = {};
    render();
}

function nächstübung() {
    let weightedQuestions = [];
    for (let key in dictionary) {
        const incorrectAttempts = dictionary[key].incorrectAttempts || 1;
        for (let i = 0; i < incorrectAttempts; i++) {
            weightedQuestions.push(key);
        }
    }
    ran_key = weightedQuestions[Math.floor(Math.random() * weightedQuestions.length)];
    diefrage.innerHTML = `${ran_key} &nbsp?`;
    Antwort.value = "";

    if (!timer_gestartet) {
        startzeit = new Date().getTime();
        timer_gestartet = true;

        timerInterval = setInterval(function() {
            const dauer_element = document.getElementById("dauer");
            const dauer_in_ms = dauer();
            const stunden = Math.floor(dauer_in_ms / (1000 * 60 * 60));
            const minuten = Math.floor((dauer_in_ms % (1000 * 60 * 60)) / (1000 * 60));
            const sekunden = Math.floor((dauer_in_ms % (1000 * 60)) / 1000);
            const dauer_formatiert = ("0" + stunden).slice(-2) + ":" + ("0" + minuten).slice(-2) + ":" + ("0" + sekunden).slice(-2);
            dauer_element.textContent = dauer_formatiert;
        }, 1000);
    }
}

function richtigfalsch() {
    const userAntwort = Antwort.value.trim();
    const correctAnswer = dictionary[ran_key].answer.trim();

    if (userAntwort === correctAnswer) {
        überprüfungstext.innerHTML = `Richtig (;`;
    } else {
        überprüfungstext.innerHTML =
            `Das ist leider falsch ;(` +
            `<div id="lösungstext"> <br> <h4>Deine Antwort:</h4> <h4 id="falscheantwort">${userAntwort}</h4> <br> <h4>Korrekte Antwort:</h4> <h4 id="richtigelösung">${correctAnswer}</h4> </div>`;
    }
    nächstübung();
}

let timer_gestartet = false;
let startzeit;
let timerInterval;

function dauer() {
    return new Date().getTime() - startzeit;
}