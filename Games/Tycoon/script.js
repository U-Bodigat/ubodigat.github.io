document.addEventListener("DOMContentLoaded", function() {
    let ressourcenAnzahl = 0;
    let gebaudeAnzahl = 0;
    let gebaudeLevel = [];
    let gebaudeKosten = 10;
    const maxGebaudeLevel = 10;

    const ressourcenAnzahlElement = document.getElementById("ressourcenAnzahl");
    const ressourcenSammelnButton = document.getElementById("ressourcenSammelnButton");
    const gebaudeKaufenButton = document.getElementById("gebaudeKaufenButton");
    const modal = document.getElementById("modal");
    const modalText = document.getElementById("modalText");
    const modalBuy = document.getElementById("modalBuy");
    const modalCancel = document.getElementById("modalCancel");
    const closeModal = document.getElementById("closeModal");
    const statusText = document.getElementById("statusText");
    const gebaudeTabelle = document.getElementById("gebäudeTabelle");

    ressourcenSammelnButton.addEventListener("click", ressourcenSammeln);
    gebaudeKaufenButton.addEventListener("click", zeigeGebaudeKosten);
    closeModal.addEventListener("click", schließeModal);
    modalBuy.addEventListener("click", kaufeGebaude);
    modalCancel.addEventListener("click", schließeModal);

    function ressourcenSammeln() {
        ressourcenAnzahl += 1;
        updateRessourcenAnzahl();
    }

    function zeigeGebaudeKosten() {
        if (ressourcenAnzahl >= gebaudeKosten) {
            modalText.textContent = `Möchtest du das Gebäude für ${gebaudeKosten} Ressourcen kaufen?`;
            modalBuy.style.display = "inline-block";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";
        } else {
            const benötigteRessourcen = gebaudeKosten - ressourcenAnzahl;
            modalText.innerHTML = `Nicht genug Ressourcen! Du benötigst noch ${benötigteRessourcen} Ressourcen.`;
            modalBuy.style.display = "none";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";
        }
    }

    function kaufeGebaude() {
        if (ressourcenAnzahl >= gebaudeKosten) {
            ressourcenAnzahl -= gebaudeKosten;
            gebaudeAnzahl += 1;
            gebaudeLevel.push(0);
            updateGebaudeAnzahl();
            updateRessourcenAnzahl();
            updateGebaudeKosten();
            updateGebaudeStatus();
            updateGebaeudeTabelle();
            schließeModal();
            zeigeStatusText(`Gebäude erfolgreich gekauft!`);
            gebaudeTabelle.style.display = 'block';
        } else {
            modalText.textContent = `Nicht genug Ressourcen! Du benötigst ${gebaudeKosten} Ressourcen, um das Gebäude zu kaufen.`;
            modalBuy.style.display = "none";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";
        }
    }

    function levelnGebaude(gebaudeNummer) {
        if (gebaudeLevel[gebaudeNummer - 1] >= maxGebaudeLevel) {
            zeigeStatusText(`Maximales Level erreicht (${maxGebaudeLevel}).`);
            return;
        }

        const levelnGebaudeKosten = gebaudeLevel[gebaudeNummer - 1] * 18;
        if (ressourcenAnzahl >= levelnGebaudeKosten) {
            modalText.textContent = `Möchtest du das Gebäude auf Level ${gebaudeLevel[gebaudeNummer - 1] + 1} leveln? (Kosten: ${levelnGebaudeKosten} Ressourcen)`;
            modalBuy.style.display = "inline-block";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";

            modalBuy.onclick = function() {
                ressourcenAnzahl -= levelnGebaudeKosten;
                gebaudeLevel[gebaudeNummer - 1] += 1;
                updateGebaudeStatus(gebaudeNummer);
                schließeModal();
                zeigeStatusText(`Gebäude ${gebaudeNummer} erfolgreich auf Level ${gebaudeLevel[gebaudeNummer - 1]} gelevelt!`);
            };
        } else {
            modalText.textContent = `Nicht genug Ressourcen! Du benötigst ${levelnGebaudeKosten} Ressourcen, um das Gebäude zu leveln.`;
            modalBuy.style.display = "none";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";
        }
    }

    function createGebaudeRow(gebaudeNummer) {
        const tbody = gebaudeTabelle.querySelector("tbody");
        const existingRow = tbody.querySelector(`td[data-gebaude="${gebaudeNummer}"]`);

        if (!existingRow) {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td data-gebaude="${gebaudeNummer}">Gebäude ${gebaudeNummer}</td>
                <td>Level ${gebaudeLevel[gebaudeNummer - 1]}</td>
                <td><button class="leveln-button" id="leveln-button-${gebaudeNummer}">Leveln</button></td>`;
            tbody.appendChild(newRow);

            const levelnButton = document.getElementById(`leveln-button-${gebaudeNummer}`);
            levelnButton.addEventListener("click", () => {
                levelnGebaude(gebaudeNummer);
            });
        }
    }

    function updateGebaudeAnzahl() {
        const gebaudeStatus = gebaudeAnzahl === 1 ? 'Gebäude' : 'Gebäude';
        ressourcenAnzahlElement.textContent = `${gebaudeAnzahl} ${gebaudeStatus}`;
    }

    function updateRessourcenAnzahl() {
        ressourcenAnzahlElement.textContent = `${ressourcenAnzahl} Ressourcen`;
    }

    function updateGebaudeKosten() {
        gebaudeKosten = 10 + gebaudeAnzahl * 10;
    }

    function updateGebaudeStatus() {
        for (let i = 1; i <= gebaudeAnzahl; i++) {
            updateGebaudeStatusById(i);
        }
    }

    function updateGebaudeStatusById(gebaudeNummer) {
        const tbody = gebaudeTabelle.querySelector("tbody");
        const gebaudeRow = tbody.querySelector(`td[data-gebaude="${gebaudeNummer}"]`);
        if (gebaudeRow) {
            gebaudeRow.nextElementSibling.textContent = `Level ${gebaudeLevel[gebaudeNummer - 1]}`;
        }
    }

    function updateGebaeudeTabelle() {
        // Erstellen Sie Zeilen für alle vorhandenen Gebäude
        for (let i = 1; i <= gebaudeAnzahl; i++) {
            createGebaudeRow(i);
        }
    }

    function zeigeStatusText(text) {
        statusText.textContent = text;
        setTimeout(() => {
            statusText.textContent = "";
        }, 4000);
    }

    function schließeModal() {
        modal.style.display = "none";
    }

    updateRessourcenAnzahl();
    updateGebaudeKosten();
});