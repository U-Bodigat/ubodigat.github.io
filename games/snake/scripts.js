let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let rows = 25;
let cols = 50;
let snake = [{ x: 19, y: 3 }];
let food;
let cellWidth = canvas.width / cols;
let cellHeight = canvas.height / rows;
let direction = 'LEFT';
let foodCollected = false;
let score = 0;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let gameInterval;
let isPaused = false;

placeFood();

startGame();
document.addEventListener('keydown', keyDown);

draw();

function startGame() {
    gameInterval = setInterval(gameLoop, 300);
}

function pauseGame() {
    clearInterval(gameInterval);
}

function draw() {
    ctx.fillStyle = '#066e46';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';

    snake.forEach(part => add(part.x, part.y));

    ctx.fillStyle = '#00ff40';
    add(food.x, food.y); // Food

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
    highScores.slice(0, 3).forEach((highScore, index) => {
        ctx.fillText((index + 1) + '. ' + highScore, 10, 50 + index * 20);
    });

    requestAnimationFrame(draw);
}

function testGameOver() {
    let firstPart = snake[0];
    let otherParts = snake.slice(1);
    let duplicatePart = otherParts.find(part => part.x == firstPart.x && part.y == firstPart.y);

    if (snake[0].x < 0 || snake[0].x > cols - 1 || snake[0].y < 0 || snake[0].y > rows - 1 || duplicatePart) {
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5); // Keep only top 5 scores
        localStorage.setItem('highScores', JSON.stringify(highScores)); // Save to localStorage
        score = 0;
        placeFood();
        snake = [{ x: 19, y: 3 }];
        direction = 'LEFT';
    }
}

function placeFood() {
    let randomX = Math.floor(Math.random() * cols);
    let randomY = Math.floor(Math.random() * rows);

    food = { x: randomX, y: randomY };
}

function add(x, y) {
    ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth - 1, cellHeight - 1);
}

function shiftSnake() {
    for (let i = snake.length - 1; i > 0; i--) {
        const part = snake[i];
        const lastPart = snake[i - 1];
        part.x = lastPart.x;
        part.y = lastPart.y;
    }
}

function gameLoop() {
    if (!isPaused) {
        testGameOver();
        if (foodCollected) {
            snake = [{ x: snake[0].x, y: snake[0].y }, ...snake];
            foodCollected = false;
            score++;
        }

        shiftSnake();

        if (direction == 'LEFT') {
            snake[0].x--;
        }

        if (direction == 'RIGHT') {
            snake[0].x++;
        }

        if (direction == 'UP') {
            snake[0].y--;
        }

        if (direction == 'DOWN') {
            snake[0].y++;
        }

        if (snake[0].x == food.x && snake[0].y == food.y) {
            foodCollected = true;
            placeFood();
        }
    }
}

function keyDown(e) {
    if (e.keyCode == 37) {
        direction = 'LEFT';
    }
    if (e.keyCode == 38) {
        direction = 'UP';
    }
    if (e.keyCode == 39) {
        direction = 'RIGHT';
    }
    if (e.keyCode == 40) {
        direction = 'DOWN';
    }
}

document.getElementById('highScoresLink').onclick = function() {
    isPaused = true;
    pauseGame();
    let modal = document.getElementById('highScoresModal');
    let allHighScores = document.getElementById('allHighScores');
    allHighScores.innerHTML = '';
    highScores.forEach((highScore, index) => {
        let li = document.createElement('li');
        li.textContent = (index + 1) + '. ' + highScore;
        allHighScores.appendChild(li);
    });
    modal.style.display = 'block';
}

document.getElementsByClassName('close')[0].onclick = function() {
    isPaused = false;
    startGame();
    document.getElementById('highScoresModal').style.display = 'none';
}

window.onclick = function(event) {
    let modal = document.getElementById('highScoresModal');
    if (event.target == modal) {
        isPaused = false;
        startGame();
        modal.style.display = 'none';
    }
}