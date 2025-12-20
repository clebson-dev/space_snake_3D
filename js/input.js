import * as THREE from 'three';

export function initInput(state, container) {
    document.addEventListener('pointerlockchange', () => {
        state.isPointerLocked = document.pointerLockElement === container;
    });

    container.addEventListener('click', () => {
        if (state.gameRunning && !state.isPointerLocked && !state.isTouchDevice) {
            container.requestPointerLock();
        }
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

    initTouchControls(state);
}

let joystickState = {
    active: false,
    origin: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    id: null
};

function initTouchControls(state) {
    const joystickArea = document.getElementById('joystick-area');
    const joystickKnob = document.getElementById('joystick-knob');
    const boostBtn = document.getElementById('mobile-boost-btn');
    const pauseBtn = document.getElementById('mobile-pause-btn');
    const container = document.getElementById('canvas-container');

    state.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickState.active) return;

        const touch = e.changedTouches[0];
        joystickState.active = true;
        joystickState.id = touch.identifier;

        const rect = joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        joystickState.origin = { x: centerX, y: centerY };
        joystickState.current = { x: touch.clientX, y: touch.clientY };

        updateJoystickVisuals(joystickKnob);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!joystickState.active) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickState.id) {
                const touch = e.changedTouches[i];
                joystickState.current = { x: touch.clientX, y: touch.clientY };
                updateJoystickVisuals(joystickKnob);
                break;
            }
        }
    }, { passive: false });

    const endJoystick = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickState.id) {
                joystickState.active = false;
                joystickState.id = null;
                joystickState.current = { ...joystickState.origin };
                joystickKnob.style.transform = `translate(0px, 0px)`;
                break;
            }
        }
    };

    document.addEventListener('touchend', endJoystick);
    document.addEventListener('touchcancel', endJoystick);

    if (boostBtn) {
        boostBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            state.isSpacePressed = true;
            boostBtn.style.transform = "scale(0.9)";
        }, { passive: false });

        boostBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            state.isSpacePressed = false;
            boostBtn.style.transform = "scale(1)";
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
            document.dispatchEvent(event);
        }, { passive: false });

        pauseBtn.addEventListener('click', (e) => e.preventDefault());
    }

    let lookState = {
        id: null,
        lastX: 0,
        lastY: 0
    };

    if (container) {
        container.addEventListener('touchstart', (e) => {
            if (lookState.id !== null) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === joystickState.id) continue;

                lookState.id = t.identifier;
                lookState.lastX = t.clientX;
                lookState.lastY = t.clientY;
                state.isFreeLook = true;
                break;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (lookState.id === null) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === lookState.id) {
                    const dx = t.clientX - lookState.lastX;
                    const dy = t.clientY - lookState.lastY;

                    const sensitivity = 0.005;
                    state.camera.yaw -= dx * sensitivity;
                    state.camera.pitch -= dy * sensitivity;

                    const pitchLimit = Math.PI / 2 - 0.1;
                    state.camera.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, state.camera.pitch));

                    lookState.lastX = t.clientX;
                    lookState.lastY = t.clientY;
                    break;
                }
            }
        }, { passive: false });

        const endLook = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === lookState.id) {
                    lookState.id = null;
                    state.isFreeLook = false;
                    break;
                }
            }
        };

        container.addEventListener('touchend', endLook);
        container.addEventListener('touchcancel', endLook);
    }
}

function updateJoystickVisuals(knob) {
    const maxDist = 40;
    let dx = joystickState.current.x - joystickState.origin.x;
    let dy = joystickState.current.y - joystickState.origin.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
        const ratio = maxDist / dist;
        dx *= ratio;
        dy *= ratio;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;
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
    if (joystickState.active) {
        updateJoystickSteering(state);
        return;
    }

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

function updateJoystickSteering(state) {
    const dx = joystickState.current.x - joystickState.origin.x;
    const dy = joystickState.current.y - joystickState.origin.y;

    if (Math.sqrt(dx * dx + dy * dy) < 10) return;

    const sensitivity = 0.003;
    state.camera.yaw -= dx * sensitivity;
    state.camera.pitch -= dy * sensitivity;

    const pitchLimit = Math.PI / 2 - 0.1;
    state.camera.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, state.camera.pitch));

    const yaw = state.camera.yaw;
    const pitch = state.camera.pitch;

    const fX = Math.sin(yaw) * Math.cos(pitch);
    const fY = -Math.sin(pitch);
    const fZ = Math.cos(yaw) * Math.cos(pitch);

    const absX = Math.abs(fX);
    const absY = Math.abs(fY);
    const absZ = Math.abs(fZ);

    let targetDir = { x: 0, y: 0, z: 0 };

    if (absX > absY && absX > absZ) {
        targetDir = { x: Math.sign(fX), y: 0, z: 0 };
    } else if (absY > absX && absY > absZ) {
        targetDir = { x: 0, y: Math.sign(fY), z: 0 };
    } else {
        targetDir = { x: 0, y: 0, z: Math.sign(fZ) };
    }

    state.nextVelocity = targetDir;
}

export function updateMobileControlsVisibility(state) {
    const mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return;

    if (state.isTouchDevice && state.gameRunning && !state.isPaused && !state.gameOver) {
        mobileControls.style.display = 'block';
    } else {
        mobileControls.style.display = 'none';
    }
}
