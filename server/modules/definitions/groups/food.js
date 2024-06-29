const { basePolygonDamage, basePolygonHealth, base } = require('../constants.js'),

// Code by Damocles (https://discord.com/channels/366661839620407297/508125275675164673/1090010998053818488)
// Albeit heavily modified because the math in the original didn't work LOL
makeRelic = (type, scale = 1, gem, SIZE) => {
    type = ensureIsClass(type);
    let relicCasing = {
        PARENT: 'genericEntity',
        LABEL: 'Relic Casing',
        LEVEL_CAP: 45,
        COLOR: type.COLOR,
        MIRROR_MASTER_ANGLE: true,
        SHAPE: [[-0.4,-1],[0.4,-0.25],[0.4,0.25],[-0.4,1]].map(r => r.map(s => s * scale))
    }, relicBody = {
        PARENT: 'genericEntity',
        LABEL: 'Relic Mantle',
        LEVEL_CAP: 45,
        COLOR: type.COLOR,
        MIRROR_MASTER_ANGLE: true,
        SHAPE: type.SHAPE
    };
    Class[Math.random().toString(36)] = relicCasing;
    Class[Math.random().toString(36)] = relicBody;
    let width = 6 * scale,
        y = 8.25 + ((scale % 1) * 5),
        isEgg = type.SHAPE == 0,
        casings = isEgg ? 8 : type.SHAPE,
        fraction = 360 / casings,
        GUNS = [],
        TURRETS = [{ POSITION: [32.5, 0, 0, 0, 0, 0], TYPE: relicBody }],
        PARENT = [type],
        additionalAngle = type.SHAPE % 2 === 0 ? 0 : fraction / 2;

    if (SIZE) {
        PARENT.push({ SIZE });
    }

    for (let i = 0; i < casings; i++) {
        let angle = i * fraction,
            gunAngle = angle + additionalAngle;
        if (isEgg) {
            GUNS.push({
                POSITION: [4, width, 2.5, 12,  0, gunAngle, 0]
            });
            TURRETS.push({
                POSITION: [8, -15,  0, angle, 0, 1],
                TYPE: relicCasing
            });
        } else {
            GUNS.push({
                POSITION: [4, width, 2.5, 12,  y, gunAngle, 0]
            });
            GUNS.push({
                POSITION: [4, width, 2.5, 12, -y, gunAngle, 0]
            });
            TURRETS.push({
                POSITION: [8, -15,  y, angle, 0, 1],
                TYPE: relicCasing
            });
            TURRETS.push({
                POSITION: [8, -15, -y, angle, 0, 1],
                TYPE: relicCasing
            });
        }
    }

    if (gem) {
        TURRETS.push({
            POSITION: [8, 0, 0, 0, 0, 1],
            TYPE: [gem, { MIRROR_MASTER_ANGLE: true }]
        });
    }

    return {
        PARENT,
        LABEL: type.LABEL + ' Relic',
        COLOR: "white", // This is the color of the floor, this makes it look hollow.
        BODY: {
            ACCELERATION: 0.001
        },
        CONTROLLERS: [],
        VALUE: type.VALUE * 100_000,
        GUNS,
        TURRETS
    };
},

makeCrasher = type => ({
    PARENT: type,
    COLOR: 'pink',
    TYPE: "crasher",
    LABEL: 'Crasher ' + type.LABEL,
    CONTROLLERS: ['nearestDifferentMaster', 'mapTargetToGoal'],
    MOTION_TYPE: "motor",
    FACING_TYPE: "smoothWithMotion",
    HITS_OWN_TYPE: "hard",
    HAS_NO_MASTER: true,
    DRAW_HEALTH: true,
    BODY: {
        SPEED: 1 + 5 / Math.max(2, type.TURRETS.length + type.SHAPE),
        ACCELERATION: 5,
        DAMAGE: 5,
        PUSHABILITY: 0.5,
        DENSITY: 10,
        RESIST: 2,
    },
    AI: {
        NO_LEAD: true,
    }
}),

