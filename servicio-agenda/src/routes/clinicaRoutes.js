const express = require('express');
const router = express.Router();
const { Clinica } = require('../models/Recursos');

router.get('/', async (req, res) => {
    try {
        const clinicas = await Clinica.findAll({ where: { disponible: true } });
        res.status(200).json(clinicas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener clínicas', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const clinica = await Clinica.findByPk(req.params.id);
        if (!clinica) return res.status(404).json({ mensaje: 'Clínica no encontrada' });
        res.status(200).json(clinica);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la clínica', error: error.message });
    }
});

module.exports = router;