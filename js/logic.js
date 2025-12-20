import { GRID_SIZE, MAX_FOOD, MAX_BLACK_HOLES, RARE_FRUIT_CHANCE, GREEN_FRUIT_CHANCE, MAX_NPCS } from './constants.js';

export function updateLogic(state) {
    if (!state.previousSnake) state.previousSnake = [];

    while (state.previousSnake.length < state.snake.length) state.previousSnake.push({});
    while (state.previousSnake.length > state.snake.length) state.previousSnake.pop();

    for (let i = 0; i < state.snake.length; i++) {
        const s = state.snake[i];
        const p = state.previousSnake[i];
        p.x = s.x;
        p.y = s.y;
        p.z = s.z;
    }

    if (!(state.nextVelocity.x === -state.velocity.x &&
        state.nextVelocity.y === -state.velocity.y &&
        state.nextVelocity.z === -state.velocity.z)) {
        state.velocity = { ...state.nextVelocity };
    }

    if (state.velocity.x === 0 && state.velocity.y === 0 && state.velocity.z === 0) return;

    const head = {
        x: state.snake[0].x + state.velocity.x,
        y: state.snake[0].y + state.velocity.y,
        z: state.snake[0].z + state.velocity.z
    };

    if (head.x < 0) {
        head.x = GRID_SIZE - 1;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: head.y, z: head.z }, orientation: 'x', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: head.y, z: head.z }, orientation: 'x', color: 0xff0055, size: 1.0 });
    }
    if (head.x >= GRID_SIZE) {
        head.x = 0;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: head.y, z: head.z }, orientation: 'x', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: head.y, z: head.z }, orientation: 'x', color: 0xff0055, size: 1.0 });
    }
    if (head.y < 0) {
        head.y = GRID_SIZE - 1;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: 0, z: head.z }, orientation: 'y', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: GRID_SIZE, z: head.z }, orientation: 'y', color: 0xff0055, size: 1.0 });
    }
    if (head.y >= GRID_SIZE) {
        head.y = 0;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: GRID_SIZE, z: head.z }, orientation: 'y', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: 0, z: head.z }, orientation: 'y', color: 0xff0055, size: 1.0 });
    }
    if (head.z < 0) {
        head.z = GRID_SIZE - 1;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: head.y, z: 0 }, orientation: 'z', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: head.y, z: GRID_SIZE }, orientation: 'z', color: 0xff0055, size: 1.0 });
    }
    if (head.z >= GRID_SIZE) {
        head.z = 0;
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: head.y, z: GRID_SIZE }, orientation: 'z', color: 0x00f3ff, size: 1.0 });
        state.events.push({ type: 'PORTAL_SPAWN', pos: { x: head.x, y: head.y, z: 0 }, orientation: 'z', color: 0xff0055, size: 1.0 });
    }

    if (Math.abs(head.x - state.snake[0].x) > 1 ||
        Math.abs(head.y - state.snake[0].y) > 1 ||
        Math.abs(head.z - state.snake[0].z) > 1) {

        state.camera.warp.active = true;

        state.events.push({
            type: 'WARP'
        });
    }

    for (let segment of state.snake) {
        if (head.x === segment.x && head.y === segment.y && head.z === segment.z) {
            return { gameOver: true, crashPos: head };
        }
    }

    state.snake.unshift(head);

    if (state.pendingGrowth > 0) {
        state.pendingGrowth--;
    } else {
        state.snake.pop();
    }

    checkFood(state);

    if (state.rareFood) {
        if (Date.now() > state.rareFood.expiresAt) {
            state.rareFood.expired = true;
            state.rareFood = null;
        } else {
            const head = state.snake[0];
            const rf = state.rareFood;

            let dx = rf.x - head.x;
            let dy = rf.y - head.y;
            let dz = rf.z - head.z;

            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

            const distEuclidean = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const magnetRange = 8.0;

            if (distEuclidean < magnetRange) {
                const dot = dx * state.velocity.x + dy * state.velocity.y + dz * state.velocity.z;

                if (dot > -2.0) {
                    const pullStrength = 0.3;

                    rf.x -= dx * pullStrength;
                    rf.y -= dy * pullStrength;
                    rf.z -= dz * pullStrength;

                    if (rf.x < 0) rf.x += GRID_SIZE;
                    if (rf.x >= GRID_SIZE) rf.x -= GRID_SIZE;
                    if (rf.y < 0) rf.y += GRID_SIZE;
                    if (rf.y >= GRID_SIZE) rf.y -= GRID_SIZE;
                    if (rf.z < 0) rf.z += GRID_SIZE;
                    if (rf.z >= GRID_SIZE) rf.z -= GRID_SIZE;
                }
            }

            let ndx = rf.x - head.x;
            let ndy = rf.y - head.y;
            let ndz = rf.z - head.z;

            if (Math.abs(ndx) > GRID_SIZE / 2) ndx -= Math.sign(ndx) * GRID_SIZE;
            if (Math.abs(ndy) > GRID_SIZE / 2) ndy -= Math.sign(ndy) * GRID_SIZE;
            if (Math.abs(ndz) > GRID_SIZE / 2) ndz -= Math.sign(ndz) * GRID_SIZE;

            const distFinal = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);

            if (distFinal < 1.5) {
                state.score += 500;
                state.speedMultiplier += 0.01;
                state.pendingGrowth += 2;

                state.events.push({
                    type: 'EXPLOSION',
                    x: rf.x, y: rf.y, z: rf.z,
                    color: 0xffd700
                });

                state.rareFood = null;
            }
        }
    } else {
        if (Math.random() < RARE_FRUIT_CHANCE) {
            spawnRareFood(state);
        }
    }

    state.blackHoles = state.blackHoles.filter(bh => !bh.expired);
    while (state.blackHoles.length < MAX_BLACK_HOLES) {
        spawnBlackHole(state);
    }

    updateBlackHoles(state);
    if (state.gameOver) {
        return { gameOver: true, crashPos: state.crashPos };
    }

    state.npcSnakes = state.npcSnakes.filter(npc => !npc.dead);
    if (state.npcSnakes.length < MAX_NPCS) {
        spawnNPC(state);
    }
    updateNPCs(state);
    checkNPCCollisions(state);

    if (state.gameOver) {
        return { gameOver: true, crashPos: state.crashPos };
    }

    if (state.greenFruit) {
        const gf = state.greenFruit;

        if (Date.now() > gf.expiresAt) {
            gf.expired = true;

            state.events.push({
                type: 'EXPLOSION',
                x: gf.x, y: gf.y, z: gf.z,
                color: 0xFF00B3
            });

            state.greenFruit = null;
        } else {
            if (!gf.moveDir) {
                const dirs = [
                    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
                    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
                    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
                ];
                gf.moveDir = dirs[Math.floor(Math.random() * dirs.length)];
            }

            if (Math.random() < 0.05) {
                const dirs = [
                    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
                    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
                    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
                ];
                gf.moveDir = dirs[Math.floor(Math.random() * dirs.length)];
            }

            if (Math.random() < 0.5) {
                let wrapAxis = null;
                let wrapDir = 0;

                gf.x += gf.moveDir.x;
                gf.y += gf.moveDir.y;
                gf.z += gf.moveDir.z;

                if (gf.x < 0) {
                    gf.x = GRID_SIZE - 1;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: gf.y, z: gf.z }, orientation: 'x', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: gf.y, z: gf.z }, orientation: 'x', color: 0x00ff00 });
                }
                else if (gf.x >= GRID_SIZE) {
                    gf.x = 0;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: gf.y, z: gf.z }, orientation: 'x', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: gf.y, z: gf.z }, orientation: 'x', color: 0x00ff00 });
                }

                if (gf.y < 0) {
                    gf.y = GRID_SIZE - 1;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: 0, z: gf.z }, orientation: 'y', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: GRID_SIZE, z: gf.z }, orientation: 'y', color: 0x00ff00 });
                }
                else if (gf.y >= GRID_SIZE) {
                    gf.y = 0;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: GRID_SIZE, z: gf.z }, orientation: 'y', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: 0, z: gf.z }, orientation: 'y', color: 0x00ff00 });
                }

                if (gf.z < 0) {
                    gf.z = GRID_SIZE - 1;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: gf.y, z: 0 }, orientation: 'z', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: gf.y, z: GRID_SIZE }, orientation: 'z', color: 0x00ff00 });
                }
                else if (gf.z >= GRID_SIZE) {
                    gf.z = 0;
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: gf.y, z: GRID_SIZE }, orientation: 'z', color: 0x00ff00 });
                    state.events.push({ type: 'PORTAL_SPAWN', pos: { x: gf.x, y: gf.y, z: 0 }, orientation: 'z', color: 0x00ff00 });
                }
            }

            const head = state.snake[0];
            const dist = Math.abs(head.x - gf.x) + Math.abs(head.y - gf.y) + Math.abs(head.z - gf.z);

            if (dist < 1.5) {
                state.score += 2000;
                state.pendingGrowth += 20;

                state.events.push({
                    type: 'EXPLOSION',
                    x: gf.x, y: gf.y, z: gf.z,
                    color: 0x00ff00
                });

                state.greenFruit = null;
            }
        }
    } else {
        if (!state.greenFruit && Math.random() < GREEN_FRUIT_CHANCE) {
            spawnGreenFruit(state);
        }
    }

    return { gameOver: false };
}

