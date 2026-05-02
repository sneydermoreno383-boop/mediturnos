const express = require('express');
const router = express.Router();
const { Profesional } = require('../models/Recursos');

router.get('/', async (req, res) => {
    try {
        const profesionales = await Profesional.findAll({ where: { disponible: true } });
        res.status(200).json(profesionales);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener profesionales', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const profesional = await Profesional.findByPk(req.params.id);
        if (!profesional) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        res.status(200).json(profesional);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el profesional', error: error.message });
    }
});

// Crear nuevo profesional (lo llama el servicio-auth al registrar un médico)
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, especialidad, id_clinica, obras_sociales_aceptadas } = req.body;

        if (!nombre || !apellido || !especialidad || !id_clinica) {
            return res.status(400).json({ mensaje: 'nombre, apellido, especialidad e id_clinica son obligatorios' });
        }

        const profesional = await Profesional.create({
            nombre,
            apellido,
            especialidad,
            id_clinica,
            obras_sociales_aceptadas: obras_sociales_aceptadas || [],
            disponible: true
        });

        res.status(201).json(profesional);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el profesional', error: error.message });
    }
});

module.exports = router;