const express = require('express');
const router = express.Router();
const {
  crearTurno,
  obtenerTurnos,
  obtenerTurno,
  cancelarTurno,
  consultarDisponibilidad,
  obtenerTurnosPorPaciente,
  obtenerTurnosPorProfesional
} = require('../controllers/turnoController');

router.get('/disponibilidad',                consultarDisponibilidad);
router.get('/paciente/:id_paciente',         obtenerTurnosPorPaciente);
router.get('/profesional/:id_profesional',   obtenerTurnosPorProfesional);
router.post('/',                             crearTurno);
router.get('/',                              obtenerTurnos);
router.get('/:id',                           obtenerTurno);
router.delete('/:id',                        cancelarTurno);

module.exports = router;