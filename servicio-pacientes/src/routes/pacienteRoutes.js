const express = require('express');
const router = express.Router();
const { 
  crearPaciente, 
  obtenerPaciente, 
  obtenerPacientes,
  buscarPorDocumento
} = require('../controllers/pacienteController');

router.post('/', crearPaciente);
router.get('/', obtenerPacientes);
router.get('/documento/:documento', buscarPorDocumento);
router.get('/:id', obtenerPaciente);

module.exports = router;