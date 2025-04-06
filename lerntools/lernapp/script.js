let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
let ran_key;
let timer_gestartet = false;
let startzeit;
let timerInterval;

function übunghinzufügen() {
    const frage = document.getElementById('frageInput').value.trim();
    const antwort = document.getElementById('antwortInput').value.trim();
    const caseSensitive = document.getElementById('caseSensitiveCheckbox').checked;

    if (frage !== '' && antwort !== '') {
        dictionary[frage] = {
            question: frage,
            answer: antwort,
            caseSensitive: caseSensitive,
            incorrectAttempts: 0
        };
        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        render();
        document.getElementById('frageInput').value = '';
        document.getElementById('antwortInput').value = '';
    }
}

function render() {
    const übungsliste = document.getElementById('Übungsliste');
    übungsliste.innerHTML = '';
    const keys = Object.keys(dictionary).reverse();
    for (let key of keys) {
        const übung = dictionary[key];
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span onclick="deleteÜbung('${key}')" style="cursor:pointer;">❌</span> 
            <span onclick="editÜbung('${key}')" style="cursor:pointer;">✏️</span> 
            <b style="color:red;">Frage:</b> ${übung.question} &nbsp;&nbsp;
            <b style="color:red;">Antwort:</b> ${übung.answer}
        `;
        übungsliste.appendChild(listItem);
    }

    const exportButton = document.getElementById('exportButton');
    const overwriteOptionVisible = Object.keys(dictionary).length > 0;

    if (exportButton) {
        exportButton.disabled = !overwriteOptionVisible;
    }

    window.canOverwrite = overwriteOptionVisible;
}

function deleteÜbung(key) {
    delete dictionary[key];
    localStorage.setItem('dictionary', JSON.stringify(dictionary));
    render();
}

function editÜbung(key) {
    const übung = dictionary[key];
    document.getElementById('editFrage').value = übung.question;
    document.getElementById('editFrage').setAttribute('data-original-key', key);
    document.getElementById('editAntwort').value = übung.answer;
    document.getElementById('editCaseSensitive').checked = übung.caseSensitive || false;
    document.getElementById('popupContainer').style.display = 'flex';
}


function saveEdit() {
    const editedKey = document.getElementById('editFrage').value.trim();
    const newAnswer = document.getElementById('editAntwort').value.trim();
    const caseSensitive = document.getElementById('editCaseSensitive').checked;
    const originalKey = document.getElementById('editFrage').getAttribute('data-original-key');

    if (editedKey !== '') {
        const oldData = dictionary[originalKey];
        delete dictionary[originalKey];
        dictionary[editedKey] = {
            question: editedKey,
            answer: newAnswer,
            caseSensitive: caseSensitive,
            incorrectAttempts: oldData.incorrectAttempts || 0
        };
        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        render();
        closePopup();
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

function exportDictionary() {
    if (Object.keys(dictionary).length === 0) {
        showCustomError('❗️ Es gibt keine Vokabeln zum Exportieren!');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dictionary));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "vokabeln.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importDictionary() {
    document.getElementById('importFile').click();
}

function mischFragen() {
    shuffledKeys = Object.keys(dictionary);
    for (let i = shuffledKeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
    }
}

function chooseFrage() {
    const weightedList = [];

    for (const key of Object.keys(dictionary)) {
        const attempts = dictionary[key].incorrectAttempts || 0;
        weightedList.push(key);
        if (attempts > 0) {
            for (let i = 0; i < Math.min(attempts, 2); i++) {
                weightedList.push(key);
            }
        }
    }

    return weightedList[Math.floor(Math.random() * weightedList.length)];
}

function nächstübung() {
    if (!timer_gestartet) {
        startzeit = new Date().getTime();
        timer_gestartet = true;
        timerInterval = setInterval(updateTimer, 1000);
    }

    ran_key = chooseFrage();
    const diefrage = document.getElementById('diefrage');
    if (diefrage) {
        diefrage.innerHTML = `${ran_key} &nbsp?`;
    }

    const antwortInput = document.getElementById('Antwort');
    if (antwortInput) {
        antwortInput.value = "";
    }

    document.getElementById('überblendung').innerText = "";
    document.getElementById('überprüfungstext').innerText = "";

    document.getElementById('streak-counter').innerHTML = `🔥 Streak: ${streak}`;
}

function richtigfalsch() {
    const userAntwort = document.getElementById('Antwort').value.trim();
    const correctAnswer = dictionary[ran_key].answer.trim();
    const caseSensitive = dictionary[ran_key].caseSensitive;

    let korrekt = caseSensitive ? (userAntwort === correctAnswer) : (userAntwort.toLowerCase() === correctAnswer.toLowerCase());

    if (korrekt) {
        document.getElementById('überprüfungstext').innerText = "✅ Richtig!";
        dictionary[ran_key].incorrectAttempts = 0;
        streak++;
    } else {
        document.getElementById('überprüfungstext').innerHTML = `
            ❌ Falsch! Richtige Antwort: ${correctAnswer}
        `;
        dictionary[ran_key].incorrectAttempts = (dictionary[ran_key].incorrectAttempts || 0) + 1;
        streak = 0;
    }

    localStorage.setItem('dictionary', JSON.stringify(dictionary));

    document.getElementById('streak-counter').innerHTML = `🔥 Streak: ${streak}`;

    setTimeout(() => {
        nächstübung();
    }, 1000);
}

const reader = new FileReader();
reader.onload = function(e) {
    try {
        const importedData = JSON.parse(e.target.result);
        dictionary = importedData;
        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        render();
        alert("Import erfolgreich!");
    } catch (error) {
        showCustomError('Fehler beim Importieren: Ungültige Datei!');
    }
};

function updateTimer() {
    const dauer_element = document.getElementById("dauer");
    if (!dauer_element) return;

    const dauer_in_ms = new Date().getTime() - startzeit;
    const stunden = Math.floor(dauer_in_ms / (1000 * 60 * 60));
    const minuten = Math.floor((dauer_in_ms % (1000 * 60 * 60)) / (1000 * 60));
    const sekunden = Math.floor((dauer_in_ms % (1000 * 60)) / 1000);

    const dauer_formatiert = ("0" + stunden).slice(-2) + ":" + ("0" + minuten).slice(-2) + ":" + ("0" + sekunden).slice(-2);
    dauer_element.textContent = dauer_formatiert;
}

function closePopup() {
    document.getElementById('popupContainer').style.display = 'none';
}

function showCustomError(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';


    const modal = document.createElement('div');
    modal.style.background = '#1f1f1f';
    modal.style.padding = '40px';
    modal.style.borderRadius = '15px';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0px 0px 20px rgba(0, 0, 0, 0.7)';
    modal.style.maxWidth = '400px';
    modal.style.color = 'white';


    const logo = document.createElement('img');
    logo.src = 'https://ubodigat.com/bilder/ubodigatwarnung.svg';
    logo.alt = 'Warnung';
    logo.style.width = '350px';
    logo.style.marginBottom = '20px';
    modal.appendChild(logo);


    const text = document.createElement('p');
    text.innerText = message;
    text.style.margin = '20px 0';
    text.style.fontSize = '18px';
    modal.appendChild(text);


    const button = document.createElement('button');
    button.innerText = 'OK';
    button.style.padding = '10px 20px';
    button.style.marginTop = '20px';
    button.style.backgroundColor = '#00ff0d';
    button.style.color = '#003a1e';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.onclick = () => document.body.removeChild(overlay);
    modal.appendChild(button);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);


    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        showCustomError('Bitte wähle eine gültige JSON-Datei aus!');
        return;
    }

    if (file.name.split('.').pop().toLowerCase() !== 'json') {
        showCustomError('Nur .JSON Dateien erlaubt!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            showImportOptions(importedData);
        } catch (error) {
            showCustomError('Fehler beim Importieren: Ungültige Datei!');
        }
    };
    reader.readAsText(file);
}

function showImportOptions(importedData) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';

    const modal = document.createElement('div');
    modal.style.background = '#1f1f1f';
    modal.style.padding = '30px';
    modal.style.borderRadius = '15px';
    modal.style.textAlign = 'center';
    modal.style.boxShadow = '0px 0px 20px rgba(0,0,0,0.7)';
    modal.style.maxWidth = '400px';
    modal.style.color = 'white';

    const title = document.createElement('h2');
    title.innerText = '📂 Import Optionen';
    title.style.marginBottom = '20px';
    modal.appendChild(title);

    const text = document.createElement('p');
    text.innerText = 'Was möchtest du mit den importierten Vokabeln machen?';
    text.style.marginBottom = '30px';
    modal.appendChild(text);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.flexWrap = 'wrap';

    // Nur anzeigen, wenn aktuell Vokabeln existieren
    if (window.canOverwrite) {
        const überschreibenButton = document.createElement('button');
        überschreibenButton.innerText = 'Überschreiben';
        überschreibenButton.className = 'popup-button';
        überschreibenButton.onclick = () => {
            dictionary = importedData;
            localStorage.setItem('dictionary', JSON.stringify(dictionary));
            render();
            document.body.removeChild(overlay);
            alert('✅ Erfolgreich überschrieben!');
        };
        buttonContainer.appendChild(überschreibenButton);
    }

    const hinzufügenButton = document.createElement('button');
    hinzufügenButton.innerText = 'Hinzufügen';
    hinzufügenButton.className = 'popup-button';
    hinzufügenButton.onclick = () => {
        for (let key in importedData) {
            dictionary[key] = importedData[key];
        }
        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        render();
        document.body.removeChild(overlay);
        alert('✅ Erfolgreich hinzugefügt!');
    };

    const abbrechenButton = document.createElement('button');
    abbrechenButton.innerText = 'Abbrechen';
    abbrechenButton.className = 'popup-button cancel';
    abbrechenButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    buttonContainer.appendChild(hinzufügenButton);
    buttonContainer.appendChild(abbrechenButton);

    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}