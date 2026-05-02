require('dotenv').config();
const Notificacion = require('../models/Notificacion');
const Plantilla = require('../models/Plantilla');
const { obtenerPlantilla, procesarPlantilla } = require('../services/plantillaService');
const { enviarEmail } = require('../services/emailService');
const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL;

// Crear y enviar notificación
const crearNotificacion = async (req, res) => {
  try {
    const { id_paciente, nombre_paciente, tipo, mensaje } = req.body;

    if (!id_paciente || !nombre_paciente || !tipo || !mensaje) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    const notificacion = await Notificacion.create({
      id_paciente,
      nombre_paciente,
      tipo,
      mensaje,
      canal: 'email',
      estado: 'Pendiente'
    });

    // Siempre intentar enviar email
    try {
      const resPaciente = await axios.get(`${GATEWAY_URL}/api/v1/pacientes/${id_paciente}`);
      const emailPaciente = resPaciente.data.email;

      if (emailPaciente) {
        const plantilla = await obtenerPlantilla(tipo);
        const contenidoFinal = procesarPlantilla(plantilla.contenido, {
          nombre_paciente,
          mensaje
        });

        const enviado = await enviarEmail({
          destinatario: emailPaciente,
          asunto: plantilla.asunto,
          contenido: contenidoFinal
        });

        await notificacion.update({
          estado: enviado ? 'Enviado' : 'Fallido',
          fecha_envio: new Date()
        });

        console.log(`Notificación ${tipo} enviada a ${emailPaciente}`);
      } else {
        // Paciente sin email registrado
        await notificacion.update({ estado: 'Enviado', fecha_envio: new Date() });
        console.log(`Paciente ${id_paciente} sin email — notificación guardada en sistema`);
      }
    } catch (err) {
      console.error('Error enviando email:', err.message);
      await notificacion.update({ estado: 'Fallido' });
    }

    res.status(201).json({ mensaje: 'Notificación registrada', notificacion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear notificación', error: error.message });
  }
};

// Obtener todas las notificaciones
const obtenerNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(notificaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener notificaciones', error: error.message });
  }
};

// Obtener notificaciones por paciente
const obtenerPorPaciente = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { id_paciente: req.params.id_paciente },
      order: [['createdAt', 'DESC']]
    });
    if (!notificaciones.length) {
      return res.status(404).json({ mensaje: 'No hay notificaciones para este paciente' });
    }
    res.status(200).json(notificaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener notificaciones', error: error.message });
  }
};

// Obtener todas las plantillas
const obtenerPlantillas = async (req, res) => {
  try {
    const plantillas = await Plantilla.findAll();
    res.status(200).json(plantillas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener plantillas', error: error.message });
  }
};

// Actualizar plantilla
const actualizarPlantilla = async (req, res) => {
  try {
    const plantilla = await Plantilla.findByPk(req.params.id);
    if (!plantilla) {
      return res.status(404).json({ mensaje: 'Plantilla no encontrada' });
    }
    await plantilla.update(req.body);
    res.status(200).json({ mensaje: 'Plantilla actualizada', plantilla });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar plantilla', error: error.message });
  }
};

module.exports = {
  crearNotificacion,
  obtenerNotificaciones,
  obtenerPorPaciente,
  obtenerPlantillas,
  actualizarPlantilla
};