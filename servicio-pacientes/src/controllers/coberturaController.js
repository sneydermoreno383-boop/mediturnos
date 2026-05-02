const Cobertura = require('../models/Cobertura');
const Autorizacion = require('../models/Autorizacion');
const Paciente = require('../models/Paciente');

const EPS_VALIDAS = [
    'Sura EPS', 'Sanitas EPS', 'Nueva EPS',
    'Compensar EPS', 'Famisanar EPS', 'Coosalud EPS', 'Medimas EPS'
];

const verificarVigencia = (cobertura) => {
    const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const fechaHoy = hoy.toISOString().split('T')[0];

    if (!cobertura.activa) return { vigente: false, motivo: 'Cobertura inactiva' };
    if (cobertura.fecha_inicio > fechaHoy) return { vigente: false, motivo: 'Cobertura aún no inicia' };
    if (cobertura.fecha_fin && cobertura.fecha_fin < fechaHoy) {
        return { vigente: false, motivo: 'Cobertura vencida' };
    }
    return { vigente: true, motivo: 'Cobertura vigente' };
};

// Agregar cobertura a un paciente
const agregarCobertura = async (req, res) => {
    try {
        const { id_paciente } = req.params;
        const { eps, numero_afiliado, tipo_afiliacion, fecha_inicio, fecha_fin, saldo_disponible, copago_porcentaje } = req.body;

        const paciente = await Paciente.findByPk(id_paciente);
        if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

        if (!EPS_VALIDAS.includes(eps)) {
            return res.status(400).json({
                mensaje: `EPS no reconocida. EPS válidas: ${EPS_VALIDAS.join(', ')}`
            });
        }

        if (!eps || !numero_afiliado || !tipo_afiliacion || !fecha_inicio) {
            return res.status(400).json({ mensaje: 'Campos obligatorios: eps, numero_afiliado, tipo_afiliacion, fecha_inicio' });
        }

        const cobertura = await Cobertura.create({
            id_paciente,
            eps,
            numero_afiliado,
            tipo_afiliacion,
            fecha_inicio,
            fecha_fin: fecha_fin || null,
            saldo_disponible: saldo_disponible || 0,
            copago_porcentaje: copago_porcentaje || 0,
            activa: true
        });

        res.status(201).json({ mensaje: 'Cobertura agregada exitosamente', cobertura });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar cobertura', error: error.message });
    }
};

// Obtener coberturas de un paciente
const obtenerCoberturas = async (req, res) => {
    try {
        const { id_paciente } = req.params;

        const paciente = await Paciente.findByPk(id_paciente);
        if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

        const coberturas = await Cobertura.findAll({ where: { id_paciente } });

        const coberturasConVigencia = coberturas.map(c => ({
            ...c.toJSON(),
            vigencia: verificarVigencia(c)
        }));

        res.status(200).json(coberturasConVigencia);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener coberturas', error: error.message });
    }
};

// Verificar vigencia de una cobertura específica
const verificarCobertura = async (req, res) => {
    try {
        const cobertura = await Cobertura.findByPk(req.params.id_cobertura);
        if (!cobertura) return res.status(404).json({ mensaje: 'Cobertura no encontrada' });

        const vigencia = verificarVigencia(cobertura);

        if (!vigencia.vigente) {
            await cobertura.update({ activa: false });
        }

        res.status(200).json({
            cobertura,
            vigencia
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al verificar cobertura', error: error.message });
    }
};

// Actualizar saldo de cobertura
const actualizarSaldo = async (req, res) => {
    try {
        const { id_cobertura } = req.params;
        const { saldo_disponible } = req.body;

        if (saldo_disponible === undefined || saldo_disponible < 0) {
            return res.status(400).json({ mensaje: 'El saldo debe ser un número positivo' });
        }

        const cobertura = await Cobertura.findByPk(id_cobertura);
        if (!cobertura) return res.status(404).json({ mensaje: 'Cobertura no encontrada' });

        await cobertura.update({ saldo_disponible });
        res.status(200).json({ mensaje: 'Saldo actualizado exitosamente', cobertura });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar saldo', error: error.message });
    }
};

// Solicitar autorización
const solicitarAutorizacion = async (req, res) => {
    try {
        const { id_paciente } = req.params;
        const { id_cobertura, tipo_estudio, fecha_vencimiento, monto_autorizado, observaciones } = req.body;

        const paciente = await Paciente.findByPk(id_paciente);
        if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

        const cobertura = await Cobertura.findByPk(id_cobertura);
        if (!cobertura) return res.status(404).json({ mensaje: 'Cobertura no encontrada' });

        const vigencia = verificarVigencia(cobertura);
        if (!vigencia.vigente) {
            return res.status(400).json({ mensaje: `No se puede autorizar: ${vigencia.motivo}` });
        }

        const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const codigo_autorizacion = `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const autorizacion = await Autorizacion.create({
            id_paciente,
            id_cobertura,
            tipo_estudio,
            codigo_autorizacion,
            estado: 'Aprobada',
            fecha_solicitud: hoy.toISOString().split('T')[0],
            fecha_vencimiento: fecha_vencimiento || null,
            monto_autorizado: monto_autorizado || null,
            observaciones: observaciones || null
        });

        res.status(201).json({ mensaje: 'Autorización aprobada', autorizacion });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al solicitar autorización', error: error.message });
    }
};

// Obtener historial de autorizaciones de un paciente
const obtenerAutorizaciones = async (req, res) => {
    try {
        const { id_paciente } = req.params;

        const paciente = await Paciente.findByPk(id_paciente);
        if (!paciente) return res.status(404).json({ mensaje: 'Paciente no encontrado' });

        const autorizaciones = await Autorizacion.findAll({
            where: { id_paciente },
            order: [['createdAt', 'DESC']]
        });

        const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }))
            .toISOString().split('T')[0];

        const actualizadas = await Promise.all(autorizaciones.map(async (a) => {
            if (a.estado === 'Aprobada' && a.fecha_vencimiento && a.fecha_vencimiento < hoy) {
                await a.update({ estado: 'Vencida' });
            }
            return a;
        }));

        res.status(200).json(actualizadas);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener autorizaciones', error: error.message });
    }
};

module.exports = {
    agregarCobertura,
    obtenerCoberturas,
    verificarCobertura,
    actualizarSaldo,
    solicitarAutorizacion,
    obtenerAutorizaciones
};