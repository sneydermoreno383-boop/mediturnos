require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const app = express();
app.use(cors());
app.use(express.json());

const facturaRoutes = require('./routes/facturaRoutes');
app.use('/api/v1/facturas', facturaRoutes);

app.get('/health/live', (req, res) => res.status(200).json({ estado: 'activo', servicio: 'servicio-facturacion' }));

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