document.addEventListener("DOMContentLoaded", function() {
    let ressourcenAnzahl = 0;
    let gebaudeAnzahl = 0;
    let gebaudeLevel = 1;
    let gebaudeKosten = 10;

    const ressourcenAnzahlElement = document.getElementById('ressourcenAnzahl');
    const gebaudeAnzahlElement = document.getElementById('gebaudeAnzahl');
    const gebaudeKaufenButton = document.getElementById('gebaudeKaufenButton');
    const modal = document.getElementById('modal');
    const modalText = document.getElementById('modalText');
    const modalBuy = document.getElementById('modalBuy');
    const modalCancel = document.getElementById('modalCancel');
    const closeModal = document.getElementById('closeModal');
    const statusText = document.getElementById('statusText');

    ressourcenSammelnButton.addEventListener('click', ressourcenSammeln);
    gebaudeKaufenButton.addEventListener('click', zeigeGebaudeKosten);
    closeModal.addEventListener('click', schließeModal);
    modalBuy.addEventListener('click', kaufeGebaude);
    modalCancel.addEventListener('click', schließeModal);

    function ressourcenSammeln() {
        ressourcenAnzahl += 1;
        updateRessourcenAnzahl();
    }

    function zeigeGebaudeKosten() {
        if (ressourcenAnzahl >= gebaudeKosten) {
            modalText.textContent = `Möchtest du das Gebäude für ${gebaudeKosten} Ressourcen kaufen?`;
            modalBuy.style.display = 'inline-block';
            modalCancel.style.display = 'inline-block';
            modal.style.display = 'block';
        } else {
            const benötigteRessourcen = gebaudeKosten - ressourcenAnzahl;
            modalText.innerHTML = `Nicht genug Ressourcen!<br>Du benötigst noch ${benötigteRessourcen} Ressourcen.`;
            modalBuy.style.display = 'none';
            modalCancel.style.display = 'inline-block';
            modal.style.display = 'block';
        }
    }

    const gebaudeTabelle = document.getElementById('gebäudeTabelle');

    function kaufeGebaude() {
        if (ressourcenAnzahl >= gebaudeKosten) {
            ressourcenAnzahl -= gebaudeKosten;
            gebaudeAnzahl += 1;
            gebaudeLevel = 1;
            updateGebaudeAnzahl();
            updateRessourcenAnzahl();
            updateGebaudeKosten();
            updateGebaudeStatus();
            updateGebaeudeTabelle();
            schließeModal();
            zeigeStatusText(`Gebäude erfolgreich gekauft!`);
        } else {
            zeigeStatusText(`Nicht genug Ressourcen, um das Gebäude zu kaufen!`);
        }
    }

    function zeigeStatusText(text) {
        statusText.textContent = text;
        setTimeout(() => {
            statusText.textContent = '';
        }, 4000); // Text verschwindet nach 4 Sekunden
    }

    function updateGebaeudeTabelle() {
        const tbody = gebaudeTabelle.querySelector('tbody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>Gebäude ${gebaudeAnzahl}</td>
            <td>${gebaudeLevel}</td>
            <td><button class="leveln-button" data-gebaude="${gebaudeAnzahl}">Leveln</button></td>`;
        tbody.appendChild(newRow);
    }

    function schließeModal() {
        modal.style.display = 'none';
    }

    function updateGebaudeAnzahl() {
        const gebaudeStatus = gebaudeAnzahl === 1 ? 'Gebäude' : 'Gebäude';
        gebaudeAnzahlElement.textContent = `${gebaudeAnzahl} ${gebaudeStatus}`;
    }

    function updateRessourcenAnzahl() {
        ressourcenAnzahlElement.textContent = `${ressourcenAnzahl} Ressourcen`;
    }

    function updateGebaudeKosten() {
        gebaudeKosten = 10 + (gebaudeLevel - 1) * 10;
    }

    function updateGebaudeStatus() {
        // Hier kannst du den Status des Gebäudes aktualisieren, wenn es ein Level gibt.
    }

    updateRessourcenAnzahl();
    updateGebaudeKosten();
    updateGebaudeStatus();
});