function spawnRareFood(state) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const z = Math.floor(Math.random() * GRID_SIZE);

    state.rareFood = {
        x, y, z,
        expiresAt: Date.now() + 45000,
        mesh: null
    };
}

function checkFood(state) {
    state.isAttracting = false;

    const head = state.snake[0];
    const magnetRange = 10;
    const eatRadius = 0.8;
    const velocity = state.velocity;

    for (let f of state.foods) {
        if (f.x < -GRID_SIZE || f.x > GRID_SIZE * 2 ||
            f.y < -GRID_SIZE || f.y > GRID_SIZE * 2 ||
            f.z < -GRID_SIZE || f.z > GRID_SIZE * 2) {

            f.eaten = true;

            state.events.push({
                type: 'EXPLOSION',
                x: f.x, y: f.y, z: f.z,
                color: 0xff0055
            });
            continue;
        }

        let dx = f.x - head.x;
        let dy = f.y - head.y;
        let dz = f.z - head.z;

        if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
        if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
        if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < magnetRange && !f.eaten) {
            const dot = dx * velocity.x + dy * velocity.y + dz * velocity.z;

            if (dot > -2.0 || dist < 2.5) {
                state.isAttracting = true;

                let pullStrength = 0.2;
                if (dist < 5.0) pullStrength = 0.4;
                if (dist < 2.5) pullStrength = 0.9;

                f.x -= dx * pullStrength;
                f.y -= dy * pullStrength;
                f.z -= dz * pullStrength;

                if (f.x < 0) f.x += GRID_SIZE;
                if (f.x >= GRID_SIZE) f.x -= GRID_SIZE;
                if (f.y < 0) f.y += GRID_SIZE;
                if (f.y >= GRID_SIZE) f.y -= GRID_SIZE;
                if (f.z < 0) f.z += GRID_SIZE;
                if (f.z >= GRID_SIZE) f.z -= GRID_SIZE;

                let ndx = f.x - head.x;
                let ndy = f.y - head.y;
                let ndz = f.z - head.z;
                if (Math.abs(ndx) > GRID_SIZE / 2) ndx -= Math.sign(ndx) * GRID_SIZE;
                if (Math.abs(ndy) > GRID_SIZE / 2) ndy -= Math.sign(ndy) * GRID_SIZE;
                if (Math.abs(ndz) > GRID_SIZE / 2) ndz -= Math.sign(ndz) * GRID_SIZE;
                dist = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);
            }
        }

        if (dist < 1.0) {
            state.score += 100;
            state.pendingGrowth += 1;
            f.eaten = true;

            state.events.push({
                type: 'EXPLOSION',
                x: f.x, y: f.y, z: f.z,
                color: 0xff0055
            });
        }
    }

    state.foods = state.foods.filter(f => !f.eaten);
    while (state.foods.length < MAX_FOOD) {
        state.foods.push(spawnFood(state));
    }
}

