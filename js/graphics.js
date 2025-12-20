import { GRID_SIZE, TILE_SIZE, MATERIALS } from './constants.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export let scene, camera, renderer, composer;
let snakeMeshes = [];
let solarSystem;
let activeRareMesh = null;
let activeGreenMesh = null;
let foodMeshMap = {};
let blackHoleMeshMap = {};
let npcMeshMap = {};

const _tempVec = new THREE.Vector3();

export function resetVisuals(scene) {
    snakeMeshes.forEach(mesh => scene.remove(mesh));
    snakeMeshes = [];

    if (foodMeshMap) {
        Object.values(foodMeshMap).forEach(mesh => scene.remove(mesh));
        foodMeshMap = {};
    }

    if (activeRareMesh) {
        scene.remove(activeRareMesh);
        activeRareMesh = null;
    }
    if (activeGreenMesh) {
        scene.remove(activeGreenMesh);
        activeGreenMesh = null;
    }
    if (blackHoleMeshMap) {
        Object.values(blackHoleMeshMap).forEach(mesh => scene.remove(mesh));
        blackHoleMeshMap = {};
    }
    if (npcMeshMap) {
        Object.values(npcMeshMap).forEach(mesh => scene.remove(mesh));
        npcMeshMap = {};
    }
}

export function initGraphics(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.8;
    bloomPass.radius = 0.8;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        composer.setSize(width, height);
        bloomPass.resolution.set(width, height);
    });

    const hemiLight = new THREE.HemisphereLight(0x4040a0, 0x101020, 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.PointLight(0xffaa00, 1.5, GRID_SIZE * 3);
    keyLight.position.set(-1.5 * GRID_SIZE, 0.5 * GRID_SIZE, -1.5 * GRID_SIZE);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f3ff, 0.8);
    rimLight.position.set(100, -50, 100);
    scene.add(rimLight);

    createSolarSystem();
    createStars();

    return { scene, camera, renderer };
}

function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 6000;
    const posArray = new Float32Array(starCount * 3);
    const spread = GRID_SIZE * 4;
    const offset = GRID_SIZE / 2;

    let i = 0;
    while (i < starCount * 3) {
        const x = (Math.random() - 0.5) * spread + offset;
        const y = (Math.random() - 0.5) * spread + offset;
        const z = (Math.random() - 0.5) * spread + offset;

        const buffer = 50;
        if (x > -buffer && x < GRID_SIZE + buffer &&
            y > -buffer && y < GRID_SIZE + buffer &&
            z > -buffer && z < GRID_SIZE + buffer) {
            continue;
        }

        posArray[i] = x;
        posArray[i + 1] = y;
        posArray[i + 2] = z;
        i += 3;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.6, color: 0xffffff });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
}

function createSolarSystem() {
    solarSystem = new THREE.Group();
    scene.add(solarSystem);

    const sunGeo = new THREE.SphereGeometry(60, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-1.5 * GRID_SIZE, 0.5 * GRID_SIZE, -1.5 * GRID_SIZE);
    solarSystem.add(sun);

    const p1Geo = new THREE.SphereGeometry(20, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({ color: 0x4400ff, roughness: 0.8 });
    const p1 = new THREE.Mesh(p1Geo, p1Mat);
    p1.position.set(1.5 * GRID_SIZE, 0.2 * GRID_SIZE, 1.0 * GRID_SIZE);
    solarSystem.add(p1);

    const p2Geo = new THREE.SphereGeometry(10, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.9 });
    const p2 = new THREE.Mesh(p2Geo, p2Mat);
    p2.position.set(0.3 * GRID_SIZE, -1.0 * GRID_SIZE, 1.5 * GRID_SIZE);
    solarSystem.add(p2);

    const p3Geo = new THREE.SphereGeometry(15, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.4 });
    const p3 = new THREE.Mesh(p3Geo, p3Mat);
    p3.position.set(-1.0 * GRID_SIZE, 1.0 * GRID_SIZE, 1.0 * GRID_SIZE);

    const ringGeo = new THREE.TorusGeometry(22, 2, 2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    p3.add(ring);

    solarSystem.add(p3);
}

