import { GRID_SIZE, TILE_SIZE } from './constants.js';
import * as THREE from 'three';

export function clearEffects(state, scene) {
    if (!state) return;

    if (state.particles) {
        state.particles.forEach(p => {
            if (p.mesh) scene.remove(p.mesh);
        });
        state.particles = [];
    }

    if (state.comets) {
        state.comets.forEach(c => {
            if (c.mesh) scene.remove(c.mesh);
        });
        state.comets = [];
    }

    if (state.predictedPortals) {
        if (state.predictedPortals.entry && state.predictedPortals.entry.mesh) {
            scene.remove(state.predictedPortals.entry.mesh);
        }
        if (state.predictedPortals.exit && state.predictedPortals.exit.mesh) {
            scene.remove(state.predictedPortals.exit.mesh);
        }
        state.predictedPortals = { entry: null, exit: null };
    }
}

export function updateEffects(state, scene) {
    while (state.events.length > 0) {
        const e = state.events.shift();
        if (e.type === 'EXPLOSION') {
            createExplosion(e.x, e.y, e.z, e.color, scene, state);
        } else if (e.type === 'SUPERNOVA') {
            createExplosion(e.x, e.y, e.z, 0xFFD700, scene, state);
            state.camera.shake = 5.0;

            const swGeo = new THREE.RingGeometry(0.5, 20.0, 64);
            const swMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const swMesh = new THREE.Mesh(swGeo, swMat);
            swMesh.position.set(e.x * TILE_SIZE, e.y * TILE_SIZE, e.z * TILE_SIZE);
            scene.add(swMesh);
            state.particles.push({
                mesh: swMesh,
                vx: 0, vy: 0, vz: 0,
                life: 2.0,
                type: 'SHOCKWAVE'
            });
        } else if (e.type === 'PORTAL_SPAWN') {
            createPortalEffect(e.pos, e.color, false, scene, state, e.orientation, e.size, e.isCannibal);
        }
    }

    updateParticles(state, scene);
    updateComets(state, scene);
    updateGreenFruitTrail(state, scene);
    checkPortalPrediction(state, scene);
}

function updateGreenFruitTrail(state, scene) {
    if (state.greenFruit && state.greenFruit.mesh) {
        const pos = state.greenFruit.mesh.position;
        const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set(
            pos.x + (Math.random() - 0.5) * 0.5,
            pos.y + (Math.random() - 0.5) * 0.5,
            pos.z + (Math.random() - 0.5) * 0.5
        );

        scene.add(mesh);

        state.particles.push({
            mesh: mesh,
            vx: (Math.random() - 0.5) * 0.05,
            vy: (Math.random() - 0.5) * 0.05,
            vz: (Math.random() - 0.5) * 0.05,
            life: 1.0
        });
    }
}

function updateParticles(state, scene) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        let p = state.particles[i];

        if (p.isPredictive) {
            if (p.mesh.material.opacity < 0.8) p.mesh.material.opacity += 0.05;

            const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.2;
            p.mesh.scale.setScalar(scale);
            p.mesh.rotation.z += 0.05;
        } else if (p.isPortal) {
            if (p.life > 1.0) {
                if (p.mesh.material.opacity < 0.8) p.mesh.material.opacity += 0.1;
                const scale = 1.0 + Math.sin(Date.now() * 0.02) * 0.3;
                p.mesh.scale.setScalar(scale);
                p.mesh.rotation.z += 0.2;

                if (p.isCannibal) {
                    const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
                    p.mesh.material.color.setHSL(0.14, 1.0, pulse * 0.5);
                }
            } else {
                p.mesh.material.opacity -= 0.05;
                p.mesh.rotation.z += 0.1;
                p.mesh.scale.multiplyScalar(0.9);
            }
            p.life -= 0.02;
        } else {
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;

            p.life -= 0.02;
            p.mesh.scale.setScalar(p.life);
        }

        if (p.life <= 0 || (p.isPortal && p.mesh && p.mesh.material.opacity <= 0)) {
            if (p.mesh) scene.remove(p.mesh);
            state.particles.splice(i, 1);
        }
    }
}