function spawnFood(state) {
    let valid = false;
    let x, y, z;
    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        z = Math.floor(Math.random() * GRID_SIZE);

        valid = true;
        for (let s of state.snake) {
            if (s.x === x && s.y === y && s.z === z) valid = false;
        }
        for (let f of state.foods) {
            if (f.x === x && f.y === y && f.z === z) valid = false;
        }
    }
    return { x, y, z, id: Math.random().toString(36).substr(2, 9) };
}

export function spawnGreenFruit(state) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const z = Math.floor(Math.random() * GRID_SIZE);

    state.greenFruit = {
        x, y, z,
        expiresAt: Date.now() + 120000,
        mesh: null
    };
}

function spawnBlackHole(state) {
    let valid = false;
    let x, y, z;
    const head = state.snake[0];
    const magnetRange = 10;
    const safeZone = magnetRange + 5;

    while (!valid) {
        x = Math.floor(Math.random() * GRID_SIZE);
        y = Math.floor(Math.random() * GRID_SIZE);
        z = Math.floor(Math.random() * GRID_SIZE);

        valid = true;
        for (let s of state.snake) {
            if (s.x === x && s.y === y && s.z === z) valid = false;
        }
        for (let f of state.foods) {
            if (f.x === x && f.y === y && f.z === z) valid = false;
        }
        for (let bh of state.blackHoles) {
            if (bh.x === x && bh.y === y && bh.z === z) valid = false;
        }
        if (head) {
            let dx = x - head.x;
            let dy = y - head.y;
            let dz = z - head.z;
            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < safeZone) valid = false;
        }
    }

    const duration = 120000 + Math.random() * 60000;

    const dir = {
        x: (Math.random() - 0.5),
        y: (Math.random() - 0.5),
        z: (Math.random() - 0.5)
    };
    const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
    dir.x /= mag; dir.y /= mag; dir.z /= mag;

    state.blackHoles.push({
        x, y, z,
        id: Math.random().toString(36).substr(2, 9),
        expiresAt: Date.now() + duration,
        expired: false,
        size: 1.0,
        speedMultiplier: 1.0,
        moveDir: dir,
        isCannibal: false
    });
}

