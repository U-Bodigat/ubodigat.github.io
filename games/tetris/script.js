document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const gameArea = document.getElementById('gameArea');
    const instructions = document.querySelector('.instructions');

    let cols = 15;
    let rows = 25;
    const blockSize = 20;

    function resizeCanvas(w, h) {
        canvas.width = w * blockSize;
        canvas.height = h * blockSize;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(blockSize, blockSize);
    }

    resizeCanvas(cols, rows);

    const colors = [
        null,
        '#00bcd4', '#ff4081', '#ffeb3b', '#8bc34a', '#ff5722', '#3f51b5', '#e91e63'
    ];

    let arena = createMatrix(cols, rows);
    let player = {
        pos: { x: 0, y: 0 },
        matrix: null
    };

    let dropCounter = 0;
    let dropInterval = 500;
    let lastTime = 0;
    let animationId = null;
    let gameOver = false;

    function createMatrix(w, h) {
        return Array.from({ length: h }, () => new Array(w).fill(0));
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

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    function draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(arena, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);
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
        const pieces = 'TJLOSZI';
        player.matrix = createPiece(pieces[Math.random() * pieces.length | 0]);
        player.pos.y = 0;
        player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
        if (collide(arena, player)) {
            gameOver = true;
            cancelAnimationFrame(animationId);
            showGameOver();
        }
    }

    function update(time = 0) {
        if (gameOver) return;
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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, rows / 2 - 2, cols, 4);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.max(1.2, cols / 10)}px Arial`;

        ctx.fillText('🟥 GAME OVER 🟥', cols / 2, rows / 2);

        startButton.disabled = false;
        startButton.textContent = '🔁 Neustarten';
    }


    startButton.addEventListener('click', () => {
        arena = createMatrix(cols, rows);
        playerReset();
        dropCounter = 0;
        lastTime = 0;
        gameOver = false;
        startButton.disabled = true;
        startButton.textContent = '🟢 Läuft...';
        update();
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