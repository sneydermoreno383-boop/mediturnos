require('dotenv').config();
const Resultado = require('../models/Resultado');
const Imagen = require('../models/Imagen');
const axios = require('axios');
const { obtenerCache, guardarCache, eliminarCache } = require('../services/cacheService');

const GATEWAY_URL = process.env.GATEWAY_URL;

// Crear resultado con archivos adjuntos
const crearResultado = async (req, res) => {
  try {
    const { id_turno, id_paciente, nombre_paciente, especialidad, descripcion, fecha_resultado } = req.body;

    if (!id_turno || !id_paciente || !nombre_paciente || !especialidad || !descripcion || !fecha_resultado) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    // Verificar turno a través del gateway
    try {
      await axios.get(`${GATEWAY_URL}/api/v1/turnos/${id_turno}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ mensaje: 'El turno no existe en el sistema' });
      }
      return res.status(503).json({ mensaje: 'El servicio de agenda no está disponible' });
    }

    const resultado = await Resultado.create({
      id_turno, id_paciente, nombre_paciente,
      especialidad, descripcion, fecha_resultado,
      estado: 'Disponible'
    });

    // Si se subieron archivos, registrarlos
    if (req.files && req.files.length > 0) {
      const imagenes = req.files.map(file => ({
        id_resultado: resultado.id_resultado,
        nombre_archivo: file.originalname,
        tipo_archivo: determinarTipo(file.mimetype),
        ruta_archivo: file.path,
        tamanio_bytes: file.size
      }));
      await Imagen.bulkCreate(imagenes);
    }

    // Limpiar caché del paciente
    await eliminarCache(`resultados_paciente_${id_paciente}`);

    res.status(201).json({ mensaje: 'Resultado registrado exitosamente', resultado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el resultado', error: error.message });
  }
};

// Determinar tipo de archivo
const determinarTipo = (mimetype) => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.startsWith('image/')) return 'IMAGEN';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype === 'application/dicom') return 'DICOM';
  return 'PDF';
};

// Obtener todos los resultados
const obtenerResultados = async (req, res) => {
  try {
    const resultados = await Resultado.findAll();
    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los resultados', error: error.message });
  }
};

// Obtener resultado por ID con caché
const obtenerResultado = async (req, res) => {
  try {
    const clave = `resultado_${req.params.id}`;

    // Buscar en caché primero
    const enCache = await obtenerCache(clave);
    if (enCache) {
      return res.status(200).json({ ...enCache, fuente: 'cache' });
    }

    const resultado = await Resultado.findByPk(req.params.id, {
      include: [{ model: Imagen, as: 'imagenes' }]
    });
    if (!resultado) return res.status(404).json({ mensaje: 'Resultado no encontrado' });

    // Guardar en caché por 5 minutos
    await guardarCache(clave, resultado.toJSON(), 300);

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el resultado', error: error.message });
  }
};

// Obtener resultados por paciente con caché
const obtenerResultadosPorPaciente = async (req, res) => {
  try {
    const clave = `resultados_paciente_${req.params.id_paciente}`;

    // Buscar en caché primero
    const enCache = await obtenerCache(clave);
    if (enCache) {
      return res.status(200).json({ resultados: enCache, fuente: 'cache' });
    }

    const resultados = await Resultado.findAll({
      where: { id_paciente: req.params.id_paciente },
      include: [{ model: Imagen, as: 'imagenes' }]
    });

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron resultados para este paciente' });
    }

    // Guardar en caché por 5 minutos
    await guardarCache(clave, resultados.map(r => r.toJSON()), 300);

    res.status(200).json(resultados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los resultados', error: error.message });
  }
};

module.exports = { crearResultado, obtenerResultados, obtenerResultado, obtenerResultadosPorPaciente };