function updateBlackHoles(state) {
    const head = state.snake[0];
    const velocity = state.velocity;

    const baseMagnetRange = 10;
    const baseEatRadius = 1.5;
    const baseSpeed = 0.4;

    for (let i = 0; i < state.blackHoles.length; i++) {
        let bh = state.blackHoles[i];
        if (bh.expired) continue;

        if (Date.now() > bh.expiresAt) {
            bh.expired = true;
            state.events.push({
                type: 'EXPLOSION',
                x: bh.x, y: bh.y, z: bh.z,
                color: bh.isCannibal ? 0xFFD700 : 0x000000,
                isCannibal: bh.isCannibal
            });
            continue;
        }

        if (Math.random() < 0.01) {
            const dir = {
                x: (Math.random() - 0.5),
                y: (Math.random() - 0.5),
                z: (Math.random() - 0.5)
            };
            const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
            bh.moveDir = { x: dir.x / mag, y: dir.y / mag, z: dir.z / mag };
        }

        const currentSpeed = baseSpeed * bh.speedMultiplier;
        bh.x += bh.moveDir.x * currentSpeed;
        bh.y += bh.moveDir.y * currentSpeed;
        bh.z += bh.moveDir.z * currentSpeed;

        if (bh.x < 0) {
            bh.x += GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: bh.y, z: bh.z }, orientation: 'x', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: bh.y, z: bh.z }, orientation: 'x', color: color, isCannibal: bh.isCannibal, size: bh.size });
        } else if (bh.x >= GRID_SIZE) {
            bh.x -= GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: bh.y, z: bh.z }, orientation: 'x', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: bh.y, z: bh.z }, orientation: 'x', color: color, isCannibal: bh.isCannibal, size: bh.size });
        }

        if (bh.y < 0) {
            bh.y += GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: 0, z: bh.z }, orientation: 'y', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: GRID_SIZE, z: bh.z }, orientation: 'y', color: color, isCannibal: bh.isCannibal, size: bh.size });
        } else if (bh.y >= GRID_SIZE) {
            bh.y -= GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: GRID_SIZE, z: bh.z }, orientation: 'y', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: 0, z: bh.z }, orientation: 'y', color: color, isCannibal: bh.isCannibal, size: bh.size });
        }

        if (bh.z < 0) {
            bh.z += GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: bh.y, z: 0 }, orientation: 'z', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: bh.y, z: GRID_SIZE }, orientation: 'z', color: color, isCannibal: bh.isCannibal, size: bh.size });
        } else if (bh.z >= GRID_SIZE) {
            bh.z -= GRID_SIZE;
            const color = bh.isCannibal ? 0xFFD700 : 0xFFFFFF;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: bh.y, z: GRID_SIZE }, orientation: 'z', color: color, isCannibal: bh.isCannibal, size: bh.size });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: bh.x, y: bh.y, z: 0 }, orientation: 'z', color: color, isCannibal: bh.isCannibal, size: bh.size });
        }

        const eatRadius = baseEatRadius * bh.size;

        for (let f of state.foods) {
            if (f.eaten) continue;

            let dx = f.x - bh.x;
            let dy = f.y - bh.y;
            let dz = f.z - bh.z;
            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < eatRadius) {
                f.eaten = true;
                bh.size += 0.05;

                state.events.push({
                    type: 'EXPLOSION',
                    x: f.x, y: f.y, z: f.z,
                    color: 0xff0055
                });

            } else if (dist < 5 * bh.size) {
                let pullFn = 0.2;
                if (dist < 2.5 * bh.size) pullFn = 0.5;
                if (dist < 1.5 * bh.size) pullFn = 0.9;

                f.x -= dx * pullFn;
                f.y -= dy * pullFn;
                f.z -= dz * pullFn;
            }
        }

        if (state.rareFood) {
            const rf = state.rareFood;
            let dx = rf.x - bh.x;
            let dy = rf.y - bh.y;
            let dz = rf.z - bh.z;
            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < eatRadius) {
                state.rareFood = null;
                bh.speedMultiplier += 0.5;
                bh.size += 0.2;
                bh.expiresAt += 300000;
                bh.isCannibal = true;
                state.events.push({
                    type: 'EXPLOSION',
                    x: rf.x, y: rf.y, z: rf.z,
                    color: 0xffff00
                });
            } else if (dist < 10 * bh.size) {
                let pullFn = 0.3;
                if (dist < 5 * bh.size) pullFn = 0.6;
                if (dist < 2.5 * bh.size) pullFn = 0.95;

                rf.x -= dx * pullFn;
                rf.y -= dy * pullFn;
                rf.z -= dz * pullFn;
            }
        }

        for (let j = i + 1; j < state.blackHoles.length; j++) {
            let other = state.blackHoles[j];
            if (other.expired) continue;

            let dx = other.x - bh.x;
            let dy = other.y - bh.y;
            let dz = other.z - bh.z;
            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < (bh.size + other.size) * 1.1) {
                if (bh.isCannibal && !other.isCannibal) {
                    other.expired = true;
                    bh.size *= 1.15;
                    bh.expiresAt -= 5000;
                    state.events.push({ type: 'EXPLOSION', x: other.x, y: other.y, z: other.z, color: 0x000000 });
                }
                else if (!bh.isCannibal && other.isCannibal) {
                    bh.expired = true;
                    other.size *= 1.15;
                    other.expiresAt -= 5000;
                    state.events.push({ type: 'EXPLOSION', x: bh.x, y: bh.y, z: bh.z, color: 0x000000 });
                }
                else {
                    bh.expired = true;
                    other.expired = true;
                    state.events.push({
                        type: 'EXPLOSION',
                        x: (bh.x + other.x) / 2,
                        y: (bh.y + other.y) / 2,
                        z: (bh.z + other.z) / 2,
                        color: (bh.isCannibal && other.isCannibal) ? 0xFFD700 : 0xffffff,
                        isCannibal: (bh.isCannibal && other.isCannibal)
                    });
                }

                if (bh.expired) break;

            } else if (dist < 15) {
                let force = 0.05;
                if (dist < 5.0) force = 0.2;
                if (dist < 3.0) force = 0.5;

                bh.x += dx * force;
                bh.y += dy * force;
                bh.z += dz * force;

                other.x -= dx * force;
                other.y -= dy * force;
                other.z -= dz * force;
            }
        }
        if (bh.expired) continue;

        let dx = bh.x - head.x;
        let dy = bh.y - head.y;
        let dz = bh.z - head.z;

        if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
        if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
        if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const effectiveMagnetRange = baseMagnetRange * bh.size;

        if (dist < effectiveMagnetRange) {
            const dot = dx * velocity.x + dy * velocity.y + dz * velocity.z;
            if (dot > -2.0 || dist < 2.5) {
                state.isAttracting = true;

                let pullStrength = 0.1 + (bh.size * 0.05);
                if (dist < 5.0) pullStrength *= 2;
                if (dist < 2.5) pullStrength *= 2;

                bh.x -= dx * pullStrength;
                bh.y -= dy * pullStrength;
                bh.z -= dz * pullStrength;

                if (bh.x < 0) bh.x += GRID_SIZE;
                if (bh.x >= GRID_SIZE) bh.x -= GRID_SIZE;
                if (bh.y < 0) bh.y += GRID_SIZE;
                if (bh.y >= GRID_SIZE) bh.y -= GRID_SIZE;
                if (bh.z < 0) bh.z += GRID_SIZE;
                if (bh.z >= GRID_SIZE) bh.z -= GRID_SIZE;

                let ndx = bh.x - head.x;
                let ndy = bh.y - head.y;
                let ndz = bh.z - head.z;
                if (Math.abs(ndx) > GRID_SIZE / 2) ndx -= Math.sign(ndx) * GRID_SIZE;
                if (Math.abs(ndy) > GRID_SIZE / 2) ndy -= Math.sign(ndy) * GRID_SIZE;
                if (Math.abs(ndz) > GRID_SIZE / 2) ndz -= Math.sign(ndz) * GRID_SIZE;
                dist = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);
            }
        }

        if (dist < 1.0 * bh.size) {
            state.events.push({
                type: 'EXPLOSION',
                x: bh.x, y: bh.y, z: bh.z,
                color: 0x000000
            });
            bh.expired = true;

            if (state.snake.length <= 12) {
                state.gameOver = true;
                state.crashPos = { x: bh.x, y: bh.y, z: bh.z };
                return;
            } else {
                const damage = Math.floor(10 * bh.size);

                for (let k = 0; k < damage; k++) {
                    if (state.snake.length > 1) {
                        state.snake.pop();
                    }
                }
                state.camera.shake = 20;
            }
        }
    }

    for (let i = 0; i < state.blackHoles.length; i++) {
        let bh = state.blackHoles[i];
        if (bh.expired) continue;
        if (bh.isCannibal && bh.size > 2.5) {
            bh.expired = true;
            state.events.push({ type: 'SUPERNOVA', x: bh.x, y: bh.y, z: bh.z, color: 0xFFD700 });

            state.foods.forEach(f => {
                if (f.eaten) return;
                let dx = f.x - bh.x; let dy = f.y - bh.y; let dz = f.z - bh.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                if (distSq < 4900) {
                    const dist = Math.sqrt(distSq);
                    const force = 100.0 / (dist + 5.0);
                    f.x += (dx / dist) * force * 5.0; f.y += (dy / dist) * force * 5.0; f.z += (dz / dist) * force * 5.0;
                }
            });

            state.blackHoles.forEach(other => {
                if (other === bh || other.expired) return;
                let dx = other.x - bh.x; let dy = other.y - bh.y; let dz = other.z - bh.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                if (distSq < 4900) {
                    const dist = Math.sqrt(distSq);
                    const force = 50.0 / (dist + 5.0);
                    other.x += (dx / dist) * force * 5.0; other.y += (dy / dist) * force * 5.0; other.z += (dz / dist) * force * 5.0;
                }
            });

            state.snake.forEach(seg => {
                let dx = seg.x - bh.x; let dy = seg.y - bh.y; let dz = seg.z - bh.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                if (distSq < 4900) {
                    const dist = Math.sqrt(distSq);
                    const force = 40.0 / (dist + 5.0);
                    seg.x += (dx / dist) * force * 2.0; seg.y += (dy / dist) * force * 2.0; seg.z += (dz / dist) * force * 2.0;

                    if (dist < 40 && state.snake.length > 5) {
                        if (Math.random() < 0.3) {
                            state.snake.pop();
                            state.camera.shake = 10;
                            state.events.push({ type: 'EXPLOSION', x: seg.x, y: seg.y, z: seg.z, color: 0xff0000, size: 0.5 });
                        }
                    } else if (dist < 15) {
                        state.gameOver = true;
                        state.crashPos = { x: bh.x, y: bh.y, z: bh.z };
                    }
                }
            });

            state.npcSnakes.forEach(npc => {
                if (npc.dead) return;
                npc.segments.forEach(seg => {
                    let dx = seg.x - bh.x; let dy = seg.y - bh.y; let dz = seg.z - bh.z;
                    const distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq < 4900) {
                        const dist = Math.sqrt(distSq);
                        const force = 40.0 / (dist + 5.0);
                        seg.x += (dx / dist) * force * 2.0; seg.y += (dy / dist) * force * 2.0; seg.z += (dz / dist) * force * 2.0;
                    }
                });

                let dx = npc.segments[0].x - bh.x;
                let dy = npc.segments[0].y - bh.y;
                let dz = npc.segments[0].z - bh.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < 15) {
                    npc.dead = true;
                    state.events.push({ type: 'EXPLOSION', x: npc.segments[0].x, y: npc.segments[0].y, z: npc.segments[0].z, color: npc.color });
                }
            });
        }
    }

    state.blackHoles.forEach(bh => {
        if (bh.expired) return;
        state.npcSnakes.forEach(npc => {
            if (npc.dead) return;
            const head = npc.segments[0];

            let dx = bh.x - head.x;
            let dy = bh.y - head.y;
            let dz = bh.z - head.z;

            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 10 * bh.size) {
                let pullStrength = 0.1 + (bh.size * 0.05);
                if (dist < 5.0) pullStrength *= 1.5;
                if (dist < 2.5) pullStrength *= 2;

                head.x -= dx * pullStrength;
                head.y -= dy * pullStrength;
                head.z -= dz * pullStrength;

                if (head.x < 0) head.x += GRID_SIZE;
                if (head.x >= GRID_SIZE) head.x -= GRID_SIZE;
                if (head.y < 0) head.y += GRID_SIZE;
                if (head.y >= GRID_SIZE) head.y -= GRID_SIZE;
                if (head.z < 0) head.z += GRID_SIZE;
                if (head.z >= GRID_SIZE) head.z -= GRID_SIZE;
            }

            if (dist < 1.5 * bh.size) {
                npc.dead = true;
                bh.expired = true;
                state.events.push({
                    type: 'EXPLOSION',
                    x: head.x, y: head.y, z: head.z,
                    color: npc.color
                });
                state.events.push({
                    type: 'EXPLOSION',
                    x: bh.x, y: bh.y, z: bh.z,
                    color: 0x000000
                });
            }
        });
    });
}

