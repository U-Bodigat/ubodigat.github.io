"use strict";
let dictionary = JSON.parse(localStorage.getItem('dictionary')) || {};
let eintraege = Object.values(dictionary);
let runde = [];
let falschGemerkt = [];
let index = 0;
let rundeGestartet = false;

function ladeKartenrunde(nurFalsche = false) {
    falschGemerkt = nurFalsche ? falschGemerkt : [];
    index = 0;
    runde = nurFalsche && falschGemerkt.length ?
        shuffle([...falschGemerkt]) :
        shuffle([...Object.values(dictionary)]);
    falschGemerkt = [];
    zeigeKarteikarte();
    document.getElementById("lernbuttons").style.display = "flex";
    document.getElementById("startHinweis").style.display = "none";
}

function zeigeKarteikarte() {
    const fortschrittText = document.getElementById("fortschrittText");
    const fortschrittFuellung = document.getElementById("fortschrittFuellung");
    const vorder = document.getElementById("vorderseite");
    const rueck = document.getElementById("rueckseite");
    if (index >= runde.length) {
        zeigeErgebnisfenster();
        return;
    }
    const karte = runde[index];
    const frageOderAntwort = Math.random() < 0.5;
    const vorderseite = frageOderAntwort ? karte.question : karte.answer;
    const rueckseite = frageOderAntwort ? karte.answer : karte.question;

    vorder.innerText = vorderseite;
    rueck.innerText = rueckseite;

    vorder.classList.add("aktiv");
    rueck.classList.remove("aktiv");

    fortschrittText.innerText = `Karte ${index + 1} von ${runde.length}`;
    fortschrittFuellung.style.width = `${((index + 1) / runde.length) * 100}%`;
}

function antwort(gewusst) {
    if (!gewusst) falschGemerkt.push(runde[index]);
    index++;
    zeigeKarteikarte();
}

function zeigeErgebnisfenster() {
    const overlay = document.getElementById("rundeBeendetOverlay");
    overlay.style.display = "flex";
}

function neuStarten(nurFalsche) {
    document.getElementById("rundeBeendetOverlay").style.display = "none";
    ladeKartenrunde(nurFalsche);
}

window.addEventListener("DOMContentLoaded", function() {
    const karteikarte = document.getElementById("karteikarte");
    const vorder = document.getElementById("vorderseite");
    const rueck = document.getElementById("rueckseite");
    const lernbuttons = document.getElementById("lernbuttons");
    const startHinweis = document.getElementById("startHinweis");

    if (!karteikarte) return;

    karteikarte.addEventListener("click", function() {
        if (!rundeGestartet) {
            rundeGestartet = true;
            ladeKartenrunde(false);
            if (lernbuttons) lernbuttons.style.display = "flex";
            if (startHinweis) startHinweis.style.display = "none";
        } else {
            vorder.classList.toggle("aktiv");
            rueck.classList.toggle("aktiv");
        }
    });
});

function shuffle(array) {
    let a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

window.antwort = antwort;
window.neuStarten = neuStarten;

function zeigeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'flex';
}

function schließeModusFenster() {
    document.getElementById('modusFensterOverlay').style.display = 'none';
}