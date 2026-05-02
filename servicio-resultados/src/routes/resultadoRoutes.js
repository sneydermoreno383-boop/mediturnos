const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
  crearResultado,
  obtenerResultados,
  obtenerResultado,
  obtenerResultadosPorPaciente
} = require('../controllers/resultadoController');

router.post('/', upload.array('archivos', 10), crearResultado);
router.get('/', obtenerResultados);
router.get('/paciente/:id_paciente', obtenerResultadosPorPaciente);
router.get('/:id', obtenerResultado);

module.exports = router;