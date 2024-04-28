let fs = require('fs'),
    path = require('path'),
    servers = require('./servers.json'),
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
    modify_file = (file, root) => {
        if (!fs.existsSync(file)) {
            file = path.join(root, DEFAULT_FILE);
        } else if (!fs.lstatSync(file).isFile()) {
            file = path.join(root, DEFAULT_FILE);
        }
        return file;
    };

server = require('http').createServer((req, res) => {
    let shared = req.url.startsWith('/shared/'),
        root = shared ? sharedRoot : publicRoot,
        fileToGet = path.join(root, req.url.slice(shared ? 7 : 0));

    if (req.url == './servers.json') {
        res.writeHead(200);
        res.end(servers);
    } else {
        //if this file does not exist, return the default;
        fileToGet = modify_file(fileToGet, root);

        //return the file
        res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
        return fs.createReadStream(fileToGet).pipe(res);
    }
});

server.listen(port, host, () => console.log("Client server listening on port", port));

module.exports = { server };