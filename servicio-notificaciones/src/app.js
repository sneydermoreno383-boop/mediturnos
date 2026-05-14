require('dotenv').config();
const cors = require('cors');
const express = require('express');
const sequelize = require('./config/database');
const notificacionRoutes = require('./routes/notificacionRoutes');
const { crearPlantillasIniciales } = require('./services/plantillaService');
const { iniciarWorker } = require('./workers/recordatorioWorker');


// ─── OBSERVABILIDAD ───────────────────────────────────────────────────────────
const { client, metricsMiddleware } = require('./observability');
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─── MIDDLEWARE DE MÉTRICAS (antes de las rutas) ──────────────────────────────
app.use(metricsMiddleware('servicio-notificaciones'));
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/v1/notificaciones', notificacionRoutes);

app.get('/health/live', (req, res) => {
  res.status(200).json({ estado: 'activo', servicio: 'servicio-notificaciones' });
});

// ─── ENDPOINT DE MÉTRICAS (Prometheus lo consulta aquí) ──────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3004;

const conectarConReintentos = async (intentos = 5) => {
  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.authenticate();
      console.log('Conexion a la base de datos exitosa');
      await sequelize.sync({ alter: true });
      console.log('Base de datos sincronizada');

      // Crear plantillas iniciales
      await crearPlantillasIniciales();

      // Iniciar worker de recordatorios
      iniciarWorker();

      app.listen(PORT, () => {
        console.log(`Servicio de notificaciones corriendo en el puerto ${PORT}`);
      });
      return;
    } catch (error) {
      console.log(`Intento ${i} fallido. Reintentando en 5 segundos...`);
      if (i === intentos) {
        console.error('No se pudo conectar:', error.message);
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

conectarConReintentos();