function updateComets(state, scene) {
    if (Math.random() < 0.005) spawnComet(state, scene);

    for (let i = state.comets.length - 1; i >= 0; i--) {
        let c = state.comets[i];
        c.mesh.position.x += c.vx;
        c.mesh.position.y += c.vy;
        c.mesh.position.z += c.vz;

        if (Math.random() < 0.3) {
            const tGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const tMat = new THREE.MeshBasicMaterial({ color: c.color, transparent: true, opacity: 0.5 });
            const tMesh = new THREE.Mesh(tGeo, tMat);
            tMesh.position.copy(c.mesh.position);
            scene.add(tMesh);

            state.particles.push({
                mesh: tMesh,
                vx: 0, vy: 0, vz: 0,
                life: 0.5
            });
        }

        c.life--;
        if (c.life <= 0) {
            scene.remove(c.mesh);
            state.comets.splice(i, 1);
        }
    }
}

function spawnComet(state, scene) {
    const geo = new THREE.SphereGeometry(1, 8, 8);
    const colors = [0xffffff, 0x00ffff, 0xff00ff, 0xffaa00, 0x00ffaa];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);

    const dist = 500 + Math.random() * 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const startX = dist * Math.sin(phi) * Math.cos(theta);
    const startY = dist * Math.sin(phi) * Math.sin(theta);
    const startZ = dist * Math.cos(phi);

    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;
    const centerZ = GRID_SIZE / 2;

    mesh.position.set(centerX + startX, centerY + startY, centerZ + startZ);

    const targetOffset = 250;
    const targetTheta = theta + Math.PI / 2 + (Math.random() - 0.5);
    const targetX = targetOffset * Math.sin(phi) * Math.cos(targetTheta);
    const targetY = targetOffset * Math.sin(phi) * Math.sin(targetTheta);
    const targetZ = targetOffset * Math.cos(phi);

    const dir = new THREE.Vector3(targetX - startX, targetY - startY, targetZ - startZ).normalize();
    const speed = 2 + Math.random() * 3;

    scene.add(mesh);

    state.comets.push({
        mesh: mesh,
        vx: dir.x * speed,
        vy: dir.y * speed,
        vz: dir.z * speed,
        life: 400,
        color: color
    });
}

function checkPortalPrediction(state, scene) {
    if (state.snake.length === 0) return;

    const head = state.snake[0];
    const vel = state.velocity;

    const lookAhead = 6.0;
    const futureX = head.x + vel.x * lookAhead;
    const futureY = head.y + vel.y * lookAhead;
    const futureZ = head.z + vel.z * lookAhead;

    let wrapEntry = null;
    let wrapExit = null;
    let orientation = null; // 'x', 'y', or 'z'

    if (futureX < 0) {
        wrapEntry = { x: 0, y: head.y, z: head.z };
        wrapExit = { x: GRID_SIZE, y: head.y, z: head.z };
        orientation = 'x';
    } else if (futureX >= GRID_SIZE) {
        wrapEntry = { x: GRID_SIZE, y: head.y, z: head.z };
        wrapExit = { x: 0, y: head.y, z: head.z };
        orientation = 'x';
    }

    else if (futureY < 0) {
        wrapEntry = { x: head.x, y: 0, z: head.z };
        wrapExit = { x: head.x, y: GRID_SIZE, z: head.z };
        orientation = 'y';
    } else if (futureY >= GRID_SIZE) {
        wrapEntry = { x: head.x, y: GRID_SIZE, z: head.z };
        wrapExit = { x: head.x, y: 0, z: head.z };
        orientation = 'y';
    }

    else if (futureZ < 0) {
        wrapEntry = { x: head.x, y: head.y, z: 0 };
        wrapExit = { x: head.x, y: head.y, z: GRID_SIZE };
        orientation = 'z';
    } else if (futureZ >= GRID_SIZE) {
        wrapEntry = { x: head.x, y: head.y, z: GRID_SIZE };
        wrapExit = { x: head.x, y: head.y, z: 0 };
        orientation = 'z';
    }

    if (wrapEntry) {
        if (!state.predictedPortals.entry) {
            state.predictedPortals.entry = createPortalEffect(wrapEntry, 0xff0055, true, scene, state, orientation);
            state.predictedPortals.exit = createPortalEffect(wrapExit, 0x00f3ff, true, scene, state, orientation);
        } else {
            const entryMesh = state.predictedPortals.entry.mesh;
            const exitMesh = state.predictedPortals.exit.mesh;

            entryMesh.position.set(wrapEntry.x * TILE_SIZE, wrapEntry.y * TILE_SIZE, wrapEntry.z * TILE_SIZE);
            exitMesh.position.set(wrapExit.x * TILE_SIZE, wrapExit.y * TILE_SIZE, wrapExit.z * TILE_SIZE);

            updatePortalOrientation(entryMesh, orientation);
            updatePortalOrientation(exitMesh, orientation);
        }
    } else {
        if (state.predictedPortals.entry) {
            if (!state.camera.warp.active) {
                const entry = state.predictedPortals.entry;
                const exit = state.predictedPortals.exit;

                entry.isPredictive = false; entry.life = 0.3; entry.isPortal = true;
                exit.isPredictive = false; exit.life = 0.3; exit.isPortal = true;

                state.predictedPortals = { entry: null, exit: null };
            }
        }
    }
}