function spawnNPC(state) {
    let valid = false;
    let head;

    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const z = Math.floor(Math.random() * GRID_SIZE);

        if (isSafeSpawn(state, x, y, z)) {
            head = { x, y, z };
            valid = true;
            break;
        }
    }

    if (!valid) {
        head = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
            z: Math.floor(Math.random() * GRID_SIZE)
        };
    }

    const id = Math.random().toString(36).substr(2, 9);

    const dirs = [
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
    ];
    let dir = dirs[Math.floor(Math.random() * dirs.length)];

    const segments = [];
    const len = 5 + Math.floor(Math.random() * 6);

    let cx = head.x, cy = head.y, cz = head.z;
    let odx = -dir.x;
    let ody = -dir.y;
    let odz = -dir.z;

    let bodySafe = true;

    for (let k = 0; k < len; k++) {
        if (!isSafeSpawn(state, cx, cy, cz)) {
            bodySafe = false;
            break;
        }

        segments.push({ x: cx, y: cy, z: cz });
        cx += odx;
        cy += ody;
        cz += odz;

        if (cx < 0) cx = GRID_SIZE - 1;
        else if (cx >= GRID_SIZE) cx = 0;
        if (cy < 0) cy = GRID_SIZE - 1;
        else if (cy >= GRID_SIZE) cy = 0;
        if (cz < 0) cz = GRID_SIZE - 1;
        else if (cz >= GRID_SIZE) cz = 0;
    }

    if (!bodySafe) {
        return;
    }

    const hue = Math.random();
    const sat = 0.8 + Math.random() * 0.2;
    const lit = 0.4 + Math.random() * 0.2;
    const colors = [
        0xff0000, 0xff4400, 0xff8800, 0xffff00,
        0x00ff00, 0x00ff88, 0x00ffff, 0x0088ff,
        0x0000ff, 0x8800ff, 0xff00ff, 0xff0088
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    state.npcSnakes.push({
        id,
        segments,
        previousSegments: JSON.parse(JSON.stringify(segments)),
        dir,
        dead: false,
        pendingGrowth: 0,
        moveAccumulator: 0,
        speedMultiplier: 0.8 + Math.random() * 0.4,
        color: color
    });
}

