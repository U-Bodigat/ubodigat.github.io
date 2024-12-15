var paddleA = document.getElementById("paddleA");
var paddleB = document.getElementById("paddleB");
var ball = document.getElementById("ball");
var scoreA = document.getElementById("scoreA");
var scoreB = document.getElementById("scoreB");
var startButton = document.getElementById("startButton");

var ballSpeedX = 2;
var ballSpeedY = 2;
var scoreLeft = 0;
var scoreRight = 0;
var gameStarted = false;

var paddleASpeed = 0;
var paddleBSpeed = 0;

var resetButton = document.getElementById("resetButton");

resetButton.addEventListener("click", resetGame);

startButton.addEventListener("click", startGame);

document.addEventListener("keydown", function(event) {
    if (event.key === "w") {
        paddleASpeed = -5;
    } else if (event.key === "s") {
        paddleASpeed = 5;
    } else if (event.key === "ArrowUp") {
        paddleBSpeed = -5;
    } else if (event.key === "ArrowDown") {
        paddleBSpeed = 5;
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "w" || event.key === "s") {
        paddleASpeed = 0;
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        paddleBSpeed = 0;
    }
});

var initialBallSpeedX = 7; // Ursprünglicher Wert für die Geschwindigkeit des Balls in der X-Richtung
var initialBallSpeedY = 7; // Ursprünglicher Wert für die Geschwindigkeit des Balls in der Y-Richtung

var ballSpeedX = initialBallSpeedX; // Aktueller Wert für die Geschwindigkeit des Balls in der X-Richtung
var ballSpeedY = initialBallSpeedY; // Aktueller Wert für die Geschwindigkeit des Balls in der Y-Richtung

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        startButton.style.display = "none";
        resetScore();
        ballSpeedX = initialBallSpeedX; // Setze die Geschwindigkeit des Balls auf den ursprünglichen Wert
        ballSpeedY = initialBallSpeedY;
        paddleA.style.top = "160px";
        paddleB.style.top = "160px";
        ball.style.left = "390px";
        ball.style.top = "190px";
        update();
    }
}

function resetGame() {
    gameStarted = false;
    startButton.style.display = "block";
    resetScore();
    paddleA.style.top = "160px";
    paddleB.style.top = "160px";
    ball.style.left = "390px";
    ball.style.top = "190px";
    ballSpeedX = 0; // Setze die Geschwindigkeit des Balls auf 0
    ballSpeedY = 0;
    location.reload(); // Seite neu laden
}

function resetScore() {
    scoreLeft = 0;
    scoreRight = 0;
    scoreA.textContent = scoreLeft;
    scoreB.textContent = scoreRight;
}

function update() {
    var ballX = ball.offsetLeft;
    var ballY = ball.offsetTop;
    var paddleAY = paddleA.offsetTop;
    var paddleBY = paddleB.offsetTop;

    if (ballX >= 760) {
        ballSpeedX = -ballSpeedX;
        scoreRight++;
        scoreB.textContent = scoreRight;
    } else if (ballX <= 20) {
        ballSpeedX = -ballSpeedX;
        scoreLeft++;
        scoreA.textContent = scoreLeft;
    }

    if (ballY >= 380 || ballY <= 0) {
        ballSpeedY = -ballSpeedY;
    }

    if (
        (ballX <= 40 && ballY + 20 >= paddleAY && ballY <= paddleAY + 80) ||
        (ballX >= 740 && ballY + 20 >= paddleBY && ballY <= paddleBY + 80)
    ) {
        ballSpeedX = -ballSpeedX;
    }

    ball.style.left = (ballX + ballSpeedX) + "px";
    ball.style.top = (ballY + ballSpeedY) + "px";

    movePaddle(paddleA, paddleASpeed);
    movePaddle(paddleB, paddleBSpeed);

    requestAnimationFrame(update);
}

function movePaddle(paddle, speed) {
    var topPosition = parseInt(paddle.style.top) || 0;
    paddle.style.top = (topPosition + speed) + "px";
}

function movePaddle(paddle, speed) {
    var topPosition = parseInt(paddle.style.top) || 0;
    var newPosition = topPosition + speed;

    // Begrenze die Position des Balkens innerhalb des Spielfelds
    if (newPosition < 0) {
        newPosition = 0;
    } else if (newPosition + paddle.offsetHeight > 400) {
        newPosition = 400 - paddle.offsetHeight;
    }

    paddle.style.top = newPosition + "px";
}

// Infotext Funktion

function showPopup() {
    alert("Ziel: Schlage den Ball mit deinem Paddel über das Netz, um Punkte zu erzielen, indem du den Gegner dazu bringst, den Ball zu verpassen.  Steuerung: Spieler A: Verwende die Pfeiltasten *Auf* und *Ab*. Spieler B: Verwende die Tasten *W* und *S*. Spielablauf: Starte das Spiel durch Klicken auf *Start*. Schlage den Ball über das Netz und versuche, den Gegner zu überlisten. Jeder verpasste Ball gibt dem Gegner einen Punkt. Reset: Klicke auf *Reset*, um das Spiel zurückzusetzen. Viel Spaß!");
}