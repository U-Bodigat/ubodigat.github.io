let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
let ran_key;
let timer_gestartet = false;
let startzeit;
let timerInterval;
let streak = 0;
let abgefragteVokabeln = [];
let frageZaehler = 0;
let frageWirdVertauscht = false;

function übunghinzufügen() {
    const frage = document.getElementById('frageInput').value.trim();
    const antwort = document.getElementById('antwortInput').value.trim();
    const caseSensitive = document.getElementById('caseSensitiveCheckbox').checked;

    if (frage !== '' && antwort !== '') {
        dictionary[frage] = {
            question: frage,
            answer: antwort,
            caseSensitive: caseSensitive,
            incorrectAttempts: 0,
            recoveredAttempts: 0
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
    const scrollDownButton = document.getElementById('scrollDownButton');
    if (Object.keys(dictionary).length > 7) {
        scrollDownButton.style.display = 'block';
    } else {
        scrollDownButton.style.display = 'none';
    }
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
    modal.style.padding = '30px 25px';
    modal.style.borderRadius = '20px';
    modal.style.textAlign = 'center';
    modal.style.width = '90%';
    modal.style.maxWidth = '400px';
    modal.style.color = 'white';
    modal.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.7)';
    modal.style.backdropFilter = 'blur(10px)';

    const title = document.createElement('h2');
    title.innerHTML = '⚠️ <b>Alle Vokabeln löschen?</b>';
    title.style.marginBottom = '15px';
    modal.appendChild(title);

    const message = document.createElement('p');
    message.innerHTML = 'Bist du sicher, dass du <b>ALLE</b> gespeicherten<br>Vokabeln unwiderruflich löschen willst?';
    message.style.marginBottom = '25px';
    modal.appendChild(message);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '15px';

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Ja, löschen';
    Object.assign(confirmButton.style, {
        padding: '10px 20px',
        backgroundColor: '#cc0000',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
    });
    confirmButton.addEventListener('mouseenter', () => {
        confirmButton.style.backgroundColor = '#ff0000';
        confirmButton.style.color = '#000000';
    });
    confirmButton.addEventListener('mouseleave', () => {
        confirmButton.style.backgroundColor = '#cc0000';
        confirmButton.style.color = '#ffffff';
    });
    confirmButton.onclick = () => {
        localStorage.clear();
        dictionary = {};
        render();
        document.body.removeChild(overlay);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Abbrechen';
    Object.assign(cancelButton.style, {
        padding: '10px 20px',
        backgroundColor: '#00cc00',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
    });
    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.backgroundColor = '#00ff00';
        cancelButton.style.color = '#000000';
    });
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.backgroundColor = '#00cc00';
        cancelButton.style.color = '#ffffff';
    });
    cancelButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
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
    frageZaehler++;

    const keys = Object.keys(dictionary);
    const falscheKeys = keys.filter(key => dictionary[key].incorrectAttempts > 0 && dictionary[key].recoveredAttempts < 2);
    const normaleKeys = keys.filter(key => !abgefragteVokabeln.includes(key));


    if (normaleKeys.length === 0) {
        abgefragteVokabeln = [];
    }


    if (frageZaehler % 4 === 0 && falscheKeys.length > 0) {
        const randomKey = falscheKeys[Math.floor(Math.random() * falscheKeys.length)];
        return randomKey;
    } else {
        const nochNichtAbgefragt = keys.filter(key => !abgefragteVokabeln.includes(key));
        const randomKey = nochNichtAbgefragt[Math.floor(Math.random() * nochNichtAbgefragt.length)];
        abgefragteVokabeln.push(randomKey);
        return randomKey;
    }
}


function nächstübung() {
    if (!timer_gestartet) {
        startzeit = new Date().getTime();
        timer_gestartet = true;
        timerInterval = setInterval(updateTimer, 1000);
    }

    const keys = Object.keys(dictionary);
    if (keys.length === 0) {
        showCustomNoVocabModal();
        return;
    }

    ran_key = chooseFrage();
    const vokabelmodusAktiv = localStorage.getItem("vokabelmodus") === "true";
    frageWirdVertauscht = vokabelmodusAktiv && Math.random() < 0.5;

    const diefrage = document.getElementById('diefrage');
    if (diefrage && ran_key && dictionary[ran_key]) {
        diefrage.innerHTML = frageWirdVertauscht ?
            `${dictionary[ran_key].answer} &nbsp?` :
            `${ran_key} &nbsp?`;
    } else {
        showCustomNoVocabModal();
        return;
    }

    document.getElementById('Antwort').value = "";
    document.getElementById('überblendung').innerText = "";
    document.getElementById('streak-counter').innerHTML = `🔥 Streak: ${streak}`;
}

