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
const backgroundMusic = new Audio('sounds/backgroundMusic.mp3');
backgroundMusic.loop = true;

// Define Tetriminos shapes and colors
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
    document.addEventListener('keydown', handleKeyPress);
}

// Pause the game
function pauseGame() {
    clearInterval(gameInterval);
    isPaused = true;
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'inline';
}

// Resume the game
function resumeGame() {
    gameInterval = setInterval(updateGame, 1000 - level * 100);
    isPaused = false;
    resumeButton.style.display = 'none';
    pauseButton.style.display = 'inline';
}

// Restart the game
function restartGame() {
    clearInterval(gameInterval);
    startGame();
}

// Exit the game
function exitGame() {
    clearInterval(gameInterval);
    backgroundMusic.pause();
    startButton.style.display = 'inline';
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'none';
    restartButton.style.display = 'none';
    exitButton.style.display = 'none';
    document.removeEventListener('keydown', handleKeyPress);
}

// Generate a new Tetrimino
function generateTetrimino() {
    const keys = Object.keys(TETRIMINOS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    currentTetrimino = TETRIMINOS[randomKey];
    currentPos = { x: Math.floor((cols - currentTetrimino.shape[0].length) / 2), y: 0 };
    if (!isValidMove(currentTetrimino, currentPos)) {
        gameOver();
    } else {
        drawTetrimino(currentTetrimino, currentPos);
        drawPreview();
    }
}

// Draw the Tetrimino on the canvas
function drawTetrimino(tetrimino, pos) {
    ctx.fillStyle = tetrimino.color;
    tetrimino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillRect((pos.x + x) * blockSize, (pos.y + y) * blockSize, blockSize, blockSize);
            }
        });
    });
}

// Draw the preview of the next Tetrimino
function drawPreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const nextKeys = Object.keys(TETRIMINOS);
    const randomNextKey = nextKeys[Math.floor(Math.random() * nextKeys.length)];
    nextTetrimino = TETRIMINOS[randomNextKey];
    previewCtx.fillStyle = nextTetrimino.color;
    nextTetrimino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                previewCtx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        });
    });
}

// Update the game state
function updateGame() {
    moveTetriminoDown();
}

// Move the Tetrimino down
function moveTetriminoDown() {
    const newPos = { x: currentPos.x, y: currentPos.y + 1 };
    if (isValidMove(currentTetrimino, newPos)) {
        currentPos = newPos;
    } else {
        placeTetrimino();
        clearLines();
        generateTetrimino();
    }
    drawBoard();
}

// Place the Tetrimino on the board
function placeTetrimino() {
    currentTetrimino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPos.y + y][currentPos.x + x] = currentTetrimino.color;
            }
        });
    });
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    board.forEach((row, y) => {
        if (row.every(cell => cell !== 0)) {
            linesCleared++;
            board.splice(y, 1);
            board.unshift(Array(cols).fill(0));
        }
    });
    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreDisplay.textContent = `Score: ${score}`;
        lineClearSound.play();
    }
}

// Draw the board and Tetrimino
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                ctx.fillStyle = cell;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        });
    });
    drawTetrimino(currentTetrimino, currentPos);
}

// Handle key press events
function handleKeyPress(e) {
    if (isPaused) return;
    switch (e.keyCode) {
        case KEY.LEFT:
            moveTetrimino(-1);
            break;
        case KEY.RIGHT:
            moveTetrimino(1);
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
}

// Move the Tetrimino left or right
function moveTetrimino(dir) {
    const newPos = { x: currentPos.x + dir, y: currentPos.y };
    if (isValidMove(currentTetrimino, newPos)) {
        currentPos = newPos;
    }
    drawBoard();
}

// Rotate the Tetrimino
function rotateTetrimino() {
    const newTetrimino = { ...currentTetrimino, shape: rotateMatrix(currentTetrimino.shape) };
    if (isValidMove(newTetrimino, currentPos)) {
        currentTetrimino = newTetrimino;
    }
    drawBoard();
}

// Check if the move is valid
function isValidMove(tetrimino, pos) {
    return tetrimino.shape.every((row, y) => {
        return row.every((value, x) => {
            const newX = pos.x + x;
            const newY = pos.y + y;
            return (
                value === 0 ||
                (newX >= 0 && newX < cols && newY < rows && board[newY][newX] === 0)
            );
        });
    });
}

// Rotate the matrix (Tetrimino)
function rotateMatrix(matrix) {
    return matrix[0].map((_, index) => matrix.map(row => row[index])).reverse();
}

// Game over
function gameOver() {
    clearInterval(gameInterval);
    backgroundMusic.pause();
    gameOverSound.play();
    gameOverPopup.classList.remove('hidden');
    finalScoreDisplay.textContent = `Score: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = `High Score: ${highScore}`;
    }
    document.removeEventListener('keydown', handleKeyPress);
}

// Background message animation
let messagePosX = 0;
let messagePosY = 0;
let messageSpeedX = 2;
let messageSpeedY = 1;

function updateBackgroundMessage() {
    const messageWidth = backgroundMessage.offsetWidth;
    const messageHeight = backgroundMessage.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Update position
    messagePosX += messageSpeedX;
    messagePosY += messageSpeedY;

    // Check for collision with boundaries and reverse direction if needed
    if (messagePosX + messageWidth > windowWidth || messagePosX < 0) {
        messageSpeedX = -messageSpeedX;
    }
    if (messagePosY + messageHeight > windowHeight || messagePosY < 0) {
        messageSpeedY = -messageSpeedY;
    }

    // Apply new position
    backgroundMessage.style.transform = `translate(${messagePosX}px, ${messagePosY}px)`;
    requestAnimationFrame(updateBackgroundMessage);
}

// Start the background message animation
updateBackgroundMessage();

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', restartGame);
exitButton.addEventListener('click', exitGame);
popupRestartButton.addEventListener('click', restartGame);
popupExitButton.addEventListener('click', exitGame);
