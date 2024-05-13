let fs = require('fs'),
    path = require('path'),
    serverNames = require('./serverData.json'),
    publicRoot = path.join(__dirname, "../public"),
    sharedRoot = path.join(__dirname, "../shared"),
    mimeSet = {
        "js": "application/javascript",
        "json": "application/json",
        "css": "text/css",
        "html": "text/html",
        "md": "text/markdown",
        "png": "image/png",
        "ico": "image/x-icon"
    },
    server,
    port = 3000,
    host = "localhost",
    // If someone tries to get a file that does not exist, send them this instead.
    DEFAULT_FILE = "index.html",
    update_servers = async () => {
        const servers = [];
        for (let i = 0; i < serverNames.length; i++) {
            let protocol = serverNames[i].protocol,
                serverName = protocol + "://" + serverNames[i].ip;
            try {
                if (typeof serverName != "string") throw 0;
        
                let now = Date.now();
                await fetch(`${serverName}/serverData.json`).then(x => x.json()).then(fetchedServer => {
                    servers.push({ server: fetchedServer, ping: Date.now() - now, https: protocol });
                }).catch(() => {
                    console.log(`${serverName} doesn't respond`);
                });
            } catch (e) {
                switch (e) {
                    case 0:
                        console.log(`${serverName} is not a string`);
                        break;
                    default:
                        console.log(`Failed to fetch ${serverName}/serverData.json`);
                }
            }
        };
        return servers;
    },
    modify_file = (file, root) => {
        if (!fs.existsSync(file)) {
            file = path.join(root, DEFAULT_FILE);
        } else if (!fs.lstatSync(file).isFile()) {
            file = path.join(root, DEFAULT_FILE);
        }
        return file;
    };

server = require('http').createServer(async (req, res) => {
    let shared = req.url.startsWith('/shared/'),
        root = shared ? sharedRoot : publicRoot,
        fileToGet = path.join(root, req.url.slice(shared ? 7 : 0)),
        resStr = "";

    switch (req.url) {
        case '/servers.json':
            resStr = JSON.stringify(await update_servers());
            break;
        default:
            //if this file does not exist, return the default;
            fileToGet = modify_file(fileToGet, root);

            //return the file
            res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
            return fs.createReadStream(fileToGet).pipe(res);
    }

    res.writeHead(200);
    res.end(resStr);
});

server.listen(port, host, () => console.log("Client server listening on port", port));

module.exports = { server };