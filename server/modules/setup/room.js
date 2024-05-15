for (let filename of c.ROOM_SETUP) {
    let currentRoom = require(`./rooms/${filename}.js`);
    for (let y = 0; y < currentRoom.length; y++) {
        for (let x = 0; x < currentRoom[0].length; x++) {
            if (room.setup[y] == null) {
                room.setup[y] = currentRoom[y];
            } else if (currentRoom[y][x]) {
                room.setup[y][x] = currentRoom[y][x];
            }
        }
    }
}
room.xgrid = room.setup[0].length;
room.ygrid = room.setup.length;

Object.defineProperties(room, {
    tileWidth: { get: () => c.TILE_WIDTH, set: v => c.TILE_WIDTH = v },
    tileHeight: { get: () => c.TILE_HEIGHT, set: v => c.TILE_HEIGHT = v },
    width: { get: () => room.xgrid * c.TILE_WIDTH, set: v => c.TILE_WIDTH = v / room.xgrid },
    height: { get: () => room.ygrid * c.TILE_HEIGHT, set: v => c.TILE_HEIGHT = v / room.ygrid }
});

Object.defineProperties(room.center, {
    x: { get: () => room.xgrid * c.TILE_WIDTH / 2, set: v => c.TILE_WIDTH = v * 2 / room.xgrid },
    y: { get: () => room.ygrid * c.TILE_HEIGHT / 2, set: v => c.TILE_HEIGHT = v * 2 / room.ygrid }
});

room.isInRoom = location => {
    if (c.ARENA_TYPE === "circle") {
        return (location.x - room.center.x) ** 2 + (location.y - room.center.y) ** 2 < room.center.x ** 2;
    }
    return location.x >= 0 && location.x <= room.width && location.y >= 0 && location.y <= room.height;
};
room.getAt = location => {
    if (!room.isInRoom(location)) return undefined;
    let a = Math.floor(location.y / room.tileWidth);
    let b = Math.floor(location.x / room.tileHeight);
    return room.setup[a][b];
};
room.near = (position, radius) => {
    let point = ran.pointInUnitCircle();
    return {
        x: Math.round(position.x + radius * point.x),
        y: Math.round(position.y + radius * point.y)
    };
};
room.random = () => {
    return c.ARENA_TYPE === "circle" ? room.near(room.center, room.center.x) : {
        x: ran.irandom(room.width),
        y: ran.irandom(room.height)
    };
};

class TileEntity {
    constructor (tile, loc) {
        if (!(tile instanceof Tile)) {
            throw new Error(`The cell at ${loc.x},${loc.y} in the room setup is not a Tile object!` +
                ('string' == typeof tile ? ' But it is a string, which means you probably need to update your room setup!' : ' But it is of type ' + typeof tile)
            );
        }
        let gridLoc = this.gridLoc = { x: parseFloat(loc.x), y: parseFloat(loc.y) };
        // this.blueprint = tile.args;
        this.loc = {
            get x() { return room.tileWidth * (gridLoc.x + 0.5); },
            get y() { return room.tileHeight * (gridLoc.y + 0.5); }
        };
        this.color = new Color(tile.color ?? 8);
        this.init = tile.init;
        this.tick = tile.tick;
        this.entities = [];
        this.data = JSON.parse(JSON.stringify(tile.data));
    }

    randomInside() {
        return {
            x: room.tileWidth * (this.gridLoc.x + Math.random()),
            y: room.tileHeight * (this.gridLoc.y + Math.random())
        }
    }
}

function roomLoop() {
    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i],
            tile = room.getAt(entity);
        if (tile) tile.entities.push(entity);
    }

    for (let y = 0; y < room.setup.length; y++) {
        for (let x = 0; x < room.setup[y].length; x++) {
            let tile = room.setup[y][x];
            tile.tick(tile);
            tile.entities = [];
        }
    }

    if (room.sendColorsToClient) {
        room.sendColorsToClient = false;
        sockets.broadcastRoom();
    }
}

for (let y in room.setup) {
    for (let x in room.setup[y]) {
        let tile = room.setup[y][x] = new TileEntity(room.setup[y][x], { x, y });
        tile.init(tile);
    }
}

module.exports = { roomLoop };