export function syncVisuals(state, alpha) {
    if (!state) return;

    while (snakeMeshes.length < state.snake.length) {
        const mesh = createSnakeBody(0, 0, 0);
        scene.add(mesh);
        snakeMeshes.push(mesh);
    }
    while (snakeMeshes.length > state.snake.length) {
        const mesh = snakeMeshes.pop();
        scene.remove(mesh);
    }

    for (let i = 0; i < state.snake.length; i++) {
        const curr = state.snake[i];
        const prev = state.previousSnake[i] || curr;
        const mesh = snakeMeshes[i];

        if (i === 0) {
            if (mesh.material !== MATERIALS.snakeHead) mesh.material = MATERIALS.snakeHead;
        } else {
            if (mesh.material !== MATERIALS.snake) mesh.material = MATERIALS.snake;
        }

        const distSq = (curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2 + (curr.z - prev.z) ** 2;

        if (distSq > 4) {
            mesh.position.set(curr.x * TILE_SIZE, curr.y * TILE_SIZE, curr.z * TILE_SIZE);
        } else {
            const lx = prev.x + (curr.x - prev.x) * alpha;
            const ly = prev.y + (curr.y - prev.y) * alpha;
            const lz = prev.z + (curr.z - prev.z) * alpha;
            mesh.position.set(lx * TILE_SIZE, ly * TILE_SIZE, lz * TILE_SIZE);
        }

        if (i === 0) {
            const pulse = state.isAttracting ? (1.0 + Math.sin(Date.now() * 0.02) * 0.3) : 1.0;
            mesh.scale.setScalar(pulse);
        }
    }

    syncFoodVisuals(state);
    syncBlackHoles(state);
    syncNPCVisuals(state, alpha);

    if (solarSystem) solarSystem.rotation.y += 0.0005;

    updateCamera(state);
}

function syncFoodVisuals(state) {
    if (!foodMeshMap) foodMeshMap = {};
    const unseenIds = new Set(Object.keys(foodMeshMap));

    state.foods.forEach(f => {
        if (!f.id) f.id = Math.random().toString(36).substr(2, 9);
        if (!foodMeshMap[f.id]) {
            const mesh = createSphere(f.x, f.y, f.z, MATERIALS.food);
            scene.add(mesh);
            foodMeshMap[f.id] = mesh;
        }
        unseenIds.delete(f.id.toString());

        const mesh = foodMeshMap[f.id];
        const tx = f.x * TILE_SIZE;
        const ty = f.y * TILE_SIZE;
        const tz = f.z * TILE_SIZE;

        _tempVec.set(tx, ty, tz);
        mesh.position.lerp(_tempVec, 0.2);

        mesh.rotation.y += 0.05;
        mesh.rotation.z += 0.02;
    });

    if (state.rareFood) {
        syncRareFood(state);
    } else if (activeRareMesh) {
        scene.remove(activeRareMesh);
        activeRareMesh = null;
    }

    if (state.greenFruit) {
        syncGreenFood(state);
    } else if (activeGreenMesh) {
        scene.remove(activeGreenMesh);
        activeGreenMesh = null;
    }

    unseenIds.forEach(id => {
        const mesh = foodMeshMap[id];
        scene.remove(mesh);
        delete foodMeshMap[id];
    });
}

function syncRareFood(state) {
    if (!state.rareFood.mesh) {
        const geo = new THREE.SphereGeometry(0.8, 16, 16);
        const mat = MATERIALS.golden;
        state.rareFood.mesh = new THREE.Mesh(geo, mat);
        scene.add(state.rareFood.mesh);
        activeRareMesh = state.rareFood.mesh;
        state.rareFood.mesh.position.set(state.rareFood.x * TILE_SIZE, state.rareFood.y * TILE_SIZE, state.rareFood.z * TILE_SIZE);
    }
    const tx = state.rareFood.x * TILE_SIZE;
    const ty = state.rareFood.y * TILE_SIZE;
    const tz = state.rareFood.z * TILE_SIZE;

    _tempVec.set(tx, ty, tz);
    state.rareFood.mesh.position.lerp(_tempVec, 0.2);

    state.rareFood.mesh.rotation.y += 0.1;
    state.rareFood.mesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.01) * 0.3);
}

