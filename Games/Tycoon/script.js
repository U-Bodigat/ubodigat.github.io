document.addEventListener("DOMContentLoaded", function() {
    let ressourcenAnzahl = 0;
    let gebaudeAnzahl = 0;
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
            gebaudeKosten = 10 + gebaudeAnzahl * 10; // Erhöhe die Kosten mit jedem Kauf
            updateRessourcenAnzahl();
            updateGebaudeKosten();
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
            statusText.textContent = "";
        }, 4000); // Text verschwindet nach 4 Sekunden
    }

    function updateGebaeudeTabelle() {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
          <td>Gebäude ${gebaudeAnzahl}</td>
          <td><button class="leveln-button" data-gebaude="${gebaudeAnzahl}">Leveln</button></td>`;
        gebaudeTabelle.querySelector("tbody").appendChild(newRow);
    }

    function schließeModal() {
        modal.style.display = "none";
    }

    function updateRessourcenAnzahl() {
        ressourcenAnzahlElement.textContent = `${ressourcenAnzahl} Ressourcen`;
    }

    function updateGebaudeKosten() {
        gebaudeKosten = 10 + gebaudeAnzahl * 10; // Aktualisiere die Kosten für das nächste Gebäude
    }

    updateRessourcenAnzahl();
    updateGebaudeKosten();
});