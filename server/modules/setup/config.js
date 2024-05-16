let output = require("../../config.js");

for (let gamemode of output.GAME_MODES) {
    let mode = require(`./gamemodeconfigs/${gamemode}.js`);
    for (let key in mode) {
        if (key === "ROOM_SETUP") {
            output[key].push(...mode[key]);
        } else {
            output[key] = mode[key];
        }
    }
}

module.exports = output;
