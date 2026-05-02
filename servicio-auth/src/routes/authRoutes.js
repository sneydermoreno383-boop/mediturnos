const express = require('express');
const router = express.Router();
const { registrar, login, verificar, crearAdmin, listarUsuarios, toggleUsuario, registrarMedico } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/verificarToken');
const { verificarRol } = require('../middlewares/verificarRol');

router.post('/registro',  registrar);
router.post('/login',     login);
router.get('/verificar',  verificarToken, verificar);
router.post('/crear-admin', crearAdmin);

// Solo admin
router.get('/usuarios',                    verificarToken, verificarRol('admin'), listarUsuarios);
router.put('/usuarios/:id/toggle',         verificarToken, verificarRol('admin'), toggleUsuario);

router.post('/registro-medico', 
    verificarToken, 
    verificarRol('admin'), 
    registrarMedico
);

module.exports = router;