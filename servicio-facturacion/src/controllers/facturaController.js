const Factura = require('../models/Factura');
const facturaService = require('../services/facturaService');

const obtenerFacturas = async (req, res) => {
    try {
        const facturas = await Factura.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json(facturas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener facturas', error: error.message });
    }
};

const generarFacturaMasiva = async (req, res) => {
    try {
        const resultados = await facturaService.automatizarFacturacionMensual();
        res.status(201).json({
            mensaje: `Proceso completado. Se generaron ${resultados.length} facturas.`,
            cantidad: resultados.length
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en la automatización', error: error.message });
    }
};

const rechazarFactura = async (req, res) => {
    try {
        const factura = await Factura.findByPk(req.params.id);
        if (!factura) return res.status(404).json({ mensaje: 'No encontrada' });
        factura.estado = 'Rechazada';
        await factura.save();
        res.json({ mensaje: 'Factura rechazada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error', error: error.message });
    }
};

const refacturar = async (req, res) => {
    try {
        const original = await Factura.findByPk(req.params.id);
        if (!original || original.estado !== 'Rechazada') {
            return res.status(400).json({ mensaje: 'Solo se refacturan las rechazadas' });
        }
        const nueva = await Factura.create({
            id_turno: original.id_turno,
            id_paciente: original.id_paciente,
            nombre_paciente: original.nombre_paciente,
            obra_social: original.obra_social,
            valor: original.valor,
            estado: 'Pendiente',
            id_factura_original: original.id_factura
        });
        res.status(201).json({ mensaje: 'Re-facturación exitosa', nueva });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al refacturar', error: error.message });
    }
};

module.exports = { obtenerFacturas, generarFacturaMasiva, rechazarFactura, refacturar };