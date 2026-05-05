const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url);

  // Si es la raíz, sirve index.html
    if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'index.html');
    }

  // Si es una ruta sin extensión, intenta con .html
    if (!path.extname(filePath)) {
    filePath += '.html';
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Archivo no encontrado: ' + filePath);
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Frontend corriendo en puerto ${PORT}`);
    });