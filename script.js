// script.js

// Define constants and variables
const canvas = document.getElementById('gameCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const previewCtx = previewCanvas.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScoreDisplay = document.getElementById('finalScore');
const popupRestartButton = document.getElementById('popupRestartButton');
const popupExitButton = document.getElementById('popupExitButton');
const backgroundMessage = document.getElementById('background-message');

const blockSize = 30;
const cols = 10;
const rows = 20;
const canvasWidth = cols * blockSize;
const canvasHeight = rows * blockSize;

canvas.width = canvasWidth;
canvas.height = canvasHeight;
previewCanvas.width = 120;
previewCanvas.height = 60;

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let level = 1;
let board = Array.from({ length: rows }, () => Array(cols).fill(0));
let currentTetrimino;
let currentPos;
let nextTetrimino;
let gameInterval;
let isPaused = false;

// Sound effects and music
const lineClearSound = new Audio('sounds/lineClear.mp3');
const gameOverSound = new Audio('sounds/gameOver.mp3');
const rotateSound = new Audio('sounds/rotate.mp3');
const backgroundMusic = new Audio('sounds/backgroundMusic.mp3');
backgroundMusic.loop = true;

// Define TETRIMINOS shapes and colors
const TETRIMINOS = {
    I: { shape: [[1, 1, 1, 1]], color: 'cyan' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
    O: { shape: [[1, 1], [1, 1]], color: 'yellow' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }
};

const KEY = {
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40,
    UP: 38,
    PAUSE: 80,
    RESUME: 82
};

// Start the game
function startGame() {
    score = 0;
    level = 1;
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    gameOverPopup.classList.add('hidden');
    startButton.style.display = 'none';
    pauseButton.style.display = 'inline';
    restartButton.style.display = 'inline';
    exitButton.style.display = 'inline';
    backgroundMusic.play();
    generateTetrimino();
    gameInterval = setInterval(updateGame, 1000 - level * 100); // Adjust game speed based on level
}

function updateGame() {
    if (!isPaused) {
        if (!moveTetriminoDown()) {
            freezeTetrimino();
            clearLines();
            generateTetrimino();
            if (isGameOver()) {
                endGame();
            }
        }
        drawBoard();
        drawTetrimino();
    }
}

function pauseGame() {
    isPaused = true;
    clearInterval(gameInterval);
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'inline';
}

function resumeGame() {
    isPaused = false;
    gameInterval = setInterval(updateGame, 1000 - level * 100); // Adjust game speed based on level
    resumeButton.style.display = 'none';
    pauseButton.style.display = 'inline';
}

function restartGame() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    startGame();
}

function endGame() {
    clearInterval(gameInterval);
    gameOverSound.play();
    backgroundMusic.pause();
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverPopup.classList.remove('hidden');
    startButton.style.display = 'inline';
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'none';
    restartButton.style.display = 'none';
    exitButton.style.display = 'none';

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = `High Score: ${highScore}`;
    }
}

// Function to move the background message
function moveBackgroundMessage() {
    let x = Math.random() * (window.innerWidth - backgroundMessage.offsetWidth);
    let y = Math.random() * (window.innerHeight - backgroundMessage.offsetHeight);
    let xDirection = Math.random() < 0.5 ? -1 : 1;
    let yDirection = Math.random() < 0.5 ? -1 : 1;

    setInterval(() => {
        x += xDirection * 2;
        y += yDirection * 2;

        if (x <= 0 || x >= window.innerWidth - backgroundMessage.offsetWidth) {
            xDirection *= -1;
        }

        if (y <= 0 || y >= window.innerHeight - backgroundMessage.offsetHeight) {
            yDirection *= -1;
        }

        backgroundMessage.style.left = `${x}px`;
        backgroundMessage.style.top = `${y}px`;
    }, 50);
}

// Initialize the background message movement
moveBackgroundMessage();

// Function to generate a random Tetrimino
function generateTetrimino() {
    const tetriminos = 'IJLOSTZ';
    const rand = Math.floor(Math.random() * tetriminos.length);
    const name = tetriminos[rand];
    currentTetrimino = TETRIMINOS[name];
    currentPos = { x: Math.floor((cols - currentTetrimino.shape[0].length) / 2), y: 0 };
    nextTetrimino = TETRIMINOS[tetriminos[(rand + 1) % tetriminos.length]];
    drawPreview();
}

function drawPreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    drawShape(nextTetrimino.shape, { x: 0, y: 0 }, previewCtx, nextTetrimino.color);
}

function moveTetriminoLeft() {
    if (!isCollision(currentTetrimino.shape, { x: currentPos.x - 1, y: currentPos.y })) {
        currentPos.x -= 1;
    }
}

function moveTetriminoRight() {
    if (!isCollision(currentTetrimino.shape, { x: currentPos.x + 1, y: currentPos.y })) {
        currentPos.x += 1;
    }
}

function moveTetriminoDown() {
    if (!isCollision(currentTetrimino.shape, { x: currentPos.x, y: currentPos.y + 1 })) {
        currentPos.y += 1;
        return true;
    }
    return false;
}

function rotateTetrimino() {
    const rotatedShape = currentTetrimino.shape[0].map((_, i) =>
        currentTetrimino.shape.map(row => row[i])
    ).reverse();

    if (!isCollision(rotatedShape, currentPos)) {
        currentTetrimino.shape = rotatedShape;
        rotateSound.play();
    }
}

function freezeTetrimino() {
    currentTetrimino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + currentPos.y][x + currentPos.x] = value;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;

    for (let y = board.length - 1; y >= 0; y--) {
        if (board[y].every(value => value > 0)) {
            board.splice(y, 1);
            board.unshift(Array(cols).fill(0));
            linesCleared += 1;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreDisplay.textContent = `Score: ${score}`;
        lineClearSound.play();
    }
}

function isCollision(shape, position) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (
                shape[y][x] &&
                (board[y + position.y] && board[y + position.y][x + position.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function isGameOver() {
    return currentTetrimino.shape.some((row, y) => {
        return row.some((value, x) => {
            return value && board[y + currentPos.y] && board[y + currentPos.y][x + currentPos.x] !== 0;
        });
    });
}

function drawBoard() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = currentTetrimino.color;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        });
    });
}

function drawTetrimino() {
    drawShape(currentTetrimino.shape, currentPos, ctx, currentTetrimino.color);
}

function drawShape(shape, position, context, color) {
    context.fillStyle = color;
    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillRect(
                    (position.x + x) * blockSize,
                    (position.y + y) * blockSize,
                    blockSize,
                    blockSize
                );
                context.strokeRect(
                    (position.x + x) * blockSize,
                    (position.y + y) * blockSize,
                    blockSize,
                    blockSize
                );
            }
        });
    });
}

document.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
        case KEY.LEFT:
            moveTetriminoLeft();
            break;
        case KEY.RIGHT:
            moveTetriminoRight();
            break;
        case KEY.DOWN:
            moveTetriminoDown();
            break;
        case KEY.UP:
            rotateTetrimino();
            break;
        case KEY.PAUSE:
            pauseGame();
            break;
        case KEY.RESUME:
            resumeGame();
            break;
    }
    drawBoard();
    drawTetrimino();
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);
popupRestartButton.addEventListener('click', restartGame);
exitButton.addEventListener('click', () => {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    window.location.reload();
});
popupExitButton.addEventListener('click', () => {
    window.location.reload();
});
