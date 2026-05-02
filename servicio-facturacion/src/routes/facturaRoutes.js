const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
    generarFacturaMasiva,
    obtenerFacturas,
    rechazarFactura,
    refacturar
} = require('../controllers/facturaController');

const RUTA_FACTURAS = path.join(__dirname, '../../facturas');

// Generar facturas masivas
router.post('/generar', generarFacturaMasiva);

// Obtener listado
router.get('/', obtenerFacturas);

// Descargar archivo de factura
router.get('/:id/descargar', async (req, res) => {
    try {
        const Factura = require('../models/Factura');
        const factura = await Factura.findByPk(req.params.id);
        if (!factura || !factura.archivo_factura) {
            return res.status(404).json({ mensaje: 'Archivo no encontrado' });
        }

        const rutaArchivo = path.join(RUTA_FACTURAS, factura.archivo_factura);
        if (!fs.existsSync(rutaArchivo)) {
            return res.status(404).json({ mensaje: 'El archivo no existe en el servidor' });
        }

        const extension = path.extname(factura.archivo_factura).toLowerCase();

        if (extension === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${factura.archivo_factura}"`);
        } else if (extension === '.html') {
            // Servir como HTML para que el usuario pueda imprimir como PDF desde el navegador
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="${factura.archivo_factura}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${factura.archivo_factura}"`);
        }

        res.sendFile(rutaArchivo);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al descargar', error: error.message });
    }
});

// Rechazar y refacturar
router.patch('/:id/rechazar', rechazarFactura);
router.post('/:id/refacturar', refacturar);

module.exports = router;