function syncGreenFood(state) {
    if (!state.greenFruit.mesh) {
        const geo = new THREE.SphereGeometry(0.5, 16, 16);
        const mat = MATERIALS.greenFruit;
        state.greenFruit.mesh = new THREE.Mesh(geo, mat);
        scene.add(state.greenFruit.mesh);
        activeGreenMesh = state.greenFruit.mesh;
        state.greenFruit.mesh.position.set(state.greenFruit.x * TILE_SIZE, state.greenFruit.y * TILE_SIZE, state.greenFruit.z * TILE_SIZE);
    }
    const tx = state.greenFruit.x * TILE_SIZE;
    const ty = state.greenFruit.y * TILE_SIZE;
    const tz = state.greenFruit.z * TILE_SIZE;

    _tempVec.set(tx, ty, tz);
    state.greenFruit.mesh.position.lerp(_tempVec, 0.2);

    state.greenFruit.mesh.rotation.x += 0.05;
    state.greenFruit.mesh.rotation.y += 0.05;
    state.greenFruit.mesh.scale.setScalar(1.0 + Math.sin(Date.now() * 0.02) * 0.2);
}

function syncBlackHoles(state) {
    if (!blackHoleMeshMap) blackHoleMeshMap = {};
    const unseenBH = new Set(Object.keys(blackHoleMeshMap));

    state.blackHoles.forEach(bh => {
        if (bh.expired) return;
        unseenBH.delete(bh.id);

        let mesh = blackHoleMeshMap[bh.id];
        if (!mesh) {
            mesh = createBlackHoleMesh(bh);
            scene.add(mesh);
            blackHoleMeshMap[bh.id] = mesh;
            mesh.position.set(bh.x * TILE_SIZE, bh.y * TILE_SIZE, bh.z * TILE_SIZE);
        }

        const tx = bh.x * TILE_SIZE;
        const ty = bh.y * TILE_SIZE;
        const tz = bh.z * TILE_SIZE;

        const distSq = (mesh.position.x - tx) ** 2 + (mesh.position.y - ty) ** 2 + (mesh.position.z - tz) ** 2;

        if (distSq > (GRID_SIZE / 2 * TILE_SIZE) ** 2) {
            mesh.position.set(tx, ty, tz);
        } else {
            _tempVec.set(tx, ty, tz);
            mesh.position.lerp(_tempVec, 0.2);
        }

        const size = bh.size || 1.0;
        const pulse = 1.0 + Math.sin(Date.now() * 0.005 + bh.x) * 0.2;
        mesh.scale.setScalar(pulse * size);

        mesh.rotation.x += 0.02;
        updateBlackHoleColors(mesh, bh);
    });

    unseenBH.forEach(id => {
        const mesh = blackHoleMeshMap[id];
        scene.remove(mesh);
        delete blackHoleMeshMap[id];
    });
}

function updateCamera(state) {
    if (!snakeMeshes.length) return;

    const headPos = snakeMeshes[0].position;

    const dist = state.camera.dist || 30;
    const yaw = state.camera.yaw || 0;
    const pitch = state.camera.pitch || 0.5;

    const offY = Math.sin(pitch) * dist;
    const hDist = Math.cos(pitch) * dist;
    const offX = Math.sin(yaw) * hDist;
    const offZ = Math.cos(yaw) * hDist;

    const targetPos = new THREE.Vector3(
        headPos.x - offX,
        headPos.y + offY,
        headPos.z - offZ
    );

    if (state.camera.warp && state.camera.warp.active) {
        state.camera.warp.progress += 0.02;
        if (state.camera.warp.progress >= 1.0) {
            state.camera.warp.active = false;
            state.camera.warp.startPos = null;
            camera.position.copy(targetPos);
        } else {
            if (!state.camera.warp.startPos) state.camera.warp.startPos = camera.position.clone();
            const t = state.camera.warp.progress;
            const ease = t * t * (3 - 2 * t);
            camera.position.lerpVectors(state.camera.warp.startPos, targetPos, ease);
        }
    } else {
        const smoothness = 0.15;
        camera.position.lerp(targetPos, smoothness);
    }

    camera.lookAt(headPos);

    if (state.camera.shake > 0) {
        camera.position.x += (Math.random() - 0.5) * state.camera.shake;
        camera.position.y += (Math.random() - 0.5) * state.camera.shake;
        camera.position.z += (Math.random() - 0.5) * state.camera.shake;
        state.camera.shake *= 0.9;
    }
}

