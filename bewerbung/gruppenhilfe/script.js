document.getElementById("bewerbungsForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const data = {
        vorname: document.getElementById("vorname").value.trim(),
        nachname: document.getElementById("nachname").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefon: document.getElementById("telefon").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        geburtstag: document.getElementById("geburtstag").value,
        verfuegbarkeit: document.getElementById("verfuegbarkeit").value.trim(),
        erfahrung: document.getElementById("erfahrung").value.trim(),
        kenntnisse: document.getElementById("kenntnisse").value.trim(),
        motivation: document.getElementById("motivation").value.trim(),
        geschlecht: document.querySelector('input[name="geschlecht"]:checked')?.value || "",
        kommentar: document.getElementById("kommentar").value.trim(),
        mindestalter: document.getElementById("mindestalter").checked ? "Ja" : "Nein"
    };

    if (!data.vorname || !data.nachname || !data.email || !data.discord) {
        ubodigatAlert("Bitte fülle alle Pflichtfelder aus.");
        return;
    }

    if (!document.getElementById("datenschutz").checked) {
        ubodigatAlert("Bitte bestätige, dass du mit der Verarbeitung deiner Daten laut Datenschutzerklärung einverstanden bist.");
        return;
    }

    const felder = [
        ["Vorname", data.vorname],
        ["Nachname", data.nachname],
        ["E-Mail", data.email],
        ["Telefon", data.telefon],
        ["Discord-Tag/Name", data.discord],
        ["Geburtstag", data.geburtstag],
        ["Geschlecht", data.geschlecht],
        ["Verfügbarkeit", data.verfuegbarkeit],
        ["Erfahrung mit Discord", data.erfahrung],
        ["Kenntnisse / technische Skills", data.kenntnisse],
        ["Motivation", data.motivation],
        ["Mindestalter bestätigt", data.mindestalter],
        ["Zusätzlicher Kommentar", data.kommentar || "–"],
    ];
    const emailBody = felder.map(([label, value]) => label + ": " + value).join("\n");
    const mailtoLink = "mailto:bewerbung@ubodigat.com" +
        "?subject=" + encodeURIComponent("Bewerbung Gruppenhilfe – " + data.vorname + " " + data.nachname + " | " + data.discord) +
        "&body=" + encodeURIComponent(emailBody);

    window.location.href = mailtoLink;

    document.getElementById("bewerbungsForm").reset();
    zeigeErfolgPopup();
});

function zeigeErfolgPopup() {
    document.getElementById("erfolgsPopup").classList.remove("hidden");
}

document.getElementById("popupClose").addEventListener("click", () => {
    document.getElementById("erfolgsPopup").classList.add("hidden");
});