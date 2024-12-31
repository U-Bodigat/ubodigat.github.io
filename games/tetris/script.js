// Spielfeld und Tetris-Steuerung
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');

// Spielfeld
const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 20;
const COLORS = ['#00bcd4', '#ff4081', '#ff5722', '#8bc34a', '#ffeb3b', '#3f51b5', '#e91e63'];
let grid = [];
let isGameOver = false;
let currentPiece = null;
let gameInterval; // Interval für das Spiel

// Die Spielfeld-Größe erstellen
function createGrid() {
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLUMNS; c++) {
            grid[r][c] = 'white';
        }
    }
}

// Zeichnen des Spielfelds
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
            ctx.fillStyle = grid[r][c];
            ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
}

// Zufällige Tetris-Formen generieren
function randomPiece() {
    const shapes = [
        [
            [1, 1, 1, 1]
        ], // Linie
        [
            [1, 1, 1],
            [1]
        ], // T
        [
            [1, 1],
            [1, 1]
        ], // Quadrat
        [
            [1, 1, 0],
            [0, 1, 1]
        ], // Z
        [
            [0, 1, 1],
            [1, 1, 0]
        ], // S
        [
            [1, 1, 0],
            [1, 0, 0]
        ], // L
        [
            [0, 1, 1],
            [1, 0, 0]
        ] // J
    ];

    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    return {
        shape: shape,
        color: color,
        x: Math.floor(COLUMNS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// Das Tetris-Element zeichnen
function drawPiece(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                ctx.fillStyle = piece.color;
                ctx.fillRect((piece.x + c) * BLOCK_SIZE, (piece.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'black';
                ctx.strokeRect((piece.x + c) * BLOCK_SIZE, (piece.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Überprüfen, ob das Stück das Spielfeld oder andere Teile trifft
function collides(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                if (piece.x + c < 0 || piece.x + c >= COLUMNS || piece.y + r >= ROWS || grid[piece.y + r][piece.x + c] !== 'white') {
                    return true;
                }
            }
        }
    }
    return false;
}

// Stück ins Spielfeld einfügen
function placePiece(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
                grid[piece.y + r][piece.x + c] = piece.color;
            }
        }
    }
}

// Zeilen löschen, die voll sind
function clearLines() {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r].every(cell => cell !== 'white')) {
            grid.splice(r, 1);
            grid.unshift(new Array(COLUMNS).fill('white'));
        }
    }
}

// Spiel starten
function startGame() {
    createGrid();
    isGameOver = false;
    currentPiece = randomPiece();
    drawGrid();
    drawPiece(currentPiece);

    // Starte die Spiel-Loop
    gameInterval = setInterval(gameLoop, 500);
    startButton.disabled = true; // Deaktiviere den Button, während das Spiel läuft
}

// Haupt-Spiel-Schleife
function gameLoop() {
    if (isGameOver) {
        clearInterval(gameInterval); // Stoppe die Spiel-Loop
        startButton.disabled = false; // Button wieder aktivieren
        return;
    }

    drawGrid();
    drawPiece(currentPiece);

    if (collides(currentPiece)) {
        placePiece(currentPiece);
        clearLines();
        currentPiece = randomPiece();
        if (collides(currentPiece)) {
            isGameOver = true;
            alert('Spiel vorbei!');
        }
    } else {
        currentPiece.y++;
    }
}

// Steuerung des Spiels
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    if (e.key === 'ArrowLeft') {
        currentPiece.x--;
        if (collides(currentPiece)) currentPiece.x++;
    } else if (e.key === 'ArrowRight') {
        currentPiece.x++;
        if (collides(currentPiece)) currentPiece.x--;
    } else if (e.key === 'ArrowDown') {
        currentPiece.y++;
        if (collides(currentPiece)) currentPiece.y--;
    } else if (e.key === 'q') {
        const rotatedShape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[index])).reverse();
        const newPiece = {...currentPiece, shape: rotatedShape };
        if (!collides(newPiece)) currentPiece = newPiece;
    } else if (e.key === 'w') {
        const rotatedShape = currentPiece.shape.map(row => row.reverse());
        const newPiece = {...currentPiece, shape: rotatedShape };
        if (!collides(newPiece)) currentPiece = newPiece;
    }
});

// Spiel starten bei Button-Klick
startButton.addEventListener('click', () => {
    if (!isGameOver) {
        alert('Das Spiel läuft bereits!');
    } else {
        startGame(); // Spiel neu starten, wenn es vorbei ist
    }
});