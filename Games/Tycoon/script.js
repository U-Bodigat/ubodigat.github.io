document.addEventListener("DOMContentLoaded", function() {
    let ressourcenAnzahl = 0;
    let gebaudeAnzahl = 0;
    let gebaudeLevel = 0;
    let gebaudeKosten = 10;

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
            modalBuy.removeEventListener("click", levelnGebaude); // Entfernen Sie den Event-Listener für das Leveln
            modalBuy.addEventListener("click", kaufeGebaude); // Fügen Sie einen Event-Listener für den Kauf hinzu
        } else {
            const benötigteRessourcen = gebaudeKosten - ressourcenAnzahl;
            modalText.innerHTML = `Nicht genug Ressourcen!<br>Du benötigst noch ${benötigteRessourcen} Ressourcen.`;
            modalBuy.style.display = "none";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";
        }
    }

    function kaufeGebaude() {
        if (ressourcenAnzahl >= gebaudeKosten) {
            ressourcenAnzahl -= gebaudeKosten;
            gebaudeAnzahl += 1;
            gebaudeLevel = 0;
            updateGebaudeAnzahl();
            updateRessourcenAnzahl();
            updateGebaudeKosten();
            updateGebaudeStatus();
            updateGebaeudeTabelle();
            schließeModal();
            zeigeStatusText(`Gebäude erfolgreich gekauft!`);
            gebaudeTabelle.style.display = 'block';
        } else {
            zeigeStatusText(`Nicht genug Ressourcen, um das Gebäude zu kaufen!`);
        }
    }

    function levelnGebaude(gebaudeNummer) {
        const levelnGebaudeKosten = gebaudeLevel === 0 ? 17 : gebaudeLevel * 18;
        if (ressourcenAnzahl >= levelnGebaudeKosten) {
            modalText.textContent = `Möchtest du das Gebäude auf Level ${gebaudeLevel + 1} für ${levelnGebaudeKosten} Ressourcen leveln?`;
            modalBuy.textContent = "Leveln";
            modalBuy.style.display = "inline-block";
            modalCancel.style.display = "inline-block";
            modal.style.display = "block";

            modalBuy.addEventListener("click", () => {
                ressourcenAnzahl -= levelnGebaudeKosten;
                gebaudeLevel += 1;
                updateRessourcenAnzahl(); // Ressourcen aktualisieren
                updateGebaudeStatus(gebaudeNummer);
                schließeModal();
                zeigeStatusText(`Gebäude ${gebaudeNummer} erfolgreich auf Level ${gebaudeLevel} gelevelt!`);
            });
        } else {
            modalText.innerHTML = `Nicht genug Ressourcen!<br>Du benötigst noch ${levelnGebaudeKosten - ressourcenAnzahl} Ressourcen.`;
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
                <td>Level ${gebaudeLevel}</td>
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

    function updateGebaudeStatus(gebaudeNummer) {
        const tbody = gebaudeTabelle.querySelector("tbody");
        const gebaudeRow = tbody.querySelector(`td[data-gebaude="${gebaudeNummer}"]`);
        if (gebaudeRow) {
            gebaudeRow.nextElementSibling.textContent = `Level ${gebaudeLevel}`;
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