makeRare = (type, level) => {
    type = ensureIsClass(type);
    return {
        PARENT: "food",
        LABEL: ["Shiny", "Legendary", "Shadow", "Rainbow", "Trans"][level] + " " + type.LABEL,
        VALUE: [100, 500, 2000, 4000, 5000][level] * type.VALUE,
        SHAPE: type.SHAPE,
        SIZE: type.SIZE + level,
        COLOR: ["lightGreen", "teal", "darkGrey", "rainbow", "trans"][level],
        ALPHA: level == 2 ? 0.25 : 1,
        BODY: {
            DAMAGE: type.BODY.DAMAGE + level,
            DENSITY: type.BODY.DENSITY + level,
            HEALTH: [10, 20, 40, 80, 100][level] * type.BODY.HEALTH,
            PENETRATION: type.BODY.PENETRATION + level,
            ACCELERATION: type.BODY.ACCELERATION
        },
        DRAW_HEALTH: true,
        INTANGIBLE: false,
        GIVE_KILL_MESSAGE: true,
    }
},

makeLaby = (type, level, baseScale = 1) => {
    type = ensureIsClass(type);
    let usableSHAPE = Math.max(type.SHAPE, 3),
        downscale = Math.cos(Math.PI / usableSHAPE),
        strengthMultiplier = 6 ** level;
    return {
        PARENT: "food",
        LABEL: ["", "Beta ", "Alpha ", "Omega ", "Gamma ", "Delta "][level] + type.LABEL,
        VALUE: type.VALUE * strengthMultiplier,
        SHAPE: type.SHAPE,
        SIZE: type.SIZE * baseScale / downscale ** level,
        COLOR: type.COLOR,
        ALPHA: type.ALPHA,
        BODY: {
            DAMAGE: type.BODY.DAMAGE,
            DENSITY: type.BODY.DENSITY,
            HEALTH: type.BODY.HEALTH * strengthMultiplier,
            PENETRATION: type.BODY.PENETRATION,
            PUSHABILITY: (type.BODY.PUSHABILITY / (level + 1)) || 0,
            ACCELERATION: type.BODY.ACCELERATION
        },
        VARIES_IN_SIZE: false,
        DRAW_HEALTH: type.DRAW_HEALTH,
        GIVE_KILL_MESSAGE: type.GIVE_KILL_MESSAGE || level > 2,
        GUNS: type.GUNS,
        TURRETS: [...(type.TURRETS ? type.TURRETS : []), ...Array(level).fill().map((_, i) => ({
            POSITION: [20 * downscale ** (i + 1), 0, 0, !(i & 1) ? 180 / usableSHAPE : 0, 0, 1],
            TYPE: [type, { COLOR: -1, MIRROR_MASTER_ANGLE: true }]
        }))]
    };
};

