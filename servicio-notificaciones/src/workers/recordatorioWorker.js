require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const Notificacion = require('../models/Notificacion');
const { obtenerPlantilla, procesarPlantilla } = require('../services/plantillaService');
const { enviarEmail } = require('../services/emailService');

const GATEWAY_URL = process.env.GATEWAY_URL;

// Función que verifica turnos y envía recordatorios
const procesarRecordatorios = async () => {
  try {
    console.log('Procesando recordatorios...');

    const res = await axios.get(`${GATEWAY_URL}/api/v1/turnos`);
    const turnos = res.data;

    const ahora = new Date();

    for (const turno of turnos) {
      if (turno.estado === 'Cancelado') continue;

      const fechaTurno = new Date(`${turno.fecha}T${turno.hora}`);
      const diferenciaHoras = (fechaTurno - ahora) / (1000 * 60 * 60);

      // Recordatorio 48 horas
      if (diferenciaHoras > 47 && diferenciaHoras <= 49) {
        await enviarRecordatorio(turno, 'Recordatorio_48h');
      }

      // Recordatorio 24 horas
      if (diferenciaHoras > 23 && diferenciaHoras <= 25) {
        await enviarRecordatorio(turno, 'Recordatorio_24h');
      }
    }
  } catch (error) {
    console.error('Error procesando recordatorios:', error.message);
  }
};

const enviarRecordatorio = async (turno, tipo) => {
  try {
    // Verificar si ya se envió este recordatorio para este turno
    const yaEnviado = await Notificacion.findOne({
      where: {
        metadata: { id_turno: turno.id_turno },
        tipo
      }
    });
    if (yaEnviado) return;

    // Obtener email del paciente
    let emailPaciente = null;
    try {
      const resPaciente = await axios.get(
        `${GATEWAY_URL}/api/v1/pacientes/${turno.id_paciente}`
      );
      emailPaciente = resPaciente.data.email;
    } catch { }

    const plantilla = await obtenerPlantilla(tipo);
    const variables = {
      nombre_paciente: turno.nombre_paciente,
      especialidad: turno.especialidad,
      fecha: turno.fecha,
      hora: turno.hora ? turno.hora.slice(0, 5) : ''
    };

    const mensajeFinal = procesarPlantilla(plantilla.contenido, variables);

    // Guardar notificación en BD
    const notificacion = await Notificacion.create({
      id_paciente: turno.id_paciente,
      nombre_paciente: turno.nombre_paciente,
      tipo,
      mensaje: `Recordatorio de turno: ${turno.especialidad} el ${turno.fecha}`,
      canal: emailPaciente ? 'email' : 'sistema',
      estado: 'Pendiente',
      metadata: { id_turno: turno.id_turno }
    });

    // Enviar email si hay email disponible
    if (emailPaciente) {
      const enviado = await enviarEmail({
        destinatario: emailPaciente,
        asunto: plantilla.asunto,
        contenido: mensajeFinal
      });
      await notificacion.update({
        estado: enviado ? 'Enviado' : 'Fallido',
        fecha_envio: new Date()
      });
    } else {
      await notificacion.update({ estado: 'Enviado', fecha_envio: new Date() });
    }

    console.log(`Recordatorio ${tipo} enviado para turno ${turno.id_turno}`);
  } catch (error) {
    console.error(`Error enviando recordatorio ${tipo}:`, error.message);
  }
};

// Ejecutar cada hora
const iniciarWorker = () => {
  cron.schedule('0 * * * *', procesarRecordatorios);
  console.log('Worker de recordatorios iniciado - ejecuta cada hora');
};

module.exports = { iniciarWorker, procesarRecordatorios };