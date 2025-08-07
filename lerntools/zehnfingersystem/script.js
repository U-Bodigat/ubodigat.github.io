let examMode = false;
let examTimeLimit = 300;
let examMaxError = 5;
let examUserName = "";
let timerInterval = null;
let remainingSeconds = 0;
let selectedTextIndex = 0;
const predefinedTexts = [
    "Luftfahrt umfasst den Transport von Menschen und Gütern durch Luftfahrzeuge. Sie begann in der Antike, erlebte ihren Durchbruch im 20. Jahrhundert und ist heute ein wichtiger Wirtschaftszweig. Die zivile Luftfahrt (Linienflug, Charter, etc.) und die militärische Luftfahrt sind die zwei Hauptkategorien. Herausforderungen wie Klimawandel und Terrorismus stehen der Branche gegenüber. Wichtige Akteure sind Fluggesellschaften, Flughäfen und Hersteller. Die Luftfahrt hat große Bedeutung für die globale Wirtschaft und Gesellschaft. Die Zukunft verspricht neue Technologien, Wachstum und mehr Sicherheit.",
    "Die Informatik ist ein bedeutendes Teilgebiet der Mathematik und Technik, das sich mit der Verarbeitung von Informationen durch Computer beschäftigt. Sie umfasst die Entwicklung von Software, Hardware und Algorithmen. Informatik spielt in nahezu allen Bereichen der Gesellschaft eine zentrale Rolle und fördert die Digitalisierung und Automatisierung.",
    "Die Umweltverschmutzung stellt eine der größten Herausforderungen für unsere Erde dar. Ursachen sind zum Beispiel Industrieabgase, Müll und übermäßiger Ressourcenverbrauch. Maßnahmen wie Recycling, erneuerbare Energien und nachhaltige Lebensstile sind notwendig, um die Umwelt zu schützen und den Klimawandel aufzuhalten."
];

