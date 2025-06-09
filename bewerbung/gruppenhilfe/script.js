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
        alert("Bitte fülle alle Pflichtfelder aus.");
        return;
    }

    fetch("mail.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data)
    }).then(response => response.text()).then(console.log);

    fetch("DISCORD WEB HOOK", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: `📩 **Neue Bewerbung als Gruppenhilfe eingegangen:**
            👤 **Name:** ${data.vorname} ${data.nachname}
            🎮 **Discord:** ${data.discord}
            📧 **E-Mail:** ${data.email}
            📱 **Telefon:** ${data.telefon}
            🎂 **Geburtstag:** ${data.geburtstag}
            🕒 **Verfügbarkeit:** ${data.verfuegbarkeit}
            📌 **Erfahrung:** ${data.erfahrung}
            🛠 **Kenntnisse:** ${data.kenntnisse}
            💡 **Motivation:** ${data.motivation}
            🚻 **Geschlecht:** ${data.geschlecht}
            ✅ **Mindestalter bestätigt:** ${data.mindestalter}
            📝 **Kommentar:** ${data.kommentar || "-"}`
        })
    }).then(response => response.text()).then(console.log);

    document.getElementById("bewerbungsForm").reset();
    zeigeErfolgPopup();
});

function zeigeErfolgPopup() {
  document.getElementById("erfolgsPopup").classList.remove("hidden");
}

document.getElementById("popupClose").addEventListener("click", () => {
  document.getElementById("erfolgsPopup").classList.add("hidden");
});