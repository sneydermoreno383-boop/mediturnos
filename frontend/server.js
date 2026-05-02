const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url);

    if (req.url === '/') {
    filePath = path.join(__dirname, 'index.html');
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Archivo no encontrado');
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor frontend corriendo en puerto ${PORT}`);
});