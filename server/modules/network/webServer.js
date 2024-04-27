let server,
    wsServer = new (require('ws').WebSocketServer)({ noServer: true });

if (c.host === 'localhost') {
    util.warn(`config.host is just "localhost", are you sure you don't mean "localhost:${c.port}"?`);
}
if (c.host.match(/localhost:(\d)/) && c.host !== 'localhost:' + c.port) {
    util.warn('config.host is a localhost domain but its port is different to config.port!');
}

server = require('http').createServer((req, res) => {
    let resStr = "";
    switch (req.url) {
        case "/lib/json/mockups.json":
            resStr = mockupJsonData;
            break;
        case "/serverData.json":
            resStr = JSON.stringify({
                ip: c.host,
                gameMode: c.gameModeName,
                players: views.length,
            });
            break;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    res.writeHead(200);
    res.end(resStr);
});

server.on('upgrade', (req, socket, head) => wsServer.handleUpgrade(req, socket, head, ws => sockets.connect(ws, req)));
server.listen(c.port, () => console.log("Server listening on port", c.port));

module.exports = { server };