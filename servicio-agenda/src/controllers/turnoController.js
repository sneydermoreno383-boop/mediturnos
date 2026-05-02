require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Turno = require('../models/Turno');
const { Clinica, Profesional, Consultorio, Equipo, Insumo } = require('../models/Recursos');
const { verificarPaciente } = require('../services/pacientesService');
const {
    getDuracion,
    getPreparacion,
    getInsumoEspecial,
    verificarCobertura
} = require('../utils/reglasNegocio');

const generarHorariosDia = () => {
    const horarios = [];
    for (let h = 8; h < 18; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00:00`);
    horarios.push(`${String(h).padStart(2, '0')}:30:00`);
    }
    return horarios;
};

const sumarMinutos = (horaStr, minutos) => {
    const [h, m] = horaStr.split(':').map(Number);
    const total = h * 60 + m + minutos;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const CONSULTORIO_POR_ESTUDIO = {
    radiografia:        'radiologia',
    ecografia:          'ecografia',
    tomografia:         'tomografia',
    resonancia:         'resonancia',
    mamografia:         'mamografia',
    laboratorio:        'laboratorio',
    electrocardiograma: 'general',
    densitometria:      'general'
};

const EQUIPO_POR_ESTUDIO = {
    radiografia:        'radiologia',
    ecografia:          'ecografia',
    tomografia:         'tomografia',
    resonancia:         'resonancia',
    mamografia:         'mamografia',
    densitometria:      'densitometria',
    electrocardiograma: 'electrocardiograma',
    laboratorio:        null
};

const completarTurnosPasados = async () => {
    try {
        const ahoraColombia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const fechaHoy      = ahoraColombia.toISOString().split('T')[0];
        const horaAhora     = `${String(ahoraColombia.getHours()).padStart(2,'0')}:${String(ahoraColombia.getMinutes()).padStart(2,'0')}:00`;

        await Turno.update(
            { estado: 'Completado' },
            {
                where: {
                    estado: ['Pendiente', 'Confirmado'],
                    [Op.or]: [
                        { fecha: { [Op.lt]: fechaHoy } },
                        {
                            fecha: fechaHoy,
                            hora:  { [Op.lt]: horaAhora }
                        }
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Error al completar turnos pasados:', error.message);
    }
};

const consultarDisponibilidad = async (req, res) => {
    const { fecha, tipo_estudio, especialidad, id_clinica } = req.query;

    if (!fecha || !tipo_estudio || !id_clinica) {
        return res.status(400).json({ mensaje: 'Se requieren: fecha, tipo_estudio e id_clinica' });
    }

    try {
        const clinica = await Clinica.findByPk(id_clinica);
        if (!clinica) return res.status(404).json({ mensaje: 'Clínica no encontrada' });

        const duracion    = getDuracion(tipo_estudio);
        const preparacion = getPreparacion(tipo_estudio);
        const insumo      = getInsumoEspecial(tipo_estudio);

        const ahoraColombia = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const fechaHoy      = ahoraColombia.toISOString().split('T')[0];
        const horaAhora     = `${String(ahoraColombia.getHours()).padStart(2,'0')}:${String(ahoraColombia.getMinutes()).padStart(2,'0')}:00`;
        const esFechaHoy    = fecha === fechaHoy;

        const horariosDia   = generarHorariosDia().filter(h => !esFechaHoy || h >= horaAhora);

        const whereProfesional = { disponible: true, id_clinica };
        if (especialidad) whereProfesional.especialidad = especialidad;

        const profesionales = await Profesional.findAll({ where: whereProfesional });

        const profesionalesConHorarios = await Promise.all(profesionales.map(async (prof) => {
            const turnosOcupados = await Turno.findAll({
                where: { id_profesional: prof.id_profesional, fecha, estado: ['Pendiente', 'Confirmado'] },
                attributes: ['hora']
            });
            const horasOcupadas = turnosOcupados.map(t => t.hora);

            return {
                id_profesional: prof.id_profesional,
                nombre:         `${prof.nombre} ${prof.apellido}`,
                especialidad:   prof.especialidad,
                horarios: horariosDia.map(h => ({
                    hora_inicio: h.slice(0, 5),
                    hora_fin:    sumarMinutos(h, duracion),
                    disponible:  !horasOcupadas.includes(h)
                }))
            };
        }));

        const tipoConsultorio = CONSULTORIO_POR_ESTUDIO[tipo_estudio.toLowerCase()] || 'general';
        const todosConsultorios = await Consultorio.findAll({
            where: { disponible: true, tipo: tipoConsultorio, id_clinica }
        });

        const turnosPorHoraConsultorio = await Turno.findAll({
            where: { fecha, estado: ['Pendiente', 'Confirmado'] },
            attributes: ['hora', 'id_consultorio']
        });

        const consultoriosConHorarios = todosConsultorios.map(c => {
            const horasOcupadas = turnosPorHoraConsultorio
                .filter(t => t.id_consultorio === c.id_consultorio)
                .map(t => t.hora);

            return {
                id_consultorio: c.id_consultorio,
                nombre:         c.nombre,
                tipo:           c.tipo,
                horarios: horariosDia.map(h => ({
                    hora_inicio: h.slice(0, 5),
                    hora_fin:    sumarMinutos(h, duracion),
                    disponible:  !horasOcupadas.includes(h)
                }))
            };
        });

        const tipoEquipo = EQUIPO_POR_ESTUDIO[tipo_estudio.toLowerCase()];
        let equiposConHorarios = [];

        if (tipoEquipo) {
            const todosEquipos = await Equipo.findAll({
                where: { disponible: true, tipo: tipoEquipo, id_clinica }
            });

            const turnosPorHoraEquipo = await Turno.findAll({
                where: { fecha, estado: ['Pendiente', 'Confirmado'], id_equipo: { [Op.not]: null } },
                attributes: ['hora', 'id_equipo']
            });

            equiposConHorarios = todosEquipos.map(e => {
                const horasOcupadas = turnosPorHoraEquipo
                    .filter(t => t.id_equipo === e.id_equipo)
                    .map(t => t.hora);

                return {
                    id_equipo:  e.id_equipo,
                    nombre:     e.nombre,
                    tipo:       e.tipo,
                    horarios: horariosDia.map(h => ({
                        hora_inicio: h.slice(0, 5),
                        hora_fin:    sumarMinutos(h, duracion),
                        disponible:  !horasOcupadas.includes(h)
                    }))
                };
            });
        }

        let stock_insumo = null;
        if (insumo) {
            const insumoReg = await Insumo.findOne({ where: { nombre: insumo } });
            stock_insumo = insumoReg ? insumoReg.stock : 0;
        }

        res.status(200).json({
            fecha,
            tipo_estudio,
            clinica:                    { id: clinica.id_clinica, nombre: clinica.nombre, ciudad: clinica.ciudad, departamento: clinica.departamento },
            especialidad:               especialidad || 'Todas',
            duracion_minutos:           duracion,
            tiempo_preparacion_minutos: preparacion,
            insumo_especial_requerido:  insumo,
            stock_insumo,
            tipo_consultorio_requerido: tipoConsultorio,
            tipo_equipo_requerido:      tipoEquipo,
            profesionales:              profesionalesConHorarios,
            consultorios:               consultoriosConHorarios,
            equipos:                    equiposConHorarios
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar disponibilidad', error: error.message });
    }
};

const crearTurno = async (req, res) => {
    const { id_paciente, tipo_estudio, especialidad, fecha, hora, id_profesional, id_consultorio, id_equipo, obra_social } = req.body;

    if (!id_paciente || !tipo_estudio || !especialidad || !fecha || !hora || !id_profesional || !id_consultorio) {
    return res.status(400).json({
        mensaje: 'Campos obligatorios: id_paciente, tipo_estudio, especialidad, fecha, hora, id_profesional, id_consultorio'
    });
    }

    const ahoraColombia  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const fechaHoy       = ahoraColombia.toISOString().split('T')[0];
    const horaAhora      = `${String(ahoraColombia.getHours()).padStart(2,'0')}:${String(ahoraColombia.getMinutes()).padStart(2,'0')}:00`;

    if (fecha < fechaHoy) {
    return res.status(400).json({ mensaje: 'No se pueden agendar turnos en fechas pasadas' });
    }
    if (fecha === fechaHoy && hora <= horaAhora) {
    return res.status(400).json({ mensaje: 'No se pueden agendar turnos en horarios que ya pasaron' });
    }

    let duracion_minutos, tiempo_preparacion_minutos, insumo_especial;
    try {
    duracion_minutos           = getDuracion(tipo_estudio);
    tiempo_preparacion_minutos = getPreparacion(tipo_estudio);
    insumo_especial            = getInsumoEspecial(tipo_estudio);
    } catch (error) {
    return res.status(400).json({ mensaje: error.message });
    }

    if (!verificarCobertura(obra_social, tipo_estudio)) {
    return res.status(400).json({
        mensaje: `La obra social "${obra_social}" no cubre el estudio "${tipo_estudio}"`
    });
    }

    let paciente;
    try {
    paciente = await verificarPaciente(id_paciente);
    } catch (error) {
    if (error.response?.status === 404) return res.status(404).json({ mensaje: 'El paciente no existe en el sistema' });
    return res.status(503).json({ mensaje: 'El servicio de pacientes no está disponible' });
    }

    const transaction = await sequelize.transaction({
    isolationLevel: sequelize.constructor.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
    const conflictoProfesional = await Turno.findOne({
        where: { id_profesional, fecha, hora, estado: ['Pendiente', 'Confirmado'] },
        transaction, lock: transaction.LOCK.UPDATE
    });
    if (conflictoProfesional) {
        await transaction.rollback();
        return res.status(409).json({ mensaje: 'El profesional ya tiene un turno en ese horario' });
    }

    const conflitoConsultorio = await Turno.findOne({
        where: { id_consultorio, fecha, hora, estado: ['Pendiente', 'Confirmado'] },
        transaction, lock: transaction.LOCK.UPDATE
    });
    if (conflitoConsultorio) {
        await transaction.rollback();
        return res.status(409).json({ mensaje: 'El consultorio ya está ocupado en ese horario' });
    }

    if (id_equipo) {
        const conflitoEquipo = await Turno.findOne({
        where: { id_equipo, fecha, hora, estado: ['Pendiente', 'Confirmado'] },
        transaction, lock: transaction.LOCK.UPDATE
        });
        if (conflitoEquipo) {
        await transaction.rollback();
        return res.status(409).json({ mensaje: 'El equipo ya está en uso en ese horario' });
        }
    }

    if (insumo_especial) {
        const insumo = await Insumo.findOne({
        where: { nombre: insumo_especial },
        transaction, lock: transaction.LOCK.UPDATE
        });
        if (!insumo || insumo.stock <= 0) {
        await transaction.rollback();
        return res.status(409).json({ mensaje: `Sin stock disponible del insumo requerido: "${insumo_especial}"` });
        }
        await insumo.update({ stock: insumo.stock - 1 }, { transaction });
    }

    const turno = await Turno.create({
        id_paciente,
        nombre_paciente:            `${paciente.nombre} ${paciente.apellido}`,
        tipo_estudio,
        especialidad,
        fecha,
        hora,
        duracion_minutos,
        tiempo_preparacion_minutos,
        id_profesional,
        id_consultorio,
        id_equipo:                  id_equipo || null,
        obra_social:                obra_social || null,
        requiere_insumo_especial:   !!insumo_especial,
        insumo_especial,
        estado:                     'Pendiente',
        version:                    0
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ mensaje: 'Turno creado exitosamente', turno });

    } catch (error) {
    await transaction.rollback();
    if (error.name === 'SequelizeDatabaseError' && error.parent?.code === 'ER_LOCK_DEADLOCK') {
        return res.status(409).json({ mensaje: 'Conflicto de reserva simultánea. Intente nuevamente.' });
    }
    res.status(500).json({ mensaje: 'Error al crear el turno', error: error.message });
    }
};

const obtenerTurnos = async (req, res) => {
    try {
        await completarTurnosPasados();
        const turnos = await Turno.findAll();
        res.status(200).json(turnos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los turnos', error: error.message });
    }
};

const obtenerTurno = async (req, res) => {
    try {
    const turno = await Turno.findByPk(req.params.id);
    if (!turno) return res.status(404).json({ mensaje: 'Turno no encontrado' });
    res.status(200).json(turno);
    } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el turno', error: error.message });
    }
};

const cancelarTurno = async (req, res) => {
    const { version } = req.body;
    try {
    const turno = await Turno.findByPk(req.params.id);
    if (!turno) return res.status(404).json({ mensaje: 'Turno no encontrado' });

    if (version !== undefined && turno.version !== version) {
        return res.status(409).json({
        mensaje: 'El turno fue modificado por otra operación. Recargue y vuelva a intentar.',
        version_actual: turno.version
        });
    }

    await turno.update({ estado: 'Cancelado', version: turno.version + 1 });
    res.status(200).json({ mensaje: 'Turno cancelado exitosamente', turno });
    } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar el turno', error: error.message });
    }
};

const obtenerTurnosPorPaciente = async (req, res) => {
    try {
        await completarTurnosPasados();
        const turnos = await Turno.findAll({
            where: { id_paciente: req.params.id_paciente },
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });
        if (!turnos.length) {
            return res.status(404).json({ mensaje: 'No se encontraron turnos para este paciente' });
        }
        res.status(200).json(turnos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los turnos', error: error.message });
    }
};

const obtenerTurnosPorProfesional = async (req, res) => {
    try {
        await completarTurnosPasados();
        const turnos = await Turno.findAll({
            where: { id_profesional: req.params.id_profesional },
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });
        if (!turnos.length) {
            return res.status(404).json({ mensaje: 'No se encontraron turnos para este profesional' });
        }
        res.status(200).json(turnos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los turnos', error: error.message });
    }
};

module.exports = { crearTurno, obtenerTurnos, obtenerTurno, cancelarTurno, consultarDisponibilidad, obtenerTurnosPorPaciente, obtenerTurnosPorProfesional };