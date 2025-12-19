export const GRID_SIZE = 250;
export const TILE_SIZE = 1;
export const GAME_SPEED = 100;
export const MAX_FOOD = 1500;
export const MAX_BLACK_HOLES = 100;
export const RARE_FRUIT_CHANCE = 0.01;
export const GREEN_FRUIT_CHANCE = 0.003;

import * as THREE from 'three';

export const MATERIALS = {
    snake: new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    }),
    snakeHead: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8
    }),
    food: new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 0.8
    }),
    golden: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        metalness: 1.0
    }),
    greenFruit: new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.4
    })
};

export const COLORS = {
    explosion: 0xff0055,
    comets: [0xffffff, 0x00ffff, 0xff00ff, 0xffaa00, 0x00ffaa]
};
