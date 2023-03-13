const words = [
    "Apfel",
    "Banane",
    "Kartoffel",
    "Erdbeere",
    "Birne",
    "Tomate",
    "Zucchini",
    "Gurke",
    "Paprika",
    "Möhre",
];

const wordEl = document.getElementById("word");
const answerEl = document.getElementById("answer");
const checkBtn = document.getElementById("check-btn");
const nextBtn = document.getElementById("next-btn");
const resultMessageEl = document.getElementById("result-message");
const resultEl = document.querySelector(".result");

let currentWordIndex = 0;

function generateRandomWord() {
    const index = Math.floor(Math.random() * words.length);
    return words[index];
}

function checkAnswer() {
    const answer = answerEl.value.trim();
    const word = words[currentWordIndex];
    if (answer.toLowerCase() === word.toLowerCase()) {
        resultMessageEl.textContent = "Richtig!";
        resultMessageEl.style.color = "green";
    } else {
        resultMessageEl.textContent = "Falsch!";
        resultMessageEl.style.color = "red";
    }
    resultEl.style.display = "block";
    answerEl.disabled = true;
    checkBtn.disabled = true;
}

function showNextWord() {
    currentWordIndex++;
    if (currentWordIndex >= words.length) {
        currentWordIndex = 0;
    }
    const word = generateRandomWord();
    wordEl.textContent = word;
    answerEl.value = "";
    resultEl.style.display = "none";
    answerEl.disabled = false;
    checkBtn.disabled = false;
    answerEl.focus();
}

checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", showNextWord);

showNextWord();