let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {

};
let ran_key;

function übunghinuzfügen() {
    dictionary[Frage.value] = input2.value;

    Frage.value = "";
    input2.value = "";

    localStorage.setItem('dictionary', JSON.stringify(dictionary));
    render();
}

function render() {
    Übungsliste.innerHTML = '';
    for (let key in dictionary) {
        Übungsliste.innerHTML += `<li> <b id="Abtrennung">F r a g e :</b> &nbsp ${dictionary[key]} &nbsp <b id="Abtrennung">L ö s u n g 💡:</b> &nbsp ${key}</li>`;
    }
}

function löschen() {
    localStorage.clear();
}

function nächstübung() {
    let obj_keys = Object.keys(dictionary);
    ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
    diefrage.innerHTML = `${dictionary[ran_key]} &nbsp?`;

    Antwort.value = "";

    //Übungszeit

    if (!timer_gestartet) {
        startzeit = new Date().getTime();
        timer_gestartet = true;

        timerInterval = setInterval(function() {
            const dauer_element = document.getElementById("dauer");
            const dauer_in_ms = dauer();
            const minuten = Math.floor(dauer_in_ms / 60000);
            const sekunden = Math.floor((dauer_in_ms % 60000) / 1000);
            const dauer_formatiert = ("0" + minuten).slice(-2) + ":" + ("0" + sekunden).slice(-2);
            dauer_element.textContent = dauer_formatiert;
        }, 1000);
    }
}

function richtigfalsch() {
    if (Antwort.value == ran_key) {
        überprüfungstext.innerHTML = `Richtig (;`;
    } else {
        überprüfungstext.innerHTML =
            `Das ist leider falsch ;(` +
            `<div id="lösungstext"> <h4>Das wäre die Lösung gewesen:</h4> <br> ${ran_key} </div>`;
    }
    nächstübung();
}

//Übungszeittimer

let timer_gestartet = false;
let startzeit;
let timerInterval;

function dauer() {
    return new Date().getTime() - startzeit;
}