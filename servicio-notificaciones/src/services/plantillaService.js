const Plantilla = require('../models/Plantilla');

// Reemplaza variables en la plantilla: {{nombre}}, {{fecha}}, etc.
const procesarPlantilla = (contenido, variables) => {
  let resultado = contenido;
  Object.keys(variables).forEach(clave => {
    const regex = new RegExp(`{{${clave}}}`, 'g');
    resultado = resultado.replace(regex, variables[clave] || '');
  });
  return resultado;
};

const obtenerPlantilla = async (tipo) => {
  let plantilla = await Plantilla.findOne({ where: { tipo } });
  if (!plantilla) {
    // Plantilla por defecto si no existe
    plantilla = {
      asunto: `Notificación MediTurnos: ${tipo}`,
      contenido: `<p>Estimado/a {{nombre_paciente}},</p><p>{{mensaje}}</p><p>Equipo MediTurnos</p>`
    };
  }
  return plantilla;
};

const crearPlantillasIniciales = async () => {
  const plantillas = [
    {
      tipo: 'Turno_confirmado',
      asunto: 'Tu turno fue confirmado — MediTurnos',
      contenido: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1a73e8;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">🏥 MediTurnos</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#1a73e8;">✅ Turno Confirmado</h2>
            <p>Estimado/a <strong>{{nombre_paciente}}</strong>,</p>
            <p>Tu turno ha sido confirmado exitosamente.</p>
            <div style="background:white;border-left:4px solid #1a73e8;padding:15px;margin:20px 0;">
              <p><strong>Especialidad:</strong> {{especialidad}}</p>
              <p><strong>Fecha:</strong> {{fecha}}</p>
              <p><strong>Hora:</strong> {{hora}}</p>
            </div>
            <p>Por favor llega 10 minutos antes de tu turno.</p>
          </div>
        </div>`
    },
    {
      tipo: 'Recordatorio_48h',
      asunto: 'Recordatorio: Tu turno es en 48 horas — MediTurnos',
      contenido: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#f59e0b;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">🏥 MediTurnos</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#f59e0b;">⏰ Recordatorio — 48 horas</h2>
            <p>Estimado/a <strong>{{nombre_paciente}}</strong>,</p>
            <p>Te recordamos que tienes un turno programado en <strong>48 horas</strong>.</p>
            <div style="background:white;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;">
              <p><strong>Especialidad:</strong> {{especialidad}}</p>
              <p><strong>Fecha:</strong> {{fecha}}</p>
              <p><strong>Hora:</strong> {{hora}}</p>
            </div>
            <p>Si necesitas cancelar, hazlo con anticipación.</p>
          </div>
        </div>`
    },
    {
      tipo: 'Recordatorio_24h',
      asunto: 'Recordatorio: Tu turno es mañana — MediTurnos',
      contenido: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#ea4335;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">🏥 MediTurnos</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#ea4335;">🔔 Tu turno es mañana</h2>
            <p>Estimado/a <strong>{{nombre_paciente}}</strong>,</p>
            <p>Te recordamos que <strong>mañana tienes un turno</strong>.</p>
            <div style="background:white;border-left:4px solid #ea4335;padding:15px;margin:20px 0;">
              <p><strong>Especialidad:</strong> {{especialidad}}</p>
              <p><strong>Fecha:</strong> {{fecha}}</p>
              <p><strong>Hora:</strong> {{hora}}</p>
            </div>
            <p>¡No olvides traer tu documento y orden médica si corresponde!</p>
          </div>
        </div>`
    },
    {
      tipo: 'Resultado_disponible',
      asunto: 'Tus resultados están disponibles — MediTurnos',
      contenido: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#34a853;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">🏥 MediTurnos</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#34a853;">📋 Resultados Disponibles</h2>
            <p>Estimado/a <strong>{{nombre_paciente}}</strong>,</p>
            <p>Tus resultados médicos ya están disponibles en el sistema.</p>
            <div style="background:white;border-left:4px solid #34a853;padding:15px;margin:20px 0;">
              <p><strong>Especialidad:</strong> {{especialidad}}</p>
              <p><strong>Fecha:</strong> {{fecha_resultado}}</p>
            </div>
            <p>Puedes consultarlos ingresando a tu portal de paciente.</p>
          </div>
        </div>`
    },
    {
      tipo: 'Turno_cancelado',
      asunto: 'Tu turno fue cancelado — MediTurnos',
      contenido: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#ea4335;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">🏥 MediTurnos</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#ea4335;">❌ Turno Cancelado</h2>
            <p>Estimado/a <strong>{{nombre_paciente}}</strong>,</p>
            <p>Tu turno ha sido cancelado.</p>
            <div style="background:white;border-left:4px solid #ea4335;padding:15px;margin:20px 0;">
              <p><strong>Especialidad:</strong> {{especialidad}}</p>
              <p><strong>Fecha:</strong> {{fecha}}</p>
            </div>
            <p>Puedes agendar un nuevo turno cuando lo desees.</p>
          </div>
        </div>`
    }
  ];

  for (const p of plantillas) {
    const existe = await Plantilla.findOne({ where: { tipo: p.tipo } });
    if (!existe) await Plantilla.create(p);
  }
  console.log('Plantillas iniciales creadas');
};

module.exports = { procesarPlantilla, obtenerPlantilla, crearPlantillasIniciales };