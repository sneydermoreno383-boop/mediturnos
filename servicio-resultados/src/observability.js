const client = require('prom-client');

// Limpia el registro para evitar errores si el módulo se carga dos veces
client.register.clear();

// Métricas automáticas de Node.js: RAM, CPU, event loop, etc.
client.collectDefaultMetrics({ prefix: 'node_' });

// Contador de peticiones HTTP
const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total de peticiones HTTP recibidas',
    labelNames: ['method', 'route', 'status_code', 'servicio'],
});

// Duración de cada petición
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de peticiones HTTP en segundos',
    labelNames: ['method', 'route', 'status_code', 'servicio'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

// Middleware: se ejecuta en cada request automáticamente
function metricsMiddleware(nombreServicio) {
    return (req, res, next) => {
    // Ignorar la ruta /metrics para no contarse a sí misma
    if (req.path === '/metrics') return next();

    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
        servicio: nombreServicio,
        };
        httpRequestCounter.inc(labels);
        end(labels);
    });
    next();
    };
}

module.exports = { client, metricsMiddleware };