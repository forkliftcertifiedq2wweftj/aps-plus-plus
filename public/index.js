let fs = require('fs'),
    path = require('path'),
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
    DEFAULT_FILE = 'index.html';

server = require('http').createServer((req, res) => {
    if (req.url.startsWith('/shared/')) {
        let fileToGet = path.join(sharedRoot, req.url.slice(7));

        //if this file does not exist, return the default;
        if (!fs.existsSync(fileToGet)) {
            fileToGet = path.join(sharedRoot, DEFAULT_FILE);
        } else if (!fs.lstatSync(fileToGet).isFile()) {
            fileToGet = path.join(sharedRoot, DEFAULT_FILE);
        }

        //return the file
        res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
        return fs.createReadStream(fileToGet).pipe(res);
    } else {
        let fileToGet = path.join(publicRoot, req.url);

        //if this file does not exist, return the default;
        if (!fs.existsSync(fileToGet)) {
            fileToGet = path.join(publicRoot, DEFAULT_FILE);
        } else if (!fs.lstatSync(fileToGet).isFile()) {
            fileToGet = path.join(publicRoot, DEFAULT_FILE);
        }

        //return the file
        res.writeHead(200, { 'Content-Type': mimeSet[ fileToGet.split('.').pop() ] || 'text/html' });
        return fs.createReadStream(fileToGet).pipe(res);
    }
});

server.listen(port, host, () => console.log("Client server listening on port", port));

module.exports = { server };