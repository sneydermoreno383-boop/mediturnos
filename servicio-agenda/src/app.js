require('dotenv').config();
const cors = require('cors');
const express = require('express');
const sequelize = require('./config/database');
const turnoRoutes = require('./routes/turnoRoutes');

require('./models/Turno');
require('./models/Recursos');
const clinicaRoutes = require('./routes/clinicaRoutes');

// ─── OBSERVABILIDAD ───────────────────────────────────────────────────────────
const { client, metricsMiddleware } = require('./observability');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─── MIDDLEWARE DE MÉTRICAS (antes de las rutas) ──────────────────────────────
app.use(metricsMiddleware('servicio-agenda'));
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/v1/turnos', turnoRoutes);
app.use('/api/v1/clinicas', clinicaRoutes);
const profesionalRoutes = require('./routes/profesionalRoutes');
app.use('/api/v1/profesionales', profesionalRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health/live', (req, res) => {
  res.status(200).json({ estado: 'activo', servicio: 'servicio-agenda' });
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── ENDPOINT DE MÉTRICAS (Prometheus lo consulta aquí) ──────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3002;

const conectarConReintentos = async (intentos = 5) => {
  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos exitosa');
      await sequelize.sync({ alter: true });
      console.log('Base de datos sincronizada');
      app.listen(PORT, () => {
        console.log(`Servicio de agenda corriendo en el puerto ${PORT}`);
      });
      return;
    } catch (error) {
      console.log(`Intento ${i} fallido. Reintentando en 5 segundos...`);
      if (i === intentos) {
        console.error('No se pudo conectar a la base de datos:', error.message);
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

conectarConReintentos();