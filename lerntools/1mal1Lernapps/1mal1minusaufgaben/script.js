var score = 0;
var questionNum = 1;
var correctAnswer;
var timeLeft = 25;
var intervalId;

function generateQuestion() {
    var operator = Math.floor(Math.random() * 1);
    var num1, num2, question;

    switch (operator) {
        case 0: // minus
            num1 = Math.floor(Math.random() * 99) + 1;
            num2 = Math.floor(Math.random() * 99) + 1;
            question = num1 + " - " + num2 + " = ";
            correctAnswer = num1 - num2;
            break;
    }

    document.getElementById("question").textContent = question;
    document.getElementById("num1").textContent = num1;
    document.getElementById("num2").textContent = num2;
}

function checkAnswer() {
    var userAnswer = parseInt(document.getElementById("answer").value);
    if (isNaN(userAnswer)) {
        document.getElementById("result").textContent = "Bitte geben Sie eine Zahl ein.";
    } else if (userAnswer === correctAnswer) {
        document.getElementById("result").textContent = "Richtig!";
        score += 1;
        document.getElementById("score").textContent = "Punktestand: " + score;
        clearInterval(intervalId);
        timeLeft = 25;
        startTimer();
    } else {
        document.getElementById("result").textContent = "Falsch! Die richtige Antwort ist: " + correctAnswer;
        score -= 1;
        document.getElementById("score").textContent = "Punktestand: " + score;
        timeLeft = 25;
        startTimer();
    }
    document.getElementById("answer").value = "";
    generateQuestion();
}

function startTimer() {
    clearInterval(intervalId);
    document.getElementById("check-answer-btn").textContent = "Antwort überprüfen";
    intervalId = setInterval(function() {
        timeLeft -= 1;
        document.getElementById("time-left").textContent = timeLeft;
        if (timeLeft === 0) {
            clearInterval(intervalId);
            timeLeft = 0;
            score = 0;
            document.getElementById("score").textContent = "Punktestand: " + score;
            document.getElementById("result").textContent = "Zeit ist abgelaufen!";
            document.getElementById("check-answer-btn").textContent = "Start";
        }
    }, 1000);
}

document.getElementById("check-answer-btn").addEventListener("click", function() {
    if (document.getElementById("check-answer-btn").textContent === "Start") {
        timeLeft = 25;
    }
    startTimer();
    checkAnswer();
});

document.getElementById("answer").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("check-answer-btn").click();
    }
});

generateQuestion();