document.addEventListener('DOMContentLoaded', function() {
            const textContainer = document.getElementById('text-container');
            const userInput = document.getElementById('user-input');
            const errorDisplay = document.getElementById('error-display');
            const loadFileButton = document.getElementById('load-file');
            const modeToggleButton = document.getElementById('mode-toggle');
            const evaluateButton = document.getElementById('evaluate-button');
            const fileInput = document.getElementById('file-input');
            const settingsBtn = document.getElementById('settings-btn');
            const examInfo = document.getElementById('exam-info');
            const examInfoBar = document.getElementById('exam-info-bar');
            evaluateButton.addEventListener('click', evaluateText);

            let currentText = predefinedTexts[0];
            const textArray = [];
            let startTime = null;
            let endTime = null;
            let keyStrokes = 0;
            let errorCount = 0;

            updateText(currentText);

            function removeAllModals() {
                document.querySelectorAll('.overlay, .modal, .examstart-modal, .evaluation-popup').forEach(e => e.remove());
            }


            settingsBtn.addEventListener('click', function() {
                showSettingsModal('normal');
            });

            modeToggleButton.addEventListener('click', function() {
                if (examMode) {
                    toggleExamMode(false);
                    updateMenuForMode();
                } else {
                    showExamStartModal();
                }
            });

            function showSettingsModal(mode) {
                removeAllModals();
                const overlay = document.createElement('div');
                overlay.className = 'overlay settings-overlay';
                const modal = document.createElement('div');
                modal.className = 'modal settings-modal';
                modal.style.background = '#222d';
                modal.style.borderRadius = '16px';
                modal.style.boxShadow = '0 6px 32px #0006';
                modal.style.padding = '32px 36px';
                modal.style.position = 'relative';
                modal.innerHTML = `
            <span class="close-button" style="font-size:2rem;top:15px;right:18px;z-index:1;position:absolute;cursor:pointer;color:#fff">&times;</span>
            <h2 style="margin-bottom:30px;font-size:2.2rem;font-weight:900;letter-spacing:1px;
            background: linear-gradient(90deg,#21d3a4,#6bc6ff 85%);
            -webkit-background-clip: text;-webkit-text-fill-color: transparent;text-align:center;">Einstellungen</h2>
            <div style="display:flex;gap:18px;align-items:center;margin-bottom:22px;">
                <label style="font-size:1.12rem;font-weight:700;min-width:180px;text-align:left;">
                    Prüfungszeit:
                </label>
                <input id="exam-minutes" type="number" min="0" max="5" value="${Math.floor(examTimeLimit/60)}"
                    style="border-radius:7px 0 0 7px;width:60px;padding:7px 8px 7px 12px;font-size:1rem;border:none;outline:none;">
                <span style="font-size:1.08rem;font-weight:600;color:#fff;background:#333;padding:7px 12px 7px 5px;
                    border-radius:0 8px 8px 0;margin-left:-6px;">min</span>
                <input id="exam-seconds" type="number" min="0" max="59" value="${examTimeLimit%60}"
                    style="border-radius:7px 0 0 7px;width:60px;padding:7px 8px 7px 12px;font-size:1rem;border:none;outline:none;margin-left:12px;">
                <span style="font-size:1.08rem;font-weight:600;color:#fff;background:#333;padding:7px 12px 7px 5px;
                    border-radius:0 8px 8px 0;margin-left:-6px;">sek</span>
            </div>
            <div style="display:flex;gap:18px;align-items:center;margin-bottom:22px;">
                <label style="font-size:1.12rem;font-weight:700;min-width:180px;text-align:left;">
                    Maximale Fehleranzahl:
                </label>
                <input id="max-error-input" type="number" min="1" max="5" value="${examMaxError}"
                    style="border-radius:7px;width:80px;padding:7px 12px;font-size:1rem;border:none;outline:none;">
            </div>
            <div style="display:flex;gap:14px;justify-content:flex-end;">
                <button id="preview-settings-btn" style="background:linear-gradient(90deg,#21d3a4,#6bc6ff 85%);
                color:#fff;padding:9px 25px;border-radius:7px;font-weight:700;font-size:1.1rem;border:none;box-shadow:0 3px 12px #2221;cursor:pointer;">Vorschau</button>
                <button id="save-settings-btn"
                    style="background:linear-gradient(90deg,#6bc6ff 85%,#21d3a4);color:#fff;padding:9px 25px;border-radius:7px;font-weight:700;font-size:1.1rem;border:none;box-shadow:0 3px 12px #2221;cursor:pointer;">Speichern</button>
            </div>
        `;
                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                modal.querySelector('.close-button').onclick = () => document.body.removeChild(overlay);

                document.getElementById('preview-settings-btn').onclick = function() {
                    showConfirmSettingsPopup(overlay, mode, false);
                };
                document.getElementById('save-settings-btn').onclick = function() {
                    saveSettingsAndProceed(mode, overlay, false);
                };
            }

            function showExamStartModal() {
                removeAllModals();
                const overlay = document.createElement('div');
                overlay.className = 'overlay examstart-overlay';
                overlay.innerHTML = `
                    <div class="examstart-modal">
                        <span class="close-button examstart-close">&times;</span>
                        <h2>Prüfung starten</h2>
                        <label for="exam-username">Name</label>
                        <input id="exam-username" type="text" placeholder="Dein Name...">
                        <label for="exam-text-select">Textauswahl</label>
                        <select id="exam-text-select">
                            <option value="0">Luftfahrt</option>
                            <option value="1">Informatik</option>
                            <option value="2">Umweltverschmutzung</option>
                            <option value="custom">Eigener Text (.txt)</option>
                        </select>
                        <div id="custom-file-block" style="display:none;margin-bottom:14px;text-align:center;">
                            <button id="custom-file-btn" type="button" class="examstart-btn" style="width:100%;margin-bottom:6px;">.txt-Datei auswählen</button>
                            <div id="custom-file-status" class="examstart-file-hint"></div>
                        </div>
                        <div style="margin-bottom:0.5rem;">
                            <label style="margin-bottom:5px;display:block;font-weight:600;">Prüfungszeit</label>
                            <div class="examstart-row examstart-timeinputs" style="gap:10px;align-items:center;justify-content: center;">
                                <input id="exam-minutes" type="number" min="0" max="5" value="5" style="max-width:70px;">
                                <span class="examstart-unit">min</span>
                                <input id="exam-seconds" type="number" min="0" max="59" value="0" style="max-width:70px;">
                                <span class="examstart-unit">sek</span>
                            </div>
                        </div>
                        <div style="height:8px;"></div>
                        <div class="error-row" style="margin-bottom:22px;justify-content: center;">
                            <label for="max-error-input" style="margin-bottom:0;">Fehleranzahl</label>
                            <input id="max-error-input" type="number" value="5" min="1" style="max-width:90px;">
                        </div>
                        <div class="action-row">
                            <button id="preview-settings-btn" class="examstart-btn ghost">Vorschau</button>
                            <button id="save-settings-btn" class="examstart-btn">Speichern & Starten</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
                const modal = overlay.querySelector('.examstart-modal');
                setTimeout(() => modal.classList.add("in"), 15);
                overlay.querySelector('.examstart-close').onclick = () => overlay.remove();
                overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
                const select = overlay.querySelector("#exam-text-select");
                const customFileBlock = overlay.querySelector("#custom-file-block");
                const customFileBtn = overlay.querySelector("#custom-file-btn");
                const customFileStatus = overlay.querySelector("#custom-file-status");
                let selectedFile = null;
                select.addEventListener("change", function() {
                    if (this.value === "custom") {
                        customFileBlock.style.display = "block";
                    } else {
                        customFileBlock.style.display = "none";
                        customFileStatus.textContent = "";
                        selectedFile = null;
                    }
                });
                customFileBtn.addEventListener("click", () => {
                    document.getElementById('file-input').click();
                });
                document.getElementById('file-input').onchange = function() {
                    if (!this.files[0]) {
                        customFileStatus.textContent = "Bitte .txt-Datei auswählen";
                        customFileStatus.style.color = "#44afff";
                        selectedFile = null;
                        return;
                    }
                    if (this.files[0].type === "text/plain" || this.files[0].name.endsWith('.txt')) {
                        customFileStatus.textContent = "✓ " + this.files[0].name;
                        customFileStatus.style.color = "#23d0ae";
                        selectedFile = this.files[0];
                    } else {
                        customFileStatus.textContent = "Ungültige Datei! Nur .txt erlaubt.";
                        customFileStatus.style.color = "#ff3131";
                        selectedFile = null;
                    }
                };
                overlay.querySelector("#preview-settings-btn").onclick = () => {
                    overlay.querySelector("#save-settings-btn").click();
                };
                overlay.querySelector("#save-settings-btn").onclick = () => {
                    examUserName = overlay.querySelector("#exam-username").value.trim();

                    let minute = parseInt(overlay.querySelector("#exam-minutes").value) || 0;
                    let second = parseInt(overlay.querySelector("#exam-seconds").value) || 0;
                    let errorVal = parseInt(overlay.querySelector("#max-error-input").value) || 1;
                    if (errorVal < 1) errorVal = 1;
                    examTimeLimit = minute * 60 + second;
                    if (examTimeLimit < 1) examTimeLimit = 1;
                    examMaxError = errorVal;
                    selectedTextIndex = overlay.querySelector("#exam-text-select").value;

                    let idx = selectedTextIndex;
                    if (idx === "custom" && selectedFile) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            overlay.remove();
                            updateText(e.target.result.trim());
                            toggleExamMode(true);
                        };
                        reader.readAsText(selectedFile);
                    } else {
                        overlay.remove();
                        updateText(predefinedTexts[parseInt(idx) || 0]);
                        toggleExamMode(true);
                    }
                };
            }

            function showConfirmSettingsPopup(parentOverlay, mode, withNameText) {
                let min = Math.max(0, parseInt(document.getElementById('exam-minutes').value) || 0);
                let sec = Math.max(0, Math.min(59, parseInt(document.getElementById('exam-seconds').value) || 0));
                let errors = Math.max(1, parseInt(document.getElementById('max-error-input').value) || 1);
                let name = withNameText ? (document.getElementById('exam-name-input') ?.value || "") : "";
                let textdesc = "";
                if (withNameText) {
                    let sel = document.getElementById('text-select').value;
                    if (sel === "custom" && userCustomText) textdesc = "Eigener Text (hochgeladen)";
                    else textdesc = `Text ${parseInt(sel) + 1}`;
                }
                const popup = document.createElement('div');
                popup.className = 'overlay settings-confirm-overlay';
                popup.innerHTML = `
            <div class="modal" style="max-width:380px;padding:30px 25px 22px 25px; border-radius:18px;">
                <h2 style="margin-bottom:18px;">Mit diesen Einstellungen starten?</h2>
                <div style="margin-bottom:20px;font-size:1.1rem;">
                ${withNameText ? `<b>Name:</b> ${escapeHtml(name)}<br>` : ""}
                ${withNameText ? `<b>Text:</b> ${textdesc}<br>` : ""}
                <b>Prüfungszeit:</b> ${min} min ${sec} sek<br>
                <b>Max. Fehler:</b> ${errors}
                </div>
                <div style="display:flex;gap:16px;justify-content:flex-end;">
                <button id="edit-settings-btn" style="background:#d2e2f6;color:#2573b8;font-weight:600;border:none;padding:8px 22px;border-radius:7px;box-shadow:0 1px 7px #b6cbe5;">Bearbeiten</button>
                <button id="start-with-settings-btn" style="background:linear-gradient(90deg,#21d3a4,#6bc6ff 85%);color:#fff;font-weight:700;border:none;padding:8px 22px;border-radius:7px;box-shadow:0 2px 10px #2222;">OK</button>
                </div>s
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('edit-settings-btn').onclick = () => document.body.removeChild(popup);
        document.getElementById('start-with-settings-btn').onclick = function() {
        document.body.removeChild(popup);
        document.getElementById('save-settings-btn').click();
    };
    }

    function saveSettingsAndProceed(mode, overlay, withNameText) {
        let min = Math.max(0, parseInt(document.getElementById('exam-minutes').value) || 0);
        let sec = Math.max(0, Math.min(59, parseInt(document.getElementById('exam-seconds').value) || 0));
        if (min === 0 && sec === 0) sec = 1;
        examTimeLimit = min * 60 + sec;
        examMaxError = Math.max(1, parseInt(document.getElementById('max-error-input').value) || 1);
        if (withNameText) {
            examUserName = document.getElementById('exam-name-input')?.value || "";
            const sel = document.getElementById('text-select').value;
            selectedTextIndex = sel;
            if (sel === "custom" && userCustomText) {
                updateText(userCustomText);
            } else {
                updateText(predefinedTexts[parseInt(sel) || 0]);
            }
        }
        document.body.removeChild(overlay);
        updateExamInfo();
        if (mode === 'exam') {
            toggleExamMode(true);
        }
    }

    function toggleExamMode(on) {
        examMode = !!on;
        document.body.classList.toggle('exam-mode', examMode);
        modeToggleButton.innerHTML = examMode ? 'Normalmodus' : 'Prüfungsmodus';
        evaluateButton.style.display = examMode ? 'inline-block' : 'none';
        if (examMode) {
            remainingSeconds = examTimeLimit;
            startExamTimer();
            startTime = performance.now();
            endTime = null;
            keyStrokes = 0;
            userInput.value = "";
            userInput.focus();
            updateExamInfo();
        } else {
            clearExamTimer();
            startTime = null;
            endTime = null;
            updateExamInfo();
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function updateText(newText) {
        textContainer.innerHTML = newText
            .split('')
            .map((char, idx) => `<span class="char${idx}">${escapeHtml(char)}</span>`)
            .join('');
        currentText = newText;
        textArray.length = 0;
        textArray.push(...newText.split(''));
        userInput.value = "";
        errorCount = 0;
        errorDisplay.textContent = "Fehler: 0";
        updateExamInfo();
    }

    function loadTextFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            currentText = content.trim();
            updateText(currentText);
        };
        reader.readAsText(file);
    }
    loadFileButton.addEventListener('click', function() {
        if (examMode) {
            showErrorOverlay("Im Prüfungsmodus kann kein neuer Text geladen werden!");
            return;
        }
        showTextSelectionModalNormal();
    });
    if (examMode) {
        loadFileButton.disabled = true;
    } else {
        loadFileButton.disabled = false;
    }

    fileInput.addEventListener('change', function() {
        const selectedFile = fileInput.files[0];
        if (selectedFile) {
            if (selectedFile.type === 'text/plain') {
                loadTextFile(selectedFile);
            } else {
                showErrorOverlay('Falscher Dateityp! Bitte wählen Sie eine .txt-Datei.');
            }
        }
    });

    function showTextSelectionModalNormal() {
        removeAllModals();
        const overlay = document.createElement('div');
        overlay.className = 'overlay examstart-overlay';
        overlay.innerHTML = `
            <div class="examstart-modal" style="padding-bottom:18px;">
                <span class="close-button" style="font-size:2.1rem;top:18px;right:22px;position:absolute;cursor:pointer;">&times;</span>
                <h2>Text auswählen</h2>
                <label for="normal-text-select">Textauswahl</label>
                <select id="normal-text-select" style="margin-bottom:12px;">
                    <option value="0">Luftfahrt</option>
                    <option value="1">Informatik</option>
                    <option value="2">Umweltverschmutzung</option>
                    <option value="custom">Eigener Text (.txt)</option>
                </select>
                <div id="normal-file-row" style="display:none;flex-direction:column;align-items:center;margin-bottom:16px;">
                    <label class="file-upload-btn" for="normal-custom-file">.txt-Datei auswählen</label>
                    <input type="file" id="normal-custom-file" accept=".txt" style="display:none;">
                    <div id="normal-custom-status" class="examstart-file-hint" style="margin-top:10px;text-align:center;"></div>
                </div>
                <div class="examstart-actions" style="margin-top:18px;">
                    <button class="examstart-btn ghost" id="normal-cancel-btn">Abbrechen</button>
                    <button class="examstart-btn" id="normal-load-btn">Auswählen</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const customStatus = overlay.querySelector("#normal-custom-status");
        const select = overlay.querySelector("#normal-text-select");
        const fileRow = overlay.querySelector("#normal-file-row");
        const fileInput = overlay.querySelector("#normal-custom-file");
        const fileUploadBtn = overlay.querySelector(".file-upload-btn");
        fileUploadBtn.onclick = () => {
            fileInput.value = "";
            fileInput.click();
        };
        select.onchange = function () {
            if (this.value === "custom") {
                fileRow.style.display = "flex";
                overlay.querySelector("#normal-load-btn").disabled = true;
            } else {
                fileRow.style.display = "none";
                customStatus.textContent = "";
                overlay.querySelector("#normal-load-btn").disabled = false;
            }
        };
        fileInput.onchange = function () {
            if (
                fileInput.files[0]
                && (fileInput.files[0].type === "text/plain" || fileInput.files[0].name.toLowerCase().endsWith('.txt'))
            ) {
                customStatus.textContent = "✓ " + fileInput.files[0].name;
                customStatus.className = "examstart-file-hint ok";
                overlay.querySelector("#normal-load-btn").disabled = false;
            } else {
                customStatus.textContent = "Ungültig! Nur .txt erlaubt.";
                customStatus.className = "examstart-file-hint error";
                overlay.querySelector("#normal-load-btn").disabled = true;
                fileInput.value = "";
            }
        };
        overlay.querySelector('.close-button').onclick = () => {
            document.body.removeChild(overlay);
            fileInput.value = "";
        };
        overlay.onclick = e => { if (e.target === overlay) {
            document.body.removeChild(overlay);
            fileInput.value = "";
        }};
        overlay.querySelector("#normal-cancel-btn").onclick = () => {
            document.body.removeChild(overlay);
            fileInput.value = "";
        };
        overlay.querySelector("#normal-load-btn").onclick = () => {
            let selectedText = select.value;
            if (selectedText === "custom") {
                if (!fileInput.files[0]) {
                    customStatus.textContent = "Bitte .txt-Datei auswählen";
                    customStatus.className = "examstart-file-hint error";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.body.removeChild(overlay);
                    updateText(e.target.result.trim());
                    fileInput.value = "";
                };
                reader.readAsText(fileInput.files[0]);
            } else {
                document.body.removeChild(overlay);
                updateText(predefinedTexts[parseInt(selectedText) || 0]);
            }
        };
    }

    userInput.addEventListener('input', function() {
        const inputArray = userInput.value.split('');
        errorCount = 0;

        textArray.forEach((char, index) => {
            const span = textContainer.querySelector(`.char${index}`);
            if (!span) return;
            if (inputArray[index] !== undefined) {
                if (inputArray[index] === char) {
                    span.classList.remove('incorrect', 'fade-text');
                } else {
                    span.classList.add('incorrect');
                    errorCount += 1;
                }
            } else {
                span.classList.remove('incorrect');
            }
            if (index === userInput.value.length) {
                span.classList.add('current-char');
            } else {
                span.classList.remove('current-char');
            }
            if (index === userInput.value.length + 1) {
                span.classList.add('next-char');
            } else {
                span.classList.remove('next-char');
            }
            if (index < userInput.value.length) {
                span.classList.add('fade-text');
            } else {
                span.classList.remove('fade-text');
            }
        });

        errorDisplay.textContent = `Fehler: ${errorCount}`;
        keyStrokes++;

        if (examMode && errorCount >= examMaxError) {
            finishExam("Maximale Fehleranzahl erreicht!");
        }
        updateExamInfo();
    });

    userInput.addEventListener('keydown', function(e) {
        if (examMode) {
            if (["Backspace", "Delete"].includes(e.key)) {
                e.preventDefault();
            }
            if (userInput.selectionStart !== userInput.selectionEnd && !["ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                e.preventDefault();
            }
        }
    });

    function startExamTimer() {
        clearExamTimer();
        remainingSeconds = examTimeLimit;
        updateExamInfo();
        timerInterval = setInterval(() => {
            remainingSeconds--;
            updateExamInfo();
            if (remainingSeconds <= 0) {
                finishExam("Zeit abgelaufen!");
            }
        }, 1000);
    }

    function clearExamTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }

    function updateExamInfo() {
        if (!examInfo) return;
        if (examMode) {
            const min = Math.floor((remainingSeconds || examTimeLimit) / 60);
            const sec = (remainingSeconds || examTimeLimit) % 60;
            let nameText = examUserName && examUserName.trim().length > 0
                ? `<span style="margin-left:18px;color:#fff;background:#2b537b;padding:2px 9px;border-radius:7px;">👤 ${escapeHtml(examUserName)}</span>`
                : '';
            examInfo.innerHTML = `⏱ <span style="color:#6bc6ff;">${min}:${sec<10?"0":""}${sec} min</span> | Fehler: <b style="color:${errorCount>=examMaxError-1?"#ff3131":"#23d0ae"}">${errorCount}</b> / <b>${examMaxError}</b> ${nameText}`;
            errorDisplay.style.color = (errorCount >= examMaxError - 1) ? '#ff3131' : '#23d0ae';
        } else {
            examInfo.innerHTML = '';
            errorDisplay.style.color = '#c90000';
        }
        const errorSummary = document.getElementById('error-summary-value');
        if (errorSummary) {
            errorSummary.textContent = `${errorCount} / ${examMaxError}`;
            errorSummary.style.color = (errorCount >= examMaxError - 1) ? '#ff3131' : '#23d0ae';
        }
        if (examInfoBar) {
            if (examMode) {
                examInfoBar.style.display = 'flex';
                const min = Math.floor((remainingSeconds || examTimeLimit) / 60);
                const sec = (remainingSeconds || examTimeLimit) % 60;
                examInfoBar.innerHTML = `
                    <span class="time"><i class="fa-solid fa-clock"></i>${min}:${sec < 10 ? '0' : ''}${sec} min</span>
                    <span class="errors">Fehler: ${errorCount}</span>
                    <span class="max">/ ${examMaxError}</span>
                `;
            } else {
                examInfoBar.style.display = 'none';
            }
        }
        if (examMode) {
            document.getElementById('error-display').style.display = 'none';
        } else {
            document.getElementById('error-display').style.display = '';
        }
    }

    function finishExam(message) {
        clearExamTimer();
        evaluateText();
        showErrorOverlay(message, true);
        userInput.disabled = true;
        setTimeout(() => userInput.disabled = false, 1200);
    }

    evaluateButton.addEventListener('click', evaluateText);
    userInput.addEventListener('focus', function() {
        if (examMode && !startTime) startTime = performance.now();
    });

    function formatTime(ms) {
        const sec = Math.floor(ms / 1000);
        const min = Math.floor(sec / 60);
        const hours = Math.floor(min / 60);
        return {
            hours,
            minutes: min % 60,
            seconds: sec % 60
        };
    }

    function determineTextDifficulty(length, specialChars) {
        if (length < 230 && specialChars < 5) {
            return 'leicht';
        } else if (length < 1500 && specialChars < 10) {
            return 'mittel';
        } else {
            return 'schwer';
        }
    }

    function evaluateText() {
        if (!startTime) startTime = performance.now();
        endTime = performance.now();
        const timeElapsed = endTime - startTime;
        const duration = formatTime(timeElapsed);

        const accuracy = textArray.length > 0 ? ((textArray.length - errorCount) / textArray.length) * 100 : 0;
        const specialCharCount = currentText.replace(/[a-zA-Z0-9\s]/g, '').length;
        const now = new Date();
        const datum = now.toLocaleDateString('de-DE');
        const uhrzeit = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const ergebnisse = {
            genauigkeit: accuracy.toFixed(1),
            fehler: errorCount,
            zeit: timeElapsed,
            tastenanschlaege: keyStrokes,
            gesamtTastenanschlaege: currentText.length,
            textLaenge: currentText.length,
            textSchwierigkeit: determineTextDifficulty(currentText.length, specialCharCount),
            datum,
            uhrzeit,
            name: examUserName,
            maxFehler: examMaxError,
            examTimeLimit: examTimeLimit
        };
        showEvaluationPopup(accuracy, duration, ergebnisse);
    }

    function showEvaluationPopup(accuracy, duration, ergebnisse) {
        const popup = document.createElement('div');
        popup.innerHTML = `
        <div class="modern-eval-overlay">
            <div class="modern-eval-popup">
            <button class="modern-eval-close" title="Schließen">×</button>
            <div class="modern-eval-header">
                <span class="modern-eval-icon"><i class="fa-solid fa-clipboard-check"></i></span>
                <span class="modern-eval-title">Auswertung</span>
            </div>
            <div class="modern-eval-table">
                <div class="modern-eval-row">
                <span><i class="fa-regular fa-calendar"></i> Datum:</span>
                <span>${ergebnisse.datum}</span>
                </div>
                ${ergebnisse.name ? `<div class="modern-eval-row"><span><i class="fa-solid fa-user"></i> Name:</span><span>${escapeHtml(ergebnisse.name)}</span></div>` : ""}
                <div class="modern-eval-row">
                <span><i class="fa-solid fa-bullseye"></i> Genauigkeit:</span>
                <span class="eval-green">${accuracy.toFixed(1)}%</span>
                </div>
                <div class="modern-eval-row">
                <span><i class="fa-regular fa-clock"></i> Zeit:</span>
                <span>${duration.minutes}m ${duration.seconds}s</span>
                </div>
                <div class="modern-eval-row">
                <span><i class="fa-solid fa-bug"></i> Fehler:</span>
                <span class="eval-red">${ergebnisse.fehler}</span>
                </div>
                <div class="modern-eval-row">
                <span><i class="fa-solid fa-keyboard"></i> Tastenanschläge:</span>
                <span>${ergebnisse.tastenanschlaege}</span>
                </div>
                <div class="modern-eval-row">
                <span><i class="fa-solid fa-rectangle-list"></i> Textlänge:</span>
                <span>${ergebnisse.textLaenge}</span>
                </div>
                <div class="modern-eval-row">
                <span><i class="fa-solid fa-gauge-simple"></i> Schwierigkeit:</span>
                <span>${ergebnisse.textSchwierigkeit}</span>
                </div>
            </div>
            <div class="modern-eval-actions">
                <button class="modern-eval-btn" id="modern-eval-print"><i class="fa-solid fa-print"></i> Drucken</button>
            </div>
            </div>
        </div>
        `;
        document.body.appendChild(popup);
        popup.querySelector('.modern-eval-close').onclick = () => popup.remove();
        popup.querySelector('.modern-eval-overlay').onclick = e => {
            if (e.target === popup.querySelector('.modern-eval-overlay')) popup.remove();
        };
        popup.querySelector('#modern-eval-print').onclick = function () {
            const druckfenster = window.open('print.html');
            let tries = 0;
            let timer = setInterval(() => {
                if (tries++ > 5) { clearInterval(timer); return; }
                try { druckfenster.postMessage(ergebnisse, window.location.origin); } catch(e) {}
            }, 400);
            setTimeout(() => {
                clearInterval(timer);
                druckfenster.print();
            }, 1000);
        };
    }

    function showErrorOverlayModern(message) {
        const overlay = document.createElement('div');
        overlay.className = 'modern-info-overlay';
        overlay.innerHTML = `
        <div class="modern-info-popup">
            <button class="modern-info-close" title="Schließen">×</button>
            <div class="modern-info-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div>${message}</div>
        </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.modern-info-close').onclick = () => overlay.remove();
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    }
    
    function showTextSelectionModal({ mode = "normal", callback }) {
        removeAllModals();
        const overlay = document.createElement('div');
        overlay.className = 'overlay examstart-overlay';
        overlay.innerHTML = `
            <div class="examstart-modal" style="padding-bottom:18px;">
                <span class="close-button" style="font-size:2.1rem;top:18px;right:22px;position:absolute;cursor:pointer;">&times;</span>
                <h2>${mode === "exam" ? "Prüfung starten" : "Text auswählen"}</h2>
                ${mode === "exam" ? `
                    <label for="exam-username">Name</label>
                    <input id="exam-username" type="text" placeholder="Dein Name...">
                ` : ""}
                <label for="exam-text-select">Textauswahl</label>
                <select id="exam-text-select" style="margin-bottom:10px;">
                    <option value="0">Luftfahrt</option>
                    <option value="1">Informatik</option>
                    <option value="2">Umweltverschmutzung</option>
                    <option value="custom">Eigener Text (.txt)</option>
                </select>
                <div id="custom-file-row" style="display:none;margin-bottom:8px;">
                    <input type="file" id="exam-custom-file" accept=".txt">
                    <span id="custom-text-status" class="examstart-file-hint"></span>
                </div>
                <div class="examstart-row" style="gap:16px;${mode === "normal" ? "display:none;" : ""}">
                    <label style="min-width:110px;">Prüfungszeit</label>
                    <input id="exam-minutes" type="number" value="5" min="0" max="5" style="width:60px;">
                    <span class="mini-label">min</span>
                    <input id="exam-seconds" type="number" value="0" min="0" max="59" style="width:60px;">
                    <span class="mini-label">sek</span>
                </div>
                <div class="examstart-row" style="gap:16px;${mode === "normal" ? "display:none;" : ""}">
                    <label style="min-width:110px;">Fehleranzahl</label>
                    <input id="max-error-input" type="number" value="5" min="1" style="max-width:90px;">
                </div>
                <div class="examstart-actions" style="margin-top:18px;">
                    <button class="examstart-btn ghost" id="preview-settings-btn">${mode === "exam" ? "Vorschau" : "Abbrechen"}</button>
                    <button class="examstart-btn" id="save-settings-btn">${mode === "exam" ? "Speichern & Starten" : "Auswählen"}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const select = overlay.querySelector("#exam-text-select");
        const fileRow = overlay.querySelector("#custom-file-row");
        const fileInput = overlay.querySelector("#exam-custom-file");
        const customStatus = overlay.querySelector("#custom-text-status");
        select.onchange = function () {
            if (this.value === "custom") {
                fileRow.style.display = "block";
            } else {
                fileRow.style.display = "none";
                customStatus.textContent = "";
            }
        };
        const fileUploadBtn = overlay.querySelector(".file-upload-btn");
        const fileInputBtn = overlay.querySelector("#normal-custom-file");
        fileUploadBtn.onclick = () => fileInputBtn.click();
        fileInputBtn.onchange = function () {
            if (!fileInputBtn.files[0]) {
                customStatus.textContent = "Bitte .txt-Datei auswählen";
                customStatus.className = "examstart-file-hint";
                return;
            }
            if (
                fileInputBtn.files[0].type === "text/plain"
                || fileInputBtn.files[0].name.toLowerCase().endsWith('.txt')
            ) {
                customStatus.textContent = "✓ " + fileInputBtn.files[0].name;
                customStatus.className = "examstart-file-hint ok";
            } else {
                customStatus.textContent = "Ungültig! Nur .txt erlaubt.";
                customStatus.className = "examstart-file-hint error";
                fileInputBtn.value = "";
            }
        };
        overlay.querySelector('.close-button').onclick = () => document.body.removeChild(overlay);
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        overlay.querySelector("#preview-settings-btn").onclick = () => document.body.removeChild(overlay);
        overlay.querySelector("#save-settings-btn").onclick = () => {
            let selectedText = select.value;
            if (selectedText === "custom" && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.body.removeChild(overlay);
                    callback({
                        name: overlay.querySelector("#exam-username")?.value || "",
                        textIndex: "custom",
                        customText: e.target.result.trim(),
                        minutes: overlay.querySelector("#exam-minutes")?.value || 0,
                        seconds: overlay.querySelector("#exam-seconds")?.value || 0,
                        errors: overlay.querySelector("#max-error-input")?.value || 5
                    });
                };
                reader.readAsText(fileInput.files[0]);
                return;
            } else {
                document.body.removeChild(overlay);
                callback({
                    name: overlay.querySelector("#exam-username")?.value || "",
                    textIndex: selectedText,
                    customText: "",
                    minutes: overlay.querySelector("#exam-minutes")?.value || 0,
                    seconds: overlay.querySelector("#exam-seconds")?.value || 0,
                    errors: overlay.querySelector("#max-error-input")?.value || 5
                });
            }
        };
    }

    function showErrorOverlay(message, isExam = false) {
        removeAllModals();
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.zIndex = 99999;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <span class="close-button" style="float:right;cursor:pointer;">&times;</span>
            <img src="https://ubodigat.com/bilder/ubodigatwarnung.svg" alt="Logo" class="overlay-logo" style="width: 150%; margin-bottom: 14px; margin-left: 10%;">
            <p style="font-size:1.15rem;font-weight:600;padding:5px 14px 18px 8px;text-align:center;">${message}</p>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        modal.querySelector('.close-button').onclick = () => overlay.remove();
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    }

    function updateMenuForMode() {
        document.getElementById('settings-btn').style.display = "";
        document.getElementById('exam-info').style.display = "";
    }
    
    function updateMenuForMode() {
    if (!examMode) {
        document.getElementById('settings-btn').style.display = "none";
        document.getElementById('exam-info').style.display = "none";
    } else {
        document.getElementById('settings-btn').style.display = "";
        document.getElementById('exam-info').style.display = "";
    }
    }
    updateMenuForMode();
    modeToggleButton.addEventListener('click', function () {
        if (!examMode) {
            showExamStartModal();
        } else {
            toggleExamMode(false);
            updateMenuForMode();
        }
    });

    const tasten = document.querySelectorAll(".taste");
    document.addEventListener("keydown", function(event) {
        let taste;
        switch (event.code) {
            case "Space":
                taste = document.querySelector(".taste.space");
                break;
            case "ControlLeft":
                taste = document.querySelector(".taste.ctrl.left");
                break;
            case "ControlRight":
                taste = document.querySelector(".taste.ctrl.right");
                break;
            case "AltRight":
                taste = document.querySelector(".taste.alt.right");
                break;
            case "AltLeft":
                taste = document.querySelector(".taste.alt.left");
                break;
            case "ShiftLeft":
                taste = document.querySelector(".taste.shift.left");
                break;
            case "ShiftRight":
                taste = document.querySelector(".taste.shift.right");
                break;
            case "CapsLock":
                taste = document.querySelector(".taste.caps.lock");
                break;
            case "Tab":
                taste = document.querySelector(".taste.shift");
                break;
            case "Enter":
                taste = document.querySelector(".taste.enter");
                break;
            case "Backspace":
                taste = document.querySelector(".taste.backspace");
                break;
            default:
                taste = Array.from(tasten).find(t => t.textContent.trim().toUpperCase() === event.key.toUpperCase());
                break;
        }
        if (taste) taste.classList.add("leuchtet");
    }, true);
    document.addEventListener("keyup", function(event) {
        let taste;
        switch (event.code) {
            case "Space":
                taste = document.querySelector(".taste.space");
                break;
            case "ControlLeft":
                taste = document.querySelector(".taste.ctrl.left");
                break;
            case "ControlRight":
                taste = document.querySelector(".taste.ctrl.right");
                break;
            case "AltRight":
                taste = document.querySelector(".taste.alt.right");
                break;
            case "AltLeft":
                taste = document.querySelector(".taste.alt.left");
                break;
            case "ShiftLeft":
                taste = document.querySelector(".taste.shift.left");
                break;
            case "ShiftRight":
                taste = document.querySelector(".taste.shift.right");
                break;
            case "CapsLock":
                taste = document.querySelector(".taste.caps.lock");
                break;
            case "Tab":
                taste = document.querySelector(".taste.shift");
                break;
            case "Enter":
                taste = document.querySelector(".taste.enter");
                break;
            case "Backspace":
                taste = document.querySelector(".taste.backspace");
                break;
            default:
                taste = Array.from(tasten).find(t => t.textContent.trim().toUpperCase() === event.key.toUpperCase());
                break;
        }
        if (taste) taste.classList.remove("leuchtet");
    });
});