// EGGS
Class.egg = {
    PARENT: "food",
    LABEL: "Triangle",
    VALUE: 250,
    SHAPE: 3,
    SIZE: 4.5,
    COLOR: "yellow",
    INTANGIBLE: false,
    BODY: {
        DAMAGE: 0,
        DENSITY: 2,
        HEALTH: 3 * basePolygonHealth,
        PUSHABILITY: 0,
        ACCELERATION: 0.015
    },
    DRAW_HEALTH: true,
};
Class.gem = {
    PARENT: "food",
    LABEL: "Gem",
    VALUE: 2e3,
    SHAPE: 6,
    SIZE: 4.5,
    COLOR: "aqua",
    BODY: {
        DAMAGE: basePolygonDamage / 4,
        DENSITY: 4,
        HEALTH: 10,
        PENETRATION: 2,
        RESIST: 2,
        PUSHABILITY: 0.25,
        ACCELERATION: 0.015
    },
    DRAW_HEALTH: true,
    INTANGIBLE: false,
    GIVE_KILL_MESSAGE: true,
};
Class.jewel = {
    PARENT: "food",
    LABEL: "Jewel",
    VALUE: 1e5,
    SHAPE: 6,
    SIZE: 8,
    COLOR: "yellow",
    BODY: {
        DAMAGE: basePolygonDamage / 4,
        DENSITY: 4,
        HEALTH: 50,
        PENETRATION: 2,
        RESIST: 2,
        PUSHABILITY: 0.25,
        ACCELERATION: 0.015
    },
    DRAW_HEALTH: true,
    INTANGIBLE: false,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyEgg = makeRare("egg", 0);
Class.legendaryEgg = makeRare("egg", 1);
Class.shadowEgg = makeRare("egg", 2);
Class.rainbowEgg = makeRare("egg", 3);
Class.transEgg = makeRare("egg", 4); //ironic

// SQUARES
Class.square = {
    PARENT: "food",
    LABEL: "Square",
    VALUE: 1250,
    SHAPE: 4,
    SIZE: 14,
    COLOR: "red",
    BODY: {
        DAMAGE: basePolygonDamage,
        DENSITY: 4,
        HEALTH: 6 * basePolygonHealth,
        PENETRATION: 2,
        ACCELERATION: 0.0075
    },
    DRAW_HEALTH: true,
    INTANGIBLE: false,
};
Class.shinySquare = makeRare("square", 0);
Class.legendarySquare = makeRare("square", 1);
Class.shadowSquare = makeRare("square", 2);
Class.rainbowSquare = makeRare("square", 3);
Class.transSquare = makeRare("square", 4);

// TRIANGLES
Class.triangle = {
    PARENT: "food",
    LABEL: "Pentagon",
    VALUE: 5250,
    SHAPE: 5,
    SIZE: 10,
    COLOR: "purple",
    BODY: {
        DAMAGE: basePolygonDamage,
        DENSITY: 6,
        HEALTH: 9 * basePolygonHealth,
        RESIST: 1.15,
        PENETRATION: 1.5,
        ACCELERATION: 0.005
    },
    DRAW_HEALTH: true,
};
Class.shinyTriangle = makeRare("triangle", 0);
Class.legendaryTriangle = makeRare("triangle", 1);
Class.shadowTriangle = makeRare("triangle", 2);
Class.rainbowTriangle = makeRare("triangle", 3);
Class.transTriangle = makeRare("triangle", 4);

// PENTAGONS
Class.pentagon = {
    PARENT: "food",
    LABEL: "Hexagon",
    VALUE: 21250,
    SHAPE: 6,
    SIZE: 21,
    COLOR: "orange",
    BODY: {
        DAMAGE: 1.5 * basePolygonDamage,
        DENSITY: 8,
        HEALTH: 15 * basePolygonHealth,
        RESIST: 1.25,
        PENETRATION: 1.1,
        ACCELERATION: 0.0035
    },
    DRAW_HEALTH: true,
};
Class.shinyPentagon = makeRare("pentagon", 0);
Class.legendaryPentagon = makeRare("pentagon", 1);
Class.shadowPentagon = makeRare("pentagon", 2);
Class.rainbowPentagon = makeRare("pentagon", 3);
Class.transPentagon = makeRare("pentagon", 4);

// BETA PENTAGONS
Class.betaPentagon = {
    PARENT: "food",
    LABEL: "Heptagon",
    VALUE: 85250,
    SHAPE: 7,
    SIZE: 30,
    COLOR: "green",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 30,
        HEALTH: 24 * basePolygonHealth,
        RESIST: Math.pow(1.25, 2),
        PENETRATION: 1.1,
        SHIELD: 20 * basePolygonHealth,
        REGEN: 0.2,
        ACCELERATION: 0.003
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyBetaPentagon = makeRare("betaPentagon", 0);
Class.legendaryBetaPentagon = makeRare("betaPentagon", 1);
Class.shadowBetaPentagon = makeRare("betaPentagon", 2);
Class.rainbowBetaPentagon = makeRare("betaPentagon", 3);
Class.transBetaPentagon = makeRare("betaPentagon", 4);

// ALPHA PENTAGONS
Class.alphaPentagon = {
    PARENT: "food",
    LABEL: "Octagon",
    VALUE: 341250,
    SHAPE: 8,
    SIZE: 58,
    COLOR: "blue",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 48 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.nonagons = {
    PARENT: "food",
    LABEL: "Nonagon",
    VALUE: 1365250,
    SHAPE: 9,
    SIZE: 73,
    COLOR: "purple",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 100 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.decagons = {
    PARENT: "food",
    LABEL: "Decagon",
    VALUE: 5461250,
    SHAPE: 10,
    SIZE: 100,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 150 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.hendecagons = {
    PARENT: "food",
    LABEL: "Hendecagon",
    VALUE: 21845250,
    SHAPE: 11,
    SIZE: 120,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 175 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.dodecagons = {
    PARENT: "food",
    LABEL: "Dodecagon",
    VALUE: 87381250,
    SHAPE: 12,
    SIZE: 145,
    COLOR: "gray",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 200 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.tridecagons = {
    PARENT: "food",
    LABEL: "Tridecagon",
    VALUE: 349525250,
    SHAPE: 13,
    SIZE: 175,
    COLOR: "white",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 225 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.tetradecagons = {
    PARENT: "food",
    LABEL: "Tetradecagon",
    VALUE: 1398101250,
    SHAPE: 14,
    SIZE: 210,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 250 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.pentadecagons = {
    PARENT: "food",
    LABEL: "Pentadecagon",
    VALUE: 5592405250,
    SHAPE: 15,
    SIZE: 250,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 275 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.hexadecagons = {
    PARENT: "food",
    LABEL: "Hexadecagon",
    VALUE: 22369621250,
    SHAPE: 15,
    SIZE: 295,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 300 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.heptadecagons = {
    PARENT: "food",
    LABEL: "Heptadecagon",
    VALUE: 89478485250,
    SHAPE: 15,
    SIZE: 335,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 325 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.octadecagons = {
    PARENT: "food",
    LABEL: "Octadecagon",
    VALUE: 357913941250,
    SHAPE: 18,
    SIZE: 380,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 350 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);

// ALPHA PENTAGONS
Class.nonadecagons = {
    PARENT: "food",
    LABEL: "Nonadecagon",
    VALUE: 89478485250,
    SHAPE: 19,
    SIZE: 430,
    COLOR: "black",
    BODY: {
        DAMAGE: 2 * basePolygonDamage,
        DENSITY: 80,
        HEALTH: 375 * basePolygonHealth,
        RESIST: Math.pow(1.25, 3),
        PENETRATION: 1.1,
        SHIELD: 40 * basePolygonHealth,
        REGEN: 0.6,
        ACCELERATION: 0.0025
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.shinyAlphaPentagon = makeRare("alphaPentagon", 0);
Class.legendaryAlphaPentagon = makeRare("alphaPentagon", 1);
Class.shadowAlphaPentagon = makeRare("alphaPentagon", 2);
Class.rainbowAlphaPentagon = makeRare("alphaPentagon", 3);
Class.transAlphaPentagon = makeRare("alphaPentagon", 4);




// HEXAGONS
Class.hexagon = {
    PARENT: "food",
    LABEL: "Hexagon",
    VALUE: 500,
    SHAPE: 6,
    SIZE: 25,
    COLOR: "hexagon",
    BODY: {
        DAMAGE: 3 * basePolygonDamage,
        DENSITY: 8,
        HEALTH: 20 * basePolygonHealth,
        RESIST: 1.3,
        SHIELD: 50 * basePolygonHealth,
        PENETRATION: 1.1,
        ACCELERATION: 0.003
    },
    DRAW_HEALTH: true,
};
Class.shinyHexagon = makeRare("hexagon", 0);
Class.legendaryHexagon = makeRare("hexagon", 1);
Class.shadowHexagon = makeRare("hexagon", 2);
Class.rainbowHexagon = makeRare("hexagon", 3);
Class.transHexagon = makeRare("hexagon", 4);

// 3D POLYGONS
Class.sphere = {
    PARENT: "food",
    LABEL: "The Sphere",
    FACING_TYPE: "noFacing",
    VALUE: 1e7,
    SHAPE: 0,
    SIZE: 9,
    COLOR: {
        BASE: "white",
        BRIGHTNESS_SHIFT: -15,
    },
    BODY: {
        DAMAGE: 4,
        DENSITY: 16,
        HEALTH: 30,
        RESIST: 1.25,
        PENETRATION: 15,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
    TURRETS: [{
        POSITION: [17, 0, 0, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: -14 }, BORDERLESS: true }]
    }, {
        POSITION: [15, 1, -1, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: -9 }, BORDERLESS: true }]
    }, {
        POSITION: [13, 2, -2, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: -8 }, BORDERLESS: true }]
    }, {
        POSITION: [11, 3, -3, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: -3 }, BORDERLESS: true }]
    }, {
        POSITION: [8, 3.25, -3.25, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: 3 }, BORDERLESS: true }]
    }, {
        POSITION: [6, 3, -3, 0, 0, 1],
        TYPE: ["egg", { COLOR: { BASE: "white", BRIGHTNESS_SHIFT: 9 }, BORDERLESS: true }]
    }]
};
Class.cube = {
    PARENT: "food",
    LABEL: "The Cube",
    VALUE: 2e7,
    SIZE: 10,
    COLOR: "white",
    SHAPE: "M 0.0575 0.0437 V 0.9921 L 0.8869 0.5167 V -0.4306 L 0.0575 0.0437 Z M -0.0583 0.0437 V 0.9921 L -0.8869 0.5159 V -0.4306 L -0.0583 0.0437 Z M 0 -0.0556 L 0.829 -0.5266 L 0 -1 L -0.8254 -0.527 L 0 -0.0556",
    BODY: {
        DAMAGE: 4.8,
        DENSITY: 20,
        HEALTH: 40,
        RESIST: 1.25,
        PENETRATION: 17.5,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    INTANGIBLE: false,
    GIVE_KILL_MESSAGE: true,
};
Class.tetrahedron = {
    PARENT: "food",
    LABEL: "The Tetrahedron",
    VALUE: 3e7,
    SIZE: 12,
    COLOR: "white",
    SHAPE: "M 0.058 0.044 V 1 L 0.894 -0.434 L 0.058 0.044 Z M -0.0588 0.044 V 1 L -0.894 -0.434 L -0.0588 0.044 Z M 0 -0.056 L 0.8356 -0.5308 L -0.832 -0.5312 L 0 -0.056",
    BODY: {
        DAMAGE: 6,
        DENSITY: 23,
        HEALTH: 50,
        RESIST: 1.25,
        PENETRATION: 22.5,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true
};
Class.octahedron = {
    PARENT: "food",
    LABEL: "The Octahedron",
    VALUE: 4e7,
    SIZE: 13,
    COLOR: "white",
    SHAPE: "M 0.06 -0.06 L 0.95 -0.06 L 0.06 -0.95 L 0.06 -0.06 M -0.06 0.06 L -0.06 0.95 L -0.95 0.06 L -0.06 0.06 M -0.06 -0.06 L -0.95 -0.06 L -0.06 -0.95 L -0.06 -0.06 M 0.06 0.06 L 0.06 0.95 L 0.95 0.06 L 0.06 0.06",
    BODY: {
        DAMAGE: 6.5,
        DENSITY: 26,
        HEALTH: 60,
        RESIST: 1.25,
        PENETRATION: 30,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true
};
Class.dodecahedron = {
    PARENT: "food",
    LABEL: "The Dodecahedron",
    VALUE: 5e7,
    SIZE: 18,
    COLOR: "white",
    SHAPE: "M -0.3273 -0.4318 H 0.3045 L 0.5068 0.1727 L -0.0091 0.5455 L -0.5227 0.1727 L -0.3273 -0.4318 Z M -0.6068 0.2682 L -0.0773 0.6545 V 0.9591 L -0.5955 0.7977 L -0.9136 0.3545 L -0.6068 0.2682 Z M 0.5909 0.2682 L 0.0523 0.6591 V 0.9636 L 0.5773 0.7955 L 0.8955 0.3545 L 0.5909 0.2682 Z M -0.65 0.1455 L -0.4477 -0.4818 L -0.6318 -0.7505 L -0.9545 -0.3182 V 0.2318 L -0.65 0.1455 Z M 0.4273 -0.4841 L 0.6318 0.1455 L 0.9341 0.2341 V -0.3136 L 0.6145 -0.7591 L 0.4273 -0.4841 Z M -0.0091 -1 L -0.5318 -0.8341 L -0.3455 -0.5609 H 0.3227 L 0.5159 -0.8314 L -0.0091 -1",
    BODY: {
        DAMAGE: 7,
        DENSITY: 28,
        HEALTH: 70,
        RESIST: 1.25,
        PENETRATION: 32.5,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};
Class.icosahedron = {
    PARENT: "food",
    LABEL: "The Icosahedron",
    VALUE: 1e8,
    SIZE: 20,
    COLOR: "white",
    SHAPE: "M 0 0.65 L -0.563 -0.325 L 0.563 -0.325 Z M -0.866 0.5 L -0.108 0.653 L -0.619 -0.233 Z M 0.679 -0.332 L 0.906 0.331 L 0.892 -0.455 Z M 0.627 -0.422 L 0.166 -0.95 L 0.84 -0.545 Z M 0.866 0.5 L 0.619 -0.233 L 0.108 0.653 Z M -0.627 -0.422 L -0.166 -0.95 L -0.84 -0.545 Z M -0.679 -0.332 L -0.906 0.331 L -0.892 -0.455 Z M 0 -1 L -0.511 -0.42 L 0.511 -0.42 Z M -0.052 0.754 L -0.74 0.619 L -0.052 1 Z M 0.052 0.754 L 0.74 0.619 L 0.052 1 Z",
    BODY: {
        DAMAGE: 9,
        DENSITY: 30,
        HEALTH: 80,
        RESIST: 1.25,
        PENETRATION: 35,
        ACCELERATION: 0.002
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true,
};

// RELICS
for (let [gemColor, name] of [
    [undefined, ""],
    ["powerGem", "Power"],
    ["spaceGem", "Space"],
    ["realityGem", "Reality"],
    ["soulGem", "Soul"],
    ["timeGem", "Time"],
    ["mindGem", "Mind"]
]) {
    let gem;
    if (gemColor) {
        gem = Class[name + "Gem"] = {
            PARENT: 'gem',
            LABEL: name + ' Gem',
            SHAPE: 6,
            COLOR: gemColor
        }
    }

    Class[name + "EggRelic"] = makeRelic("egg", 0.5, gem, 7);
    Class[name + "SquareRelic"] = makeRelic("square", 1, gem);
    Class[name + "TriangleRelic"] = makeRelic("triangle", 1.45, gem);
    Class[name + "PentagonRelic"] = makeRelic("pentagon", -0.6, gem);
    Class[name + "BetaPentagonRelic"] = makeRelic("betaPentagon", -0.6, gem);
    Class[name + "AlphaPentagonRelic"] = makeRelic("alphaPentagon", -0.6, gem);
}

// 4D
Class.tesseract = {
    PARENT: "food",
    LABEL: "The Tesseract",
    VALUE: 42e7,
    SIZE: 25,
    COLOR: "white",
    SHAPE: "M -0.43 0.35 L -0.71 0.63 L -0.71 -0.63 L -0.43 -0.35 L -0.43 0.35 M -0.35 0.43 L -0.63 0.71 L 0.63 0.71 L 0.35 0.43 L -0.35 0.43 M 0.35 -0.43 L 0.63 -0.71 L -0.63 -0.71 L -0.35 -0.43 L 0.35 -0.43 M 0.43 -0.35 L 0.71 -0.63 L 0.71 0.63 L 0.43 0.35 L 0.43 -0.35 M 0.32 0.32 L 0.32 -0.32 L -0.32 -0.32 L -0.32 0.32 L 0.32 0.32",
    BODY: {
        DAMAGE: 10,
        DENSITY: 40,
        RESIST: 1.25,
        HEALTH: 200,
        PENETRATION: 50,
        ACCELERATION: 0.003
    },
    DRAW_HEALTH: true,
    GIVE_KILL_MESSAGE: true
};

// LABY
let polyNames = [ "egg", "square", "triangle", "pentagon", "hexagon" ],
    shinyNames = [ "", "shiny", "legendary", "shadow", "rainbow", "trans" ];
for (let tier = 0; tier < 6; tier++) {
    for (let poly in polyNames) {

        let polyName = polyNames[poly];
        polyName = polyName[0].toUpperCase() + polyName.slice(1);

        for (let shiny in shinyNames) {

            let shinyName = shinyNames[shiny];
            let food = shinyName + polyName;
            food = food[0].toLowerCase() + food.slice(1);

            Class[`laby${tier}${food}`] = // backwards compatability, DO NOT ADD A SEMICOLON HERE. javascript is funny about whitespace characters :))))))
            Class[`laby_${poly}_${tier}_${shiny}_0`] = makeLaby(Class[food], tier, (polyName == "Triangle" && tier > 0) ? 2/3 : 1);

            Class[`laby_${poly}_${tier}_${shiny}_1`] = makeCrasher(Class[`laby_${poly}_${tier}_${shiny}_0`]);
        }
    }
}
