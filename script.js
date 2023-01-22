let docTitel = document.title;
window, addEventListener("blur", () => {
    document.title = "ubodigat.tk | Inaktiv 😫";
})
window, addEventListener("focus", () => {
    document.title = docTitel;
})

// Dies sorgt dafür dass wenn man den tab ändern sich der titel ändert.

function copyText() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "Dieser Text ist leider nicht konfiguriert, melden sie sich beim Webseite-Betrieber. Ihr U:Bodigat.tk Support Team: 'contact@ubodigat.tk'";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}

function copyText2() { //Das script ist dafür verantwortlich das der Text wo definiert ist in der zwischenablage gespeichert wird.
    var text = "https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjixK2t_tr8AhWfSPEDHfaDDEAQFnoECAwQAw&url=https%3A%2F%2Fwww.coolblue.de%2Fberatung%2Frichtiges-ladegeraet-fuer-samsung-galaxy-s22-auswaehlen.html%23%3A~%3Atext%3DMit%2520dem%2520Samsung%252025%2520Watt%2Cdieser%2520Zeit%2520auf%252040%2520Prozent.&usg=AOvVaw3H27gyFtBRPav3Z09JB7yf";
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text erfolgreich kopiert');
    }, function(err) {
        console.error('Fehler beim Kopieren des Texts: ', err);
    });
}