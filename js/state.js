export function createInitialState() {
    return {
        snake: [],
        previousSnake: [],
        velocity: { x: 0, y: 0, z: 0 },
        nextVelocity: { x: 0, y: 0, z: 0 },
        foods: [],
        score: 0,
        highScore: parseInt(localStorage.getItem('spaceSnake3DHighScore') || '0'),
        gameRunning: false,
        isPaused: false,
        isAttracting: false,
        pendingGrowth: 0,

        // Boost Energy System
        boostEnergy: 100,
        maxBoostEnergy: 100,
        boostDrainRate: 0.05,
        boostRechargeRate: 0.0025,
        isSpacePressed: false,

        blackHoles: [],

        isFreeLook: false,
        isPointerLocked: false,

        camera: {
            yaw: 0,
            pitch: -0.5,
            dist: 20,
            warp: { active: false, startPos: null, progress: 0 },
            shake: 0
        },

        predictedPortals: { entry: null, exit: null },

        particles: [],
        comets: [],
        events: []
    };
}
