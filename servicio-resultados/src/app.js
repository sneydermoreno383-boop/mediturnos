require('dotenv').config();
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const { Op } = require('sequelize');
const sequelize = require('./config/database');
const resultadoRoutes = require('./routes/resultadoRoutes');
const Resultado = require('./models/Resultado');
const Imagen = require('./models/Imagen');

// Asociaciones entre modelos
Resultado.hasMany(Imagen, { foreignKey: 'id_resultado', as: 'imagenes' });
Imagen.belongsTo(Resultado, { foreignKey: 'id_resultado', as: 'resultado' });

const app = express();
app.use(cors());
app.use(express.json());

// Crear carpeta de uploads si no existe
const uploadsDir = '/app/uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Servir archivos subidos
app.use('/uploads', express.static(uploadsDir));
app.use('/api/v1/resultados', resultadoRoutes);

app.get('/health/live', (req, res) => {
  res.status(200).json({ estado: 'activo', servicio: 'servicio-resultados' });
});

// ── Job de retención legal ────────────────────────────────────────────────────
// Según la normativa colombiana (Resolución 1995/1999), las historias clínicas
// deben conservarse mínimo 15 años. Este job elimina registros y archivos
// físicos que superen ese límite.

const ANOS_RETENCION = 15;

const ejecutarLimpiezaRetencion = async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - ANOS_RETENCION);

    console.log(`[Retención] Buscando resultados anteriores a ${fechaLimite.toISOString().split('T')[0]}...`);

    // Buscar resultados vencidos con sus imágenes
    const resultadosVencidos = await Resultado.findAll({
      where: {
        fecha_resultado: { [Op.lt]: fechaLimite }
      },
      include: [{ model: Imagen, as: 'imagenes' }]
    });

    if (!resultadosVencidos.length) {
      console.log('[Retención] No hay resultados vencidos.');
      return;
    }

    console.log(`[Retención] Encontrados ${resultadosVencidos.length} resultados vencidos. Eliminando...`);

    for (const resultado of resultadosVencidos) {
      // Eliminar archivos físicos del disco
      for (const imagen of resultado.imagenes) {
        try {
          if (fs.existsSync(imagen.ruta_archivo)) {
            fs.unlinkSync(imagen.ruta_archivo);
            console.log(`[Retención] Archivo eliminado: ${imagen.nombre_archivo}`);
          }
        } catch (err) {
          console.error(`[Retención] Error al eliminar archivo ${imagen.ruta_archivo}:`, err.message);
        }
      }

      // Eliminar imágenes de la BD
      await Imagen.destroy({ where: { id_resultado: resultado.id_resultado } });

      // Eliminar resultado de la BD
      await resultado.destroy();

      console.log(`[Retención] Resultado ${resultado.id_resultado} eliminado.`);
    }

    console.log(`[Retención] Limpieza completada. ${resultadosVencidos.length} resultados eliminados.`);

  } catch (error) {
    console.error('[Retención] Error durante la limpieza:', error.message);
  }
};

// Ejecutar el job una vez al día (cada 24 horas)
const iniciarJobRetencion = () => {
  console.log('[Retención] Job de retención legal iniciado — se ejecuta cada 24 horas.');

  // Ejecutar inmediatamente al iniciar para verificar
  ejecutarLimpiezaRetencion();

  // Luego cada 24 horas
  setInterval(ejecutarLimpiezaRetencion, 24 * 60 * 60 * 1000);
};

// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3003;

const conectarConReintentos = async (intentos = 5) => {
  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.authenticate();
      console.log('Conexion a la base de datos exitosa');
      await sequelize.sync({ alter: true });
      console.log('Base de datos sincronizada');

      // Iniciar job de retención solo después de conectar a la BD
      iniciarJobRetencion();

      app.listen(PORT, () => {
        console.log('Servicio de resultados corriendo en el puerto ' + PORT);
      });
      return;
    } catch (error) {
      console.log('Intento ' + i + ' fallido. Reintentando en 5 segundos...');
      if (i === intentos) {
        console.error('No se pudo conectar:', error.message);
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

conectarConReintentos();