function createBlackHoleMesh(bh) {
    const mesh = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    mesh.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 16, 32), new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 }));
    halo.rotation.x = Math.PI / 3;
    mesh.add(halo);

    return mesh;
}

function updateBlackHoleColors(mesh, bh) {
    const core = mesh.children[0];
    const ring = mesh.children[1];
    const halo = mesh.children[2];
    const timeVal = (Math.sin(Date.now() * 0.002) + 1) / 2;

    if (bh.isCannibal) {
        core.material.color.setHSL(0.12, 1.0, 0.2 + timeVal * 0.3);
        const ringPulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
        ring.material.color.setHSL(0.14, 1.0, ringPulse * 0.5);
        const haloPulse = (Math.sin(Date.now() * 0.005) + 1) / 2;
        halo.material.color.setHSL(0.12, 1.0, haloPulse * 0.4);
    } else {
        core.material.color.setHSL(0, 0, timeVal);
        ring.material.color.setHex(0xFFFFFF);
        halo.material.color.setHex(0xAAAAAA);
    }
}

function createSnakeBody(x, y, z) {
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mesh = new THREE.Mesh(geo, MATERIALS.snake);
    mesh.position.set(x * TILE_SIZE, y * TILE_SIZE, z * TILE_SIZE);
    return mesh;
}

const sharedSphereGeo = new THREE.SphereGeometry(0.5, 8, 8);
function createSphere(x, y, z, mat) {
    const mesh = new THREE.Mesh(sharedSphereGeo, mat);
    mesh.position.set(x * TILE_SIZE, y * TILE_SIZE, z * TILE_SIZE);
    return mesh;
}

function syncNPCVisuals(state, alpha) {
    if (!npcMeshMap) npcMeshMap = {};
    const unseenIds = new Set(Object.keys(npcMeshMap));

    state.npcSnakes.forEach(npc => {
        unseenIds.delete(npc.id);

        let snakeGroup = npcMeshMap[npc.id];
        if (!snakeGroup) {
            snakeGroup = new THREE.Group();
            scene.add(snakeGroup);
            npcMeshMap[npc.id] = snakeGroup;
        }

        let mat = MATERIALS.npc;
        if (npc.color) {
            if (!snakeGroup.userData.material) {
                snakeGroup.userData.material = MATERIALS.npc.clone();
                snakeGroup.userData.material.color.setHex(npc.color);
                snakeGroup.userData.material.emissive.setHex(npc.color);
            }
            mat = snakeGroup.userData.material;
        }

        while (snakeGroup.children.length < npc.segments.length) {
            const mesh = createSphere(0, 0, 0, mat);
            snakeGroup.add(mesh);
        }
        while (snakeGroup.children.length > npc.segments.length) {
            snakeGroup.remove(snakeGroup.children[snakeGroup.children.length - 1]);
        }

        for (let i = 0; i < npc.segments.length; i++) {
            const curr = npc.segments[i];
            const prev = (npc.previousSegments && npc.previousSegments[i]) ? npc.previousSegments[i] : curr;
            const mesh = snakeGroup.children[i];

            if (i === 0) {
                mesh.scale.setScalar(1.2);
            } else {
                mesh.scale.setScalar(0.8);
            }

            const distSq = (curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2 + (curr.z - prev.z) ** 2;

            if (distSq > 4) {
                mesh.position.set(curr.x * TILE_SIZE, curr.y * TILE_SIZE, curr.z * TILE_SIZE);
            } else {
                const lx = prev.x + (curr.x - prev.x) * alpha;
                const ly = prev.y + (curr.y - prev.y) * alpha;
                const lz = prev.z + (curr.z - prev.z) * alpha;
                mesh.position.set(lx * TILE_SIZE, ly * TILE_SIZE, lz * TILE_SIZE);
            }
        }
    });

    unseenIds.forEach(id => {
        const group = npcMeshMap[id];
        scene.remove(group);
        delete npcMeshMap[id];
    });
}