function isSafeSpawn(state, x, y, z) {
    for (let s of state.snake) if (s.x === x && s.y === y && s.z === z) return false;
    for (let npc of state.npcSnakes) {
        for (let s of npc.segments) if (s.x === x && s.y === y && s.z === z) return false;
    }
    for (let bh of state.blackHoles) {
        const dist = Math.abs(x - bh.x) + Math.abs(y - bh.y) + Math.abs(z - bh.z);
        if (dist < bh.size * 2 + 5) return false;
    }
    return true;
}

function updateNPCs(state) {
    for (const npc of state.npcSnakes) {
        if (!npc.previousSegments) npc.previousSegments = [];
        while (npc.previousSegments.length < npc.segments.length) npc.previousSegments.push({});
        while (npc.previousSegments.length > npc.segments.length) npc.previousSegments.pop();
        for (let i = 0; i < npc.segments.length; i++) {
            npc.previousSegments[i] = { ...npc.segments[i] };
        }


        let bestDir = getBestDirection(state, npc);
        npc.dir = bestDir;

        const head = npc.segments[0];
        let nx = head.x + npc.dir.x;
        let ny = head.y + npc.dir.y;
        let nz = head.z + npc.dir.z;

        if (nx < 0) {
            nx = GRID_SIZE - 1;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: ny, z: nz }, orientation: 'x', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: ny, z: nz }, orientation: 'x', color: npc.color });
        }
        else if (nx >= GRID_SIZE) {
            nx = 0;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: GRID_SIZE, y: ny, z: nz }, orientation: 'x', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: 0, y: ny, z: nz }, orientation: 'x', color: npc.color });
        }

        if (ny < 0) {
            ny = GRID_SIZE - 1;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: 0, z: nz }, orientation: 'y', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: GRID_SIZE, z: nz }, orientation: 'y', color: npc.color });
        }
        else if (ny >= GRID_SIZE) {
            ny = 0;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: GRID_SIZE, z: nz }, orientation: 'y', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: 0, z: nz }, orientation: 'y', color: npc.color });
        }

        if (nz < 0) {
            nz = GRID_SIZE - 1;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: ny, z: 0 }, orientation: 'z', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: ny, z: GRID_SIZE }, orientation: 'z', color: npc.color });
        }
        else if (nz >= GRID_SIZE) {
            nz = 0;
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: ny, z: GRID_SIZE }, orientation: 'z', color: npc.color });
            state.events.push({ type: 'PORTAL_SPAWN', pos: { x: nx, y: ny, z: 0 }, orientation: 'z', color: npc.color });
        }

        npc.segments.unshift({ x: nx, y: ny, z: nz });

        if (npc.pendingGrowth > 0) {
            npc.pendingGrowth--;
        } else {
            npc.segments.pop();
        }
    }
}

