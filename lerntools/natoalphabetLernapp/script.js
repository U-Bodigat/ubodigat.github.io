const natoAlphabet = [
    { letter: "A", word: "Alpha" },
    { letter: "B", word: "Bravo" },
    { letter: "C", word: "Charlie" },
    { letter: "D", word: "Delta" },
    { letter: "E", word: "Echo" },
    { letter: "F", word: "Foxtrot" },
    { letter: "G", word: "Golf" },
    { letter: "H", word: "Hotel" },
    { letter: "I", word: "India" },
    { letter: "J", word: "Juliett" },
    { letter: "K", word: "Kilo" },
    { letter: "L", word: "Lima" },
    { letter: "M", word: "Mike" },
    { letter: "N", word: "November" },
    { letter: "O", word: "Oscar" },
    { letter: "P", word: "Papa" },
    { letter: "Q", word: "Quebec" },
    { letter: "R", word: "Romeo" },
    { letter: "S", word: "Sierra" },
    { letter: "T", word: "Tango" },
    { letter: "U", word: "Uniform" },
    { letter: "V", word: "Victor" },
    { letter: "W", word: "Whiskey" },
    { letter: "X", word: "X-ray" },
    { letter: "Y", word: "Yankee" },
    { letter: "Z", word: "Zulu" }
];

let currentQuestion = 0;
let shuffledAlphabet = shuffleArray(natoAlphabet);
let wordsVisible = false;

function shuffleArray(array) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showQuestion() {
    const questionElement = document.getElementById("question");
    const letterElement = document.createElement("span");
    letterElement.classList.add("letter");
    letterElement.textContent = shuffledAlphabet[currentQuestion].letter;
    questionElement.textContent = "Welches Wort gehört zum Buchstaben ";
    questionElement.appendChild(letterElement);
    questionElement.textContent += "?";
}

function checkAnswer() {
    const userAnswer = document.getElementById("answer").value.toLowerCase();
    const correctAnswer = shuffledAlphabet[currentQuestion].word.toLowerCase();

    if (userAnswer === correctAnswer) {
        alert("Richtig!");
    } else {
        alert("Falsch! Die richtige Antwort ist: " + shuffledAlphabet[currentQuestion].word);
    }

    const speech = new SpeechSynthesisUtterance();
    speech.text = shuffledAlphabet[currentQuestion].word;
    speech.lang = "en-en";
    speechSynthesis.speak(speech);

    document.getElementById("answer").value = "";
    currentQuestion++;
    if (currentQuestion < shuffledAlphabet.length) {
        showQuestion();
    } else {
        alert("Das war die letzte Frage!");
    }
}

function showWords() {
    const wordsElement = document.getElementById("words");
    wordsElement.innerHTML = "";

    if (wordsVisible) {
        document.getElementById("toggleButton").textContent = "Wörter anzeigen";
        wordsVisible = false;
    } else {
        for (let i = 0; i < natoAlphabet.length; i++) {
            const listItem = document.createElement("li");
            listItem.textContent = natoAlphabet[i].letter + " - " + natoAlphabet[i].word;
            wordsElement.appendChild(listItem);

        }
        document.getElementById("toggleButton").textContent = "Wörter ausblenden";
        wordsVisible = true;
    }
}

function handleKeyPress(event) {
    if (event.keyCode === 13) {
        checkAnswer();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    showQuestion();
    document.getElementById("answer").addEventListener("keypress", handleKeyPress);
});