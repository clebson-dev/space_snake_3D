import { createInitialState } from './js/state.js';
import { initGraphics, syncVisuals, scene, camera, renderer, composer, resetVisuals } from './js/graphics.js';
import { initInput, updateMouseSteering, updateMobileControlsVisibility } from './js/input.js';
import { updateLogic } from './js/logic.js';
import { updateEffects, triggerWarpEffect, createExplosion, clearEffects } from './js/effects.js';
import { GRID_SIZE } from './js/constants.js';
import { initLocalization } from './js/localization.js';

const container = document.getElementById('canvas-container');
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseExitBtn = document.getElementById('pause-exit-btn');
const gameoverExitBtn = document.getElementById('gameover-exit-btn');
const pauseScreen = document.getElementById('pause-screen');

let state = createInitialState();
let lastTime = 0;
let accumulator = 0;
const TIME_STEP = 100;

initGraphics(container);
initInput(state, container);
initLocalization();
updateMobileControlsVisibility(state);

function startGame() {
    clearEffects(state, scene);
    resetVisuals(scene);

    state.gameRunning = true;
    state.gameOver = false;
    state.isPaused = false;
    state.score = 0;
    state.highScore = parseInt(localStorage.getItem('spaceSnake3DHighScore') || '0');
    state.foods = [];
    state.blackHoles = [];
    state.particles = [];
    state.events = [];
    state.pendingGrowth = 0;
    state.gameSpeed = TIME_STEP;
    state.speedMultiplier = 1.0;
    state.isBoosting = false;
    state.boostEnergy = state.maxBoostEnergy;
    state.rareFood = null;
    state.rareFood = null;
    state.predictedPortals = { entry: null, exit: null };
    state.npcSnakes = [];

    if (!state.camera) state.camera = {};
    state.camera.yaw = 0;
    state.camera.pitch = 0.5;
    state.camera.dist = 30;
    state.camera.shake = 0;
    state.camera.warp = { active: false, progress: 0, startPos: null };

    const center = Math.floor(GRID_SIZE / 2);
    state.snake = [];
    const initialLength = 20;
    for (let i = 0; i < initialLength; i++) {
        state.snake.push({ x: center, y: center, z: center - i });
    }

    state.previousSnake = [];
    for (let i = 0; i < state.snake.length; i++) {
        state.previousSnake.push({ ...state.snake[i] });
    }

    state.velocity = { x: 0, y: 0, z: 1 };
    state.nextVelocity = { x: 0, y: 0, z: 1 };

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');

    startBtn.blur();
    restartBtn.blur();
    pauseRestartBtn.blur();

    lastTime = performance.now();
    accumulator = 0;

    if (!state.isAnimateRunning) {
        requestAnimationFrame(animate);
        state.isAnimateRunning = true;
    }

    updateMobileControlsVisibility(state);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', startGame);
if (pauseExitBtn) pauseExitBtn.addEventListener('click', exitToMenu);
if (gameoverExitBtn) gameoverExitBtn.addEventListener('click', exitToMenu);

document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (state.gameRunning && !state.gameOver) {
            togglePause();
        }
    }
});

function togglePause() {
    if (!state.gameRunning || state.gameOver) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        pauseScreen.classList.remove('hidden');
        document.exitPointerLock();
    } else {
        pauseScreen.classList.add('hidden');
        if (!state.isPointerLocked) container.requestPointerLock();
    }
    updateMobileControlsVisibility(state);
}

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (!state.gameRunning || state.isPaused) {
        renderer.render(scene, camera);
        return;
    }

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    const safeDelta = Math.min(deltaTime, 250);
    accumulator += safeDelta;

    if (state.isSpacePressed) {
        if (state.isBoosting) {
            if (state.boostEnergy <= 0) {
                state.isBoosting = false;
                state.boostEnergy = 0;
            }
        } else {
            if (state.boostEnergy > 5) {
                state.isBoosting = true;
            }
        }
    } else {
        state.isBoosting = false;
    }

    const boost = state.isBoosting ? 2.0 : 1.0;
    const currentStep = TIME_STEP / ((state.speedMultiplier || 1.0) * boost);

    while (accumulator >= currentStep) {
        if (state.isBoosting) {
            state.boostEnergy -= state.boostDrainRate * currentStep;
            if (state.boostEnergy < 0) state.boostEnergy = 0;
        } else {
            state.boostEnergy += state.boostRechargeRate * currentStep;
            if (state.boostEnergy > state.maxBoostEnergy) state.boostEnergy = state.maxBoostEnergy;
        }

        updateMouseSteering(state, camera);
        const result = updateLogic(state);

        if (result && result.gameOver) {
            state.gameRunning = false;
            createExplosion(result.crashPos.x, result.crashPos.y, result.crashPos.z, 0xff0055, scene, state);
            showGameOver();
            return;
        }

        for (const evt of state.events) {
            if (evt.type === 'WARP') {
                triggerWarpEffect(state);
                const flash = document.getElementById('flash-overlay');
                if (flash) {
                    flash.classList.add('flash-active');
                    setTimeout(() => flash.classList.remove('flash-active'), 1500);
                }
            }
        }

        if (state.camera.warp.active && !state.camera.warp.startPos) {
            state.camera.warp.startPos = camera.position.clone();
        }

        accumulator -= currentStep;
    }

    const alpha = accumulator / currentStep;

    updateEffects(state, scene);
    syncVisuals(state, alpha);

    scoreElement.textContent = state.score.toString().padStart(4, '0');
    const currentBoost = state.isBoosting ? 2.0 : 1.0;
    speedElement.textContent = Math.round((state.speedMultiplier || 1.0) * currentBoost * 100) + '%';

    const boostFill = document.getElementById('boost-bar-fill');
    if (boostFill) {
        const pct = Math.max(0, Math.min(100, (state.boostEnergy / state.maxBoostEnergy) * 100));
        boostFill.style.width = pct + '%';

        if (state.boostEnergy < 20) {
            boostFill.style.background = '#ff0000';
        } else {
            boostFill.style.background = 'linear-gradient(90deg, #ff0055, #bc13fe)';
        }
    }

    composer.render();
}

function showGameOver() {
    const finalScore = document.getElementById('final-score');
    if (finalScore) finalScore.textContent = state.score;
    gameOverScreen.classList.remove('hidden');
    document.exitPointerLock();

    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('spaceSnake3DHighScore', state.score);
        document.getElementById('high-score').textContent = state.score.toString().padStart(4, '0');
    }
    updateMobileControlsVisibility(state);
}

function exitToMenu() {
    state.gameRunning = false;
    state.isPaused = false;
    state.gameOver = false;

    clearEffects(state, scene);
    resetVisuals(scene);

    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    startScreen.classList.remove('hidden');

    document.exitPointerLock();
    updateMobileControlsVisibility(state);
}