function richtigfalsch() {
    const userAntwort = Antwort.value.trim();
    const eintrag = dictionary[ran_key];
    const caseSensitive = eintrag.caseSensitive;

    const correctAnswer = frageWirdVertauscht ? eintrag.question : eintrag.answer;
    const antwortVergleich = caseSensitive ? correctAnswer : correctAnswer.toLowerCase();
    const nutzerVergleich = caseSensitive ? userAntwort : userAntwort.toLowerCase();

    const istRichtig = nutzerVergleich === antwortVergleich;
    const abweichung = levenshtein(nutzerVergleich, antwortVergleich);
    const vokabelmodusAktiv = localStorage.getItem("vokabelmodus") === "true";
    const fastRichtig = vokabelmodusAktiv && !istRichtig && abweichung <= 2;

    if (istRichtig) {
        überprüfungstext.innerHTML = `Richtig (;`;
        streak++;
        eintrag.incorrectAttempts = 0;
    } else if (fastRichtig) {
        überprüfungstext.innerHTML =
            `Fast richtig 😅<br><br>
            <div id="lösungstext">
                <h4>Deine Antwort:</h4>
                <h4 id="falscheantwort">${userAntwort}</h4>
                <br>
                <h4>Korrekte Antwort:</h4>
                <h4 id="richtigelösung">${correctAnswer}</h4>
            </div>`;
        streak = 0;
    } else {
        überprüfungstext.innerHTML =
            `Das ist leider falsch ;(<br><br>
            <div id="lösungstext">
                <h4>Deine Antwort:</h4>
                <h4 id="falscheantwort">${userAntwort}</h4>
                <br>
                <h4>Korrekte Antwort:</h4>
                <h4 id="richtigelösung">${correctAnswer}</h4>
            </div>`;
        streak = 0;
        eintrag.incorrectAttempts = (eintrag.incorrectAttempts || 0) + 1;
    }

    localStorage.setItem('dictionary', JSON.stringify(dictionary));
    document.getElementById('streak-counter').innerHTML = `🔥 Streak: ${streak}`;
    setTimeout(() => nächstübung(), 1000);
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

const antwortInput = document.getElementById('antwortInput');
if (antwortInput) {
    antwortInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            übunghinzufügen();
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const scrollDownButton = document.getElementById('scrollDownButton');

    if (scrollDownButton) {
        function updateButtonDirection() {
            const scrollTop = window.scrollY;
            const scrollPosition = scrollTop + window.innerHeight;
            const pageHeight = document.documentElement.scrollHeight;

            if (pageHeight - scrollPosition <= 2) {
                scrollDownButton.innerHTML = "↑";
                scrollDownButton.onclick = () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                };
            } else {
                scrollDownButton.innerHTML = "↓";
                scrollDownButton.onclick = () => {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                };
            }
        }

        updateButtonDirection();
        window.addEventListener('scroll', updateButtonDirection);
    }
});

function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b[i - 1] === a[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[b.length][a.length];
}

function showCustomNoVocabModal() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const modal = document.createElement('div');
    modal.className = 'no-vocab-modal';

    const closeIcon = document.createElement('div');
    closeIcon.className = 'close-icon';
    closeIcon.innerHTML = '✖';
    closeIcon.onclick = () => document.body.removeChild(overlay);
    modal.appendChild(closeIcon);

    const title = document.createElement('h2');
    title.textContent = '⚠️ Keine Aufgaben gefunden';
    title.style.marginBottom = '15px';
    modal.appendChild(title);

    const message = document.createElement('p');
    message.textContent = 'Du hast aktuell keine Übungen oder Vokabeln hinterlegt.';
    message.style.marginBottom = '25px';
    modal.appendChild(message);

    const button = document.createElement('button');
    button.textContent = 'Füge jetzt Übungen hinzu';
    button.className = 'popup-button';
    button.onclick = () => {
        window.location.href = '/lerntools/lernapp/übungenhinzufügen';
    };
    modal.appendChild(button);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function zeigeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'flex';
}

function schließeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'none';
}

function toggleVokabelmodus() {
    let vokabelmodusAktiv = localStorage.getItem("vokabelmodus") === "true";
    vokabelmodusAktiv = !vokabelmodusAktiv;
    localStorage.setItem("vokabelmodus", vokabelmodusAktiv);

    const header = document.querySelector('header');
    if (vokabelmodusAktiv) {
        header.classList.add("vokabelmodus-aktiv");
    } else {
        header.classList.remove("vokabelmodus-aktiv");
    }

    schließeModusFenster();

}

const fenster = document.getElementById("modusFenster");
let offsetX, offsetY, isDragging = false;

fenster.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - fenster.getBoundingClientRect().left;
    offsetY = e.clientY - fenster.getBoundingClientRect().top;
    fenster.style.position = "absolute";
    fenster.style.zIndex = "10001";
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        fenster.style.left = `${e.clientX - offsetX}px`;
        fenster.style.top = `${e.clientY - offsetY}px`;
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

function toggleVokabelmodusVonSwitch(checked) {
    localStorage.setItem("vokabelmodus", checked);
    const header = document.querySelector('header');
    if (checked) {
        header.classList.add("vokabelmodus-aktiv");
    } else {
        header.classList.remove("vokabelmodus-aktiv");
    }
}
window.addEventListener("DOMContentLoaded", () => {
    const switchElement = document.getElementById("vokabelmodusToggle");
    const header = document.querySelector("header");

    const vokabelmodus = localStorage.getItem("vokabelmodus") === "true";

    if (switchElement) {
        switchElement.checked = vokabelmodus;

        if (vokabelmodus) {
            header.classList.add("vokabelmodus-aktiv");
        }

        switchElement.addEventListener("change", () => {
            const isChecked = switchElement.checked;
            localStorage.setItem("vokabelmodus", isChecked);

            if (isChecked) {
                header.classList.add("vokabelmodus-aktiv");
            } else {
                header.classList.remove("vokabelmodus-aktiv");
            }
        });
    }
});