function getBestDirection(state, npc) {
    const head = npc.segments[0];
    const moves = [
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
    ];

    let bestScore = -Infinity;
    let bestMoves = [];

    for (const move of moves) {
        if (move.x === -npc.dir.x && move.y === -npc.dir.y && move.z === -npc.dir.z) continue;

        let score = 0;

        let tx = head.x + move.x;
        let ty = head.y + move.y;
        let tz = head.z + move.z;

        if (tx < 0) tx = GRID_SIZE - 1;
        else if (tx >= GRID_SIZE) tx = 0;
        if (ty < 0) ty = GRID_SIZE - 1;
        else if (ty >= GRID_SIZE) ty = 0;
        if (tz < 0) tz = GRID_SIZE - 1;
        else if (tz >= GRID_SIZE) tz = 0;

        if (!isSafePos(state, tx, ty, tz, npc.id)) {
            score = -10000;
        } else {
            let closestFoodDist = Infinity;


            for (const f of state.foods) {
                if (Math.abs(f.x - tx) + Math.abs(f.y - ty) + Math.abs(f.z - tz) > 60) continue;

                let d = distSq(tx, ty, tz, f.x, f.y, f.z);
                if (d < closestFoodDist) closestFoodDist = d;
            }

            if (closestFoodDist < 2500) {
                score += (5000 / (closestFoodDist + 100));
            }

            if (move.x === npc.dir.x && move.y === npc.dir.y && move.z === npc.dir.z) {
                score += 2.0;
            }

            score += Math.random() * 4.0;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (Math.abs(score - bestScore) < 0.1) {
            bestMoves.push(move);
        }
    }

    if (bestMoves.length > 0) {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    return npc.dir;
}

function isSafePos(state, x, y, z, myId) {
    for (const s of state.snake) {
        if (s.x === x && s.y === y && s.z === z) return false;
    }

    for (const npc of state.npcSnakes) {
        if (npc.id !== myId) {
            for (const s of npc.segments) {
                if (s.x === x && s.y === y && s.z === z) return false;
            }
        } else {
            for (const s of npc.segments) {
                if (s.x === x && s.y === y && s.z === z) return false;
            }
        }
    }

    for (const bh of state.blackHoles) {
        const dist = Math.sqrt((x - bh.x) ** 2 + (y - bh.y) ** 2 + (z - bh.z) ** 2);
        if (dist < bh.size * 1.5) return false;
    }

    return true;
}

function distSq(x1, y1, z1, x2, y2, z2) {
    return (x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2;
}

function checkNPCCollisions(state) {
    const playerHead = state.snake[0];

    for (const npc of state.npcSnakes) {
        for (const seg of npc.segments) {
            const dx = playerHead.x - seg.x;
            const dy = playerHead.y - seg.y;
            const dz = playerHead.z - seg.z;
            if (dx * dx + dy * dy + dz * dz < 0.64) {
                state.gameOver = true;
                state.crashPos = { ...playerHead };
                return;
            }
        }

        const npcHead = npc.segments[0];
        for (const seg of state.snake) {
            const dx = npcHead.x - seg.x;
            const dy = npcHead.y - seg.y;
            const dz = npcHead.z - seg.z;
            if (dx * dx + dy * dy + dz * dz < 0.64) {
                npc.dead = true;
                state.score += 500;
                state.events.push({
                    type: 'EXPLOSION',
                    x: npcHead.x, y: npcHead.y, z: npcHead.z,
                    color: npc.color || 0xff4400
                });
                break;
            }
        }
    }

    const magnetRange = 10;
    const eatRadius = 1.0;

    for (const npc of state.npcSnakes) {
        if (npc.dead) continue;
        const head = npc.segments[0];

        for (const f of state.foods) {
            if (f.eaten) continue;

            let dx = f.x - head.x;
            let dy = f.y - head.y;
            let dz = f.z - head.z;

            if (Math.abs(dx) > GRID_SIZE / 2) dx -= Math.sign(dx) * GRID_SIZE;
            if (Math.abs(dy) > GRID_SIZE / 2) dy -= Math.sign(dy) * GRID_SIZE;
            if (Math.abs(dz) > GRID_SIZE / 2) dz -= Math.sign(dz) * GRID_SIZE;

            let distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < magnetRange * magnetRange) {

                let pullStrength = 0.3;
                if (distSq < 25.0) pullStrength = 0.6;
                if (distSq < 6.25) pullStrength = 0.9;

                f.x -= dx * pullStrength;
                f.y -= dy * pullStrength;
                f.z -= dz * pullStrength;

                if (f.x < 0) f.x += GRID_SIZE;
                if (f.x >= GRID_SIZE) f.x -= GRID_SIZE;
                if (f.y < 0) f.y += GRID_SIZE;
                if (f.y >= GRID_SIZE) f.y -= GRID_SIZE;
                if (f.z < 0) f.z += GRID_SIZE;
                if (f.z >= GRID_SIZE) f.z -= GRID_SIZE;

                let ndx = f.x - head.x;
                let ndy = f.y - head.y;
                let ndz = f.z - head.z;
                if (Math.abs(ndx) > GRID_SIZE / 2) ndx -= Math.sign(ndx) * GRID_SIZE;
                if (Math.abs(ndy) > GRID_SIZE / 2) ndy -= Math.sign(ndy) * GRID_SIZE;
                if (Math.abs(ndz) > GRID_SIZE / 2) ndz -= Math.sign(ndz) * GRID_SIZE;
                distSq = ndx * ndx + ndy * ndy + ndz * ndz;
            }

            if (distSq < eatRadius * eatRadius) {
                f.eaten = true;
                npc.pendingGrowth++;
                state.events.push({
                    type: 'EXPLOSION',
                    x: f.x, y: f.y, z: f.z,
                    color: 0xff0055,
                    size: 0.5
                });
            }
        }
    }

    for (let i = 0; i < state.npcSnakes.length; i++) {
        const npc1 = state.npcSnakes[i];
        if (npc1.dead) continue;
        const head1 = npc1.segments[0];

        for (let k = 4; k < npc1.segments.length; k++) {
            const s = npc1.segments[k];
            if (Math.abs(head1.x - s.x) < 0.8 && Math.abs(head1.y - s.y) < 0.8 && Math.abs(head1.z - s.z) < 0.8) {
                npc1.dead = true;
                state.events.push({ type: 'EXPLOSION', x: head1.x, y: head1.y, z: head1.z, color: npc1.color });
                break;
            }
        }
        if (npc1.dead) continue;

        for (let j = 0; j < state.npcSnakes.length; j++) {
            if (i === j) continue;
            const npc2 = state.npcSnakes[j];
            if (npc2.dead) continue;

            const head2 = npc2.segments[0];
            if (Math.abs(head1.x - head2.x) < 0.8 && Math.abs(head1.y - head2.y) < 0.8 && Math.abs(head1.z - head2.z) < 0.8) {
                npc1.dead = true;
                npc2.dead = true;
                state.events.push({ type: 'EXPLOSION', x: head1.x, y: head1.y, z: head1.z, color: 0xffffff });
                continue;
            }

            for (const s of npc2.segments) {
                if (Math.abs(head1.x - s.x) < 0.8 && Math.abs(head1.y - s.y) < 0.8 && Math.abs(head1.z - s.z) < 0.8) {
                    npc1.dead = true;
                    state.events.push({ type: 'EXPLOSION', x: head1.x, y: head1.y, z: head1.z, color: npc1.color });
                    break;
                }
            }
        }
    }
}
