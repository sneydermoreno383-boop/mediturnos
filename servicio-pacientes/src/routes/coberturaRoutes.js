const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    agregarCobertura,
    obtenerCoberturas,
    verificarCobertura,
    actualizarSaldo,
    solicitarAutorizacion,
    obtenerAutorizaciones
} = require('../controllers/coberturaController');

router.post('/', agregarCobertura);
router.get('/', obtenerCoberturas);
router.get('/:id_cobertura/verificar', verificarCobertura);
router.put('/:id_cobertura/saldo', actualizarSaldo);
router.post('/autorizaciones', solicitarAutorizacion);
router.get('/autorizaciones', obtenerAutorizaciones);

module.exports = router;