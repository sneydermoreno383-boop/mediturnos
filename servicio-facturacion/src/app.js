require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// ─── OBSERVABILIDAD ───────────────────────────────────────────────────────────
const { client, metricsMiddleware } = require('./observability');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─── MIDDLEWARE DE MÉTRICAS (antes de las rutas) ──────────────────────────────
app.use(metricsMiddleware('servicio-facturacion'));
// ─────────────────────────────────────────────────────────────────────────────

const facturaRoutes = require('./routes/facturaRoutes');
app.use('/api/v1/facturas', facturaRoutes);

app.get('/health/live', (req, res) => res.status(200).json({ estado: 'activo', servicio: 'servicio-facturacion' }));

// ─── ENDPOINT DE MÉTRICAS (Prometheus lo consulta aquí) ──────────────────────
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});
// ─────────────────────────────────────────────────────────────────────────────


const PORT = process.env.PORT || 3005;

const conectarConReintentos = async (intentos = 5) => {
    for (let i = 1; i <= intentos; i++) {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la DB exitosa');
        await sequelize.sync({ alter: true });
        console.log('Base de datos sincronizada');
        app.listen(PORT, () => console.log(`Servicio de facturación corriendo en puerto ${PORT}`));
        return;
    } catch (error) {
        console.log(`Intento ${i} fallido. Reintentando en 5s...`);
        if (i === intentos) {
        console.error('No se pudo conectar a la base de datos:', error.message);
        process.exit(1);
        }
        await new Promise(r => setTimeout(r, 5000));
    }
    }
};

conectarConReintentos();