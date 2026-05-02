const axios = require('axios');

// URL interna de Docker
const URL_AGENDA = process.env.TURNOS_SERVICE_URL || 'http://servicio-agenda:3002/api/v1/turnos';

const obtenerTurnosCompletados = async () => {
    try {
        const res = await axios.get(`${URL_AGENDA}?estado=Completado`);
        return res.data;
    } catch (error) {
        console.error("Error al conectar con Agenda:", error.message);
        return [];
    }
};

module.exports = { obtenerTurnosCompletados };