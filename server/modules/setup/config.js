let output = require("../../config.js"),
    result = [];

if (output.RANDOM_MODE.length) {
    let tempArray = output.RANDOM_MODE.slice();

    for (let i = 0; i < ran.choose(tempArray); i++) {
        const randomIndex = ran.choose(tempArray);
        const randomElement = tempArray[randomIndex];
        result.push(randomElement);
        tempArray.splice(randomIndex, 1); // Remove the selected element to avoid duplicates
    }

    for (let gamemode of result) {
        let mode = require(`./gamemodeconfigs/${gamemode}.js`);
        for (let key in mode) {
            if (key === "ROOM_SETUP") {
                output[key].push(...mode[key]);
            } else {
                output[key] = mode[key];
            }
        }
    }
}

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

//everything past this handles the display name in the main menu
const nameMap = {
    tdm: `${output.TEAMS}TDM`,
    ffa: "FFA",
    tag: "TAG",
    opentdm: `Open ${output.TEAMS}TDM`,
    //clanwars: "Clan Wars",
    trainwars: "Train Wars"
};

module.exports.gameModeName = output.GAMEMODE_NAME_PREFIXES.join(' ')
    + ' ' + output.GAME_MODES.map(x => nameMap[x] || (x[0].toUpperCase() + x.slice(1))).join(' ')
    + ' ' + result.map(x => nameMap[x] || (x[0].toUpperCase() + x.slice(1))).join(' ');