function updatePortalOrientation(mesh, orientation) {
    mesh.rotation.set(0, 0, 0);

    if (orientation === 'x') {
        mesh.rotation.y = Math.PI / 2;
    } else if (orientation === 'y') {
        mesh.rotation.x = Math.PI / 2;
    }
    // If 'z', default no rotation (facing Z) is correct for direct XY ring
}

function createPortalEffect(pos, color, predictive, scene, state, orientation, sizeMultiplier = 1.0, isCannibal = false) {
    const baseScale = predictive ? 1.0 : 2.5;
    const finalScale = baseScale * sizeMultiplier;

    const inner = predictive ? 1 : 2.5 * sizeMultiplier;
    const outer = predictive ? 1.2 : 3.5 * sizeMultiplier;

    const geo = new THREE.RingGeometry(inner, outer, 32);
    const mat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(pos.x * TILE_SIZE, pos.y * TILE_SIZE, pos.z * TILE_SIZE);

    updatePortalOrientation(mesh, orientation);

    scene.add(mesh);

    const portal = {
        mesh: mesh,
        vx: 0, vy: 0, vz: 0,
        life: predictive ? 999 : 4.0,
        isPortal: true,
        isPredictive: predictive,
        isCannibal: isCannibal
    };

    state.particles.push(portal);

    return portal;
}

export function triggerWarpEffect(state) {
    if (state.predictedPortals.entry) {
        const duration = state.snake.length * 0.5 + 5.0;

        state.predictedPortals.entry.isPredictive = false;
        state.predictedPortals.entry.life = duration;

        state.predictedPortals.exit.isPredictive = false;
        state.predictedPortals.exit.life = duration;

        state.predictedPortals = { entry: null, exit: null };
    }
}

export function createExplosion(x, y, z, color, scene, state) {
    const particleCount = 30;
    const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);

    let isBlackHole = (color === 0x000000);
    let count = isBlackHole ? 100 : 30;
    let mat;

    if (isBlackHole) {
        const swGeo = new THREE.RingGeometry(0.1, 0.5, 32);
        const swMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 1.0 });
        const swMesh = new THREE.Mesh(swGeo, swMat);
        swMesh.position.set(x * TILE_SIZE, y * TILE_SIZE, z * TILE_SIZE);
        swMesh.lookAt(new THREE.Vector3(x * TILE_SIZE, (y + 1) * TILE_SIZE, z * TILE_SIZE));
        scene.add(swMesh);
        state.particles.push({
            mesh: swMesh,
            vx: 0, vy: 0, vz: 0,
            life: 1.0,
            type: 'SHOCKWAVE'
        });

        state.camera.shake = 2.0;

        mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    } else {
        mat = new THREE.MeshBasicMaterial({ color: color });
    }

    for (let i = 0; i < count; i++) {
        let mesh;
        if (isBlackHole) {
            const isWhite = Math.random() > 0.3;
            const pMat = new THREE.MeshBasicMaterial({ color: isWhite ? 0xffffff : 0xaa0000 });
            if (!isWhite) pMat.color.setHex(0xaaaaaa);

            mesh = new THREE.Mesh(geo, pMat);
        } else {
            mesh = new THREE.Mesh(geo, mat);
        }

        mesh.position.set(x * TILE_SIZE, y * TILE_SIZE, z * TILE_SIZE);
        scene.add(mesh);

        const speed = isBlackHole ? 1.0 : 0.5;
        state.particles.push({
            mesh: mesh,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            vz: (Math.random() - 0.5) * speed,
            life: isBlackHole ? 2.0 : 1.0
        });
    }
}
