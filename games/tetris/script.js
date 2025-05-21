document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next');
    const nextCtx = nextCanvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const gameArea = document.getElementById('gameArea');
    const instructions = document.querySelector('.instructions');

    const cols = 10;
    const rows = 20;
    const blockSize = 30;

    canvas.width = cols * blockSize;
    canvas.height = rows * blockSize;
    ctx.scale(blockSize, blockSize);

    nextCanvas.width = 6 * blockSize;
    nextCanvas.height = 6 * blockSize;
    nextCtx.scale(blockSize, blockSize);

    const colors = [null, '#00bcd4', '#ff4081', '#ffeb3b', '#8bc34a', '#ff5722', '#3f51b5', '#e91e63'];

    let arena = createMatrix(cols, rows);
    let player = { pos: { x: 0, y: 0 }, matrix: null };
    let nextPiece = createRandomPiece();
    let dropCounter = 0;
    let dropInterval = 500;
    let lastTime = 0;
    let animationId = null;
    let gameOver = false;
    let isPaused = false;

    function createMatrix(w, h) {
        return Array.from({ length: h }, () => new Array(w).fill(0));
    }

    function createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 1, 0],
                    [1, 1, 1]
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2]
                ];
            case 'L':
                return [
                    [0, 0, 3],
                    [3, 3, 3]
                ];
            case 'J':
                return [
                    [4, 0, 0],
                    [4, 4, 4]
                ];
            case 'I':
                return [
                    [5, 5, 5, 5]
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0]
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7]
                ];
        }
    }

    function createRandomPiece() {
        const pieces = 'TJLOSZI';
        return createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }

    function drawMatrix(matrix, offset, context) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    context.strokeStyle = '#000';
                    context.lineWidth = 0.05;
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width / blockSize, canvas.height / blockSize);
        drawMatrix(arena, { x: 0, y: 0 }, ctx);
        if (player.matrix) drawMatrix(player.matrix, player.pos, ctx);
    }

    function drawNext() {
        nextCtx.setTransform(1, 0, 0, 1, 0, 0);
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        nextCtx.scale(blockSize, blockSize);
        const matrix = nextPiece;
        const offsetX = Math.floor((nextCanvas.width / blockSize - matrix[0].length) / 2);
        const offsetY = Math.floor((nextCanvas.height / blockSize - matrix.length) / 2);
        drawMatrix(matrix, { x: offsetX, y: offsetY }, nextCtx);
    }

    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m[y].length; x++) {
                if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            arenaSweep();
            playerReset();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    function playerRotate(dir) {
        const original = player.matrix.map(row => row.slice());
        rotate(player.matrix, dir);
        let offset = 1;
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                player.matrix = original;
                return;
            }
        }
    }

    function rotate(matrix, dir) {
        const transposed = matrix[0].map((_, i) => matrix.map(row => row[i]));
        if (dir > 0) matrix.splice(0, matrix.length, ...transposed.map(row => row.reverse()));
        else matrix.splice(0, matrix.length, ...transposed.reverse());
    }

    function arenaSweep() {
        outer: for (let y = arena.length - 1; y >= 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) continue outer;
            }
            arena.splice(y, 1);
            arena.unshift(new Array(arena[0].length).fill(0));
        }
    }

    function playerReset() {
        player.matrix = nextPiece;
        nextPiece = createRandomPiece();
        drawNext();
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
        if (collide(arena, player)) {
            gameOver = true;
            cancelAnimationFrame(animationId);
            showGameOver();
        }
    }

    function showGameOver() {
        draw();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, rows / 2 - 1.5, cols, 3);
        ctx.fillStyle = '#fff';
        ctx.font = '1.2px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🟥 GAME OVER 🟥', cols / 2, rows / 2);
        startButton.disabled = false;
        startButton.textContent = '🔁 Neustarten';
    }

    function update(time = 0) {
        if (gameOver || isPaused) return;
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) playerDrop();
        draw();
        animationId = requestAnimationFrame(update);
    }

    startButton.addEventListener('click', () => {
        if (gameOver) {
            arena = createMatrix(cols, rows);
            gameOver = false;
            isPaused = false;
            playerReset();
            dropCounter = 0;
            lastTime = 0;
            startButton.textContent = '⏸ Pause';
            update();
        } else if (!animationId) {
            isPaused = false;
            startButton.textContent = '⏸ Pause';
            update();
        } else {
            isPaused = !isPaused;
            startButton.textContent = isPaused ? '▶️ Weiter' : '⏸ Pause';
            if (!isPaused) update();
        }
    });

    document.addEventListener('keydown', e => {
        if (gameOver || isPaused) return;
        if (e.key === 'ArrowLeft') playerMove(-1);
        else if (e.key === 'ArrowRight') playerMove(1);
        else if (e.key === 'ArrowDown') playerDrop();
        else if (e.key === 'q') playerRotate(-1);
        else if (e.key === 'w') playerRotate(1);
    });

    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            gameArea.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen');
                instructions.style.display = 'none';
                fullscreenToggle.textContent = '🔙 Verlassen';
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen');
            instructions.style.display = 'block';
            fullscreenToggle.textContent = '🔳 Vollbild';
        }
    });

    drawNext();
    playerReset();
});