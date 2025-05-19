document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const gameArea = document.getElementById('gameArea');
    const instructions = document.querySelector('.instructions');

    // Neue Canvas für Vorschau
    const nextCanvas = document.getElementById('next');
    const nextCtx = nextCanvas.getContext('2d');

    let cols = 15;
    let rows = 25;
    let isPaused = false;
    const blockSize = 20;

    function resizeCanvas(w, h) {
        canvas.width = w * blockSize;
        canvas.height = h * blockSize;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(blockSize, blockSize);
    }

    resizeCanvas(cols, rows);

    const colors = [null, '#00bcd4', '#ff4081', '#ffeb3b', '#8bc34a', '#ff5722', '#3f51b5', '#e91e63'];

    let arena = createMatrix(cols, rows);
    let nextPiece = createRandomPiece();
    let player = { pos: { x: 0, y: 0 }, matrix: nextPiece };
    nextPiece = createRandomPiece();
    drawNext();

    let dropCounter = 0;
    let dropInterval = 500;
    let lastTime = 0;
    let animationId = null;
    let gameOver = false;

    function createMatrix(w, h) {
        return Array.from({ length: h }, () => new Array(w).fill(0));
    }

    function createRandomPiece() {
        const pieces = 'TJLOSZI';
        return createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }

    function createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2]
                ];
            case 'L':
                return [
                    [0, 0, 3],
                    [3, 3, 3],
                    [0, 0, 0]
                ];
            case 'J':
                return [
                    [4, 0, 0],
                    [4, 4, 4],
                    [0, 0, 0]
                ];
            case 'I':
                return [
                    [0, 0, 0, 0],
                    [5, 5, 5, 5],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0]
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0]
                ];
        }
    }

    function drawMatrix(matrix, offset, ctxTarget) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctxTarget.fillStyle = colors[value];
                    ctxTarget.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctxTarget.strokeStyle = '#000';
                    ctxTarget.lineWidth = 0.05;
                    ctxTarget.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function drawNext() {
        nextCtx.setTransform(1, 0, 0, 1, 0, 0);
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        nextCtx.scale(20, 20);

        const matrix = nextPiece;
        const offsetX = Math.floor((nextCanvas.width / 20 - matrix[0].length) / 2);
        const offsetY = Math.floor((nextCanvas.height / 20 - matrix.length) / 2);

        drawMatrix(matrix, { x: offsetX, y: offsetY }, nextCtx);
    }

    function draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(arena, { x: 0, y: 0 }, ctx);
        if (player.matrix) {
            drawMatrix(player.matrix, player.pos, ctx);
        }
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
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
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
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < y; x++) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach(row => row.reverse());
        else matrix.reverse();
    }

    function arenaSweep() {
        outer: for (let y = arena.length - 1; y >= 0; y--) {
            for (let x = 0; x < arena[y].length; x++) {
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
        player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
        if (collide(arena, player)) {
            gameOver = true;
            cancelAnimationFrame(animationId);
            showGameOver();
        }
    }

    function update(time = 0) {
        if (gameOver || isPaused) return;
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
        animationId = requestAnimationFrame(update);
    }

    function showGameOver() {
        draw();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, rows / 2 - 2, cols, 4);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.max(1.2, cols / 10)}px Arial`;
        ctx.fillText('🟥 GAME OVER 🟥', cols / 2, rows / 2);
        startButton.disabled = false;
        startButton.textContent = '🔁 Neustarten';
    }

    startButton.addEventListener('click', () => {
        if (gameOver) {
            arena = createMatrix(cols, rows);
            playerReset();
            dropCounter = 0;
            lastTime = 0;
            gameOver = false;
            isPaused = false;
            startButton.textContent = '⏸ Pause';
            startButton.disabled = false;
            update();
            return;
        }

        if (!animationId) {
            isPaused = false;
            startButton.textContent = '⏸ Pause';
            update();
        } else {
            if (isPaused) {
                isPaused = false;
                startButton.textContent = '⏸ Pause';
                update();
            } else {
                isPaused = true;
                startButton.textContent = '▶️ Weiter';
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    });

    document.addEventListener('keydown', e => {
        if (gameOver) return;
        if (e.key === 'ArrowLeft') playerMove(-1);
        else if (e.key === 'ArrowRight') playerMove(1);
        else if (e.key === 'ArrowDown') playerDrop();
        else if (e.key === 'q') playerRotate(-1);
        else if (e.key === 'w') playerRotate(1);
    });

    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            gameArea.requestFullscreen().then(() => {
                gameArea.classList.add('fullscreen');
                instructions.style.display = 'none';
                fullscreenToggle.textContent = '🔙 Verlassen';
                cols = Math.floor(window.innerWidth / blockSize);
                rows = Math.floor(window.innerHeight / blockSize);
                resizeCanvas(cols, rows);
                arena = createMatrix(cols, rows);
                playerReset();
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            gameArea.classList.remove('fullscreen');
            instructions.style.display = 'block';
            fullscreenToggle.textContent = '🔳 Vollbild';
            cols = 15;
            rows = 25;
            resizeCanvas(cols, rows);
            arena = createMatrix(cols, rows);
            playerReset();
        }
    });
});