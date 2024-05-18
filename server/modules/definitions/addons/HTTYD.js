const { combineStats, weaponArray, menu } = require('../facilitators.js');
const { smshskl, base } = require('../constants.js');
const g = require('../gunvals.js');

// Comment out the line below to enable this addon, uncomment it to disable this addon.
// return console.log('--- How to Train Your Dragon addon [HTTYD.js] is disabled. See lines 5-6 to enable it. ---');

const HTTYD_names = ["nightFury"];
const HTTYD_firework = {
    PARENT: "genericEntity",
    COLOR: "#112557",
    ALPHA: 0.4,
    BODY: {
        HEALTH: 1e6,
        DAMAGE: 0,
    },
    GUNS: weaponArray([{
        POSITION: [1, 18, 1, 0, 0, 0, 0],
        PROPERTIES: {
            SHOOT_SETTINGS: combineStats([g.basic, g.power, {
                speed: 1.4,
                maxSpeed: 1.4,
                health: 1e6,
            }]),
            TYPE: "bullet",
            AUTOFIRE: true,
        },
    }, {
        POSITION: [1, 18, 1, 0, 0, 0, 3],
        PROPERTIES: {
            SHOOT_SETTINGS: combineStats([g.basic, g.weak, {
                speed: 2,
                maxSpeed: 2,
                health: 1e6,
            }]),
            TYPE: "bullet",
            AUTOFIRE: true,
        },
    }], 18),
};
const HTTYD_blast = {
    PARENT: "bullet",
    COLOR: "purple",
    GUNS: [
        {
            POSITION: [1, 18, 1, 0, 0, 180, 4],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, {
                    reload: 0.2,
                    spray: 0.5,
                }]),
                TYPE: ["bullet", { COLOR: "purple" }],
                AUTOFIRE: true,
            },
        },
    ],
    ON: [{
        event: "death",
        handler: ({ body }) => {
            let e = new Entity(body);
            e.define(HTTYD_firework);
            e.team = body.team;
            e.SIZE = body.size;
            setSyncedTimeout(() => e.kill(), 12);
        },
    }],
};

Class[HTTYD_names[0]] = {
	UPGRADE_TOOLTIP: "A cutie.",
	BODY: {
        HEALTH: 4 * base.HEALTH,
        DAMAGE: 2 * base.DAMAGE,
        SPEED: 2.4 * base.SPEED,
        ACCEL: 0.01 * base.ACCEL,
    },
    SHAPE: "nightFury.png",
    COLOR: "black",
    GUNS: [
        {
            POSITION: [1, 3, 1, 0, 0, 0, 0],
            PROPERTIES: {
                SHOOT_SETTINGS: combineStats([g.basic, g.sniper, {
                    reload: 4,
                    range: 0.2,
                    speed: 3,
                    maxSpeed: 3,
                    health: 0.2,
                    damage: 0.4,
                }]),
                TYPE: HTTYD_blast,
            },
        },
    ],
}

for (let i = 0; i < HTTYD_names.length; i++) {
    let name = HTTYD_names[i],
        e = Class[name];
    e.PARENT = "genericTank";
    e.LABEL = name;
    e.LEVEL_CAP = 120;
    e.LEVEL = 120;
    e.SIZE = 20;
    e.SKILL_CAP = Array(10).fill(smshskl),
    e.UPGRADE_TOOLTIP += " Art by felyn_de_fens";
    e.LEVEL_SKILL_POINT_FUNCTION = level => {
        if (level <= 120) return 1;
        return 0;
    };
}

Class.HTTYD = menu("HTTYD Dragons", "black", 0);
Class.HTTYD.UPGRADES_TIER_0 = HTTYD_names;
Class.addons.UPGRADES_TIER_0.push("HTTYD");

console.log('HTTYD addon has been registered.');
