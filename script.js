let docTitel = document.title;
window, addEventListener("blur", () => {
    document.title = "ubodigat.tk | Inaktiv 😫";
})
window, addEventListener("focus", () => {
    document.title = docTitel;
})

// Dies sorgt dafür dass wenn man den tab ändern sich der titel ändert.

function copyText() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "Name: Samsung Group Gründungsjahr: 1938 Gründer: Lee Byung-chull Hauptsitz: Seoul, Südkorea Branche: Elektronik, Technologie Mitarbeiter: circa 300.000 (2021) Umsatz: circa 220 Milliarden US-Dollar (2020) Produkte: Smartphones, Tablets, tragbare Geräte, Haushaltsgeräte, Fernseher, Computer, Speicherchips, Halbleiter, Biotechnologie, Finanzdienstleistungen. Trucker_Erik";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}

function copyText2() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "Dieser Text ist leider nicht konfiguriert, melden sie sich beim Webseite-Betrieber. Ihr U:Bodigat.tk Support Team: 'contact@ubodigat.tk'";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}