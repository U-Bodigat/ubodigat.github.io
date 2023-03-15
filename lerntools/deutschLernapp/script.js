let score = 0;
let currentQuestion = 1;

function checkAnswer(frage, richtigeAntwort) {
    const form = document.getElementById(frage);
    const antworten = form.elements[frage];
    let ausgewaehlt = false;
    let ausgewaehlteAntwort;

    for (let i = 0; i < antworten.length; i++) {
        if (antworten[i].checked) {
            ausgewaehlt = true;
            ausgewaehlteAntwort = antworten[i].value;
            break;
        }
    }

    if (ausgewaehlt && ausgewaehlteAntwort === richtigeAntwort) {
        score++;
        document.getElementById('punktestand').innerHTML = `Punktestand: ${score}`;
        document.getElementById(`ergebnis${frage.slice(-1)}`).innerHTML = `Richtig!`;
    } else {
        if (ausgewaehlt) {
            document.getElementById(`ergebnis${frage.slice(-1)}`).innerHTML = `Falsch! Die richtige Antwort ist ${richtigeAntwort.toUpperCase()}.`;
        } else {
            document.getElementById(`ergebnis${frage.slice(-1)}`).innerHTML = `Bitte wählen Sie eine Antwort aus.`;
        }
        if (score > 0) {
            score--;
            document.getElementById('punktestand').innerHTML = `Punktestand: ${score}`;
        }
    }

    document.getElementById(frage).reset();

    if (currentQuestion === 1 && ausgewaehlt) {
        document.getElementById('frage2').style.display = 'block';
        currentQuestion++;
    } else if (currentQuestion === 2 && ausgewaehlt) {
        document.getElementById('frage3').style.display = 'block';
        currentQuestion++;
    } else if (currentQuestion === 3 && ausgewaehlt) {
        document.getElementById('buttonantwort').style.display = 'none';
    }
}