const express = require('express');
const router = express.Router();
const {
  crearNotificacion,
  obtenerNotificaciones,
  obtenerPorPaciente,
  obtenerPlantillas,
  actualizarPlantilla
} = require('../controllers/notificacionController');

router.post('/', crearNotificacion);
router.get('/', obtenerNotificaciones);
router.get('/paciente/:id_paciente', obtenerPorPaciente);
router.get('/plantillas', obtenerPlantillas);
router.put('/plantillas/:id', actualizarPlantilla);

module.exports = router;