import * as THREE from 'three';

export function initInput(state, container) {
    document.addEventListener('pointerlockchange', () => {
        state.isPointerLocked = document.pointerLockElement === container;
    });

    container.addEventListener('click', () => {
        if (state.gameRunning && !state.isPointerLocked) container.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (!state.isPointerLocked) return;

        const sensitivity = 0.002;
        state.camera.yaw -= e.movementX * sensitivity;
        state.camera.pitch -= e.movementY * sensitivity;

        const pitchLimit = Math.PI / 2 - 0.1;
        state.camera.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, state.camera.pitch));
    });

    document.addEventListener('wheel', (e) => {
        if (!state.gameRunning) return;
        state.camera.dist += e.deltaY * 0.01;
        state.camera.dist = Math.max(5, Math.min(50, state.camera.dist));
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') state.isFreeLook = true;

        if (state.isFreeLook) return;

        if (e.code === 'Space') {
            e.preventDefault();
            state.isSpacePressed = true;
        }

        handleSteering(e.key, state);
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') state.isFreeLook = false;
        if (e.code === 'Space') {
            e.preventDefault();
            state.isSpacePressed = false;
        }
    });
}

function handleSteering(key, state) {
    const fX = -Math.sin(state.camera.yaw);
    const fZ = -Math.cos(state.camera.yaw);

    let moveDir = { x: 0, z: 0 };
    if (Math.abs(fX) > Math.abs(fZ)) {
        moveDir = { x: Math.sign(fX), z: 0 };
    } else {
        moveDir = { x: 0, z: Math.sign(fZ) };
    }

    const rightDir = { x: moveDir.z, z: -moveDir.x };
    let nextDir = null;

    switch (key) {
        case 'ArrowUp':
        case 'w':
            nextDir = { x: moveDir.x, y: 0, z: moveDir.z };
            break;
        case 'ArrowDown':
        case 's':
            nextDir = { x: -moveDir.x, y: 0, z: -moveDir.z };
            break;
        case 'ArrowLeft':
        case 'a':
            nextDir = { x: -rightDir.x, y: 0, z: -rightDir.z };
            break;
        case 'ArrowRight':
        case 'd':
            nextDir = { x: rightDir.x, y: 0, z: rightDir.z };
            break;
    }

    if (nextDir) {
        state.nextVelocity = nextDir;
    }
}

export function updateMouseSteering(state, cameraObject) {
    if (!state.gameRunning || !state.isPointerLocked || state.isFreeLook) return;

    const yaw = state.camera.yaw;
    const pitch = state.camera.pitch;

    const fX = Math.sin(yaw) * Math.cos(pitch);
    const fY = -Math.sin(pitch);
    const fZ = Math.cos(yaw) * Math.cos(pitch);

    let targetDir = { x: 0, y: 0, z: 0 };
    const absX = Math.abs(fX);
    const absY = Math.abs(fY);
    const absZ = Math.abs(fZ);

    if (absX > absY && absX > absZ) {
        targetDir = { x: Math.sign(fX), y: 0, z: 0 };
    } else if (absY > absX && absY > absZ) {
        targetDir = { x: 0, y: Math.sign(fY), z: 0 };
    } else {
        targetDir = { x: 0, y: 0, z: Math.sign(fZ) };
    }

    state.nextVelocity = targetDir;
}
